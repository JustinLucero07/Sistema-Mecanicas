import enum
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TimestampMixin:
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RolUsuario(str, enum.Enum):
    ADMIN = "admin"
    MECANICO = "mecanico"
    CAJERO = "cajero"
    CLIENTE = "cliente"


class EstadoOrden(str, enum.Enum):
    PENDIENTE = "pendiente"
    EN_PROCESO = "en_proceso"
    COMPLETADO = "completado"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"


class PrioridadOrden(str, enum.Enum):
    BAJA = "baja"
    NORMAL = "normal"
    ALTA = "alta"
    URGENTE = "urgente"


class TipoDetalleOrden(str, enum.Enum):
    MANO_OBRA = "mano_obra"
    REPUESTO = "repuesto"


class TipoMovimientoInventario(str, enum.Enum):
    ENTRADA = "entrada"
    SALIDA = "salida"
    AJUSTE = "ajuste"


class MotivoMovimientoInventario(str, enum.Enum):
    COMPRA = "compra"
    USO_EN_ORDEN = "uso_en_orden"
    AJUSTE_INVENTARIO = "ajuste_inventario"
    DEVOLUCION = "devolucion"


class MetodoPago(str, enum.Enum):
    EFECTIVO = "efectivo"
    TARJETA = "tarjeta"
    TRANSFERENCIA = "transferencia"
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
    ANTES = "antes"
    DESPUES = "despues"
    COMPROBANTE = "comprobante"


class EstadoComision(str, enum.Enum):
    PENDIENTE = "pendiente"
    PAGADO = "pagado"
