# Warrap — Development Instructions

> This document is the canonical guide for continuing development of Warrap.
> It is written to be fully actionable by a human developer or an AI coding agent.
> It describes what exists, what must be built next, and how every decision should be made.
> Do not hardcode assumptions. Read the codebase before writing code. Follow the patterns already established.

---

## 0. Project Context

**Warrap** is a geospatial gig-map for the Cameroonian informal sector.
Users post short-term tasks (Hustles) pinned on a live map. Other users claim them with a single tap.
The name is Cameroonian street slang for a quick informal job done for money.

**Tone:** Casual, playful, youth-focused. Not corporate. The UI should feel like a game you want to keep using.

**Design system:** Mastercard Design System (getdesign.nd) — warm canvas `#F3F0EE`, ink black `#141413`, rounded pills, orbital arcs, editorial whitespace. All design tokens are already configured in `theme/static_src/tailwind.config.js`.

**Stack:**
- Backend: Django 4.2 + GeoDjango + PostgreSQL/PostGIS + Redis
- Auth: django-allauth with Google OAuth
- Frontend: Plain HTML + Tailwind CSS v3 (django-tailwind) + Vanilla JS
- Maps: Leaflet.js + OpenStreetMap (no API key required)
- Admin: Django Unfold
- Icons: HugeIcons Stroke Rounded — delivered as inline SVG components in `templates/components/icons/`

---

## 1. Development Environment

### 1.1 Runtime: WSL2 (Ubuntu) — Required on Windows

GDAL and PostGIS have broken Windows native installation stories.
**All development must run inside WSL2.** This is the authoritative environment.

```
Windows 11
└── WSL2 (Ubuntu 22.04 or 24.04)
    ├── Python 3.11+ virtual environment (.venv)
    ├── PostgreSQL 15 + PostGIS 3.3
    ├── Redis 7
    └── Node.js 20+ (for Tailwind)
```

### 1.2 WSL2 Setup (one-time, if not done)

```bash
# 1. Install WSL2
wsl --install -d Ubuntu-22.04    # run in PowerShell as admin

# 2. Inside WSL — install system dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
  python3.11 python3.11-venv python3-pip \
  postgresql postgresql-contrib postgis \
  gdal-bin libgdal-dev python3-gdal \
  redis-server \
  nodejs npm \
  git curl

# 3. Start services
sudo service postgresql start
sudo service redis-server start

# 4. Create the database
sudo -u postgres psql -c "CREATE USER warrap WITH PASSWORD 'warrap';"
sudo -u postgres psql -c "CREATE DATABASE warrap_db OWNER warrap;"
sudo -u postgres psql -d warrap_db -c "CREATE EXTENSION postgis;"
sudo -u postgres psql -d warrap_db -c "GRANT ALL PRIVILEGES ON DATABASE warrap_db TO warrap;"
```

### 1.3 Project Setup (run from repo root inside WSL)

```bash
# Clone / navigate to the project
cd /path/to/advanced-web-exercises/warrap

# Virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Environment file
cp .env.example .env
# Edit .env — set DATABASE_URL=postgis://warrap:warrap@localhost:5432/warrap_db

# Migrations
python manage.py migrate

# Tailwind
python manage.py tailwind install
# In terminal 1 (keep running):
python manage.py tailwind start

# Dev server — terminal 2:
python manage.py runserver

# Superuser
python manage.py createsuperuser
```

### 1.4 .env Reference

All environment variables are declared in `.env.example`.
The settings package reads them with `django-environ`.
Critical variables:

| Variable | Dev value | Notes |
|---|---|---|
| `DJANGO_SETTINGS_MODULE` | `warrap.settings.dev` | Auto-set by `manage.py` |
| `DATABASE_URL` | `postgis://warrap:warrap@localhost:5432/warrap_db` | Must use `postgis://` scheme |
| `REDIS_URL` | `redis://127.0.0.1:6379/1` | |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | Optional for Sprint 2 |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | Optional for Sprint 2 |
| `SECRET_KEY` | Any random string in dev | Use `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |

### 1.5 Running the Expiry Cron (local dev)

Flash-Gigs expire in 15 minutes. The expiry is handled by a management command, not a scheduler:

```bash
# Run manually to expire stale tasks during dev:
python manage.py expire_tasks

