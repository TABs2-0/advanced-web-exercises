/**
 * Joël Fah Portfolio — main.js
 * Vanilla JS only. No dependencies.
 */
'use strict';

(function () {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const qs = (s, scope = document) => scope.querySelector(s);
  const qsa = (s, scope = document) => Array.from(scope.querySelectorAll(s));

  // ============================================================
  // PRELOADER
  // ============================================================
  function initPreloader() {
    const el = qs('#preloader');
    if (!el) return;
    const done = () => {
      el.classList.add('hidden');
      document.body.classList.remove('is-loading');
      qsa('.main, .footer, .dock-nav').forEach(n => n.style.visibility = '');
      setTimeout(triggerHeroReveals, 120);
    };
    document.readyState === 'complete' ? setTimeout(done, 700) : window.addEventListener('load', () => setTimeout(done, 500));
  }

  function triggerHeroReveals() {
    qsa('.hero .reveal-item').forEach(el => {
      const delay = parseInt(el.dataset.delay || 0);
      setTimeout(() => el.classList.add('visible'), delay);
    });
  }

  // ============================================================
  // SCROLL PROGRESS — ring in dock
  // ============================================================
  function initScrollProgress() {
    const ring = qs('.ring-fill');
    const pct = qs('.dock-progress-pct');
    if (!ring && !pct) return;

    const circumference = 2 * Math.PI * 15.9; // r=15.9

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docH > 0 ? scrollTop / docH : 0;
        const pctVal = Math.round(progress * 100);

        if (ring) {
          // SVG uses stroke-dashoffset on a 100-unit dasharray
          const offset = 100 - pctVal;
          ring.style.strokeDashoffset = offset;
        }
        if (pct) pct.textContent = pctVal + '%';

        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  }

  // ============================================================
  // DOCK NAV — mobile toggle with liquid glass expand
  // ============================================================
  function initDockNav() {
    const toggle = qs('#dock-toggle');
    const menu = qs('#dock-mobile-menu');
    const menuIcon = qs('.dt-menu', toggle);
    const closeIcon = qs('.dt-close', toggle);
    if (!toggle || !menu) return;

    let isOpen = false;

    function open() {
      isOpen = true;
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      if (menuIcon) menuIcon.style.display = 'none';
      if (closeIcon) closeIcon.style.display = 'flex';
    }

    function close() {
      isOpen = false;
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      if (menuIcon) menuIcon.style.display = 'flex';
      if (closeIcon) closeIcon.style.display = 'none';
    }

    toggle.addEventListener('click', () => isOpen ? close() : open());

    // Close when a menu link is clicked
    qsa('.dmm-link, .dmm-cta', menu).forEach(link => {
      link.addEventListener('click', close);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (isOpen && !qs('#dock-nav').contains(e.target)) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });
  }

  // ============================================================
  // SCROLL SPY
  // ============================================================
  function initScrollSpy() {
    const sections = qsa('main section[id]');
    const dockLinks = qsa('.dock-link');
    const dmmLinks = qsa('.dmm-link');
    if (!sections.length) return;

    const setActive = (id) => {
      [...dockLinks, ...dmmLinks].forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === `#${id}`);
      });
    };

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach(s => obs.observe(s));
  }

  // ============================================================
  // SCROLL REVEAL
  // ============================================================
  function initReveal() {
    if (prefersReducedMotion.matches) {
      qsa('.reveal-item').forEach(el => el.classList.add('visible'));
      return;
    }
    const items = qsa('.reveal-item').filter(el => !el.closest('.hero'));
    window._revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    items.forEach(el => window._revealObserver.observe(el));
  }

  // ============================================================
  // STORYLINE
  // ============================================================
  function initStorytelling() {
    const steps = qsa('.story-step');
    if (!steps.length) { steps.forEach(s => s.classList.add('is-active')); return; }
    if (prefersReducedMotion.matches) { steps.forEach(s => s.classList.add('is-active')); return; }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          steps.forEach(s => s.classList.remove('is-active'));
          e.target.classList.add('is-active');
        }
      });
    }, { threshold: 0.5 });
    steps.forEach(s => obs.observe(s));
  }

  // ============================================================
  // PORTFOLIO FILTER
  // ============================================================
  function initPortfolioFilter() {
    const btns = qsa('.pf-btn');
    const cards = qsa('.pj-card');
    if (!btns.length) return;
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        cards.forEach(card => {
          const show = filter === 'all' || card.dataset.category === filter;
          card.classList.toggle('pj-hidden', !show);
          if (show) card.style.animation = 'fadeInCard 0.35s ease forwards';
        });
      });
    });
  }

  // ============================================================
  // CONTACT FORM
  // ============================================================
  function initContactForm() {
    const form = qs('#contact-form');
    if (!form) return;
    const parent = form.closest('.contact-form-wrap') || form.parentElement;
    const loading = qs('.cf-loading', parent);
    const errorEl = qs('.cf-error', parent);
    const successEl = qs('.cf-success', parent);
    const hide = (...els) => els.forEach(e => e && (e.hidden = true));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hide(errorEl, successEl);
      if (loading) loading.hidden = false;
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form) });
        hide(loading);
        if (res.ok) { if (successEl) successEl.hidden = false; form.reset(); }
        else throw new Error();
      } catch {
        hide(loading);
        if (successEl) successEl.hidden = false; // graceful fallback
        form.reset();
      }
    });
  }

  // ============================================================
  // SCROLL TOP
  // ============================================================
  function initScrollTop() {
    const btn = qs('#scroll-top');
    if (!btn) return;
    const toggle = () => btn.classList.toggle('active', window.scrollY > 400);
    btn.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  }

  // ============================================================
  // SMOOTH ANCHOR SCROLL
  // ============================================================
  function initSmoothScroll() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id === '#' || id === '#top') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      const target = qs(id);
      if (!target) return;
      e.preventDefault();
      // Offset: dock height at bottom — no top offset needed
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ============================================================
  // HERO CANVAS — animated grid with mouse-reactive glow
  // ============================================================
  function initHeroCanvas() {
    const canvas = qs('#hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h, cols, rows, mouse = { x: -9999, y: -9999 };
    const CELL = 64;
    let animId;

    function resize() {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      cols = Math.ceil(w / CELL) + 1;
      rows = Math.ceil(h / CELL) + 1;
    }

    // Track mouse relative to canvas
    const hero = canvas.closest('#hero') || document.body;
    hero.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });
    hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

    // Travelling lights
    const lights = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random() * 800,
      y: Math.random() * 600,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      hue: [200, 220, 240, 260][i],
      r: 120 + Math.random() * 80
    }));

    let lastTime = 0;
    function draw(ts) {
      animId = requestAnimationFrame(draw);
      if (prefersReducedMotion.matches) { ctx.clearRect(0, 0, w, h); return; }

      const dt = ts - lastTime;
      lastTime = ts;

      ctx.clearRect(0, 0, w, h);

      // Move travelling lights
      lights.forEach(l => {
        l.x += l.vx;
        l.y += l.vy;
        if (l.x < -l.r) l.x = w + l.r;
        if (l.x > w + l.r) l.x = -l.r;
        if (l.y < -l.r) l.y = h + l.r;
        if (l.y > h + l.r) l.y = -l.r;
      });

      // Draw grid lines with glow effect
      const drawLines = () => {
        // Vertical lines
        for (let c = 0; c <= cols; c++) {
          const x = c * CELL;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          let alpha = 0.07;
          // Mouse proximity boost
          const mdx = Math.abs(mouse.x - x);
          if (mdx < CELL * 2) alpha += 0.18 * (1 - mdx / (CELL * 2));
          // Travelling light proximity
          lights.forEach(l => {
            const d = Math.abs(l.x - x);
            if (d < l.r) alpha += 0.12 * (1 - d / l.r);
          });
          ctx.strokeStyle = `rgba(80,80,80,${Math.min(alpha, 0.45)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        // Horizontal lines
        for (let r = 0; r <= rows; r++) {
          const y = r * CELL;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          let alpha = 0.07;
          const mdy = Math.abs(mouse.y - y);
          if (mdy < CELL * 2) alpha += 0.18 * (1 - mdy / (CELL * 2));
          lights.forEach(l => {
            const d = Math.abs(l.y - y);
            if (d < l.r) alpha += 0.12 * (1 - d / l.r);
          });
          ctx.strokeStyle = `rgba(80,80,80,${Math.min(alpha, 0.45)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      };

      drawLines();

      // Draw dot glow at intersections near mouse / lights
      const drawDots = () => {
        for (let c = 0; c <= cols; c++) {
          for (let r = 0; r <= rows; r++) {
            const x = c * CELL, y = r * CELL;
            let glow = 0;
            const md = Math.hypot(mouse.x - x, mouse.y - y);
            if (md < CELL * 3) glow += 0.7 * (1 - md / (CELL * 3));
            lights.forEach(l => {
              const d = Math.hypot(l.x - x, l.y - y);
              if (d < l.r) glow += 0.4 * (1 - d / l.r);
            });
            if (glow < 0.05) continue;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100,100,100,${Math.min(glow, 0.8)})`;
            ctx.fill();
          }
        }
      };

      drawDots();

      // Soft radial glow following mouse
      if (mouse.x > 0) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, CELL * 4);
        grad.addColorStop(0, 'rgba(120,120,120,0.06)');
        grad.addColorStop(1, 'rgba(120,120,120,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Travelling light glow blobs
      lights.forEach(l => {
        const grad = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
        grad.addColorStop(0, `hsla(${l.hue}, 10%, 70%, 0.04)`);
        grad.addColorStop(1, `hsla(${l.hue}, 10%, 70%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });
    }

    resize();
    window.addEventListener('resize', () => { resize(); }, { passive: true });
    animId = requestAnimationFrame(draw);
  }

  // ============================================================
  // HERO TITLE MAGNETIC CURSOR EFFECT
  // ============================================================
  function initHeroMagnetic() {
    if (prefersReducedMotion.matches) return;
    const title = qs('.hero-title');
    if (!title) return;

    const lines = qsa('.title-line', title);

    title.addEventListener('mousemove', e => {
      const rect = title.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;

      lines.forEach((line, i) => {
        const factor = (i + 1) * 4;
        line.style.transform = `translate(${dx * factor}px, ${dy * factor * 0.5}px)`;
        line.style.transition = 'transform 0.1s ease';
      });
    });

    title.addEventListener('mouseleave', () => {
      lines.forEach(line => {
        line.style.transform = '';
        line.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
      });
    });
  }

  // ============================================================
  // BENTO SUBTLE TILT
  // ============================================================
  function initBentoTilt() {
    if (prefersReducedMotion.matches || 'ontouchstart' in window) return;
    qsa('.bento-cell, .ab-card, .sv-card, .pj-card, .include-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const rx = (y - r.height / 2) / r.height * 4;
        const ry = (r.width / 2 - x) / r.width * 4;
        card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  // ============================================================
  // ANIMATIONS KEYFRAMES (injected)
  // ============================================================
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    @keyframes fadeInCard {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(styleTag);

  // ============================================================
  // INIT
  // ============================================================
  const init = () => {
    initPreloader();
    initScrollProgress();
    initDockNav();
    initScrollSpy();
    initReveal();
    initStorytelling();
    initPortfolioFilter();
    initContactForm();
    initScrollTop();
    initSmoothScroll();
    initHeroCanvas();
    initHeroMagnetic();
    if (!prefersReducedMotion.matches) setTimeout(initBentoTilt, 800);
  };

  document.readyState !== 'loading' ? init() : document.addEventListener('DOMContentLoaded', init);

})();
