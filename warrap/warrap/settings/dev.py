"""
warrap/settings/dev.py
-----------------------
Development-only settings. Never used in production.

Usage:
    export DJANGO_SETTINGS_MODULE=warrap.settings.dev
    python manage.py runserver
"""
from .base import *  # noqa: F401, F403

# ---------------------------------------------------------------------------
# Core dev flags
# ---------------------------------------------------------------------------
DEBUG = True

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "[::1]",
]

# ---------------------------------------------------------------------------
# Dev-only apps
# ---------------------------------------------------------------------------
INSTALLED_APPS += [  # noqa: F405
    "django_browser_reload",
]

MIDDLEWARE += [  # noqa: F405
    "django_browser_reload.middleware.BrowserReloadMiddleware",
]

# ---------------------------------------------------------------------------
# Database — use a local PostgreSQL+PostGIS DB
# ---------------------------------------------------------------------------
# DATABASE_URL is read from .env by base.py.
# Default: postgis://postgres:postgres@localhost:5432/warrap_db

# ---------------------------------------------------------------------------
# Cache — Redis (same as base; can override with DummyCache for offline dev)
# ---------------------------------------------------------------------------
# To run without Redis locally, uncomment:
# CACHES = {
#     "default": {
#         "BACKEND": "django.core.cache.backends.dummy.DummyCache",
#     }
# }

# ---------------------------------------------------------------------------
# Static files — WhiteNoise disabled in dev (Django serves directly)
# ---------------------------------------------------------------------------
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"

# ---------------------------------------------------------------------------
# Email — print to terminal in dev (no SMTP needed)
# ---------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ---------------------------------------------------------------------------
# allauth email verification — optional in dev so you can log in right away
# ---------------------------------------------------------------------------
ACCOUNT_EMAIL_VERIFICATION = "optional"

# ---------------------------------------------------------------------------
# Django Debug Toolbar (install separately if desired)
# ---------------------------------------------------------------------------
# INSTALLED_APPS += ["debug_toolbar"]
# MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE

# ---------------------------------------------------------------------------
# Logging — verbose SQL queries in dev
# ---------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
        },
        "django.db.backends": {
            "handlers": ["console"],
            "level": "WARNING",    # change to DEBUG to log every SQL query
        },
        "apps": {
            "handlers": ["console"],
            "level": "DEBUG",
        },
    },
}

# ---------------------------------------------------------------------------
# CORS (if testing with a separate frontend in dev)
# ---------------------------------------------------------------------------
# CORS_ALLOW_ALL_ORIGINS = True