# Or loop it in a shell for dev:
watch -n 60 python manage.py expire_tasks
```

---

## 2. Codebase Map

Read this before touching any file.

```
warrap/                          ← repo root (also the Django project root)
│
├── warrap/                      ← Django project package
│   ├── settings/
│   │   ├── base.py              ← ALL shared settings (auth, cache, installed apps, SEO meta)
│   │   ├── dev.py               ← DEBUG=True, console email, hot reload
│   │   └── prod.py              ← HTTPS, HSTS, SMTP, rotating logs
│   ├── urls.py                  ← Root URL config — mounts all app URLs + allauth
│   └── wsgi.py
│
├── apps/
│   ├── accounts/
│   │   ├── models.py            ← Custom User (extends AbstractUser), Vouch
│   │   ├── forms.py             ← WarrapSignupForm, WarrapLoginForm (extend allauth)
│   │   ├── views.py             ← profile_view, edit_profile_view, vouch_view ONLY
│   │   ├── services.py          ← can_user_vouch(), create_vouch(), get_user_completed_tasks()
│   │   ├── urls.py              ← /u/profile/<username>/, /u/profile/edit/, /u/vouch/<username>/
│   │   ├── admin.py             ← Unfold-based admin for User and Vouch
│   │   ├── context_processors.py ← injects current_user into all templates
│   │   └── signals.py           ← post-registration hooks (placeholder for Sprint 5 SMS)
│   │
│   ├── hustles/
│   │   ├── models.py            ← Task, Rating (with PostGIS PointField)
│   │   ├── forms.py             ← PostTaskForm, RatingForm
│   │   ├── views.py             ← map, nearby API, task CRUD, claim, complete, rate, leaderboard
│   │   ├── services.py          ← ALL business logic: create_task, claim_task, complete_task,
│   │   │                           submit_rating, expire_stale_tasks, get_weekly_leaderboard,
│   │   │                           get_nearby_tasks (with Redis caching)
│   │   ├── urls.py              ← /hustles/*, /hustles/api/nearby/
│   │   ├── context_processors.py ← injects meta{} dict (SEO) from settings.SITE_META
│   │   ├── signals.py           ← Flash-Gig notification hook (placeholder for Sprint 4)
│   │   ├── admin.py             ← Unfold admin for Task and Rating
│   │   └── management/commands/expire_tasks.py ← python manage.py expire_tasks
│   │
│   └── notifications/
│       ├── models.py            ← Notification (recipient, kind, title, body, url, is_read)
│       ├── views.py             ← list view + mark-read endpoint
│       └── urls.py              ← /notifications/
│
├── templates/
│   ├── base.html                ← Master layout: includes seo.html, navbar, messages, footer
│   ├── partials/
│   │   ├── seo.html             ← Full SEO block (OG, Twitter, JSON-LD, geo, PWA meta)
│   │   ├── navbar.html          ← Floating pill nav — allauth-aware
│   │   ├── footer.html          ← Ink-black footer with 4-col links
│   │   ├── messages.html        ← Auto-dismissing toast notifications
│   │   └── task_card.html       ← Reusable task summary card
│   ├── account/                 ← Allauth template overrides (login, signup, password reset)
│   ├── accounts/                ← Profile and edit profile pages
│   ├── hustles/                 ← map, post_task, task_detail, leaderboard, rate, my_tasks
│   ├── notifications/           ← Notification inbox
│   └── components/icons/        ← HugeIcons SVG components (include with size param)
│
├── static/
│   ├── js/app.js                ← Global Vanilla JS (nav scroll, dropdowns, star rating, countdowns)
│   ├── icons/logo.png           ← Warrap logo
│   ├── img/                     ← OG cover image goes here (og-cover.png, 1200×630)
│   └── manifest.json            ← PWA manifest (foundation only)
│
└── theme/
    ├── static_src/
    │   ├── tailwind.config.js   ← ALL design tokens (colors, radius, shadows, animations)
    │   └── src/styles.css       ← Tailwind entry point + @layer base/components/utilities
    └── static/css/dist/         ← Compiled output (do not edit)
```

### Key conventions — follow these exactly

1. **Views are thin.** Never put business logic in a view. Call `services.py`.
2. **Services are pure Django.** No HTTP, no request objects in services.
3. **Models have helpers, not logic.** `pay_display`, `whatsapp_link`, `avatar_url` are fine on the model. Claim logic is not.
4. **One services.py per app.** If a service needs data from another app, import the model directly (avoid circular imports by importing inside the function).
5. **All auth URLs use allauth names.** `account_login`, `account_signup`, `account_logout`, `account_reset_password`, `google_login`. Never `accounts:login`.
6. **Profile URLs use `accounts:` namespace.** `accounts:profile`, `accounts:edit_profile`, `accounts:vouch`.
7. **Hustle URLs use `hustles:` namespace.** `hustles:map`, `hustles:post_task`, `hustles:task_detail`, etc.
8. **Tailwind classes only from the design token palette.** Use `bg-canvas`, `text-ink`, `bg-signal`, `rounded-btn`, `rounded-hero`, `shadow-card` — all defined in `tailwind.config.js`. Never hardcode hex colors in templates.
9. **Icons via include.** `{% include "components/icons/plus.html" with size=16 %}`. The `size` parameter is optional (defaults to 20).
10. **SEO blocks in every page template.** At minimum override `{% block meta_title %}`.

---

## 3. Design System Reference

The Mastercard Design System tokens are in `tailwind.config.js`. Use only these.

### Colors

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#F3F0EE` | Page background — always, never pure white |
| `ink` | `#141413` | Primary text, CTA backgrounds |
| `lifted` | `#FCFBFA` | Nested card surfaces |
| `slate` | `#696969` | Secondary / muted text |
| `signal` | `#CF4500` | Consent, legal actions, accent dots only |
| `signal-light` | `#F37338` | Orbital arcs, active indicators, badge accents |
| `clay` | `#9A3A0A` | Deep rust, secondary link style |
| `link` | `#3860BE` | Inline hyperlinks |
| `bone` | `#F4F4F4` | Cool alternate surface |

### Border radius

| Token | Value | Use |
|---|---|---|
| `rounded-sm` | `3px` | Tiny chips |
| `rounded-btn` | `20px` | All buttons and form inputs |
| `rounded-consent` | `24px` | Orange/signal pills |
| `rounded-hero` | `40px` | Hero frames, cards, media containers |
| `rounded-circle` | `50%` | Avatars, portrait images |
| `rounded-full` | `999px` | Nav pill, country selector |

### Component classes (defined in `styles.css` `@layer components`)

| Class | Description |
|---|---|
| `.btn-primary` | Ink-black pill button |
| `.btn-secondary` | Outlined white pill button |
| `.btn-signal` | Orange consent pill — consent/legal only |
| `.btn-satellite` | White circular arrow button (profile cards) |
| `.btn-icon` | Small circular icon button |
| `.nav-pill` | Floating nav container |
| `.eyebrow` | Section label with accent dot |
| `.card` | White rounded card with shadow |
| `.category-pill` | Small tag chip |
| `.status-open / .status-claimed / .status-completed / .status-expired` | Status badge variants |
| `.map-container` | Map wrapper with rounded corners |
| `.field-input` | Form input — use in plain HTML forms |
| `.ghost-headline` | Near-invisible watermark headline |
| `.section-container` | Max-width content wrapper with gutters |
| `.toast-success / .toast-error / .toast-info / .toast-warning` | Toast message variants |

### Animations

| Class | Effect |
|---|---|
| `.animate-fade-in` | Opacity 0→1, 300ms |
| `.animate-slide-up` | Slide up + fade, 400ms |
| `.animate-pulse-pin` | Scale pulse for Flash-Gig pins |
| `.pin-flash` | Applied to Flash-Gig SVG map pins |

Apply `animate-slide-up` to primary content cards on page load. Use `animation-delay` inline for staggered lists (e.g. leaderboard rows).

### Typography rules

- Headlines: `font-medium` (500 weight), negative letter-spacing via `text-hero` / `text-section` / `text-card-title`
- Body: `font-body` class (weight 450 — the Mastercard signature half-step)
- Eyebrow labels: `class="eyebrow"` component — auto-inserts the accent dot via CSS `::before`
- Uppercase: **only** on eyebrow labels. Never on section titles or buttons.

---

## 4. Sprint 2 — Core Map (What to build next)

**Goal:** A working live map with task pins, functional task posting with the embedded pin-drop map, and the nearby API endpoint returning real data from the database.

**Entry condition:** Sprint 1 is complete. `python manage.py runserver` loads without errors. Admin panel is accessible. Migrations are applied.

---

### 4.1 Backend: Seed data management command

Before the map can show anything, you need tasks in the database.
Create a management command `apps/hustles/management/commands/seed_data.py`.

**What it should do:**
- Create 3–5 test users (if they do not already exist) with varied cities and badges
- Create 10–15 tasks distributed across Yaoundé, Douala, and Buea coordinates
- Create a mix of categories: `digital`, `physical`, `event`, `delivery`
- Include 2–3 Flash-Gigs (set `is_flash_gig=True`, `expires_at` = now + 15 min)
- Use `services.create_task()` — never create Task objects directly in the command
- Be idempotent: running it twice should not duplicate data (use `get_or_create`)

**Coordinates to use for seeding:**
```python
SEED_LOCATIONS = {
    "yaounde": [
        (3.8663, 11.5167, "Bastos"),
        (3.8480, 11.5021, "Melen"),
        (3.8741, 11.5268, "Mvog-Ada"),
        (3.8622, 11.4956, "Biyem-Assi"),
    ],
    "douala": [
        (4.0511, 9.7679, "Akwa"),
        (4.0435, 9.7028, "Bonamoussadi"),
        (4.0612, 9.7345, "Bali"),
    ],
    "buea": [
        (4.1527, 9.2403, "Molyko"),
        (4.1617, 9.2534, "Great Soppo"),
    ],
}
```

**Run it with:**
```bash
python manage.py seed_data
```

---

### 4.2 Backend: Verify the nearby API

The API view exists at `apps/hustles/views.nearby_tasks_api`.
Before testing the map, verify it works:

```bash
# With the server running and seed data loaded:
curl "http://localhost:8000/hustles/api/nearby/?lat=3.848&lng=11.502"
# Expected: {"tasks": [...]} with at least one task
```

**If the response is empty but tasks exist in the DB:**
- Check that task `status` is `"open"` and `expires_at` is in the future
- Check that `location_approx` is set (it auto-sets on `Task.save()` if `location` is provided)
- Check that the PostGIS distance query is using the right SRID — both user point and task locations must use `srid=4326`

**If there is a PostGIS error:**
- Ensure `django.contrib.gis` is in `INSTALLED_APPS` (it is, in `base.py`)
- Ensure the DB engine is `django.contrib.gis.db.backends.postgis` (it is, in `base.py`)
- Run `python manage.py shell` → `from django.contrib.gis.geos import Point` → should import cleanly

---

### 4.3 Frontend: Map page (`templates/hustles/map.html`)

The map template is already written. **Verify and fix the following before considering it done:**

**Checklist:**
- [ ] Map renders on load at Yaoundé coordinates
- [ ] Pins appear after `loadTasks()` is called on init
- [ ] Clicking a pin opens a popup with task title, category, pay, and a "View →" link
- [ ] The sidebar populates with task cards matching the pins
- [ ] Clicking a sidebar card links to `hustles:task_detail`
- [ ] The category filter dropdown filters pins in real time (no page reload)
- [ ] The "Find my location" button calls `navigator.geolocation` and re-centers the map
- [ ] Flash-Gig pins have the `.pin-flash` CSS class applied (pulse animation)
- [ ] On mobile (< 768px): the sidebar stacks below the map, full width
- [ ] The map container has `rounded-hero` corners

**Known issue to fix:** The `TASK_DETAIL_BASE` URL construction in the map JS uses a string replace hack. Replace it with a proper data attribute:

In the view (`map_view`), pass:
```python
"task_detail_url_template": request.build_absolute_uri(
    reverse("hustles:task_detail", kwargs={"pk": 0})
).replace("/0/", "/{id}/")
```
Then in the template JS:
```javascript
const TASK_DETAIL_TEMPLATE = "{{ task_detail_url_template }}";
// Usage: TASK_DETAIL_TEMPLATE.replace("{id}", task.id)
```

---

### 4.4 Frontend: Post task page (`templates/hustles/post_task.html`)

**Checklist:**
- [ ] The embedded pin-drop map renders inside the form
- [ ] Clicking the map sets `#id_latitude` and `#id_longitude` hidden inputs
- [ ] The "Pin set at" confirmation line appears after dropping a pin
- [ ] Geolocation auto-centers the pin-drop map on the user's position
- [ ] The Flash-Gig toggle reveals a helper text about the 15-minute expiry
- [ ] Submitting without dropping a pin shows a validation error ("Please drop a pin…")
- [ ] On success, user is redirected to the task detail page
- [ ] All fields use the `.field-input` class or the form's widget classes (consistent styling)
- [ ] On mobile: form is single-column, map is full-width and at least 250px tall

**Add Flash-Gig toggle UX:**
When `#id_is_flash_gig` is checked, show an inline helper:
```html
<p id="flash-hint" class="hidden text-xs text-amber-600 mt-1">
  ⚡ This task will expire in 15 minutes and alert nearby users.
</p>
```
Wire with:
```javascript
document.getElementById('id_is_flash_gig').addEventListener('change', e => {
  document.getElementById('flash-hint').classList.toggle('hidden', !e.target.checked);
});
```

---

### 4.5 Frontend: Task detail page (`templates/hustles/task_detail.html`)

**Checklist:**
- [ ] Status badge uses the correct `.status-{status}` class variant
- [ ] Flash-Gig tasks show a live countdown timer (`data-expires="{{ task.expires_at.isoformat }}"`)
- [ ] WhatsApp deep-link button only appears when: task is `CLAIMED` or `COMPLETED`, viewer is the poster, and claimer has a phone number
- [ ] "Lock this Hustle" button is hidden if: task is not `OPEN`, or viewer is the poster, or viewer is already the claimer
- [ ] "Mark as Complete" button appears only if: task is `CLAIMED` and viewer is the poster or claimer (`is_party` context var)
- [ ] "Leave a Rating" appears only if task is `COMPLETED` and viewer is a party
- [ ] The exact location coordinates are shown only when `reveal_location` is `True`
- [ ] The poster profile snippet at the bottom links to `accounts:profile`
- [ ] Responsive: on mobile, the pay amount and title stack vertically

**Add countdown timer wiring in the template JS block:**
```javascript
// Flash-gig countdown — app.js initCountdowns() handles [data-expires] elements
// Ensure the element exists in the template:
{% if task.is_flash_gig and task.is_open %}
  <span data-expires="{{ task.expires_at.isoformat }}" class="text-xs font-medium text-amber-600"></span>
{% endif %}
```

---

## 5. Sprint 3 — Claim, Profile, Rating, Vouching

**Goal:** The full user loop works end-to-end: post → claim → complete → rate → vouch.

**Entry condition:** Sprint 2 is done. The map shows live pins. Task posting works. Task detail loads correctly.

---

### 5.1 Backend: Claim flow

The `claim_task` view and `services.claim_task()` are already implemented.
**Verify the atomicity guarantee:**

In `services.claim_task()`, confirm `select_for_update()` is used inside a `@transaction.atomic` block. This prevents two users from claiming the same task simultaneously. If you see a `DatabaseError: cannot use select_for_update in autocommit mode`, ensure the function is decorated with `@transaction.atomic`.

**After a successful claim:**
- Create a `Notification` record for the poster:
  ```python
  from apps.notifications.models import Notification
  Notification.objects.create(
      recipient=task.poster,
      kind=Notification.KindChoices.TASK_CLAIMED,
      title=f"Your task '{task.title}' was claimed!",
      body=f"@{claimer.username} just locked your warrap.",
      url=f"/hustles/{task.pk}/",
  )
  ```
  Add this to `services.claim_task()` after the status update.

---

### 5.2 Frontend: Profile page (`templates/accounts/profile.html`)

**Checklist:**
- [ ] Avatar renders with `rounded-circle` class; fallback to DiceBear URL if no avatar
- [ ] Badge emoji renders next to avatar (💻 Digital Ninja, 💪 Muscle Crew, 🎉 Event Plug, 🏍️ Delivery Rep, ⭐ All-Rounder)
- [ ] Stats row (Street Cred / Done / Vouches) renders horizontally on desktop, horizontally on mobile too (3-col grid)
- [ ] Ghost watermark headline uses the username
- [ ] "Edit profile" button only appears if `user == profile_user`
- [ ] "Vouch for this Hustler" button only appears if `can_vouch` is `True` in context
- [ ] Completed tasks grid: 2 columns on desktop, 1 on mobile
- [ ] Empty state for completed tasks has a CTA to the map
- [ ] Vouches list shows avatar + username of voucher + date

---

### 5.3 Frontend: Rating page (`templates/hustles/rate_task.html`)

The star rating UI relies on `app.js`'s `initStarRating()`. This function looks for `#star-rating` and `[data-star]` buttons.

**Verify the template wires correctly:**
- `#star-rating` wraps the star buttons
- Each star button has `data-star="{{ forloop.counter }}"`
- The hidden `#id_score` input receives the value on click
- Stars turn amber on hover and click

**If the hidden field ID is different** (allauth sometimes renames field IDs), read the rendered HTML in the browser dev tools and update the `getElementById` call in `app.js` accordingly.

---

### 5.4 Frontend: My Tasks page (`templates/hustles/my_tasks.html`)

**Checklist:**
- [ ] Two columns: "Tasks I Posted" (left) and "Tasks I Claimed" (right)
- [ ] Each uses `{% include "partials/task_card.html" %}` — do not duplicate card markup
- [ ] Status badges are correct and colour-coded
- [ ] Empty states for both columns have appropriate CTAs
- [ ] On mobile: both columns stack vertically

---

## 6. Sprint 4 — Flash-Gigs, Notifications, Leaderboard

**Goal:** Flash-Gigs work end-to-end with browser notifications. Leaderboard shows real data. Notification inbox works.

---

### 6.1 Backend: Browser Push Notifications (Web Push API)

Flash-Gig alerts use the browser's native Push API.
This requires a VAPID key pair.

**Generate VAPID keys:**
```bash
pip install pywebpush
python -c "
from pywebpush import Vapid
v = Vapid()
v.generate_keys()
print('VAPID_PUBLIC_KEY:', v.public_key.serialize().decode())
print('VAPID_PRIVATE_KEY:', v.private_key.serialize().decode())
"
```

Add to `.env`:
```
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_ADMIN_EMAIL=admin@warrap.cm
```

Add to `base.py`:
```python
VAPID_PUBLIC_KEY = env("VAPID_PUBLIC_KEY", default="")
VAPID_PRIVATE_KEY = env("VAPID_PRIVATE_KEY", default="")
VAPID_ADMIN_EMAIL = env("VAPID_ADMIN_EMAIL", default="admin@warrap.cm")
```

Add a `PushSubscription` model to `apps/notifications/models.py`:
```python
class PushSubscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name="push_subscriptions")
    endpoint = models.TextField(unique=True)
    p256dh = models.TextField()
    auth = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

Wire the signal in `apps/hustles/signals.py`:
```python
from apps.notifications.services import notify_nearby_users_of_flash_gig

@receiver(post_save, sender=Task)
def notify_flash_gig(sender, instance, created, **kwargs):
    if created and instance.is_flash_gig:
        notify_nearby_users_of_flash_gig(instance)
```

Create `apps/notifications/services.py` with `notify_nearby_users_of_flash_gig(task)`.
This function should query users with push subscriptions within 3 km of the task and call `pywebpush.webpush()`.

---

### 6.2 Frontend: Service Worker for Push

Create `static/js/sw.js` (service worker):
```javascript
self.addEventListener('push', event => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/static/icons/logo.png',
    badge: '/static/icons/logo.png',
    data: { url: data.url },
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

Register in `static/js/app.js`:
```javascript
async function registerServiceWorker() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    const reg = await navigator.serviceWorker.register('/static/js/sw.js');
    // subscribe logic here (Sprint 4)
  }
}
```

---

### 6.3 Frontend: Notification inbox (`templates/notifications/list.html`)

**Checklist:**
- [ ] Unread notifications have a coloured left border (`border-l-2 border-signal`) or accent dot
- [ ] Read notifications are visually muted
- [ ] Clicking a notification fires a POST to `notifications:mark_read` via `fetch()` (AJAX — no page reload)
- [ ] Notification count badge appears on the bell icon in the navbar if there are unread items
- [ ] Empty state renders correctly

**Add unread count to navbar:**
In `apps/accounts/context_processors.py`, add:
```python
from apps.notifications.models import Notification

def user_profile(request):
    ctx = {}
    if request.user.is_authenticated:
        ctx["current_user"] = request.user
        ctx["unread_count"] = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
    return ctx
```

Then in `templates/partials/navbar.html`, add a badge to the bell icon:
```html
{% if unread_count %}
  <span class="absolute -top-1 -right-1 w-4 h-4 rounded-circle bg-signal text-white text-[9px] font-bold flex items-center justify-center">
    {{ unread_count }}
  </span>
{% endif %}
```

---

### 6.4 Frontend: Leaderboard (`templates/hustles/leaderboard.html`)

**Checklist:**
- [ ] Top 3 entries have trophy/medal icons (🏆 🥈 🥉) and distinct background colours
- [ ] Staggered `animation-delay` for entry slide-in
- [ ] City filter dropdown wired: changing city reloads the page with `?city=` query param
- [ ] Street Cred shows one decimal place
- [ ] Badge name shown below the username in muted text
- [ ] On mobile: rank circle and avatar are 36px, name and count fit on one row

---

## 7. Sprint 5 — Polish, Bonus Features, PWA

**Goal:** The platform feels complete. PWA is installable. All bonus features work.

---

### 7.1 Skill Badges (already in models — wire the UI)

`User.auto_assign_badge()` is already implemented in `apps/accounts/models.py`.
It is called from `services.complete_task()`.

**What to add:**
- A toast message when a badge is newly awarded: "You just earned the Digital Ninja badge!"
- Badge display on the map sidebar card when viewing a user's tasks
- Badge filter on the leaderboard

---

### 7.2 WhatsApp Deep-Link (already in models — wire the UI)

`Task.whatsapp_link` property is already implemented.
It generates `https://wa.me/{phone}?text={branded message}`.

**Wire it in `task_detail.html`:**
The button must only appear when:
1. `task.status` is `CLAIMED` or `COMPLETED`
2. `request.user == task.poster` (they need to contact the claimer)
3. `task.claimer.phone_number` is not empty

```html
{% if reveal_location and task.claimer.phone_number %}
  <a href="{{ task.whatsapp_link }}" target="_blank" rel="noopener"
     class="btn-primary bg-[#25D366] border-[#25D366] hover:bg-[#1ebe5d] hover:border-[#1ebe5d] mt-3 text-xs inline-flex items-center gap-2">
    {% include "components/icons/whatsapp.html" with size=14 %}
    {% trans "Message on WhatsApp" %}
  </a>
{% endif %}
```

---

### 7.3 Fran-glais Toggle

The language toggle is already in the footer (form posts to `{% url 'set_language' %}`).
**Also add it to the navbar** as a small text button:

```html
<form action="{% url 'set_language' %}" method="post" class="hidden md:flex items-center">
  {% csrf_token %}
  <input name="next" type="hidden" value="{{ request.get_full_path }}" />
  {% if LANGUAGE_CODE == 'en' %}
    <button name="language" value="fr" class="text-xs text-slate hover:text-ink transition-colors">FR</button>
  {% else %}
    <button name="language" value="en" class="text-xs text-slate hover:text-ink transition-colors">EN</button>
  {% endif %}
</form>
```

---

### 7.4 PWA — Make it installable

The `manifest.json` exists at `static/manifest.json`. The service worker is registered in `app.js`.

**To complete PWA:**
1. Add a 512×512 PNG icon to `static/icons/icon-512.png`
2. Add an OG cover image `static/img/og-cover.png` (1200×630px)
3. Update `manifest.json` with correct icon paths
4. Test with Chrome DevTools → Application → Manifest — "Add to home screen" must appear
5. Run Lighthouse audit: PWA, Performance, SEO, Accessibility scores

---

### 7.5 Voice-Note Task Posting (bonus)

Use the browser's `SpeechRecognition` API to pre-fill the task title:

```javascript
function initVoiceNote() {
  const btn = document.getElementById('voice-note-btn');
  if (!btn || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;

  btn.classList.remove('hidden');
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SR();
  recognition.lang = document.documentElement.lang === 'fr' ? 'fr-CM' : 'en-CM';
  recognition.interimResults = false;

  btn.addEventListener('click', () => {
    recognition.start();
    btn.textContent = 'Listening…';
  });
  recognition.onresult = e => {
    document.getElementById('id_title').value = e.results[0][0].transcript;
    btn.textContent = '🎤 Voice note';
  };
  recognition.onerror = () => { btn.textContent = '🎤 Voice note'; };
}
```

Add a hidden button in `post_task.html`:
```html
<button type="button" id="voice-note-btn" class="hidden btn-secondary text-xs">
  🎤 Voice note
</button>
```

---

## 8. Sprint 6 — Deployment

**Goal:** The app is live at a public URL. Demo-ready.

---

### 8.1 Deployment target: Railway.app (recommended for course projects)

Railway supports PostgreSQL with PostGIS and Redis out of the box.

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Create project
railway new

# Add services: PostgreSQL (Railway adds PostGIS by default)
# Add services: Redis

# Set environment variables in Railway dashboard:
# DJANGO_SETTINGS_MODULE = warrap.settings.prod
# SECRET_KEY = (generate a new one)
# DATABASE_URL = (Railway auto-populates from linked PostgreSQL)
# REDIS_URL = (Railway auto-populates from linked Redis)
# ALLOWED_HOSTS = your-app.railway.app

# Deploy
railway up
```

**Procfile** (create at repo root):
```
web: gunicorn warrap.wsgi:application --bind 0.0.0.0:$PORT --workers 2
release: python manage.py migrate && python manage.py collectstatic --noinput
```

Add `gunicorn` to `requirements.txt`.

---

### 8.2 Pre-deployment checklist

- [ ] `python manage.py check --deploy` returns no critical issues
- [ ] `ACCOUNT_EMAIL_VERIFICATION = "mandatory"` in `prod.py`
- [ ] `SECRET_KEY` is a fresh 50-char random string
- [ ] `DEBUG = False` in prod
- [ ] Static files collected: `python manage.py collectstatic`
- [ ] All environment variables set in the deployment platform
- [ ] Google OAuth redirect URI updated to the production domain
- [ ] Site domain updated in Django admin → Sites
- [ ] Lighthouse audit: target ≥ 90 on Performance, SEO, Accessibility
- [ ] `python manage.py expire_tasks` added as a scheduled job (Railway Cron: `*/5 * * * *`)

---

## 9. UI/UX Standards

These standards apply to every template written or modified in any sprint.

### Layout rules

- **Never** use pure white (`#FFFFFF`) as a page background. Always `bg-canvas`.
- **Every page** must have a visible `<h1>` tag.
- **Ghost watermark headline** on auth pages and profile page. Pattern: `<p class="ghost-headline text-center mb-[-2rem]">keyword</p>` immediately above the main card.
- **Section containers** use `<div class="section-container">` for max-width + gutters.
- **Vertical rhythm:** `gap-6` between major page sections, `gap-4` between form fields, `gap-2` between list items.

