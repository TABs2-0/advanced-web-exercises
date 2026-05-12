# Warrap

> Stop scrolling. Start strolling to your next warrap.

**Warrap** (n.) — Cameroonian slang for a quick, informal job you do for some money. Not too formal. Not too serious. Just hustle.

Warrap is a geospatial gig-map for Cameroonian students and hustlers. It maps short-term informal tasks near you so you can find paid work without a CV, a contact, or a corporate email address.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 4.2 + GeoDjango |
| Database | PostgreSQL + PostGIS |
| Caching | Redis (django-redis) |
| Frontend | HTML + Tailwind CSS v3 (django-tailwind) + Vanilla JS |
| Maps | Leaflet.js + OpenStreetMap |
| Auth | django-allauth (email + Google OAuth) |
| Admin | Django Unfold |
| Design System | Mastercard Design System (getdesign.nd) |
| Icons | HugeIcons — Stroke Rounded (inline SVG components) |

---

## Project Structure

```
warrap/
├── apps/
│   ├── accounts/          # Custom User, profiles, vouching
│   ├── hustles/           # Tasks, ratings, map API, leaderboard
│   └── notifications/     # In-app notifications
├── warrap/
│   ├── settings/
│   │   ├── base.py        # Shared settings (all environments)
│   │   ├── dev.py         # Development overrides
│   │   └── prod.py        # Production overrides
│   ├── urls.py
│   └── wsgi.py
├── templates/
│   ├── base.html          # Master layout
│   ├── partials/
│   │   ├── seo.html       # Full SEO meta tags (OG, Twitter, JSON-LD)
│   │   ├── navbar.html
│   │   ├── footer.html
│   │   ├── messages.html
│   │   └── task_card.html
│   ├── account/           # django-allauth overrides (login, signup, email)
│   ├── socialaccount/     # allauth social auth overrides
│   ├── accounts/          # profile, edit_profile
│   ├── hustles/           # map, post_task, task_detail, leaderboard, rate
│   ├── notifications/
│   └── components/icons/  # HugeIcons SVG components
├── static/
│   ├── js/app.js          # Global Vanilla JS
│   └── icons/logo.png
├── theme/static_src/      # Tailwind v3 source
├── .env.example
├── requirements.txt
├── manage.py
└── setup.sh
```

---

## Setup

```bash
# 1. Clone into your course repo
cd advanced-web-exercises && mkdir warrap && cd warrap
# (extract zip contents here)

# 2. Virtual environment
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 3. Environment
cp .env.example .env   # then edit with your DB credentials

# 4. PostGIS
psql -U postgres -c "CREATE DATABASE warrap_db;"
psql -U postgres -d warrap_db -c "CREATE EXTENSION postgis;"

# 5. Migrate (settings auto-select dev)
python manage.py migrate

# 6. Tailwind (two terminals)
python manage.py tailwind install
python manage.py tailwind start   # terminal 1
python manage.py runserver        # terminal 2
```

### Settings selection

| Context | Module |
|---|---|
| Local dev (default) | `warrap.settings.dev` |
| Production server | `warrap.settings.prod` |
| Override manually | `export DJANGO_SETTINGS_MODULE=warrap.settings.prod` |

### Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → APIs & Services → Credentials → OAuth 2.0 Client ID
3. Application type: **Web application**
4. Authorised redirect URI: `http://localhost:8000/accounts/google/login/callback/`
5. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your `.env`
6. In Django admin → Sites → set domain to `localhost:8000`
7. In Django admin → Social Applications → add Google app with your credentials

---

## Key design decisions

**Why Leaflet over Mapbox?** No API key needed for dev, free OpenStreetMap tiles, works on 3G. Mapbox free tier can break mid-demo. Upgrade path is one line change.

**Why django-allauth?** Handles email verification, password reset, Google OAuth, and future social providers (Facebook, etc.) out of the box. Writing all this manually is a waste of sprint time.

**Why the settings folder?** Clean separation of concerns. `base.py` has everything shared; `dev.py` and `prod.py` only override what differs. No `if DEBUG:` noise inside a single file.

**Why monolithic architecture?** One dev, one deadline, one deployment. Django MVT already separates concerns cleanly. Microservices at this scale would hurt more than help.

---

Built for the streets. Powered by the hustle.
[github.com/Joel-Fah/advanced-web-exercises](https://github.com/Joel-Fah/advanced-web-exercises)
