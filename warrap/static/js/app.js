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

// ── Bottom sheet drag ────────────────────────────────────────────────────────
function initBottomSheet() {
  const sheet = document.getElementById('bottom-sheet');
  if (!sheet) return;
  let expanded = false;

  const COLLAPSED = 'translateY(calc(100% - 180px))';
  const EXPANDED = 'translateY(0)';
  sheet.style.transform = COLLAPSED;
  sheet.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';

  let handle = document.getElementById('sheet-handle');
  if (handle) {
    handle.addEventListener('click', () => {
      expanded = !expanded;
      sheet.style.transform = expanded ? EXPANDED : COLLAPSED;
    });

    let startY = 0;
    handle.addEventListener('touchstart', e => {
      startY = e.touches[0].clientY;
    });
    handle.addEventListener('touchend', e => {
      const diff = e.changedTouches[0].clientY - startY;
      if (diff < -30) { expanded = true; }
      if (diff > 30) { expanded = false; }
      sheet.style.transform = expanded ? EXPANDED : COLLAPSED;
    });
  }
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

  let stepNum = document.getElementById('current-step-num');
  if (stepNum) stepNum.textContent = n;
}

// ── Tab switching (My Tasks) ──────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  let panel = document.getElementById(`panel-${name}`);
  if(panel) panel.classList.remove('hidden');
  let tab = document.querySelector(`[data-tab="${name}"]`);
  if(tab) tab.classList.add('active');
}

// ── Service Worker & Push Notifications ──────────────────────────────────────
async function registerServiceWorker() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const reg = await navigator.serviceWorker.register('/static/js/sw.js');
      // Sprint 4: push subscription logic can hook in here
    } catch (e) {
      console.warn('SW registration failed:', e);
    }
  }
}

// ── Page init ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCountdowns();
  initStarRating();
  initNavScroll();
  initVoiceNote();
  initBottomSheet();
  // Set initial tab
  const firstTab = document.querySelector('.tab');
  if (firstTab) firstTab.classList.add('active');
  registerServiceWorker();
});

// ── Voice-Note Task Posting ──────────────────────────────────────────────────
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
    btn.innerHTML = '<i class="ri-pulse-line"></i> Listening...';
  });
  recognition.onresult = e => {
    document.getElementById('id_title').value = e.results[0][0].transcript;
    btn.innerHTML = '<i class="ri-mic-line"></i> Voice note';
  };
  recognition.onerror = () => { btn.innerHTML = '<i class="ri-mic-line"></i> Voice note'; };
}
