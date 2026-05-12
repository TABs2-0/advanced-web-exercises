# Warrap — Frontend Instructions

> This is the authoritative guide for building and rebuilding the Warrap UI.
> Every section is self-contained. An AI agent or developer can rebuild any
> page from scratch using only this document plus the existing codebase.
> Read the full document before touching any template.

---

## 0. The UI Vision

Warrap is **Google Maps meets a street-culture app**. The mental model to hold in your head at all times:

- The **map is the product**. It is always full-screen. Everything else floats on top of it.
- The **interface is a heads-up display**, not a website laid over a map.
- The **tone is playful, warm, and local**. Not a corporate SaaS dashboard. Not a generic Tailwind starter. Think: what if Mastercard designed Snapchat Maps for Yaoundé?
- **Delight is non-negotiable**. Transitions, micro-interactions, and animations are not optional polish — they are the product.

### The two states of the app

```
NOT LOGGED IN → Landing page (full editorial, no map, clear CTA)
LOGGED IN     → Live map (full-screen, everything overlaid, Google Maps style)
```

These are completely different UX modes. The landing page is marketing. The app is a tool.

---

## 1. Design Tokens (do not deviate)

All tokens live in `theme/static_src/tailwind.config.js`. Never hardcode a hex color in a template.

### Colors
| Token | Hex | Role |
|---|---|---|
| `canvas` | `#F3F0EE` | Page background — warm putty. **Never pure white** |
| `lifted` | `#FCFBFA` | Nested card surface — one step lighter than canvas |
| `ink` | `#141413` | Primary text, button backgrounds |
| `charcoal` | `#262627` | Softer dark for secondary headings |
| `slate` | `#696969` | Muted text, labels, placeholders |
| `dust` | `#D1CDC7` | Whisper text, disabled states |
| `signal` | `#CF4500` | Accent orange — use sparingly (labels, dots, active states) |
| `signal-light` | `#F37338` | Lighter orange — Flash-Gig indicators, orbital arcs |
| `clay` | `#9A3A0A` | Deep rust — secondary links, hover states |
| `link` | `#3860BE` | Inline hyperlinks only |
| `bone` | `#F4F4F4` | Cool alternate surface for contrast sections |

### Typography scale
| Token | Size | Use |
|---|---|---|
| `text-hero` | `64px / -1.28px` | Hero headlines only (landing page) |
| `text-section` | `36px / -0.72px` | Section titles |
| `text-card-title` | `24px / -0.48px` | Card headings, modal titles |
| `text-eyebrow` | `14px / +0.56px` | Uppercase section labels (always with `.eyebrow` class) |
| `text-body` | `16px` | Default body text |
| `text-btn` | `16px / -0.48px` | Button labels |

**Rule:** Body text uses `font-body` class (weight 450 — the Mastercard half-step). Headlines use `font-medium` (500). Bold labels use `font-bold` (700). Never `font-semibold`.

**Minimum font sizes:** Body minimum is `text-sm` (14px). Labels minimum is `text-xs` (12px). **Never go below 12px for any readable content.** The previous codebase used `text-[10px]` and `text-[11px]` — this is wrong and inaccessible. Replace all of these.

### Border radius (three zones only)
```
Buttons & inputs  → rounded-btn   (20px)
Cards & modals    → rounded-hero  (40px)
Avatars & circles → rounded-circle (50%)
Nav & full pills  → rounded-full  (999px)
```
**Never use `rounded-lg`, `rounded-xl`, `rounded-2xl` etc.** Only these four + `rounded-sm` (3px) for tiny chips.

### Shadows
```
Nav floating:  shadow-nav   (barely visible lift)
Cards:         shadow-card  (soft large-radius halo)
Overlays:      shadow-dramatic (deep modal lift)
```

### Motion timing
```
Hover:        transition-all duration-200   (always 200ms)
Page entry:   animate-slide-up             (400ms, once on load)
Stagger:      animation-delay: N*100ms     (on list items)
Flash-Gig:    animate-pulse-pin            (infinite)
```

---

## 2. The Critical Map Fix

**The map is not showing because of two issues:**

### Issue 1: `pt-24` on `<main>` pushes the map down, and the map height calculation is wrong

In `base.html`, the `<main>` tag has `pt-24`. For the map view, this must be overridden to `pt-0` and the body/main must be `overflow-hidden`.

**Fix in `base.html`:** Change main to:
```html
<main class="flex-1 {% block main_class %}pt-24{% endblock %}" id="main-content">
```

In `templates/hustles/map.html`, override this block:
```django
{% block main_class %}pt-0 overflow-hidden{% endblock %}
```

### Issue 2: The map has no defined height in a flex container

The `#hustle-map` div needs `height: 100vh` not a calculated relative height.

**Fix in `map.html`:**
```html
<style>
  body.map-page { overflow: hidden; }
  #hustle-map { 
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1;
  }
  #map-overlay {
    position: fixed;
    inset: 0;
    z-index: 10;
    pointer-events: none;
  }
  #map-overlay > * { pointer-events: auto; }
</style>
```

Add `map-page` to body via a template block:
```django
{% block body_class %}map-page{% endblock %}
```
In `base.html`: `<body class="bg-canvas text-ink font-sans min-h-screen flex flex-col {% block body_class %}{% endblock %}">`

### Issue 3: The Leaflet map initialisation fires before the container has dimensions

The `L.map()` call must happen after the DOM is fully ready. Move all map JS into a `DOMContentLoaded` listener:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('hustle-map', { zoomControl: false });
  // ... rest of map init
});
```

### Issue 4: The nearby API returns empty because `location_approx` is null

In `Task.save()`, `location_approx` is only set if it is `None`. But if a task was created without calling `.save()` (e.g. via `Task.objects.create()`), the signal does not fire for the fuzz. The `services.create_task()` function passes `location=Point(...)` and relies on `save()` to fuzz it.

**Verify in Django shell:**
```python
from apps.hustles.models import Task
Task.objects.filter(location_approx__isnull=True).count()
# If > 0, run this to backfill:
for t in Task.objects.filter(location_approx__isnull=True):
    t.save()  # triggers the fuzz logic
