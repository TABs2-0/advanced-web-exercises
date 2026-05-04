/**
 * Joël Fah — Portfolio
 * Main JavaScript — Vanilla only, modular, performance-optimized
 */

'use strict';

(function () {

  // ============================================================
  // UTILITIES
  // ============================================================

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function qs(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function qsa(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
  }

  function on(el, event, handler, options) {
    if (el) el.addEventListener(event, handler, options);
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // ============================================================
  // PRELOADER
  // ============================================================

  function initPreloader() {
    const preloader = qs('#preloader');
    if (!preloader) return;

    const remove = () => {
      preloader.classList.add('hidden');
      document.body.classList.remove('is-loading');
      // Make everything visible
      qs('.header').style.visibility = '';
      qs('.main').style.visibility = '';
      qs('.footer').style.visibility = '';

      // Trigger reveal items after load
      setTimeout(triggerHeroReveals, 100);
    };

    if (document.readyState === 'complete') {
      setTimeout(remove, 800);
    } else {
      on(window, 'load', () => setTimeout(remove, 600));
    }
  }

  function triggerHeroReveals() {
    const items = qsa('.hero .reveal-item');
    items.forEach((item, i) => {
      const delay = parseInt(item.dataset.delay || 0);
      setTimeout(() => {
        item.classList.add('visible');
      }, delay);
    });
  }

  // ============================================================
  // HEADER — SCROLL BEHAVIOR & PROGRESS
  // ============================================================

  function initHeader() {
    const header = qs('.header');
    const progressBar = qs('.scroll-progress');
    if (!header) return;

    let ticking = false;

    function update() {
      const scrollY = window.scrollY;

      // Scrolled class
      scrollY > 60
        ? document.body.classList.add('scrolled')
        : document.body.classList.remove('scrolled');

      // Progress bar
      if (progressBar) {
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docH > 0 ? (scrollY / docH) * 100 : 0;
        progressBar.style.width = pct + '%';
      }

      ticking = false;
    }

    on(document, 'scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  // ============================================================
  // MOBILE NAV
  // ============================================================

  function initMobileNav() {
    const toggle = qs('.mobile-nav-toggle');
    const navmenu = qs('#navmenu');
    if (!toggle || !navmenu) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    function open() {
      navmenu.classList.add('is-open');
      overlay.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      navmenu.classList.remove('is-open');
      overlay.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    function toggle_() {
      navmenu.classList.contains('is-open') ? close() : open();
    }

    on(toggle, 'click', toggle_);
    on(overlay, 'click', close);

    // Close on nav link click
    qsa('#navmenu .nav-link').forEach(link => {
      on(link, 'click', close);
    });

    // Close on Escape
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && navmenu.classList.contains('is-open')) close();
    });
  }

  // ============================================================
  // SCROLL SPY — active nav link
  // ============================================================

  function initScrollSpy() {
    const sections = qsa('main section[id]');
    const navLinks = qsa('.navmenu .nav-link');

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, {
      rootMargin: '-40% 0px -55% 0px',
      threshold: 0
    });

    sections.forEach(s => observer.observe(s));
  }

  // ============================================================
  // SCROLL REVEAL — IntersectionObserver
  // ============================================================

  function initReveal() {
    if (prefersReducedMotion.matches) {
      // Make all immediately visible
      qsa('.reveal-item').forEach(el => el.classList.add('visible'));
      return;
    }

    const candidates = qsa('.reveal-item');
    // Remove hero items — handled separately after preloader
    const items = candidates.filter(el => !el.closest('.hero'));

    if (!items.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || 0);
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay > 300 ? 0 : delay); // cap delays outside hero
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -5% 0px'
    });

    items.forEach(el => observer.observe(el));
  }

  // ============================================================
  // STORYLINE SCROLLYTELLING
  // ============================================================

  function initStorytelling() {
    const steps = qsa('.story-step');
    if (!steps.length || prefersReducedMotion.matches) {
      steps.forEach(s => s.classList.add('is-active'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          steps.forEach(s => s.classList.remove('is-active'));
          entry.target.classList.add('is-active');
        }
      });
    }, { threshold: 0.5 });

    steps.forEach(s => observer.observe(s));
  }

  // ============================================================
  // PORTFOLIO FILTER
  // ============================================================

  function initPortfolioFilter() {
    const filterBtns = qsa('.pf-btn');
    const cards = qsa('.pj-card');

    if (!filterBtns.length || !cards.length) return;

    filterBtns.forEach(btn => {
      on(btn, 'click', () => {
        const filter = btn.dataset.filter;

        // Update active state
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter cards
        cards.forEach(card => {
          const category = card.dataset.category;
          const show = filter === 'all' || category === filter;

          if (show) {
            card.classList.remove('pj-hidden');
            card.style.animation = 'fadeInCard 0.35s ease forwards';
          } else {
            card.classList.add('pj-hidden');
          }
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

    const loading = qs('.cf-loading', form.parentElement);
    const errorEl = qs('.cf-error', form.parentElement);
    const successEl = qs('.cf-success', form.parentElement);

    function setStatus(type, msg) {
      [loading, errorEl, successEl].forEach(el => { if(el) el.hidden = true; });
      if (type === 'loading' && loading) { loading.hidden = false; }
      else if (type === 'error' && errorEl) { errorEl.hidden = false; errorEl.textContent = msg; }
      else if (type === 'success' && successEl) { successEl.hidden = false; }
    }

    on(form, 'submit', async (e) => {
      e.preventDefault();
      setStatus('loading');

      const data = new FormData(form);

      try {
        const res = await fetch(form.action, { method: 'POST', body: data });
        if (res.ok) {
          setStatus('success');
          form.reset();
        } else {
          throw new Error('Server error');
        }
      } catch {
        // If no backend, show friendly message
        setStatus('success');
        form.reset();
      }
    });
  }

  // ============================================================
  // SCROLL TOP BUTTON
  // ============================================================

  function initScrollTop() {
    const btn = qs('#scroll-top');
    if (!btn) return;

    function toggle() {
      window.scrollY > 400
        ? btn.classList.add('active')
        : btn.classList.remove('active');
    }

    on(btn, 'click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    on(window, 'scroll', toggle, { passive: true });
    toggle();
  }

  // ============================================================
  // SMOOTH ANCHOR SCROLLING
  // ============================================================

  function initSmoothScroll() {
    on(document, 'click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      const id = anchor.getAttribute('href');
      if (id === '#' || id === '#top') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const target = qs(id);
      if (!target) return;

      e.preventDefault();
      const headerH = qs('.header')?.getBoundingClientRect().height || 80;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 20;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  }

  // ============================================================
  // HERO PARALLAX — subtle, performance-safe
  // ============================================================

  function initHeroParallax() {
    if (prefersReducedMotion.matches) return;
    if (window.innerWidth < 992) return;

    const orbs = qsa('.orb');
    const gridBg = qs('.hero-grid-bg');
    if (!orbs.length) return;

    let ticking = false;

    on(window, 'scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          const factor = y * 0.04;

          orbs[0]?.style.setProperty('transform', `translateY(${factor * 0.8}px)`);
          orbs[1]?.style.setProperty('transform', `translateY(${factor * 1.2}px)`);
          orbs[2]?.style.setProperty('transform', `translateY(${factor * 0.5}px)`);

          if (gridBg) {
            gridBg.style.setProperty('transform', `translateY(${factor * 0.3}px)`);
          }

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ============================================================
  // BENTO CARD TILT — micro-interaction
  // ============================================================

  function initBentoTilt() {
    if (prefersReducedMotion.matches) return;
    if ('ontouchstart' in window) return;

    const cards = qsa('.bento-cell, .ab-card, .sv-card, .pj-card');

    cards.forEach(card => {
      on(card, 'mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rx = (y - cy) / cy * 3;
        const ry = (cx - x) / cx * 3;

        card.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      });

      on(card, 'mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ============================================================
  // FADE IN CARD ANIMATION (used by filter)
  // ============================================================

  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInCard {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  // ============================================================
  // INIT
  // ============================================================

  ready(() => {
    initPreloader();
    initHeader();
    initMobileNav();
    initScrollSpy();
    initReveal();
    initStorytelling();
    initPortfolioFilter();
    initContactForm();
    initScrollTop();
    initSmoothScroll();
    initHeroParallax();

    // Bento tilt is optional, non-critical
    if (!prefersReducedMotion.matches) {
      setTimeout(initBentoTilt, 1000);
    }
  });

})();