### Responsive rules

- **Mobile-first.** Write base styles for mobile, add `md:` and `lg:` prefixes for larger screens.
- **Minimum tap target:** 44×44px for all interactive elements. Use `min-h-[44px]` when needed.
- **Navigation:** On mobile, only logo + hamburger + one CTA visible. Full links behind the drawer.
- **Map:** On mobile, map is full-width, sidebar stacks below it (`flex-col` on mobile, `flex-row lg:` on desktop).
- **Cards:** Single column on mobile (`grid-cols-1`), 2-up on tablet (`sm:grid-cols-2`), 3-up max on desktop.
- **Typography:** `text-[clamp(28px,4vw,48px)]` for page headings — never a fixed pixel size.

### Animation rules

- Page content: `animate-slide-up` on the primary card/section on load.
- Staggered lists: `style="animation-delay: {{ forloop.counter0 }}00ms"` on each item.
- Hover effects: `transition-all duration-200` — always 200ms, never 0, never 500ms.
- Do not animate more than 3 elements simultaneously on a single page.
- Never use `animate-spin` or `animate-bounce` on content — only on loading indicators.

### Accessibility rules

- All `<img>` tags must have a descriptive `alt` attribute.
- All form `<input>` tags must have a corresponding `<label>`.
- Icon-only buttons must have `aria-label`.
- Toast messages must have `role="alert"`.
- Focus states must be visible — never `outline-none` without a replacement focus style.
- Colour contrast: body text must be at minimum 4.5:1 ratio against background.

