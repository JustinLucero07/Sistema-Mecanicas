from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TimestampMixin


class Organizacion(Base, TimestampMixin):
    """Representa a una empresa o taller que contrata el SaaS (Tenant)."""

    __tablename__ = "organizaciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    ruc_identificacion: Mapped[str | None] = mapped_column(String(30))
    telefono: Mapped[str | None] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(150))
    direccion: Mapped[str | None] = mapped_column(String(255))
    logo_url: Mapped[str | None] = mapped_column(String(500))
    plan: Mapped[str] = mapped_column(String(30), default="PRO")  # FREE, BASIC, PRO, ENTERPRISE
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    sucursales = relationship("Sucursal", back_populates="organizacion", cascade="all, delete-orphan")
    usuarios = relationship("Usuario", back_populates="organizacion")


class Sucursal(Base, TimestampMixin):
    """Representa una sede física o sucursal del taller/empresa."""

    __tablename__ = "sucursales"

    id: Mapped[int] = mapped_column(primary_key=True)
    organizacion_id: Mapped[int] = mapped_column(ForeignKey("organizaciones.id"), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    codigo: Mapped[str | None] = mapped_column(String(20))
    telefono: Mapped[str | None] = mapped_column(String(30))
    direccion: Mapped[str | None] = mapped_column(String(255))
    es_matriz: Mapped[bool] = mapped_column(Boolean, default=False)
    activa: Mapped[bool] = mapped_column(Boolean, default=True)

    organizacion = relationship("Organizacion", back_populates="sucursales")
    usuarios = relationship("Usuario", back_populates="sucursal")
