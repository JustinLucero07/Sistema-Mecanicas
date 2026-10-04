from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.deps import get_current_tenant_id, require_admin
from app.database import get_db
from app.models.auditoria import AuditLog
from app.models.usuario import Usuario

router = APIRouter(prefix="/api/auditoria", tags=["auditoria"], dependencies=[Depends(require_admin)])


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    usuario_id: int | None
    usuario_nombre: str | None = None
    accion: str
    entidad: str
    entidad_id: int | None
    cambios: dict | None
    ip: str | None
    creado_en: datetime


@router.get("", response_model=list[AuditLogOut])
def listar(
    entidad: str | None = None,
    entidad_id: int | None = None,
    usuario_id: int | None = None,
    antes_de: int | None = Query(None, description="Paginación: id del último registro recibido"),
    limite: int = Query(50, ge=1, le=200),
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> list[AuditLogOut]:
    query = db.query(AuditLog).filter(AuditLog.organizacion_id == org_id)
    if entidad:
        query = query.filter(AuditLog.entidad == entidad)
    if entidad_id is not None:
        query = query.filter(AuditLog.entidad_id == entidad_id)
    if usuario_id is not None:
        query = query.filter(AuditLog.usuario_id == usuario_id)
    if antes_de is not None:
        query = query.filter(AuditLog.id < antes_de)
    registros = query.order_by(AuditLog.id.desc()).limit(limite).all()

    ids = {r.usuario_id for r in registros if r.usuario_id}
    nombres = dict(db.query(Usuario.id, Usuario.nombre).filter(Usuario.id.in_(ids)).all()) if ids else {}
    salida = []
    for r in registros:
        item = AuditLogOut.model_validate(r)
        item.usuario_nombre = nombres.get(r.usuario_id)
        salida.append(item)
    return salida