---

## 10. Troubleshooting Reference

### GDAL / GeoDjango errors

**Symptom:** `django.core.exceptions.ImproperlyConfigured: Could not find the GDAL library`
**Fix (WSL2/Ubuntu):**
```bash
sudo apt install -y gdal-bin libgdal-dev python3-gdal
# Then in your venv:
pip install GDAL==$(gdal-config --version)
```

**Symptom:** `AttributeError: type object 'MultiPolygonField' has no attribute 'srid'`
**Fix:** Ensure `DATABASES["default"]["ENGINE"]` is `django.contrib.gis.db.backends.postgis`, not the plain postgres engine.

---

### Allauth errors

**Symptom:** `NoReverseMatch: Reverse for 'account_login' not found`
**Fix:** Ensure `path("accounts/", include("allauth.urls"))` is in `warrap/urls.py`. Ensure `allauth` and `allauth.account` are in `INSTALLED_APPS`.

**Symptom:** Google OAuth redirect error after login
**Fix:** In Google Cloud Console, ensure the redirect URI exactly matches `http://localhost:8000/accounts/google/login/callback/`. In Django admin → Social Applications, ensure the Site is set to `localhost:8000` (not `example.com`).

---

### Redis errors

**Symptom:** `redis.exceptions.ConnectionError: Error 111 connecting to localhost:6379`
**Fix (WSL2):**
```bash
sudo service redis-server start
redis-cli ping  # should return PONG
```

