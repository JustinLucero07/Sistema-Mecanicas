from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin


class Vehiculo(Base, TimestampMixin):
    __tablename__ = "vehiculos"

    id: Mapped[int] = mapped_column(primary_key=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"), nullable=False)

    # La placa es la clave de búsqueda principal (lo que lee el OCR).
    # Normalizada sin guiones/espacios para que la búsqueda sea consistente
    # sin importar cómo la haya leído el OCR (ABC1234).
    placa: Mapped[str] = mapped_column(String(15), unique=True, index=True, nullable=False)

    marca: Mapped[str | None] = mapped_column(String(60))
    modelo: Mapped[str | None] = mapped_column(String(60))
    anio: Mapped[int | None] = mapped_column(Integer)
    color: Mapped[str | None] = mapped_column(String(40))
    vin_chasis: Mapped[str | None] = mapped_column(String(40))
    tipo: Mapped[str | None] = mapped_column(String(30))  # auto, camioneta, moto, camion...
    kilometraje_actual: Mapped[int | None] = mapped_column(Integer)
    foto_placa_url: Mapped[str | None] = mapped_column(String(500))

    cliente = relationship("Cliente", back_populates="vehiculos")
    ordenes = relationship(
        "OrdenTrabajo", back_populates="vehiculo", order_by="OrdenTrabajo.fecha_ingreso.desc()"
    )
