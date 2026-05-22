FROM python:3.12-slim-bookworm AS app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_SETTINGS_MODULE=warrap.settings.prod

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        binutils \
        build-essential \
        curl \
        gdal-bin \
        gettext \
        libgdal-dev \
        libpq-dev \
        netcat-openbsd \
        nodejs \
        npm \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN sed '/^GDAL==/d' requirements.txt > /tmp/requirements-no-gdal.txt \
    && pip install --upgrade pip \
    && pip install "GDAL==$(gdal-config --version).*" \
    && pip install -r /tmp/requirements-no-gdal.txt

COPY theme/static_src/package*.json ./theme/static_src/
RUN cd theme/static_src && npm ci

COPY . .

RUN npm --prefix theme/static_src run build \
    && chmod +x /app/docker/entrypoint.sh \
    && mkdir -p /app/logs \
    && python manage.py collectstatic --noinput

EXPOSE 8000

ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["gunicorn", "warrap.wsgi:application", "--bind", "0.0.0.0:8000"]
