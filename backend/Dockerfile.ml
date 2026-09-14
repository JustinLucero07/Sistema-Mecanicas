# Imagen con soporte de reconocimiento de placas (YOLO + OCR).
# Es mucho más pesada que el Dockerfile base por torch/opencv; úsala solo
# para el servicio que corre la inferencia (puede ser el mismo backend
# en una VPS, o un servicio aparte).
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-ml.txt requirements.txt ./
RUN pip install --no-cache-dir -r requirements-ml.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
