from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import RolUsuario, TimestampMixin


class Usuario(Base, TimestampMixin):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    organizacion_id: Mapped[int | None] = mapped_column(ForeignKey("organizaciones.id"), index=True, nullable=True)
    sucursal_id: Mapped[int | None] = mapped_column(ForeignKey("sucursales.id"), nullable=True)

    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rol: Mapped[RolUsuario] = mapped_column(Enum(RolUsuario, name="rol_usuario"), nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(30))
    cargo: Mapped[str | None] = mapped_column(String(80))
    especialidad: Mapped[str | None] = mapped_column(String(100))  # Ej: Motor, Electricidad, Suspensión
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    # Solo aplica si rol == CLIENTE: vincula el usuario a su ficha de cliente
    cliente_id: Mapped[int | None] = mapped_column(ForeignKey("clientes.id"), nullable=True)

    organizacion = relationship("Organizacion", back_populates="usuarios")
    sucursal = relationship("Sucursal", back_populates="usuarios")
    ordenes_asignadas = relationship(
        "OrdenTrabajo", back_populates="mecanico", foreign_keys="OrdenTrabajo.mecanico_id"
    )
