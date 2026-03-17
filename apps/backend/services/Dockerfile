FROM python:3.11-slim

WORKDIR /app

COPY apps/backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY apps/backend /app/backend

ENV PYTHONPATH=/app/backend
ARG SERVICE_MODULE="app.main:app"
ENV SERVICE_MODULE=${SERVICE_MODULE}
ENV PORT=8000

CMD ["sh", "-c", "uvicorn ${SERVICE_MODULE} --host 0.0.0.0 --port ${PORT}"]
