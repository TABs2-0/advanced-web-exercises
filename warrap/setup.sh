#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Warrap — Sprint 1 Setup Script
# Run once after cloning:  chmod +x setup.sh && ./setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo ""
echo "================================="
echo "  Warrap — Sprint 1 Setup"
echo "================================="
echo ""

# 1. Virtual environment
if [ ! -d ".venv" ]; then
  echo "[1/8] Creating virtual environment..."
  python3 -m venv .venv
fi
source .venv/bin/activate

# 2. Python dependencies
echo "[2/8] Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

# 3. Environment file
if [ ! -f ".env" ]; then
  echo "[3/8] Creating .env from template..."
  cp .env.example .env
  echo "      ACTION REQUIRED: Edit .env with your database credentials."
else
  echo "[3/8] .env already exists — skipping."
fi

# 4. Database check
echo "[4/8] Checking PostgreSQL + PostGIS connection..."
python3 -c "
import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'warrap.settings.dev')
try:
    import django; django.setup()
    from django.db import connection
    connection.ensure_connection()
    print('     PostgreSQL connection: OK')
except Exception as e:
    print(f'     WARNING: DB not ready — {e}')
    print('     Make sure PostgreSQL is running and .env has correct credentials.')
    print('     Also run in psql: CREATE EXTENSION postgis;')
"

# 5. Migrations
echo "[5/8] Running migrations..."
python manage.py migrate

# 6. Tailwind
echo "[6/8] Installing Tailwind dependencies..."
python manage.py tailwind install --no-input 2>/dev/null || echo "     (npm not available — run manually)"

# 7. Static files
echo "[7/8] Collecting static files..."
python manage.py collectstatic --noinput -v 0

# 8. Superuser
echo "[8/8] Creating superuser (skips if already exists)..."
python manage.py createsuperuser --noinput \
  --username admin \
  --email admin@warrap.cm 2>/dev/null || echo "     Superuser already exists."

echo ""
echo "================================="
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Edit .env with your DB password"
echo "  2. In psql: CREATE EXTENSION postgis;"
echo "  3. Configure Google OAuth in .env"
echo "     (see README.md for setup steps)"
echo "  4. Terminal 1 — Tailwind watcher:"
echo "     python manage.py tailwind start"
echo "  5. Terminal 2 — Dev server:"
echo "     python manage.py runserver"
echo "  6. Admin: http://127.0.0.1:8000/admin/"
echo "================================="