```

**In `services.create_task()`**, explicitly pass `expires_at` before calling `Task.objects.create()` so that `save()` doesn't override it:
```python
task = Task(
    poster=poster,
    title=title,
    ...
    location=Point(longitude, latitude, srid=4326),
    expires_at=expires_at,
)
task.save()  # NOT Task.objects.create() — .save() triggers location_approx generation
```

---

## 3. Seed Data for Yaoundé

Create `apps/hustles/management/commands/seed_data.py`. This command is critical — without data the map is useless for testing.

**What to seed (Yaoundé-specific):**

```python
# Realistic task data for Yaoundé neighborhoods
SEED_TASKS = [
    # Digital tasks
    {
        "title": "Mettre à jour la liste de prix WhatsApp",
        "description": "J'ai une boutique à Mokolo. J'ai besoin de quelqu'un pour mettre à jour mes prix sur mon catalogue WhatsApp Business. 1h de travail max.",
        "category": "digital",
        "pay": 2000,
        "coords": (3.8741, 11.5088, "Mokolo"),
    },
    {
        "title": "Design flyer for end-of-year party",
        "description": "Need a simple A4 flyer for a party at Mvog-Ada. Canva is fine. Delivery via WhatsApp.",
        "category": "digital",
        "pay": 3500,
        "coords": (3.8741, 11.5268, "Mvog-Ada"),
    },
    {
        "title": "Tape des données Excel pour mon inventaire",
        "description": "Environ 200 lignes à saisir depuis des tickets de caisse manuscrits. Bureau à Melen.",
        "category": "digital",
        "pay": 5000,
        "coords": (3.8480, 11.5021, "Melen"),
    },
    # Physical tasks
    {
        "title": "Aide pour déménager des cartons",
        "description": "3ème étage sans ascenseur. Environ 15 cartons à descendre et charger dans un camion. Matin de préférence.",
        "category": "physical",
        "pay": 4000,
        "coords": (3.8663, 11.5167, "Bastos"),
    },
    {
        "title": "Porter des marchandises du marché",
        "description": "Du marché central jusqu'à mon véhicule garé à 200m. Marchandises pas trop lourdes. 30 minutes.",
        "category": "physical",
        "pay": 1500,
        "coords": (3.8680, 11.5149, "Marché Central"),
    },
    {
        "title": "Nettoyer l'appartement avant visite",
        "description": "T2 propre mais besoin d'un grand ménage: cuisine, salle de bain, vitres. Produits fournis.",
        "category": "physical",
        "pay": 6000,
        "coords": (3.8622, 11.4956, "Biyem-Assi"),
    },
    # Events
    {
        "title": "Setup sound system for small event",
        "description": "Birthday party, ~50 people. Need someone to setup and manage the sound. Equipment available.",
        "category": "event",
        "pay": 8000,
        "coords": (3.8790, 11.5100, "Nlongkak"),
    },
    {
        "title": "Serveur/serveuse pour soirée privée",
        "description": "Soirée de 20 personnes samedi soir. Service de boissons et petits fours. Tenue correcte exigée.",
        "category": "event",
        "pay": 7000,
        "coords": (3.8750, 11.5180, "Omnisports"),
    },
    # Delivery
    {
        "title": "Livrer un colis à Essos",
        "description": "Petit colis (chaussures) à récupérer à Bastos et livrer à Essos. Moto ou taxi.",
        "category": "delivery",
        "pay": 1500,
        "coords": (3.8800, 11.5220, "Essos"),
    },
    {
        "title": "Faire une course pharmacie urgente",
        "description": "Ordonnance à déposer à la pharmacie Bastos et récupérer les médicaments. Remboursement + tip inclus.",
        "category": "delivery",
        "pay": 1000,
        "coords": (3.8663, 11.5167, "Bastos"),
    },
    # Flash-Gigs
    {
        "title": "⚡ Traducteur anglais-français MAINTENANT",
        "description": "Réunion dans 15 minutes. Besoin d'un traducteur simultané pour 1h. Niveau pro.",
        "category": "digital",
        "pay": 15000,
        "is_flash_gig": True,
        "coords": (3.8680, 11.5200, "Centre-ville"),
    },
    {
        "title": "⚡ Besoin de 2 personnes pour charger un camion",
        "description": "Camion arrive dans 20 minutes. Besoin de bras pour 45 minutes. Paiement cash immédiat.",
        "category": "physical",
        "pay": 3000,
        "is_flash_gig": True,
        "coords": (3.8595, 11.5050, "Messa"),
    },
]
```

The command should:
1. Create test users with `User.objects.get_or_create(username=...)`, set `city="yaounde"`, and give them varied `street_cred` scores (2.0 to 5.0)
2. Loop through `SEED_TASKS` and call `services.create_task()` for each
3. Print a summary: `Seeded N tasks across X categories`
4. Be idempotent: skip tasks that already exist with the same title + poster

---

## 4. Page-by-Page UI Rebuild

---

### 4.1 Landing Page (unauthenticated users) — `templates/hustles/landing.html`

**This page does not exist yet. Create it.**

The landing page is the only page without the floating nav pill. It has its own minimal nav.

**Route:** In `warrap/urls.py`, the root `""` currently points directly to `map_view`. Change it to:

```python
from apps.hustles.views import root_view