If Redis is unavailable and you want to develop without it temporarily, in `dev.py` uncomment:
```python
CACHES = {"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}}
```

---

### Tailwind not compiling

**Symptom:** Tailwind utility classes not applied, page has no styling
**Fix:**
```bash
# Ensure the watcher is running in a separate terminal:
python manage.py tailwind start
# If install failed:
python manage.py tailwind install
```

**Symptom:** Custom token classes like `bg-canvas` or `rounded-btn` not working
**Fix:** Check `theme/static_src/tailwind.config.js` — the `content` array must include `../../templates/**/*.html`. If classes are used in Python files (e.g., form widgets), add `../../apps/**/*.py` to the content array.

---

### Map not showing pins

**Symptom:** Map loads, but no pins appear
**Debug steps:**
1. Open browser DevTools → Network → look for the request to `/hustles/api/nearby/`
2. Check the JSON response: `{"tasks": []}` means the query returned nothing
3. Run in Django shell:
   ```python
   from apps.hustles.models import Task
   from django.utils import timezone
   Task.objects.filter(status="open", expires_at__gt=timezone.now()).count()
   ```
4. If count is 0, run `python manage.py seed_data`
5. If count > 0 but API returns empty, check that `location_approx` is not null: `Task.objects.filter(location_approx__isnull=True).count()`

