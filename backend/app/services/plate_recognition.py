"""Servicio de reconocimiento de placas: detección (YOLO) + lectura (OCR).

Las dependencias pesadas (ultralytics, easyocr, torch) se importan de forma
diferida (dentro de las funciones) para que el resto de la API pueda correr
sin instalarlas. Instálalas con `pip install -r requirements-ml.txt` en el
servicio/contenedor que va a hacer la inferencia.

Formato de placa Ecuador: 3 letras + guion + 3 o 4 dígitos (ABC-1234 / ABC-123
para motos). Normalizamos el texto leído por el OCR contra ese patrón.
"""

import io
import re
from functools import lru_cache

from app.config import get_settings

PATRON_PLACA_EC = re.compile(r"^[A-Z]{3}-?\d{3,4}$")


class PlacaNoDetectadaError(Exception):
    pass


class ModeloNoDisponibleError(Exception):
    """El modelo YOLO de placas no está instalado/entrenado todavía."""


def normalizar_placa(texto: str) -> str:
    limpio = re.sub(r"[^A-Z0-9]", "", texto.upper())
    if len(limpio) >= 6:
        return f"{limpio[:3]}-{limpio[3:]}"
    return limpio


def _validar_formato(texto: str) -> bool:
    return bool(PATRON_PLACA_EC.match(texto))


@lru_cache
def _cargar_modelo_yolo():
    try:
        from ultralytics import YOLO
    except ImportError as exc:  # pragma: no cover
        raise ModeloNoDisponibleError(
            "ultralytics no está instalado. Corre: pip install -r requirements-ml.txt"
        ) from exc

    settings = get_settings()
    try:
        return YOLO(settings.plate_model_path)
    except FileNotFoundError as exc:
        raise ModeloNoDisponibleError(
            f"No se encontró el modelo de placas en '{settings.plate_model_path}'. "
            "Entrena/descarga un modelo de detección de placas y ajusta PLATE_MODEL_PATH."
        ) from exc


@lru_cache
def _cargar_ocr():
    try:
        import easyocr
    except ImportError as exc:  # pragma: no cover
        raise ModeloNoDisponibleError(
            "easyocr no está instalado. Corre: pip install -r requirements-ml.txt"
        ) from exc
    return easyocr.Reader(["en"], gpu=False)


def reconocer_placa(imagen_bytes: bytes) -> tuple[str, float]:
    """Detecta la placa en la foto y devuelve (texto_normalizado, confianza)."""
    from PIL import Image

    modelo = _cargar_modelo_yolo()
    lector = _cargar_ocr()

    imagen = Image.open(io.BytesIO(imagen_bytes)).convert("RGB")
    resultados = modelo.predict(imagen, verbose=False)

    if not resultados or len(resultados[0].boxes) == 0:
        raise PlacaNoDetectadaError("No se detectó ninguna placa en la foto.")

    caja = max(resultados[0].boxes, key=lambda b: float(b.conf[0]))
    confianza_deteccion = float(caja.conf[0])
    x1, y1, x2, y2 = (int(v) for v in caja.xyxy[0].tolist())
    recorte = imagen.crop((x1, y1, x2, y2))

    import numpy as np

    lecturas = lector.readtext(np.array(recorte), detail=1, paragraph=False)
    if not lecturas:
        raise PlacaNoDetectadaError("Se detectó la placa pero no se pudo leer el texto.")

    _, texto, confianza_ocr = max(lecturas, key=lambda r: r[2])
    placa_normalizada = normalizar_placa(texto)

    if not _validar_formato(placa_normalizada):
        # Igual la devolvemos: el usuario puede corregirla a mano en la app.
        pass

    confianza_final = (confianza_deteccion + confianza_ocr) / 2
    return placa_normalizada, confianza_final
