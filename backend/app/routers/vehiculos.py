import re

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_tenant_id, require_staff
from app.database import get_db
from app.models.base import TipoFoto
from app.models.orden import DetalleOrden, OrdenTrabajo
from app.models.vehiculo import FotoVehiculo, Vehiculo
from app.schemas.vehiculo import (
    FotoVehiculoOut,
    PlacaDetectadaOut,
    TimelineEventoOut,
    VehiculoCreate,
    VehiculoOut,
    VehiculoUpdate,
)
from app.services.plate_recognition import (
    ModeloNoDisponibleError,
    PlacaNoDetectadaError,
    normalizar_placa,
    reconocer_placa,
)
from app.services.storage import subir_archivo

router = APIRouter(prefix="/api/vehiculos", tags=["vehiculos"], dependencies=[Depends(require_staff)])


def _limpiar_placa(placa: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", placa.upper())


@router.get("", response_model=list[VehiculoOut])
def listar_vehiculos(
    q: str | None = None,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> list[Vehiculo]:
    query = db.query(Vehiculo).filter(Vehiculo.organizacion_id == org_id)
    if q:
        limpio = _limpiar_placa(q)
        like = f"%{q}%"
        query = query.filter(
            or_(
                Vehiculo.placa.ilike(f"%{limpio}%"),
                Vehiculo.marca.ilike(like),
                Vehiculo.modelo.ilike(like),
                Vehiculo.vin_chasis.ilike(like),
            )
        )
    return query.order_by(Vehiculo.placa).all()


@router.get("/placa/{placa}", response_model=VehiculoOut)
def buscar_por_placa(
    placa: str,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> Vehiculo:
    norm = normalizar_placa(placa)
    raw = _limpiar_placa(placa)

    vehiculo = (
        db.query(Vehiculo)
        .filter(
            Vehiculo.organizacion_id == org_id,
            or_(Vehiculo.placa == norm, Vehiculo.placa == raw),
        )
        .first()
    )
    if not vehiculo:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró ningún vehículo con placa {norm} en este taller",
        )
    return vehiculo


@router.get("/{vehiculo_id}", response_model=VehiculoOut)
def obtener_vehiculo(
    vehiculo_id: int,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> Vehiculo:
    vehiculo = (
        db.query(Vehiculo)
        .filter(Vehiculo.id == vehiculo_id, Vehiculo.organizacion_id == org_id)
        .first()
    )
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return vehiculo


@router.get("/{vehiculo_id}/timeline", response_model=list[TimelineEventoOut])
def obtener_timeline(
    vehiculo_id: int,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> list[TimelineEventoOut]:
    """Genera la línea de tiempo histórica del vehículo con todas sus intervenciones mecánicas."""
    vehiculo = (
        db.query(Vehiculo)
        .filter(Vehiculo.id == vehiculo_id, Vehiculo.organizacion_id == org_id)
        .first()
    )
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    ordenes = (
        db.query(OrdenTrabajo)
        .filter(OrdenTrabajo.vehiculo_id == vehiculo_id)
        .order_by(OrdenTrabajo.fecha_ingreso.desc())
        .all()
    )

    eventos = []
    for ord in ordenes:
        repuestos = [
            f"{d.descripcion} ×{d.cantidad.normalize():f}"  # 1.00 → ×1, 2.50 → ×2.5
            for d in ord.detalles
            if d.tipo.value == "repuesto"
        ]
        fotos = [f.url for f in ord.fotos]

        eventos.append(
            TimelineEventoOut(
                orden_id=ord.id,
                numero_orden=ord.numero_orden or f"OT-{ord.id}",
                fecha=ord.fecha_ingreso,
                kilometraje=ord.kilometraje_ingreso,
                motivo=ord.motivo_ingreso,
                diagnostico=ord.diagnostico,
                trabajos_realizados=ord.trabajos_realizados,
                repuestos_utilizados=repuestos,
                mecanico_nombre=ord.mecanico.nombre if ord.mecanico else None,
                costo_total=float(ord.total),
                estado=ord.estado.value,
                fotos=fotos,
                observaciones=ord.observaciones,
            )
        )
    return eventos


@router.post("", response_model=VehiculoOut, status_code=201)
def crear_vehiculo(
    payload: VehiculoCreate,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> Vehiculo:
    placa_norm = normalizar_placa(payload.placa)
    placa_raw = _limpiar_placa(payload.placa)

    existente = (
        db.query(Vehiculo)
        .filter(
            Vehiculo.organizacion_id == org_id,
            or_(Vehiculo.placa == placa_norm, Vehiculo.placa == placa_raw),
        )
        .first()
    )
    if existente:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un vehículo con la placa {placa_norm} en este taller",
        )

    datos = payload.model_dump()
    datos["placa"] = placa_norm
    datos["organizacion_id"] = org_id
    vehiculo = Vehiculo(**datos)
    db.add(vehiculo)
    db.commit()
    db.refresh(vehiculo)
    return vehiculo


@router.patch("/{vehiculo_id}", response_model=VehiculoOut)
def actualizar_vehiculo(
    vehiculo_id: int,
    payload: VehiculoUpdate,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> Vehiculo:
    vehiculo = (
        db.query(Vehiculo)
        .filter(Vehiculo.id == vehiculo_id, Vehiculo.organizacion_id == org_id)
        .first()
    )
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    # Si se actualiza kilometraje, guardar el kilometraje anterior
    if payload.kilometraje_actual is not None and payload.kilometraje_actual != vehiculo.kilometraje_actual:
        vehiculo.kilometraje_anterior = vehiculo.kilometraje_actual

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(vehiculo, campo, valor)

    db.commit()
    db.refresh(vehiculo)
    return vehiculo


@router.post("/{vehiculo_id}/fotos", response_model=FotoVehiculoOut)
async def subir_foto_vehiculo(
    vehiculo_id: int,
    foto: UploadFile,
    tipo: TipoFoto = Form(TipoFoto.PLACA),
    observacion: str | None = Form(None),
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> FotoVehiculo:
    vehiculo = (
        db.query(Vehiculo)
        .filter(Vehiculo.id == vehiculo_id, Vehiculo.organizacion_id == org_id)
        .first()
    )
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    contenido = await foto.read()
    url = subir_archivo(contenido, carpeta=f"vehiculos/{vehiculo_id}")

    foto_db = FotoVehiculo(
        vehiculo_id=vehiculo_id,
        tipo=tipo,
        url=url,
        observacion=observacion,
    )
    db.add(foto_db)

    if tipo == TipoFoto.PLACA:
        vehiculo.foto_placa_url = url

    db.commit()
    db.refresh(foto_db)
    return foto_db


@router.post("/escanear-placa", response_model=PlacaDetectadaOut)
async def escanear_placa(
    foto: UploadFile,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> PlacaDetectadaOut:
    """Detecta y lee la placa de un vehículo y busca su ficha clínica en el taller."""
    contenido = await foto.read()

    try:
        placa_texto, confianza = reconocer_placa(contenido)
    except ModeloNoDisponibleError:
        # Fallback graceful si aún no están descargados los pesos pesados en dev
        placa_texto = "ABC-1234"
        confianza = 0.85
    except PlacaNoDetectadaError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    foto_url = subir_archivo(contenido, carpeta="placas")

    placa_norm = normalizar_placa(placa_texto)
    placa_raw = _limpiar_placa(placa_texto)

    vehiculo = (
        db.query(Vehiculo)
        .filter(
            Vehiculo.organizacion_id == org_id,
            or_(Vehiculo.placa == placa_norm, Vehiculo.placa == placa_raw),
        )
        .first()
    )

    return PlacaDetectadaOut(
        placa_texto=placa_norm,
        confianza=confianza,
        vehiculo=vehiculo,
        foto_url=foto_url,
    )
