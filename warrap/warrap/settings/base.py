"""
warrap/settings/base.py
------------------------
Settings shared across ALL environments (dev, prod).
Never import this file directly — use dev.py or prod.py.
Environment-specific secrets are loaded from .env via django-environ.
"""
import os
from pathlib import Path
from shutil import which

import environ

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
# BASE_DIR = warrap/ (the repo root, parent of the warrap/ Django package)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ---------------------------------------------------------------------------
# Security – load from environment
# ---------------------------------------------------------------------------
SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")

# Read .env from repo root
env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

# ---------------------------------------------------------------------------
# Application registry
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    # django-unfold must come BEFORE django.contrib.admin
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    "django.contrib.humanize",
    "django.contrib.sites",  # required by allauth
]

THIRD_PARTY_APPS = [
    # Auth
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",

    # Frontend tooling
    "tailwind",
    "theme",
]

LOCAL_APPS = [
    "apps.accounts",
    "apps.hustles",
    "apps.notifications",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",  # required by allauth
]

ROOT_URLCONF = "warrap.urls"
WSGI_APPLICATION = "warrap.wsgi.application"

# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",  # required by allauth
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "django.template.context_processors.i18n",
                "apps.accounts.context_processors.user_profile",
                "apps.hustles.context_processors.site_meta",  # SEO context
            ],
        },
    },
]

# ---------------------------------------------------------------------------
# Database — PostGIS (overridden per environment if needed)
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": os.environ.get("DB_NAME", "db"),
        "USER": os.environ.get("DB_USER", "postgres"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "postgres"),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
    }
}
# Force the PostGIS backend even when DATABASE_URL uses postgres://
DATABASES["default"]["ENGINE"] = "django.contrib.gis.db.backends.postgis"

# ---------------------------------------------------------------------------
# Cache — Redis
# ---------------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": env("REDIS_URL", default="redis://127.0.0.1:6379/1"),
        "KEY_PREFIX": "warrap",
        "TIMEOUT": 60 * 5,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,  # degrade gracefully if Redis is down
        },
    }
}

# ---------------------------------------------------------------------------
# Authentication — Custom User + django-allauth
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

AUTHENTICATION_BACKENDS = [
    # Default — needed for Django admin login
    "django.contrib.auth.backends.ModelBackend",
    # allauth-specific (handles email login, social, etc.)
    "allauth.account.auth_backends.AuthenticationBackend",
]

# django.contrib.sites
SITE_ID = 1

# allauth core settings
ACCOUNT_AUTHENTICATION_METHOD = "username_email"  # allow login by username OR email
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = "optional"  # set to "mandatory" in prod with SMTP
ACCOUNT_USERNAME_REQUIRED = True
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_SIGNUP_REDIRECT_URL = "hustles:map"
ACCOUNT_LOGIN_REDIRECT_URL = "hustles:map"
ACCOUNT_LOGOUT_REDIRECT_URL = "accounts:login"
ACCOUNT_LOGOUT_ON_GET = False  # POST required for logout (CSRF safety)
ACCOUNT_SESSION_REMEMBER = True
ACCOUNT_SIGNUP_FIELDS = [
    "username*", "email*", "first_name*", "last_name*", "password1*", "password2*",
]

# Custom allauth forms (we extend them to add city, phone fields)
ACCOUNT_FORMS = {
    "signup": "apps.accounts.forms.WarrapSignupForm",
    "login": "apps.accounts.forms.WarrapLoginForm",
}

# Social auth — Google
SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "SCOPE": ["profile", "email"],
        "AUTH_PARAMS": {"access_type": "online"},
        "APP": {
            "client_id": env("GOOGLE_CLIENT_ID", default=""),
            "secret": env("GOOGLE_CLIENT_SECRET", default=""),
            "key": "",
        },
    }
}
SOCIALACCOUNT_AUTO_SIGNUP = True  # skip signup form for social users
SOCIALACCOUNT_EMAIL_REQUIRED = True
SOCIALACCOUNT_LOGIN_ON_GET = False

# Legacy redirect settings (still used by some allauth internals)
LOGIN_URL = "account_login"
LOGIN_REDIRECT_URL = "hustles:map"
LOGOUT_REDIRECT_URL = "account_login"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------------------
# Internationalisation
# ---------------------------------------------------------------------------
from django.utils.translation import gettext_lazy as _

LANGUAGE_CODE = "en"
LANGUAGES = [
    ("en", _("English")),
    ("fr", _("Français")),
]
LOCALE_PATHS = [BASE_DIR / "locale"]
TIME_ZONE = "Africa/Douala"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static & media files
# ---------------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ---------------------------------------------------------------------------
# Tailwind (django-tailwind)
# ---------------------------------------------------------------------------
TAILWIND_APP_NAME = "theme"
INTERNAL_IPS = ["127.0.0.1"]
NPM_BIN_PATH = which("npm")

# ---------------------------------------------------------------------------
# Django Unfold admin
# ---------------------------------------------------------------------------
UNFOLD = {
    "SITE_TITLE": "Warrap Admin",
    "SITE_HEADER": "Warrap",
    "SITE_URL": "/",
    "COLORS": {
        "primary": {
            "50": "253 246 237",
            "100": "250 233 210",
            "200": "245 207 162",
            "300": "239 173 97",
            "400": "234 143 49",
            "500": "207 69 0",
            "600": "186 60 0",
            "700": "154 58 10",
            "800": "120 45 10",
            "900": "90 33 8",
            "950": "60 22 5",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": True,
    },
}

# ---------------------------------------------------------------------------
# SEO / Site metadata (used by hustles.context_processors.site_meta)
# ---------------------------------------------------------------------------
SITE_META = {
    "name": "Warrap",
    "tagline": "Stop scrolling. Start strolling to your next warrap.",
    "description": (
        "Warrap is a geospatial gig-map for Cameroonian students and hustlers. "
        "Find short-term, informal tasks near you — no CV, no waiting, just skills and a map pin."
    ),
    "url": env("SITE_URL", default="https://warrap.cm"),
    "locale": "en_CM",
    "locale_alternate": "fr_CM",
    "twitter_handle": "@warrap_cm",
    "og_image": "/static/img/og-cover.png",  # 1200×630 image (Sprint 5)
    "theme_color": "#F3F0EE",
    "keywords": (
        "warrap, cameroon jobs, informal work, student gigs, hustle, "
        "Yaoundé, Douala, Buea, gig map, short term work, pocket money"
    ),
    "author": "Warrap — Advanced Web Dev Course",
    "robots": "index, follow",
}

# ---------------------------------------------------------------------------
# App-specific settings
# ---------------------------------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Proximity radius for nearby task queries (metres)
HUSTLE_PROXIMITY_RADIUS_M = env.int("HUSTLE_PROXIMITY_RADIUS_M", default=5000)

# Flash-gig lifetime (minutes)
FLASH_GIG_LIFETIME_MINUTES = 15

# Map tile cache TTL in seconds
MAP_CACHE_TTL = env.int("MAP_CACHE_TTL", default=30)

# ---------------------------------------------------------------------------
# PWA (future — Sprint 6)
# ---------------------------------------------------------------------------
PWA_APP_NAME = "Warrap"
PWA_APP_DESCRIPTION = "Your neighborhood hustle-map"
PWA_APP_THEME_COLOR = "#F3F0EE"
PWA_APP_BACKGROUND_COLOR = "#F3F0EE"
PWA_APP_DISPLAY = "standalone"