path("", root_view, name="home"),
```

In `apps/hustles/views.py`, add:

```python
def root_view(request):
    """Route to map if logged in, landing page if not."""
    if request.user.is_authenticated:
        return redirect("hustles:map")
    return render(request, "hustles/landing.html", {
        "categories": TaskCategoryChoices.choices,
    })
```

**Landing page structure:**

```
┌─────────────────────────────────────────────────────────┐
│  MINIMAL NAV: Logo left | Log in · Join right           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  HERO SECTION  (100vh, bg-ink, white text)              │
│                                                         │
│  [Eyebrow: Yaoundé · Douala · Buea]                     │
│                                                         │
│  Warrap.                    [animated map preview       │
│  Your next job              peek — blurred Leaflet      │
│  is 300m away.              map screenshot or           │
│                             CSS map illustration]       │
│  [Join for free]                                        │
│  [See live map]                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  HOW IT WORKS  (bg-canvas, 3 steps with icons)         │
├─────────────────────────────────────────────────────────┤
│  CATEGORIES  (horizontal scroll pills, each clickable) │
├─────────────────────────────────────────────────────────┤
│  MINI FOOTER  (one line: copyright + links)             │
└─────────────────────────────────────────────────────────┘
```

**Hero section specifics:**
- Background: `bg-ink` (dark, bold — not canvas)
- Headline: `text-[clamp(52px,7vw,96px)]` — very large, `font-medium`, white, tight tracking
- The word "Warrap." gets the `text-signal-light` color treatment
- Subheading: `text-xl text-white/60 font-body` — NOT small
- CTA buttons: large, `py-4 px-8 text-base`
- Right side: A CSS-animated map illustration (circles, pins, orbital arcs using the Mastercard motif) — NOT a real Leaflet instance (too slow to load for landing)

**How it works — 3 steps:**
```
[📍 Drop a pin]     [👆 One tap]       [💸 Get paid]
Post your task      Lock a hustle      Done and done
in 30 seconds       instantly
```
Each step: large icon (48px), bold number badge, 2-line description in `text-base font-body`.

**CSS map illustration for hero (right side):**
```html
<div class="relative w-80 h-80">
  <!-- Map grid lines -->
  <!-- Animated pins at different positions -->
  <!-- Orbital arc SVG -->
  <!-- Pulsing circles for Flash-Gigs -->
</div>
```
Build this as a pure CSS/SVG illustration. Use the `canvas` color at low opacity for map grid lines, `signal-light` for the orbital arcs, and `white` pins.

---

### 4.2 App Map (authenticated users) — `templates/hustles/map.html`

This is the main experience. Full-screen. Everything overlaid. Google Maps UX.

**Complete rebuild of this template.**

#### Layout architecture

```
┌─────────────────────────────────────────────────────────┐
│  LEAFLET MAP — fixed, inset-0, z-index: 1              │
│                                                         │
│  ┌─────────────────────────┐                           │
│  │ TOP BAR (z-10)          │                           │
│  │ [Logo] [Search/Filter]  │  [Avatar] [+ Post]       │
│  └─────────────────────────┘                           │
│                                                         │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ BOTTOM SHEET (z-10) — slides up from bottom   │    │
│  │                                                │    │
│  │ [Flash-Gigs: Instagram stories row]           │    │
│  │ ─────────────────────────────────────────      │    │
│  │ Task cards (horizontal scroll or vertical)    │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  [FAB: + Post Hustle]  (fixed, bottom-right, z-10)     │
└─────────────────────────────────────────────────────────┘
```

#### Top bar (overlay, not a separate component)

```html
<div id="map-top-bar" class="fixed top-0 left-0 right-0 z-20 p-4 pointer-events-none">
  <div class="flex items-center gap-3 pointer-events-auto">
    <!-- Logo pill -->
    <a href="/" class="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2.5 
                       shadow-nav flex items-center gap-2 flex-shrink-0">
      <img src="..." class="h-6 w-6" />
      <span class="font-medium text-ink text-sm">Warrap</span>
    </a>

    <!-- Category filter pills (horizontal scroll) -->
    <div class="flex gap-2 overflow-x-auto pb-1 flex-1 scrollbar-none">
      <button class="filter-pill active" data-category="">All</button>
      <button class="filter-pill" data-category="digital">💻 Digital</button>
      <button class="filter-pill" data-category="physical">💪 Physical</button>
      <button class="filter-pill" data-category="delivery">🏍️ Delivery</button>
      <button class="filter-pill" data-category="event">🎉 Event</button>
    </div>

    <!-- Right actions -->
    <div class="flex items-center gap-2 flex-shrink-0">
      <a href="/hustles/post/" class="bg-ink text-canvas rounded-full px-4 py-2.5 
                                      text-sm font-medium shadow-nav hidden sm:flex items-center gap-1.5">
        + Post
      </a>
      <button onclick="toggleDropdown('nav-user-menu')" class="relative">
        <img src="{{ user.avatar_url }}" class="w-10 h-10 rounded-circle shadow-nav border-2 border-white" />
      </button>
    </div>
  </div>
