/* ═══════════════════════════════════════════════════════
   MAIN.JS — Pope Leo XIV in Cameroon
   Premium interactions & animations
═══════════════════════════════════════════════════════ */

'use strict';

/* ─── AOS Init ─── */
AOS.init({
  duration: 800,
  once: true,
  offset: 60,
  easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
});

/* ─── Loading Screen ─── */
window.addEventListener('load', () => {
  setTimeout(() => {
    const ls = document.getElementById('loadingScreen');
    if (ls) ls.classList.add('hidden');
  }, 1600);
});

/* ─── Custom Cursor ─── */
const cursorDot  = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  if (cursorDot) {
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top  = mouseY + 'px';
  }
});

(function animateCursor() {
  if (cursorRing) {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';
  }
  requestAnimationFrame(animateCursor);
})();

document.querySelectorAll('a, button, .city-tab-btn, .theme-card, .overview-card, .photo-tile, .day-block, .africa-stop')
  .forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

/* ─── Navbar: scroll state + hide/show on scroll direction ─── */
const nav         = document.getElementById('mainNav');
const progressBar = document.getElementById('navProgress');
const navToggle   = document.getElementById('navToggle');
const navLinksEl  = document.getElementById('navLinks');
const navOverlay  = document.getElementById('navOverlay');
const navItems    = document.querySelectorAll('.nav-link-item');

let lastScrollY = 0;
let hideNavTimer;
let navHidden = false;

function updateNavScroll() {
  const scrollY = window.scrollY;

  // Scrolled class for background
  nav.classList.toggle('scrolled', scrollY > 60);

  // Progress bar
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = Math.min((scrollY / docH) * 100, 100) + '%';

  // Back to top
  const btt = document.querySelector('.back-to-top');
  if (btt) btt.classList.toggle('visible', scrollY > 400);

  // Hide on scroll down, show on scroll up
  if (scrollY > 300) {
    if (scrollY > lastScrollY + 6 && !navHidden) {
      nav.style.transform = 'translateY(-110%)';
      navHidden = true;
    } else if (scrollY < lastScrollY - 3 && navHidden) {
      nav.style.transform = 'translateY(0)';
      navHidden = false;
    }
  } else {
    nav.style.transform = 'translateY(0)';
    navHidden = false;
  }

  // Auto-show after pause
  clearTimeout(hideNavTimer);
  hideNavTimer = setTimeout(() => {
    nav.style.transform = 'translateY(0)';
    navHidden = false;
  }, 2800);

  lastScrollY = scrollY;
}
window.addEventListener('scroll', updateNavScroll, { passive: true });
updateNavScroll();

/* ─── Mobile nav: open/close ─── */
function openNav() {
  navLinksEl.classList.add('open');
  navToggle.classList.add('open');
  navOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeNav() {
  navLinksEl.classList.remove('open');
  navToggle.classList.remove('open');
  navOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

navToggle && navToggle.addEventListener('click', () => {
  navLinksEl.classList.contains('open') ? closeNav() : openNav();
});

// Close when tapping the overlay (outside nav)
navOverlay && navOverlay.addEventListener('click', closeNav);

// Close on nav link click
navItems.forEach(link => link.addEventListener('click', closeNav));

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navLinksEl.classList.contains('open')) closeNav();
});

/* ─── Scrollspy ─── */
const sections = document.querySelectorAll('section[id]');
const scrollspyObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navItems.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  });
}, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
sections.forEach(s => scrollspyObs.observe(s));

/* ─── Smooth anchor scroll with nav offset ─── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH = nav ? nav.offsetHeight + 12 : 80;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH, behavior: 'smooth' });
  });
});

/* ─── Hero Particles ─── */
(function createParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  const symbols = ['✝', '☩', '✦', '✧', '✶'];
  const count = window.innerWidth < 768 ? 6 : 14;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'hero-particle';
    p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    const size     = 14 + Math.random() * 24;
    const duration = 14 + Math.random() * 18;
    const delay    = -(Math.random() * duration);
    p.style.cssText = `
      left:${5 + Math.random() * 90}%;
      bottom:-60px;
      font-size:${size}px;
      animation-duration:${duration}s;
      animation-delay:${delay}s;
    `;
    container.appendChild(p);
  }
})();

/* ─── Hero parallax on mouse ─── */
document.addEventListener('mousemove', e => {
  const heroContent = document.querySelector('.hero-content');
  if (!heroContent) return;
  const { innerWidth: w, innerHeight: h } = window;
  const x = (e.clientX / w - 0.5) * 10;
  const y = (e.clientY / h - 0.5) * 7;
  heroContent.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
});

/* ─── Hero floating image subtle parallax on scroll ─── */
window.addEventListener('scroll', () => {
  const imgWrap = document.querySelector('.hero-floating-img-wrap');
  if (!imgWrap) return;
  const scrolled = window.scrollY;
  imgWrap.style.transform = `translateY(${scrolled * 0.18}px)`;
}, { passive: true });