---

## 11. Development Journal

### Sprint 0 — Ideation and naming (completed)

Explored platform concepts for the Advanced Web Development course. Chose a geospatial gig-map targeting Cameroonian university students and informal sector workers. Initial name was "YouthConnex" then "CloKonnect". Final name settled on **Warrap** — Cameroonian street slang for a quick informal job.

**Rationale:** The name does the marketing passively. Anyone in the target demographic understands it immediately without explanation.

### Sprint 1 — Foundation (completed, running in WSL2)

**What was built:**
- Full Django project structure with three-app architecture (`accounts`, `hustles`, `notifications`)
- Settings split into `base.py` / `dev.py` / `prod.py` — clean environment separation
- Custom `User` model extending `AbstractUser` with `street_cred`, `badge`, `vouch_count`, `city`, `phone_number`
- `Task` model with PostGIS `PointField` for exact and approximate locations, Flash-Gig support, Squad-Up headcount
- `Rating` model feeding `User.street_cred` via `recompute_street_cred()`
- `Vouch` model with shared-task constraint
- `Notification` model for in-app alerts
- Services layer per app: all business logic in `services.py`, views are thin
- django-allauth with Google OAuth configured (custom `WarrapSignupForm` and `WarrapLoginForm`)
- Django Unfold admin with Warrap colour palette
- Complete Tailwind v3 design system via django-tailwind: all Mastercard tokens, component classes, animations
- SEO: `partials/seo.html` with full OG, Twitter card, JSON-LD, geo signals, hreflang — injected into `base.html`
- HugeIcons Stroke Rounded as inline SVG Django template components
- All auth templates (login, signup, password reset, email confirm) matching the Mastercard design system
- All page templates: map, post_task, task_detail, profile, edit_profile, leaderboard, rate_task, my_tasks, notification list
- `expire_tasks` management command for Flash-Gig expiry cron
- PWA foundation: `manifest.json`, service worker registration in `app.js`

