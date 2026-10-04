from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TenantMixin, TimestampMixin


class Cliente(Base, TenantMixin, TimestampMixin):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellidos: Mapped[str | None] = mapped_column(String(100))
    cedula_ruc: Mapped[str | None] = mapped_column(String(30), index=True)
    telefono: Mapped[str | None] = mapped_column(String(30))
    whatsapp: Mapped[str | None] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(150))
    ciudad: Mapped[str | None] = mapped_column(String(100))
    direccion: Mapped[str | None] = mapped_column(String(255))
    notas: Mapped[str | None] = mapped_column(Text)
    # Consentimiento explícito (LOPDP) para recibir recordatorios y mensajes.
    acepta_comunicaciones: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)
    # Fecha en que se anonimizó por pedido del titular de los datos.
    anonimizado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    vehiculos = relationship("Vehiculo", back_populates="cliente", cascade="all, delete-orphan")
    ordenes = relationship("OrdenTrabajo", back_populates="cliente")

    @property
    def nombre_completo(self) -> str:
        if self.apellidos:
            return f"{self.nombre} {self.apellidos}".strip()
        return self.nombre