</div>
```

**Filter pill CSS (add to `styles.css`):**
```css
.filter-pill {
  @apply flex-shrink-0 bg-white/90 backdrop-blur-sm text-ink text-sm font-medium
         px-4 py-2 rounded-full shadow-nav border border-transparent
         transition-all duration-200 cursor-pointer whitespace-nowrap;
}
.filter-pill.active {
  @apply bg-ink text-canvas border-ink;
}
.filter-pill:hover:not(.active) {
  @apply bg-white border-ink/20;
}
```

#### Bottom sheet

The bottom sheet is a floating panel anchored to the bottom of the screen. It has two states: **collapsed** (just the drag handle visible, peek of first card) and **expanded** (shows flash-gigs + task list).

```html
<div id="bottom-sheet" 
     class="fixed bottom-0 left-0 right-0 z-20
            bg-white rounded-t-[32px] shadow-dramatic
            transform transition-transform duration-300 ease-out"
     style="max-height: 75vh;">
  
  <!-- Drag handle -->
  <div class="flex justify-center pt-3 pb-2 cursor-grab" id="sheet-handle">
    <div class="w-10 h-1 rounded-full bg-dust"></div>
  </div>

  <!-- Flash-Gigs row (Instagram stories style) -->
  <div id="flash-gigs-row" class="px-4 pb-3">
    <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-none" id="flash-list">
      <!-- Populated by JS — each is a circle with pulse animation -->
    </div>
  </div>

  <!-- Divider (only if flash-gigs exist) -->
  <div id="flash-divider" class="hidden border-t border-ink/5 mx-4 mb-3"></div>

  <!-- Task count header -->
  <div class="flex items-center justify-between px-4 mb-3">
    <p class="text-sm font-medium text-ink">
      <span id="task-count" class="text-signal font-bold">0</span> hustles near you
    </p>
    <button id="locate-btn" class="btn-icon w-8 h-8">
      <!-- location icon -->
    </button>
  </div>

  <!-- Task cards — vertical scroll -->
  <div id="task-list" class="overflow-y-auto px-4 pb-6"
       style="max-height: calc(75vh - 180px);">
    <!-- Populated by JS -->
  </div>
</div>
```

**Bottom sheet JS behaviour:**
```javascript
// Collapsed: only 180px visible (handle + flash-gigs peek)
// Expanded: 75vh visible
let sheetExpanded = false;
const sheet = document.getElementById('bottom-sheet');

document.getElementById('sheet-handle').addEventListener('click', () => {
  sheetExpanded = !sheetExpanded;
  sheet.style.transform = sheetExpanded ? 'translateY(0)' : 'translateY(calc(100% - 180px))';
});

// Initialize collapsed
sheet.style.transform = 'translateY(calc(100% - 180px))';
```

**Touch drag support:**
```javascript
let startY = 0;
document.getElementById('sheet-handle').addEventListener('touchstart', e => {
  startY = e.touches[0].clientY;
});
document.getElementById('sheet-handle').addEventListener('touchend', e => {
  const diff = e.changedTouches[0].clientY - startY;
  if (diff < -30) { sheetExpanded = true; }
  if (diff > 30) { sheetExpanded = false; }
  sheet.style.transform = sheetExpanded ? 'translateY(0)' : 'translateY(calc(100% - 180px))';
});
```

#### Flash-Gig stories row

Each Flash-Gig renders as a circular story bubble (like Instagram), built in JS:

```javascript
function buildFlashGigBubble(task) {
  return `
    <button onclick="focusTask(${task.id}, ${task.lat}, ${task.lng})"
            class="flex flex-col items-center gap-1.5 flex-shrink-0 group">
      <div class="w-14 h-14 rounded-circle bg-gradient-to-br from-signal to-signal-light
                  p-0.5 animate-pulse-pin">
        <div class="w-full h-full rounded-circle bg-white flex items-center justify-center">
          <span class="text-xl">⚡</span>
        </div>
      </div>
      <span class="text-[11px] font-medium text-ink max-w-[56px] text-center leading-tight line-clamp-2">
        ${task.title.split(' ').slice(0,2).join(' ')}
      </span>
      <span data-expires="${task.expires_at}" 
            class="text-[10px] text-signal font-bold tabular-nums"></span>
    </button>`;
}
```

#### Task card in the bottom sheet

```javascript
function buildTaskCard(task) {
  const EMOJI = { digital: '💻', physical: '💪', delivery: '🏍️', event: '🎉', other: '📌' };
  const COLOR = { digital: 'bg-blue-50 text-blue-700', physical: 'bg-orange-50 text-orange-700',
                  delivery: 'bg-emerald-50 text-emerald-700', event: 'bg-purple-50 text-purple-700',
                  other: 'bg-gray-50 text-gray-600' };
  return `
    <a href="/hustles/${task.id}/"
       class="flex items-center gap-3 p-3 rounded-[20px] hover:bg-canvas
              transition-all duration-200 group cursor-pointer -mx-1 px-2"
       onclick="focusTask(${task.id}, ${task.lat}, ${task.lng}); return false;"
       data-task-id="${task.id}">
      <div class="w-11 h-11 rounded-[16px] flex items-center justify-center flex-shrink-0
                  ${COLOR[task.category] || COLOR.other}">
        <span class="text-lg">${EMOJI[task.category] || EMOJI.other}</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-ink leading-snug line-clamp-1 
                  group-hover:text-signal transition-colors">
          ${task.title}
        </p>
        <p class="text-xs text-slate mt-0.5">${task.neighborhood || 'Nearby'}</p>
      </div>
      <div class="text-right flex-shrink-0">
        <p class="text-sm font-medium text-ink">${task.pay_display}</p>
        ${task.is_flash_gig ? '<span class="text-[10px] text-signal font-bold">⚡ Flash</span>' : ''}
      </div>
    </a>`;
}
```

#### FAB (Floating Action Button)

```html
<a href="{% url 'hustles:post_task' %}"
   class="fixed bottom-6 right-6 z-30 sm:hidden
          w-14 h-14 rounded-circle bg-ink text-canvas
          flex items-center justify-center shadow-dramatic
          hover:bg-signal transition-all duration-200 hover:scale-110">
  {% include "components/icons/plus.html" with size=24 %}
