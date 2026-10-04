"""Reglas que se aplican en cada escritura, sin depender de cada endpoint.

1. Aislamiento entre talleres: un registro nunca puede apuntar (por clave
   foránea) a un registro de otra organización. Así ningún endpoint, actual o
   futuro, puede filtrar datos de otro taller por recibir un id ajeno.
2. Auditoría: cada alta, cambio o baja de las tablas de negocio queda en
   `audit_logs` con el usuario, la IP y los valores anteriores y nuevos.
"""

from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import event, inspect
from sqlalchemy.orm import Session

from app.core.contexto import ip_actual, organizacion_actual_id, usuario_actual_id
from app.database import Base
from app.models.auditoria import AuditLog


class ViolacionDeTenant(Exception):
    """Se intentó relacionar datos de dos talleres distintos."""


TABLAS_AUDITADAS = {
    "organizaciones",
    "sucursales",
    "usuarios",
    "clientes",
    "vehiculos",
    "ordenes_trabajo",
    "detalle_ordenes",
    "checklists_recepcion",
    "ingresos",
    "egresos",
    "caja_diaria",
    "cuentas_por_cobrar",
    "cuentas_por_pagar",
    "repuestos",
    "movimientos_inventario",
    "proveedores",
}
CAMPOS_SECRETOS = {"password_hash"}
CAMPOS_IGNORADOS = {"creado_en", "actualizado_en"}

_clase_por_tabla: dict[str, type] = {}


def _clase(tabla: str) -> type | None:
    if not _clase_por_tabla:
        for mapper in Base.registry.mappers:
            _clase_por_tabla[mapper.local_table.name] = mapper.class_
    return _clase_por_tabla.get(tabla)


def _organizacion_de(session: Session, obj) -> int | None:
    """Organización dueña de un registro, directa o a través de su padre."""
    if obj is None:
        return None
    if hasattr(obj, "organizacion_id"):
        return obj.organizacion_id
    for padre_fk, tabla in (("orden_id", "ordenes_trabajo"), ("vehiculo_id", "vehiculos"), ("inspeccion_id", "inspecciones")):
        padre_id = getattr(obj, padre_fk, None)
        if padre_id is not None:
            return _organizacion_de(session, session.get(_clase(tabla), padre_id))
    return None


def _verificar_tenant(session: Session, obj, solo_cambiados: bool) -> None:
    estado = inspect(obj)
    org_propia = _organizacion_de(session, obj)
    if org_propia is None:
        return
    for columna in estado.mapper.columns:
        if columna.key == "organizacion_id":
            continue
        for fk in columna.foreign_keys:
            if solo_cambiados and not estado.attrs[columna.key].history.has_changes():
                continue
            valor = getattr(obj, columna.key)
            destino_cls = _clase(fk.column.table.name)
            if valor is None or destino_cls is None:
                continue
            destino = session.get(destino_cls, valor)
            if destino is None:
                continue
            org_destino = _organizacion_de(session, destino)
            # org None = registro global (p. ej. superadmin); no pertenece a nadie.
            if org_destino is not None and org_destino != org_propia:
                raise ViolacionDeTenant(f"{columna.key}={valor} no pertenece a este taller")


def _serializar(valor):
    if isinstance(valor, Enum):
        return valor.value
    if isinstance(valor, Decimal):
        return float(valor)
    if isinstance(valor, (datetime, date)):
        return valor.isoformat()
    if isinstance(valor, (str, int, float, bool)) or valor is None:
        return valor
    return str(valor)


def _cambios(obj, solo_modificados: bool) -> dict:
    estado = inspect(obj)
    salida = {}
    for attr in estado.mapper.column_attrs:
        if attr.key in CAMPOS_IGNORADOS:
            continue
        historia = estado.attrs[attr.key].history
        if solo_modificados:
            if not historia.has_changes():
                continue
            antes = historia.deleted[0] if historia.deleted else None
            despues = historia.added[0] if historia.added else None
            if attr.key in CAMPOS_SECRETOS:
                antes, despues = "***", "*** (cambiada)"
            salida[attr.key] = {"antes": _serializar(antes), "despues": _serializar(despues)}
        else:
            valor = getattr(obj, attr.key)
            salida[attr.key] = "***" if attr.key in CAMPOS_SECRETOS else _serializar(valor)
    return salida


@event.listens_for(Session, "before_flush")
def _antes_de_guardar(session: Session, flush_context, instances) -> None:
    pendientes = []
    with session.no_autoflush:
        for obj in session.new:
            _verificar_tenant(session, obj, solo_cambiados=False)
        for obj in session.dirty:
            if session.is_modified(obj, include_collections=False):
                _verificar_tenant(session, obj, solo_cambiados=True)

        for obj in session.dirty:
            tabla = getattr(obj, "__tablename__", None)
            if tabla in TABLAS_AUDITADAS and session.is_modified(obj, include_collections=False):
                cambios = _cambios(obj, solo_modificados=True)
                if cambios:
                    pendientes.append(("actualizar", obj, cambios))
        for obj in session.deleted:
            if getattr(obj, "__tablename__", None) in TABLAS_AUDITADAS:
                pendientes.append(("eliminar", obj, _cambios(obj, solo_modificados=False)))
        for obj in session.new:
            if getattr(obj, "__tablename__", None) in TABLAS_AUDITADAS:
                pendientes.append(("crear", obj, None))
    session.info.setdefault("auditoria_pendiente", []).extend(pendientes)


@event.listens_for(Session, "after_flush")
def _despues_de_guardar(session: Session, flush_context) -> None:
    pendientes = session.info.pop("auditoria_pendiente", [])
    if not pendientes:
        return
    filas = []
    for accion, obj, cambios in pendientes:
        if accion == "crear":
            cambios = _cambios(obj, solo_modificados=False)
        filas.append(
            {
                "organizacion_id": _organizacion_de(session, obj) or organizacion_actual_id(),
                "usuario_id": usuario_actual_id(),
                "accion": accion,
                "entidad": obj.__tablename__,
                "entidad_id": getattr(obj, "id", None),
                "cambios": cambios,
                "ip": ip_actual(),
            }
        )
    # Insert directo: en after_flush no se pueden agregar objetos a la sesión.
    session.connection().execute(AuditLog.__table__.insert(), filas)


def registrar_evento(session: Session, accion: str, entidad: str, entidad_id: int | None = None, detalle: dict | None = None,
                     organizacion_id: int | None = None, usuario_id: int | None = None) -> None:
    """Eventos que no son cambios de datos: inicios de sesión, exportaciones."""
    session.add(
        AuditLog(
            organizacion_id=organizacion_id if organizacion_id is not None else organizacion_actual_id(),
            usuario_id=usuario_id if usuario_id is not None else usuario_actual_id(),
            accion=accion,
            entidad=entidad,
            entidad_id=entidad_id,
            cambios=detalle,
            ip=ip_actual(),
        )
    )
