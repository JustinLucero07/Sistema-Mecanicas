# Variante de la API con lectura automática de placas (YOLO + OCR).
# Mucho más pesada (torch, opencv): úsala solo cuando tengas el modelo
# entrenado en models/ y PLATE_MODEL_PATH apuntando a él.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements-ml.txt ./
RUN pip install -r requirements-ml.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini crear_taller.py ./
COPY models ./models

RUN useradd --system --uid 10001 mecanica && chown -R mecanica /app
USER mecanica
EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'"]
