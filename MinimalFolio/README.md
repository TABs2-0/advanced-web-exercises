# Joël Fah — Portfolio

Personal portfolio of **Joël Fah**, product designer and builder. Built on the [MinimalFolio](https://bootstrapmade.com/minimalfolio-bootstrap-portfolio-template/) base by BootstrapMade, extensively redesigned and personalized.

---

## Tech stack

| Layer | Technology |
|---|---|
| CSS framework | Bootstrap 5.3 (via CDN) |
| Icons | Bootstrap Icons 1.11 |
| Typography | DM Sans + DM Serif Display (Google Fonts) |
| Interactions | Vanilla JavaScript (ES2020, no frameworks) |
| Animations | CSS transitions + IntersectionObserver API |
| Build | None — plain HTML/CSS/JS, ships as-is |

---

## Design system

### Tokens
All design decisions are controlled via CSS custom properties in `:root`:

```css
--font-sans        DM Sans — body, UI
--font-display     DM Serif Display — headlines, hero, quotes
--bg               #f9f9f8 — main background
--bg-alt           #f2f2f0 — alternate section background
--surface          #ffffff — card/form surfaces
--surface-glass    rgba(255,255,255,0.7) — glassmorphism layer
--accent           #111111 — primary action color
--radius           16px — base squircle radius (not pill)
```

### Shape language
This portfolio uses **squircles** (soft rectangular border-radius), not pills. All interactive elements — buttons, cards, badges, nav items — follow the `--radius` token family:
- `--radius-sm: 10px`
- `--radius: 16px`
- `--radius-lg: 24px`
- `--radius-xl: 32px`

---

## Architecture

```
/
├── index.html              # Main portfolio (single page)
├── assets/
│   ├── css/
│   │   └── main.css        # All styles — tokens → base → sections → responsive
│   ├── js/
│   │   └── main.js         # All JS — modular IIFE, zero dependencies
│   └── img/                # Portfolio images (not included — add your own)
└── README.md
```

---

## Key sections

### Hero
Full-viewport entry with oversized DM Serif Display headline, status pill (availability), hero metric bento grid (4-up), and a scroll indicator. The background uses a CSS grid overlay masked by a radial gradient, plus three blurred ambient orbs for depth. No images required in the hero.

### About
Two-column sticky layout: narrative text on the left, a 2×2 bento card grid on the right. Below: a horizontal scrollytelling timeline (4 process steps) with IntersectionObserver-driven highlight states.

### Skills
5-cell bento grid: Design, Design Systems, Frontend Engineering, Tools, and a display quote card. Responsive collapse to 2-col on tablet, 1-col on mobile.

### Portfolio / Work
4-column responsive grid with client-side category filtering (All / Web / Mobile / Product). Project cards use deep-colored placeholder backgrounds with italic initials — replace `pj-placeholder` elements with `<img>` tags when images are available.

### Services
4-column grid with numbered service cards. Subtle gradient overlay appears on hover.

### Contact
Two-column layout: contact details + social links on the left; a clean form on the right with floating labels and squircle input fields.

### Footer
3-column footer (brand statement + 2 link columns), separated by a top border. No centered layout — left-aligned, editorial.

---

## JavaScript modules

All code is in a single IIFE in `main.js`. Each feature is a named `init*` function:

| Module | Purpose |
|---|---|
| `initPreloader` | Skeleton screen → animated fill bar → fade out |
| `initHeader` | Floating glassmorphism nav, scroll-shrink, progress bar |
| `initMobileNav` | Slide-in drawer with overlay, Escape key support |
| `initScrollSpy` | IntersectionObserver-based active nav link |
| `initReveal` | Scroll-triggered fade+slide for all `.reveal-item` elements |
| `initStorytelling` | Highlight story steps as they enter the viewport |
| `initPortfolioFilter` | Zero-dependency filter by data-category attribute |
| `initContactForm` | Async form submit with loading / success / error states |
| `initScrollTop` | Show/hide back-to-top button after 400px scroll |
| `initSmoothScroll` | Intercepts anchor clicks, offsets for fixed nav height |
| `initHeroParallax` | Subtle multi-layer parallax on hero orbs (RAF, passive) |
| `initBentoTilt` | Mouse-tracking 3D tilt on cards (touch-skipped, RAF-safe) |

All animations respect `prefers-reduced-motion`.

---

## Adding project images

Replace the `.pj-placeholder` `<div>` inside `.pj-img-inner` with an `<img>` element:

```html
<!-- Before -->
<div class="pj-placeholder" data-proj="nkwel">
  <span class="pj-letter">N</span>
</div>

<!-- After -->
<img src="assets/img/portfolio/nkwel.webp" alt="Nkwel marketing site" loading="lazy">
```

Recommended image size: **800×500px** (16:10), WebP format.

---

## Contact form

The form POSTs to `forms/contact.php`. To enable it:
1. Use the [BootstrapMade PHP contact form](https://bootstrapmade.com/docs/general/contact-form/) or replace with your own endpoint
2. Or swap for a service like Formspree, Web3Forms, or EmailJS by changing the `action` attribute and the `fetch` call in `initContactForm()`

---

## License

Based on MinimalFolio by [BootstrapMade](https://bootstrapmade.com) — see their [license terms](https://bootstrapmade.com/license/).  
Portfolio content and custom design © 2026 Joël Fah.