</a>
```

#### Map popup style

Leaflet popups must match the design system. Override CSS:

```css
.leaflet-popup-content-wrapper {
  border-radius: 20px !important;
  box-shadow: 0px 24px 48px rgba(0,0,0,0.12) !important;
  border: none !important;
  padding: 0 !important;
  overflow: hidden;
}
.leaflet-popup-content {
  margin: 0 !important;
  width: 240px !important;
}
.leaflet-popup-tip-container { display: none !important; }
.leaflet-popup-close-button {
  color: #696969 !important;
  font-size: 18px !important;
  padding: 10px 12px !important;
}
```

Popup content built in JS:
```javascript
function buildPopup(task) {
  const EMOJI = { digital: '💻', physical: '💪', delivery: '🏍️', event: '🎉', other: '📌' };
  return `
    <div class="p-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">${EMOJI[task.category] || EMOJI.other}</span>
        <span class="text-xs font-bold uppercase tracking-wider text-slate">
          ${task.category_display}
        </span>
        ${task.is_flash_gig ? '<span class="ml-auto text-xs font-bold text-signal animate-pulse">⚡ FLASH</span>' : ''}
      </div>
      <p class="text-sm font-medium text-ink leading-snug mb-1">${task.title}</p>
      <p class="text-xs text-slate mb-3">${task.neighborhood || 'Nearby'} · @${task.poster}</p>
      <div class="flex items-center justify-between">
        <span class="text-base font-medium text-ink">${task.pay_display}</span>
        <a href="/hustles/${task.id}/"
           class="bg-ink text-white text-xs font-medium px-3 py-1.5 rounded-full
                  hover:bg-signal transition-colors">
          View →
        </a>
      </div>
    </div>`;
}
```

---

### 4.3 Post Task Page — `templates/hustles/post_task.html`

**Full redesign. The form should feel like a wizard/walkthrough, not a flat form dump.**

#### Layout: two-panel on desktop, single-column wizard on mobile

```
Desktop:
┌──────────────────┬──────────────────────────────────┐
│                  │                                  │
│   Live map       │   Multi-step form                │
│   (pin-drop)     │   with progress indicator        │
│                  │                                  │
└──────────────────┴──────────────────────────────────┘

Mobile:
Step 1 → Step 2 → Step 3 → Step 4 (swipe or next button)
```

#### Step structure

**Step 1 — What's the job?**
- Title input (large, prominent `text-2xl` input)
- Description textarea
- Character count remaining (280 - current length)

**Step 2 — Category & Pay**
- Category selector as **visual tile grid** (not a `<select>` dropdown):
  ```
  [💻 Digital] [💪 Physical] [🏍️ Delivery] [🎉 Event]
  ```
  Each is a clickable card. Selected state: `bg-ink text-canvas`. Unselected: `bg-canvas border border-ink/10`.
- Pay input with XAF label
- People needed: a simple `+/-` stepper (not a number input)

**Step 3 — Where?**
- Full-width embedded Leaflet map for pin-drop
- Neighbourhood text input below (auto-populated suggestion)
- Expiry picker: visual time chips (`[2h] [6h] [12h] [24h]`)
- Flash-Gig toggle: a big, satisfying toggle switch with emoji

**Step 4 — Review & Post**
- Summary card showing all entered details
- "Post this Hustle" button (large, full-width)

#### Step navigation

```html
<div class="flex gap-1 mb-8" id="step-indicator">
  <div class="h-1 flex-1 rounded-full bg-ink" id="step-1-bar"></div>
  <div class="h-1 flex-1 rounded-full bg-ink/20" id="step-2-bar"></div>
  <div class="h-1 flex-1 rounded-full bg-ink/20" id="step-3-bar"></div>
  <div class="h-1 flex-1 rounded-full bg-ink/20" id="step-4-bar"></div>
</div>
```

Step panels shown/hidden with `hidden` class. Transitions between steps:
```javascript
function goToStep(n) {
  document.querySelectorAll('.form-step').forEach((el, i) => {
    el.classList.toggle('hidden', i !== n - 1);
  });
  // Update progress bars
  document.querySelectorAll('[id^="step-"][id$="-bar"]').forEach((bar, i) => {
    bar.classList.toggle('bg-ink', i < n);
    bar.classList.toggle('bg-ink/20', i >= n);
  });
  // Animate in
  const current = document.querySelector('.form-step:not(.hidden)');
  current.style.opacity = 0;
  current.style.transform = 'translateX(20px)';
  requestAnimationFrame(() => {
    current.style.transition = 'all 0.3s ease';
    current.style.opacity = 1;
    current.style.transform = 'translateX(0)';
  });
}
```

#### Category tile grid

```html
<div class="grid grid-cols-2 gap-3" id="category-grid">
  {% for value, label in categories %}
    <button type="button" 
            class="category-tile p-4 rounded-hero border-2 border-ink/10 
                   text-left transition-all duration-200 hover:border-ink/40"
            data-category="{{ value }}"
            onclick="selectCategory('{{ value }}', this)">
      <span class="text-2xl block mb-2">
        {% if value == 'digital' %}💻
        {% elif value == 'physical' %}💪
        {% elif value == 'delivery' %}🏍️
        {% elif value == 'event' %}🎉
        {% else %}📌{% endif %}
      </span>
      <p class="text-sm font-medium text-ink">{{ label }}</p>
    </button>
  {% endfor %}
</div>
```

```javascript
function selectCategory(value, el) {
  document.querySelectorAll('.category-tile').forEach(t => {
    t.classList.remove('bg-ink', 'text-canvas', 'border-ink');
    t.classList.add('border-ink/10');
  });
  el.classList.add('bg-ink', 'text-canvas', 'border-ink');
  el.classList.remove('border-ink/10');
  document.getElementById('id_category').value = value;
}
```

#### People stepper

```html
<div class="flex items-center gap-4">
  <button type="button" onclick="adjustPeople(-1)" 
          class="w-10 h-10 rounded-circle border border-ink/20 flex items-center justify-center
                 text-xl font-light hover:bg-canvas transition-colors">−</button>
  <span id="people-display" class="text-2xl font-medium w-8 text-center">1</span>
  <button type="button" onclick="adjustPeople(1)"
          class="w-10 h-10 rounded-circle bg-ink text-canvas flex items-center justify-center
                 text-xl font-light hover:bg-charcoal transition-colors">+</button>
  <input type="hidden" id="id_required_people" name="required_people" value="1">