**GDAL resolution:**
Native Windows GDAL installation failed despite trying: official PyPI package, OSGeo4W installer, manual .whl file, and MS C++ Build Tools. Resolution: moved development to **WSL2 (Ubuntu)** where `sudo apt install gdal-bin libgdal-dev` resolves all native dependencies cleanly. **WSL2 is now the canonical development environment for this project.**

**Known gaps going into Sprint 2:**
- The nearby API needs real seed data to test
- Map JS `TASK_DETAIL_BASE` URL construction is a hack — needs the Django `reverse()` approach
- Flash-Gig countdown timer needs wiring in task_detail template
- Notification unread count not yet in navbar context
- No OG cover image yet (`static/img/og-cover.png`)
- PWA service worker not yet registered with push subscription logic

---

## 12. Quick Reference Commands

```bash
# Activate environment (WSL2)
source .venv/bin/activate

# Start services (WSL2 — run if just opened WSL)
sudo service postgresql start
sudo service redis-server start

# Run development server (two terminals)
python manage.py tailwind start    # terminal 1 — Tailwind watcher
python manage.py runserver         # terminal 2 — Django server

# Database
python manage.py migrate
python manage.py makemigrations
python manage.py seed_data         # Sprint 2: load test tasks

# Maintenance
python manage.py expire_tasks      # expire stale Flash-Gigs
python manage.py collectstatic     # compile static for prod

# Shell access
python manage.py shell

# Testing
python manage.py test              # run all tests
python manage.py test apps.hustles # run hustles tests only

# Git (from project root in WSL2)
cd /path/to/advanced-web-exercises
git add warrap/
git commit -m "feat(sprint-2): live map with real task pins"
git push origin main
```

---

*This document should be updated at the end of every sprint with what was completed, what changed, and any new known issues. Keep the journal accurate — it is the project's memory.*

### Sprint 2 through 5 — Completion Update

**What was built:**
- Created \seed_data.py\ and propagated tasks effectively to demonstrate functionality across UI maps.
- Hardened service logic using \select_for_update\ within transactions for concurrent-safe \claim_task\ operation. Awarded skill gamification logic propagating through \messages.success\ upon Hustle completion.
- Secured Map interaction handling, ensuring robust template backtick operations rather than unsafe string splits.
- Introduced Service Worker logic and PushSubscription integration for natively pinging users within a dynamic kilometer radius.
- Fully wired gamification hooks, Whatsapp Deep Linking restrictions preventing invalid parties from receiving numbers, and Franglais UX translation tools across Nav and footer bars.
- Installed baseline PWA spec manifests, icons placeholders, and a voice-rec feature using the browser native Speech Recognition API injected into the New Hustle posting page. All responsive constraints met.

**Known Gaps passing Sprint 5:**
- Image asset replacements: \og-cover.png\, \icon-512.png\ are currently mock file descriptors and need correct image populations before real mobile deployments.
- Verify PushNotification deployment using real generated VAPID keys within Railway staging.