/* ─── Timeline animated reveal ─── */
const timelineNodes = document.querySelectorAll('.t-node');
const timelineEl    = document.querySelector('.timeline-ribbon');
if (timelineEl) {
  const obs = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    timelineNodes.forEach((n, i) => {
      setTimeout(() => n.classList.add('active'), i * 550);
    });
    obs.unobserve(timelineEl);
  }, { threshold: 0.4 });
  obs.observe(timelineEl);
}

/* ─── City Tabs ─── */
const cityTabBtns = document.querySelectorAll('.city-tab-btn');
const cityPanels  = document.querySelectorAll('.city-panel');

cityTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.city;
    cityTabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    cityPanels.forEach(p => {
      p.classList.remove('active');
      if (p.id === `panel-${target}`) p.classList.add('active');
    });
    AOS.refresh();
  });
});

/* ─── Animated Counters ─── */
function animateCounter(el, target, suffix = '', duration = 1800) {
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    const value = Math.floor(eased * target);
    el.textContent = value.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString() + suffix;
  }
  requestAnimationFrame(update);
}

const counterObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el     = entry.target;
    const count  = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (!count || el.dataset.counted) return;
    el.dataset.counted = 'true';
    counterObs.unobserve(el);
    animateCounter(el, count, suffix);
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));

/* ─── Marquee: pause on hover ─── */
const marquee = document.querySelector('.interlude-marquee');
if (marquee) {
  marquee.addEventListener('mouseenter', () => marquee.style.animationPlayState = 'paused');
  marquee.addEventListener('mouseleave', () => marquee.style.animationPlayState = 'running');
}