</div>
```

#### Flash-Gig toggle

```html
<label class="flex items-center justify-between p-4 rounded-hero bg-canvas cursor-pointer
              border-2 border-transparent hover:border-signal/30 transition-all duration-200"
       id="flash-label">
  <div>
    <p class="font-medium text-ink flex items-center gap-2">⚡ Flash-Gig</p>
    <p class="text-sm text-slate mt-0.5">Expires in 15 min · Alerts nearby users</p>
  </div>
  <div class="relative w-12 h-6">
    <input type="checkbox" id="id_is_flash_gig" name="is_flash_gig" class="sr-only peer">
    <div class="w-12 h-6 rounded-full bg-ink/20 peer-checked:bg-signal 
                transition-colors duration-200"></div>
    <div class="absolute top-0.5 left-0.5 w-5 h-5 rounded-circle bg-white shadow
                transition-transform duration-200 peer-checked:translate-x-6"></div>
  </div>
</label>
```

---

### 4.4 Task Detail Page — `templates/hustles/task_detail.html`

**Not a flat info dump. Think: product card + action sheet.**

#### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [← Back to map]                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Category emoji + pill]     [Status badge]            │
│                                                         │
│  Task title (text-card-title, large)                    │
│                                                         │
│  [Pay: 5,000 XAF]  [👤 2 people]  [📍 Bastos]          │
│                                                         │
│  ─────────────────────────────────────────             │
│                                                         │
│  Description (text-base font-body)                      │
│                                                         │
│  ─────────────────────────────────────────             │
│                                                         │
│  [Meta: Posted X ago · Expires in Y]                   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  POSTER CARD (avatar + name + street cred)             │
├─────────────────────────────────────────────────────────┤
│  ACTION AREA                                           │
│  [🔒 Lock this Hustle]  (large, full-width)            │
└─────────────────────────────────────────────────────────┘
```

#### Key UI rules for task detail

- The `[← Back to map]` link must be `text-base` minimum, not tiny
- Pay should be displayed at `text-3xl font-medium` — it is the most important number
- Category emoji should be `text-4xl` alongside a properly-sized category pill
- The "Lock this Hustle" button must be `py-4 text-base w-full` — large and prominent
- Flash-Gig countdown: `text-signal font-bold text-base` — visible and urgent
- If `reveal_location` is true, show a map fragment (small embedded Leaflet map, not just coordinates)

---

### 4.5 Profile Page — `templates/accounts/profile.html`

**Think: gaming profile card meets editorial bio.**

#### Layout

```
┌─────────────────────────────────────────────────────────┐
│  HERO AREA (bg-ink, white text, 280px tall)            │
│                                                         │
│  [Large avatar, 80px, white ring]                      │
│  [Display name, text-section]                          │
│  [@username, text-slate/70]                            │
│  [City · Member since date]                            │
│                                                         │
│  [Street Cred badge: ★ 4.8] [23 Done] [12 Vouches]    │
│                                                         │
│  [Badge pill if awarded]                               │
├─────────────────────────────────────────────────────────┤
│  BIO (if set) — text-base, italic                      │
├─────────────────────────────────────────────────────────┤
│  STATS ROW (3 large numbers on canvas background)      │
├─────────────────────────────────────────────────────────┤
│  COMPLETED HUSTLES grid                                │
├─────────────────────────────────────────────────────────┤
│  VOUCHES received                                      │
└─────────────────────────────────────────────────────────┘
```

**Stats numbers:** Use `text-[48px] font-medium` for the numbers. `text-sm text-slate` for labels. Give them room to breathe.

**Street Cred visual:** A row of filled/empty stars rendered in `text-signal-light`:
```html
<div class="flex items-center gap-1">
  {% for i in "12345" %}
    <span class="text-lg {% if forloop.counter <= profile_user.street_cred|floatformat:0|add:0 %}text-signal-light{% else %}text-dust{% endif %}">★</span>
  {% endfor %}
  <span class="text-sm font-medium text-ink ml-1">{{ profile_user.cred_display }}</span>
</div>
```

---

### 4.6 Auth Pages — Login and Signup

**The ghost headline should use `text-[80px]` or larger.** Currently it is too small to create the visual effect. The card must have plenty of vertical padding.

**On the login page**, the Google button must be visually prominent — not the same visual weight as the form fields. It should stand out as the primary option:
- Full width
- `py-3.5` vertical padding
- Google logo SVG at `20px`
- Subtle border that hints it is the preferred fast path

**Form field sizes:** Labels must be `text-sm` (not `text-xs`). Inputs must be `py-3.5` (comfortable touch targets). Error messages must be `text-sm text-red-600` (readable).

---

### 4.7 Navbar — Rebuild

**The current navbar overflows because it has too many elements at medium screen sizes.**

#### Desktop nav (≥1024px)
```
[Logo + wordmark] ←→ [center links: Map · Leaderboard] ←→ [Lang toggle · +Post · Avatar]
```

#### Tablet nav (768–1023px)
```
[Logo] ←→ [+Post] ←→ [Avatar]
Center links hidden behind avatar menu.
```

#### Mobile nav (< 768px)
```
[Logo] ←→ [Avatar · Hamburger]
Full-width drawer opens from right.
```

**Overflow fix:** Give the center links `hidden xl:flex` not `hidden md:flex`. The current `md:flex` breakpoint is 768px which is too narrow for 3 links + logo + avatar + post button.

