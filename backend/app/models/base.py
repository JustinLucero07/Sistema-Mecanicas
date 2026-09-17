import enum
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TimestampMixin:
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class TenantMixin:
    organizacion_id: Mapped[int] = mapped_column(ForeignKey("organizaciones.id"), index=True, nullable=False)


class RolUsuario(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN_TALLER = "admin_taller"
    GERENTE = "gerente"
    RECEPCIONISTA = "recepcionista"
    MECANICO = "mecanico"
    INVENTARIO = "inventario"
    CONTABILIDAD = "contabilidad"
    CLIENTE = "cliente"
    # Retrocompatibilidad
    ADMIN = "admin"
    CAJERO = "cajero"


class EstadoOrden(str, enum.Enum):
    RECEPCION = "recepcion"
    DIAGNOSTICO = "diagnostico"
    ESPERANDO_APROBACION = "esperando_aprobacion"
    ESPERANDO_REPUESTOS = "esperando_repuestos"
    EN_REPARACION = "en_reparacion"
    CONTROL_CALIDAD = "control_calidad"
    LISTO_PARA_ENTREGAR = "listo_para_entregar"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"
    # Retrocompatibilidad
    PENDIENTE = "pendiente"
    EN_PROCESO = "en_proceso"
    COMPLETADO = "completado"


class PrioridadOrden(str, enum.Enum):
    BAJA = "baja"
    NORMAL = "normal"
    ALTA = "alta"
    URGENTE = "urgente"


class TipoDetalleOrden(str, enum.Enum):
    MANO_OBRA = "mano_obra"
    REPUESTO = "repuesto"
    SERVICIO_EXTERNO = "servicio_externo"


class EstadoInspeccionItem(str, enum.Enum):
    BUENO = "bueno"
    REVISAR = "revisar"
    DEFICIENTE = "deficiente"
    REQUIERE_REPARACION = "requiere_reparacion"


class EstadoCita(str, enum.Enum):
    PROGRAMADA = "programada"
    CONFIRMADA = "confirmada"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"
    NO_ASISTIO = "no_asistio"


class EstadoBahia(str, enum.Enum):
    DISPONIBLE = "disponible"
    OCUPADA = "ocupada"
    MANTENIMIENTO = "mantenimiento"
    RESERVADA = "reservada"


class EstadoCotizacion(str, enum.Enum):
    BORRADOR = "borrador"
    ENVIADA = "enviada"
    VISTA = "vista"
    APROBADA = "aprobada"
    RECHAZADA = "rechazada"
    VENCIDA = "vencida"


class TipoMovimientoInventario(str, enum.Enum):
    ENTRADA = "entrada"
    SALIDA = "salida"
    AJUSTE = "ajuste"
    DEVOLUCION = "devolucion"


class MotivoMovimientoInventario(str, enum.Enum):
    COMPRA = "compra"
    USO_EN_ORDEN = "uso_en_orden"
    AJUSTE_INVENTARIO = "ajuste_inventario"
    DEVOLUCION = "devolucion"


class MetodoPago(str, enum.Enum):
    EFECTIVO = "efectivo"
    TARJETA = "tarjeta"
    TRANSFERENCIA = "transferencia"
    CHEQUE = "cheque"
    OTRO = "otro"


class CategoriaEgreso(str, enum.Enum):
    NOMINA = "nomina"
    REPUESTOS = "repuestos"
    ALQUILER = "alquiler"
    SERVICIOS_BASICOS = "servicios_basicos"
    HERRAMIENTAS = "herramientas"
    IMPUESTOS = "impuestos"
    MARKETING = "marketing"
    MANTENIMIENTO_LOCAL = "mantenimiento_local"
    OTROS = "otros"


class EstadoCuenta(str, enum.Enum):
    PENDIENTE = "pendiente"
    PARCIAL = "parcial"
    PAGADO = "pagado"
    VENCIDO = "vencido"


class TipoFoto(str, enum.Enum):
    PLACA = "placa"
    FRENTE = "frente"
    PARTE_TRASERA = "parte_trasera"
    LATERAL_IZQUIERDO = "lateral_izquierdo"
    LATERAL_DERECHO = "lateral_derecho"
    INTERIOR = "interior"
    MOTOR = "motor"
    DANIO = "danio"
    ANTES = "antes"
    DESPUES = "despues"
    COMPROBANTE = "comprobante"


class TipoDocumento(str, enum.Enum):
    MATRICULA = "matricula"
    SEGURO = "seguro"
    MANUAL = "manual"
    PERITAJE = "peritaje"
    FACTURA = "factura"
    OTRO = "otro"


class EstadoComision(str, enum.Enum):
    PENDIENTE = "pendiente"
    PAGADO = "pagado"