/* ─── Photo tile: tilt on mouse move ─── */
document.querySelectorAll('.photo-tile').forEach(tile => {
  tile.addEventListener('mousemove', e => {
    const rect = tile.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 6;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 6;
    tile.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${-y}deg) scale(1.02)`;
    tile.style.transition = 'transform 0.1s ease';
  });
  tile.addEventListener('mouseleave', () => {
    tile.style.transform = '';
    tile.style.transition = 'transform 0.4s ease';
  });
});

/* ─── Theme cards: 3D tilt ─── */
document.querySelectorAll('.theme-card, .overview-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 8;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 8;
    card.style.transform = `perspective(700px) rotateY(${x}deg) rotateX(${-y}deg) translateY(-4px)`;
    card.style.transition = 'transform 0.1s ease';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
  });
});

/* ─── Africa stop stagger reveal ─── */
const africaStops = document.querySelectorAll('.africa-stop');
if (africaStops.length) {
  const africaObs = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    africaStops.forEach((stop, i) => {
      setTimeout(() => {
        stop.style.opacity = '1';
        stop.style.transform = 'translateY(0)';
      }, i * 110);
    });
    africaObs.disconnect();
  }, { threshold: 0.15 });
  africaStops.forEach(s => {
    s.style.opacity = '0';
    s.style.transform = 'translateY(22px)';
    s.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });
  africaObs.observe(document.querySelector('.africa-tour-timeline'));
}

/* ─── Footer ref links stagger ─── */
const refLinks = document.querySelectorAll('.ref-list a');
if (refLinks.length) {
  const refObs = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    refLinks.forEach((link, i) => {
      setTimeout(() => {
        link.style.opacity = '1';
        link.style.transform = 'translateX(0)';
        link.style.transition = 'opacity 0.4s ease, transform 0.4s ease, color 0.28s ease';
      }, i * 45);
    });
    refObs.disconnect();
  }, { threshold: 0.1 });
  refObs.observe(document.querySelector('.site-footer'));
}

/* ─── Sticky fullscreen quote: parallax scroll ─── */
const stickySection = document.getElementById('stickyQuoteSection');
const stickyImg     = document.querySelector('.sticky-quote-img');
if (stickySection && stickyImg) {
  window.addEventListener('scroll', () => {
    const rect     = stickySection.getBoundingClientRect();
    const progress = -rect.top / (stickySection.offsetHeight);
    const clipped  = Math.max(0, Math.min(1, progress));
    // Parallax: image scrolls at 30% of page speed
    stickyImg.style.transform = `scale(1.05) translateY(${clipped * 8}%)`;
  }, { passive: true });
}

/* ─── Sticky quote entrance animation ─── */
const stickyContent = document.querySelector('.sticky-quote-content');
if (stickyContent) {
  const stickyObs = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    stickyContent.style.opacity    = '1';
    stickyContent.style.transform  = 'translateY(0)';
    stickyObs.disconnect();
  }, { threshold: 0.25 });
  stickyContent.style.opacity   = '0';
  stickyContent.style.transform = 'translateY(30px)';
  stickyContent.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
  stickyObs.observe(stickySection);
}

/* ─── Map link ripple ─── */
document.querySelectorAll('.map-link, .map-link-light').forEach(link => {
  link.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect   = this.getBoundingClientRect();
    ripple.style.cssText = `
      position:absolute;border-radius:50%;
      background:rgba(255,255,255,0.35);
      transform:scale(0);animation:rippleAnim 0.5s linear;
      pointer-events:none;width:60px;height:60px;
      left:${e.clientX - rect.left - 30}px;
      top:${e.clientY - rect.top - 30}px;
    `;
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  });
});

// Inject ripple keyframe once
const styleEl = document.createElement('style');
styleEl.textContent = '@keyframes rippleAnim{to{transform:scale(3.5);opacity:0}}';
document.head.appendChild(styleEl);

/* ─── Quotes carousel: keyboard navigation ─── */
document.addEventListener('keydown', e => {
  const carousel = document.querySelector('#quotesCarousel');
  if (!carousel) return;
  const bsC = bootstrap.Carousel.getInstance(carousel);
  if (!bsC) return;
  if (e.key === 'ArrowRight') bsC.next();
  if (e.key === 'ArrowLeft')  bsC.prev();
});

/* ─── Back to top ─── */
const bttBtn = document.querySelector('.back-to-top');
bttBtn && bttBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ─── Section in-view class ─── */
const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(e => e.target.classList.toggle('in-view', e.isIntersecting));
}, { threshold: 0.1 });
document.querySelectorAll('section').forEach(s => sectionObs.observe(s));

/* ─── Photo tile: lightbox-style click expand ─── */
function createLightbox() {
  const lb = document.createElement('div');
  lb.id = 'photoLightbox';
  lb.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(10,20,15,0.96);
    display:flex;align-items:center;justify-content:center;
    opacity:0;transition:opacity 0.3s ease;
    cursor:zoom-out;padding:2rem;
  `;
  const img = document.createElement('img');
  img.style.cssText = `
    max-width:90vw;max-height:88vh;
    object-fit:contain;border-radius:12px;
    box-shadow:0 24px 80px rgba(0,0,0,0.6);
    transform:scale(0.92);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
  `;
  const cap = document.createElement('div');
  cap.style.cssText = `
    position:absolute;bottom:2.4rem;left:50%;transform:translateX(-50%);
    background:rgba(30,57,50,0.9);backdrop-filter:blur(8px);
    color:white;font-size:1.4rem;font-weight:600;
    padding:0.8rem 2rem;border-radius:50px;
    font-family:'Instrument Sans',sans-serif;
    border:1px solid rgba(255,255,255,0.1);
    white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis;
  `;
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
  closeBtn.style.cssText = `
    position:absolute;top:2rem;right:2rem;
    background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);
    color:white;font-size:2rem;width:48px;height:48px;
    border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;
    transition:background 0.2s;
  `;
  closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = 'rgba(255,255,255,0.22)');
  closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = 'rgba(255,255,255,0.12)');
  lb.appendChild(img); lb.appendChild(cap); lb.appendChild(closeBtn);
  document.body.appendChild(lb);

  function closeLb() {
    lb.style.opacity = '0';
    img.style.transform = 'scale(0.92)';
    setTimeout(() => { lb.style.display = 'none'; document.body.style.overflow = ''; }, 300);
  }
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  closeBtn.addEventListener('click', closeLb);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

  return { lb, img, cap };
}

const { lb: lightbox, img: lbImg, cap: lbCap } = createLightbox();

document.querySelectorAll('.photo-tile').forEach(tile => {
  tile.style.cursor = 'zoom-in';
  tile.addEventListener('click', () => {
    const src  = tile.querySelector('.photo-tile-img')?.src;
    const alt  = tile.querySelector('.photo-tile-img')?.alt || '';
    const text = tile.querySelector('.photo-tile-caption span')?.textContent || alt;
    if (!src) return;
    lbImg.src   = src;
    lbImg.alt   = alt;
    lbCap.textContent = text;
    lightbox.style.display  = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      lightbox.style.opacity  = '1';
      lbImg.style.transform   = 'scale(1)';
    });
  });
});

/* ─── Event row padding on mobile ─── */
if (window.innerWidth < 576) {
  document.querySelectorAll('.event-row').forEach(row => {
    row.style.padding = '1.6rem 0.8rem';
  });
}

/* ─── Day block: subtle glow on hover ─── */
document.querySelectorAll('.day-block').forEach(block => {
  block.addEventListener('mouseenter', () => {
    block.style.borderLeftColor = 'var(--green-accent)';
  });
  block.addEventListener('mouseleave', () => {
    block.style.borderLeftColor = '';
  });
});

/* ─── Console brand ─── */
console.log('%c✝ Pope Leo XIV in Cameroon', 'color:#00754A;font-size:18px;font-weight:bold;font-family:Georgia,serif;');
console.log('%cApostolic Journey — April 15–18, 2026', 'color:#cba258;font-size:13px;font-family:Georgia,serif;');