**Nav height:** Use `py-3` not `py-4` on the pill. The pill should not be taller than 52px total.

**Logo:** Only show wordmark at `sm:` and above. On mobile, just the icon.

---

### 4.8 Footer — Minimal redesign

Replace the current oversized footer with a single-bar footer:

```html
<footer class="bg-ink border-t border-white/10">
  <div class="max-w-content mx-auto px-6 py-6 
              flex flex-col sm:flex-row items-center justify-between gap-4">
    
    <!-- Left: branding -->
    <div class="flex items-center gap-3">
      <img src="..." class="h-5 w-5 opacity-60" />
      <span class="text-sm text-white/40">Warrap · Advanced Web Dev Course · {% now "Y" %}</span>
    </div>

    <!-- Center: quick links -->
    <div class="flex items-center gap-6">
      <a href="{% url 'hustles:map' %}" class="text-sm text-white/50 hover:text-white transition-colors">Map</a>
      <a href="{% url 'hustles:leaderboard' %}" class="text-sm text-white/50 hover:text-white transition-colors">Leaderboard</a>
      <a href="https://github.com/Joel-Fah/advanced-web-exercises" target="_blank" 
         class="text-sm text-white/50 hover:text-white transition-colors">GitHub ↗</a>
    </div>

    <!-- Right: language -->
    <form action="{% url 'set_language' %}" method="post" class="flex items-center gap-2">
      {% csrf_token %}
      <input name="next" type="hidden" value="{{ request.get_full_path }}" />
      {% if LANGUAGE_CODE == 'en' %}
        <button name="language" value="fr" class="text-sm text-white/50 hover:text-white transition-colors">🇫🇷 FR</button>
      {% else %}
        <button name="language" value="en" class="text-sm text-white/50 hover:text-white transition-colors">🇬🇧 EN</button>
      {% endif %}
    </form>

  </div>
</footer>
```

**This footer replaces the current 4-column oversized footer completely.**
On the map page, the footer is hidden entirely (the map is full-screen):
```django
{% block footer %}{% endblock %}
```

---

### 4.9 Leaderboard — `templates/hustles/leaderboard.html`

**Top 3 should feel like a podium moment.**

Layout:
```
[Ghost headline: "Top"]

[#2]          [#1]               [#3]
Avatar        Avatar (largest)   Avatar  
Name          Name               Name
N done        N done             N done
              [👑 crown]

[#4 through #10 — list, smaller, uniform]
```

The podium uses `order-2` / `order-1` / `order-3` CSS to render #2 on the left and #1 in the center, but #1's card is taller (use `pt-8` instead of `pt-4`).

---

### 4.10 Leaderboard — My Tasks — `templates/hustles/my_tasks.html`

**Use tabs instead of two separate columns.**

```html
<div class="flex gap-1 bg-canvas p-1 rounded-full w-fit mb-6" role="tablist">
  <button role="tab" class="tab active" onclick="switchTab('posted')">Posted ({{ posted.count }})</button>
  <button role="tab" class="tab" onclick="switchTab('claimed')">Claimed ({{ claimed.count }})</button>
</div>
```

Tab CSS (add to `styles.css`):
```css
.tab {
  @apply px-5 py-2 rounded-full text-sm font-medium text-slate 
         transition-all duration-200 cursor-pointer;
}
.tab.active {
  @apply bg-ink text-canvas;
}
```

---

## 5. Tailwind Config Additions Required

Add these to `theme/static_src/tailwind.config.js` inside the `extend` block:

```javascript
// Utility for hiding scrollbars (used in bottom sheet, filter pills)
// Add via plugin:
plugins: [
  require("@tailwindcss/forms")({ strategy: "class" }),
  function({ addUtilities }) {
    addUtilities({
      '.scrollbar-none': {
        '-ms-overflow-style': 'none',
        'scrollbar-width': 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      },
      '.line-clamp-1': {
        overflow: 'hidden',
        display: '-webkit-box',
        '-webkit-box-orient': 'vertical',
        '-webkit-line-clamp': '1',
      },
      '.line-clamp-2': {
        overflow: 'hidden',
        display: '-webkit-box',
        '-webkit-box-orient': 'vertical',
        '-webkit-line-clamp': '2',
      },
    });
  },
],

// Add to animation:
animation: {
  // existing...
  "bounce-in": "bounceIn 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)",
  "scale-in":  "scaleIn 0.2s ease-out",
},
keyframes: {
  // existing...
  bounceIn: {
    "0%":   { transform: "scale(0.8)", opacity: "0" },
    "60%":  { transform: "scale(1.05)" },
    "100%": { transform: "scale(1)", opacity: "1" },
  },
  scaleIn: {
    "0%":   { transform: "scale(0.95)", opacity: "0" },
    "100%": { transform: "scale(1)", opacity: "1" },
  },
},
```

---

## 6. Global `styles.css` Additions

Add these to `theme/static_src/src/styles.css` in the `@layer components` block:

```css
/* Filter pills for map top bar */
.filter-pill {
  @apply flex-shrink-0 bg-white/90 backdrop-blur-sm text-ink text-sm font-medium
         px-4 py-2 rounded-full shadow-nav border border-transparent
         transition-all duration-200 cursor-pointer whitespace-nowrap;
}
.filter-pill.active { @apply bg-ink text-canvas; }
.filter-pill:hover:not(.active) { @apply bg-white border-ink/20; }

/* Bottom sheet */
.bottom-sheet-card {
  @apply flex items-center gap-3 px-2 py-3 rounded-[20px]
         hover:bg-canvas transition-all duration-200 group cursor-pointer;
}

/* Step form stepper */
.step-tile {
  @apply p-4 rounded-hero border-2 border-ink/10 text-left cursor-pointer
         transition-all duration-200 hover:border-ink/30 select-none;
}
.step-tile.selected { @apply bg-ink text-canvas border-ink; }

/* Tab bar */
.tab {
  @apply px-5 py-2 rounded-full text-sm font-medium text-slate
         transition-all duration-200 cursor-pointer;
}
.tab.active { @apply bg-ink text-canvas; }

/* Stat number display */
.stat-number {
  @apply text-5xl font-medium text-ink leading-none tracking-tight;
}
.stat-label {
  @apply text-sm text-slate mt-1 font-body;
}

/* Podium items */
.podium-1 { @apply pt-0; }
.podium-2 { @apply pt-8; }
.podium-3 { @apply pt-8; }
```

