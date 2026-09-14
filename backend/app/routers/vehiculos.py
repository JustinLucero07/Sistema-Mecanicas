import re

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.deps import require_staff
from app.database import get_db
from app.models.vehiculo import Vehiculo
from app.schemas.vehiculo import PlacaDetectadaOut, VehiculoCreate, VehiculoOut, VehiculoUpdate
from app.services.plate_recognition import (
    ModeloNoDisponibleError,
    PlacaNoDetectadaError,
    normalizar_placa,
    reconocer_placa,
)
from app.services.storage import subir_archivo

router = APIRouter(prefix="/api/vehiculos", tags=["vehiculos"], dependencies=[Depends(require_staff)])


def _normalizar_para_busqueda(placa: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", placa.upper())


@router.get("", response_model=list[VehiculoOut])
def listar_vehiculos(q: str | None = None, db: Session = Depends(get_db)) -> list[Vehiculo]:
    query = db.query(Vehiculo)
    if q:
        query = query.filter(Vehiculo.placa.ilike(f"%{_normalizar_para_busqueda(q)}%"))
    return query.order_by(Vehiculo.placa).all()


@router.get("/placa/{placa}", response_model=VehiculoOut)
def buscar_por_placa(placa: str, db: Session = Depends(get_db)) -> Vehiculo:
    vehiculo = (
        db.query(Vehiculo)
        .filter(Vehiculo.placa == normalizar_placa(placa))
        .first()
    )
    if not vehiculo:
        raise HTTPException(status_code=404, detail="No hay ningún vehículo con esa placa registrado")
    return vehiculo


@router.get("/{vehiculo_id}", response_model=VehiculoOut)
def obtener_vehiculo(vehiculo_id: int, db: Session = Depends(get_db)) -> Vehiculo:
    vehiculo = db.get(Vehiculo, vehiculo_id)
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return vehiculo


@router.post("", response_model=VehiculoOut, status_code=201)
def crear_vehiculo(payload: VehiculoCreate, db: Session = Depends(get_db)) -> Vehiculo:
    placa_normalizada = normalizar_placa(payload.placa)
    if db.query(Vehiculo).filter(Vehiculo.placa == placa_normalizada).first():
        raise HTTPException(status_code=400, detail="Ya existe un vehículo con esa placa")

    datos = payload.model_dump()
    datos["placa"] = placa_normalizada
    vehiculo = Vehiculo(**datos)
    db.add(vehiculo)
    db.commit()
    db.refresh(vehiculo)
    return vehiculo


@router.patch("/{vehiculo_id}", response_model=VehiculoOut)
def actualizar_vehiculo(vehiculo_id: int, payload: VehiculoUpdate, db: Session = Depends(get_db)) -> Vehiculo:
    vehiculo = db.get(Vehiculo, vehiculo_id)
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(vehiculo, campo, valor)
    db.commit()
    db.refresh(vehiculo)
    return vehiculo


@router.post("/escanear-placa", response_model=PlacaDetectadaOut)
async def escanear_placa(foto: UploadFile, db: Session = Depends(get_db)) -> PlacaDetectadaOut:
    """Recibe una foto de la placa, la detecta/lee con YOLO+OCR y busca si el
    vehículo ya existe en el sistema junto con su historial."""
    contenido = await foto.read()

    try:
        placa_texto, confianza = reconocer_placa(contenido)
    except ModeloNoDisponibleError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PlacaNoDetectadaError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    foto_url = subir_archivo(contenido, carpeta="placas")

    vehiculo = db.query(Vehiculo).filter(Vehiculo.placa == placa_texto).first()

    return PlacaDetectadaOut(
        placa_texto=placa_texto,
        confianza=confianza,
        vehiculo=vehiculo,
        foto_url=foto_url,
    )
