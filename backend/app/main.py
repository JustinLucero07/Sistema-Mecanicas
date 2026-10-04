import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import get_settings
from app.core import integridad  # noqa: F401  registra las reglas de escritura
from app.core.contexto import iniciar_peticion
from app.core.integridad import ViolacionDeTenant
from app.database import SessionLocal
from app.routers import auth, auditoria, clientes, financiero, inventario, ordenes, reportes, usuarios, vehiculos
from app.services.storage import AlmacenamientoNoDisponible, ArchivoInvalido

settings = get_settings()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("mecanicaos")

app = FastAPI(
    title=settings.app_name,
    # La documentación interactiva expone toda la API: solo en desarrollo.
    docs_url=None if settings.es_produccion else "/docs",
    redoc_url=None,
    openapi_url=None if settings.es_produccion else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def contexto_y_cabeceras(request: Request, call_next):
    # Detrás del proxy, la IP real llega en X-Forwarded-For.
    reenviada = request.headers.get("x-forwarded-for", "")
    iniciar_peticion(reenviada.split(",")[0].strip() or (request.client.host if request.client else None))
    respuesta = await call_next(request)
    respuesta.headers["X-Content-Type-Options"] = "nosniff"
    respuesta.headers["X-Frame-Options"] = "DENY"
    respuesta.headers["Referrer-Policy"] = "no-referrer"
    respuesta.headers["Cache-Control"] = "no-store"
    if settings.es_produccion:
        respuesta.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return respuesta


@app.exception_handler(ViolacionDeTenant)
async def _tenant(_: Request, exc: ViolacionDeTenant):
    log.warning("Intento de referencia entre talleres: %s", exc)
    return JSONResponse(status_code=400, content={"detail": "Uno de los datos enviados no pertenece a tu taller."})


@app.exception_handler(ArchivoInvalido)
async def _archivo(_: Request, exc: ArchivoInvalido):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(AlmacenamientoNoDisponible)
async def _almacenamiento(_: Request, exc: AlmacenamientoNoDisponible):
    return JSONResponse(status_code=503, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def _inesperado(request: Request, exc: Exception):
    # Nunca se devuelve la traza al cliente; queda en el log del servidor.
    log.exception("Error no controlado en %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Ocurrió un error inesperado. Ya quedó registrado."})


app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(clientes.router)
app.include_router(vehiculos.router)
app.include_router(ordenes.router)
app.include_router(inventario.router)
app.include_router(financiero.router)
app.include_router(reportes.router)
app.include_router(auditoria.router)


@app.get("/api/health")
def health() -> dict:
    """Usado por Docker y el monitoreo: también comprueba la base de datos."""
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        base = "ok"
    except Exception:
        log.exception("Health check: la base de datos no responde")
        return JSONResponse(status_code=503, content={"status": "error", "database": "sin conexión"})
    return {"status": "ok", "database": base}