---

## 7. `app.js` Required Additions

Add these functions to `static/js/app.js`:

```javascript
// ── Bottom sheet drag ────────────────────────────────────────────────────────
function initBottomSheet() {
  const sheet = document.getElementById('bottom-sheet');
  if (!sheet) return;
  let expanded = false;
  
  const COLLAPSED = 'translateY(calc(100% - 180px))';
  const EXPANDED = 'translateY(0)';
  sheet.style.transform = COLLAPSED;
  sheet.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';

  document.getElementById('sheet-handle')?.addEventListener('click', () => {
    expanded = !expanded;
    sheet.style.transform = expanded ? EXPANDED : COLLAPSED;
  });
}

// ── Focus map on a task (called from task card / popup) ──────────────────────
function focusTask(id, lat, lng) {
  if (window.warrapMap) {
    window.warrapMap.flyTo([lat, lng], 16, { duration: 0.8 });
    // Highlight the card
    document.querySelectorAll('[data-task-id]').forEach(el => {
      el.classList.toggle('bg-canvas', el.dataset.taskId == id);
    });
    // Collapse bottom sheet to see map
    const sheet = document.getElementById('bottom-sheet');
    if (sheet) sheet.style.transform = 'translateY(calc(100% - 180px))';
  }
}

// ── Step form navigation ─────────────────────────────────────────────────────
function goToStep(n) {
  const steps = document.querySelectorAll('.form-step');
  const bars = document.querySelectorAll('[id^="step-"][id$="-bar"]');
  
  steps.forEach((el, i) => el.classList.toggle('hidden', i !== n - 1));
  bars.forEach((bar, i) => {
    bar.classList.toggle('bg-ink', i < n);
    bar.classList.toggle('bg-ink/20', i >= n);
  });
  
  const current = document.querySelector('.form-step:not(.hidden)');
  if (current) {
    current.animate([
      { opacity: 0, transform: 'translateX(16px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ], { duration: 250, easing: 'ease-out', fill: 'forwards' });
  }
  
  document.getElementById('current-step-num').textContent = n;
}

// ── Tab switching (My Tasks) ──────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`panel-${name}`)?.classList.remove('hidden');
  document.querySelector(`[data-tab="${name}"]`)?.classList.add('active');
}

// Extend DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initCountdowns();
  initStarRating();
  initNavScroll();
  initBottomSheet();
  // Set initial tab
  const firstTab = document.querySelector('.tab');
  if (firstTab) firstTab.classList.add('active');
});
```

---

## 8. File Build Order

When rebuilding the frontend from scratch, follow this order to avoid broken dependencies:

1. `tailwind.config.js` — add all new tokens and plugins
2. `styles.css` — add all new component classes
3. `app.js` — add all new JS functions
4. `partials/navbar.html` — fix overflow, apply responsive breakpoints
5. `partials/footer.html` — replace with minimal single-bar version
6. `base.html` — add `{% block main_class %}` and `{% block body_class %}`
7. `hustles/landing.html` — create from scratch (non-auth users)
8. `hustles/map.html` — full rebuild (Google Maps layout)
9. `hustles/post_task.html` — multi-step form
10. `hustles/task_detail.html` — product card layout
11. `accounts/profile.html` — editorial hero + stats
12. `hustles/leaderboard.html` — podium layout
13. `hustles/my_tasks.html` — tab layout
14. `account/login.html` and `account/signup.html` — fix type sizes
15. Seed data: `apps/hustles/management/commands/seed_data.py`

---

## 9. Accessibility Minimum Requirements

Every rebuilt page must pass these:

- Minimum body font size: `text-sm` (14px). Remove all `text-[10px]`, `text-[11px]` instances.
- All interactive elements: minimum `44px` tap target. Use `min-h-[44px]` when needed.
- All images: `alt` attribute required.
- All icon-only buttons: `aria-label` required.
- Colour contrast: `text-slate` on `bg-canvas` passes (5.8:1). `text-dust` does not use for readable text — labels only.
- Focus states: never remove `outline` without replacement. Use `focus-visible:ring-2 focus-visible:ring-ink` on interactive elements.

---

## 10. Testing Checklist After Each Page Rebuild

Run these checks after rebuilding any page:

```
□ Tailwind watcher is running: `python manage.py tailwind start`
□ No unstyled elements (missing classes compiled)
□ No horizontal scroll at 375px viewport width (iPhone SE)
□ Map renders with pins at 1280px viewport width
□ Bottom sheet opens and closes on mobile
□ Category filter pills scroll horizontally without page scroll
□ All tap targets pass 44×44px minimum
□ Form submits successfully to correct endpoint
□ Toast messages appear and auto-dismiss
□ No console errors in browser DevTools
□ Nav dropdown closes when clicking outside
□ Seed data command runs: `python manage.py seed_data`
□ API returns tasks: curl http://localhost:8000/hustles/api/nearby/?lat=3.848&lng=11.502
```

---

*This document is the single source of truth for frontend decisions. When in doubt: more whitespace, larger text, bolder hierarchy, more animation delight. Do not be timid.*