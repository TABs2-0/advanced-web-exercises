/**
 * Warrap — Global JavaScript
 * --------------------------------
 * Vanilla JS only. No framework. No build step required.
 * All map logic lives inside individual template <script> blocks.
 */

'use strict';

// ── Dropdown toggle ─────────────────────────────────────────────────────────
function toggleDropdown(id) {
  const menu = document.getElementById(id);
  if (!menu) return;
  const isHidden = menu.classList.contains('hidden');

  // Close all other dropdowns first
  document.querySelectorAll('[id$="-menu"]').forEach(el => el.classList.add('hidden'));

  if (isHidden) {
    menu.classList.remove('hidden');
    // Close when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeOnOutside(e) {
        if (!menu.contains(e.target)) {
          menu.classList.add('hidden');
          document.removeEventListener('click', closeOnOutside);
        }
      });
    }, 0);
  }
}

// ── Mobile menu drawer ───────────────────────────────────────────────────────
function toggleMobileMenu() {
  const overlay = document.getElementById('mobile-menu');
  const drawer = document.getElementById('mobile-drawer');
  if (!overlay || !drawer) return;

  const isOpen = !drawer.classList.contains('hidden');
  if (isOpen) {
    drawer.style.transform = 'translateX(100%)';
    setTimeout(() => {
      drawer.classList.add('hidden');
      overlay.classList.add('hidden');
    }, 300);
  } else {
    drawer.classList.remove('hidden');
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      drawer.style.transform = 'translateX(0)';
    });
  }
}

// ── Flash-gig countdown timers ───────────────────────────────────────────────
function initCountdowns() {
  document.querySelectorAll('[data-expires]').forEach(el => {
    const expiresAt = new Date(el.dataset.expires);

    const update = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        el.textContent = 'Expired';
        el.classList.add('text-red-600');
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      el.textContent = `${mins}m ${secs}s`;
      setTimeout(update, 1000);
    };
    update();
  });
}

// ── Star rating UI ───────────────────────────────────────────────────────────
function initStarRating() {
  const container = document.getElementById('star-rating');
  if (!container) return;

  const stars = container.querySelectorAll('[data-star]');
  const input = document.getElementById('id_score');

  stars.forEach((star, i) => {
    star.addEventListener('mouseenter', () => highlightStars(stars, i));
    star.addEventListener('mouseleave', () => {
      const val = input ? parseInt(input.value) - 1 : -1;
      highlightStars(stars, val);
    });
    star.addEventListener('click', () => {
      if (input) input.value = i + 1;
      highlightStars(stars, i);
    });
  });
}

function highlightStars(stars, upToIndex) {
  stars.forEach((star, i) => {
    star.classList.toggle('text-amber-400', i <= upToIndex);
    star.classList.toggle('text-slate', i > upToIndex);
  });
}

// ── Nav scroll behaviour ─────────────────────────────────────────────────────
function initNavScroll() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    if (current > 80 && current > lastScroll) {
      nav.style.transform = 'translateX(-50%) translateY(-120%)';
    } else {
      nav.style.transform = 'translateX(-50%) translateY(0)';
    }
    lastScroll = current;
  }, { passive: true });
}

// ── CSRF helper for fetch() calls ────────────────────────────────────────────
function getCsrfToken() {
  return document.querySelector('[name=csrfmiddlewaretoken]')?.value
    || document.cookie.split('; ').find(r => r.startsWith('csrftoken='))?.split('=')[1]
    || '';
}

// ── Page init ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCountdowns();
  initStarRating();
  initNavScroll();
});
