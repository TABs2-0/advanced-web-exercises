/**
 * portfolio-details.js
 * Reads ?project=slug from URL, renders project content dynamically.
 * No framework. One file, one truth.
 */
'use strict';

const PROJECTS = {
  nkwel: {
    title: 'Nkwel',
    year: '2024',
    type: 'Marketing Site',
    category: 'Web',
    color: '#1a1a2e',
    image: 'assets/img/nkwel.png',
    imageAlt: 'Nkwel marketing site',
    live: 'https://nkwel.com',
    github: null,
    role: 'Design & Frontend',
    duration: '6 weeks',
    stack: 'HTML · CSS · JS',
    overview: `Nkwel needed a marketing site that communicated product value quickly and clearly — no noise, no generic SaaS template vibes. The brief was to create something minimal that still felt premium and differentiated.`,
    challenge: `The challenge was clarity under ambiguity. Early content drafts were scattered across multiple value propositions. The design had to impose structure without being prescriptive — a clean information hierarchy that guided visitors from "what is this?" to "I want this."`,
    process: [
      { title: 'Content audit & hierarchy', body: 'Mapped every message the team wanted to convey, then ruthlessly cut until one primary value proposition was clear.' },
      { title: 'Wireframe sprint', body: 'Three layout explorations in 48 hours. One above-the-fold composition that answered the key question without scrolling.' },
      { title: 'Visual system', body: 'Built a tight type scale, a constrained 3-color palette, and consistent spacing tokens. No decisions left to chance in implementation.' },
      { title: 'Frontend build', body: 'Coded directly in HTML/CSS/JS. Pixel-precise. Responsive from 320px up. Animations tied to scroll, not timers.' }
    ],
    outcomes: [
      { num: '3×', label: 'Conversion lift' },
      { num: '<2s', label: 'Load time' },
      { num: '100', label: 'Lighthouse score' }
    ],
    learnings: [
      'A hero section that answers one question outperforms a carousel of five every time.',
      'Restraint in animation creates more elegance than quantity of effects.',
      'Marketing sites are product design problems, not just visual ones.'
    ],
    prev: null,
    next: 'hinkaku'
  },

  hinkaku: {
    title: 'Hinkaku',
    year: '2024',
    type: 'Brand Site',
    category: 'Web',
    color: '#0f3460',
    image: 'assets/img/hinkaku.png',
    imageAlt: 'Hinkaku brand site',
    live: 'https://hinkaku.tech',
    github: null,
    role: 'Design & Frontend',
    duration: '4 weeks',
    stack: 'HTML · CSS · JS · Django',
    overview: `Hinkaku is a tech startup that needed a brand website communicating trust, precision, and product focus. The site had to work for both technical and non-technical audiences — a rare challenge that demanded careful IA decisions.`,
    challenge: `Two audiences, one site. Technical visitors needed evidence of competence. Business visitors needed to feel safe and confident. Every section had to serve both without feeling split-personality or cluttered.`,
    process: [
      { title: 'Audience mapping', body: 'Defined the primary entry paths for each persona — what they scan first, what question they need answered before they keep reading.' },
      { title: 'Dual-mode copywriting', body: 'Worked with the founders to write headlines that read as confident and clear to both audiences simultaneously.' },
      { title: 'Component design', body: 'Built a small but complete design system in Figma: 6 component types, 3 layout patterns, consistent use of space and type.' },
      { title: 'Production build', body: 'Implemented in Django with static delivery for performance. SSR for SEO, JS progressive enhancement for interactions.' }
    ],
    outcomes: [
      { num: '4.9★', label: 'Founder rating' },
      { num: '2×', label: 'Session length' },
      { num: '40%', label: 'Bounce rate drop' }
    ],
    learnings: [
      'Designing for two audiences means designing the information sequence, not two separate pages.',
      'Trust is built in the details: consistent margins, real copy, real numbers.',
      'Django as a frontend delivery layer works well when the design system is tight.'
    ],
    prev: 'nkwel',
    next: 'geoxps'
  },

  geoxps: {
    title: 'GeoXPS',
    year: '2024',
    type: 'Platform Landing',
    category: 'Web',
    color: '#16213e',
    image: 'assets/img/geox.png',
    imageAlt: 'GeoXPS platform landing',
    live: 'https://geoxps.com',
    github: null,
    role: 'Product Design',
    duration: '3 weeks',
    stack: 'Figma · HTML · CSS',
    overview: `GeoXPS is a spatial intelligence platform. The landing page needed to explain a complex technical product to people who don't know they need it yet — which is the hardest kind of communication to get right.`,
    challenge: `Spatial data analytics is inherently visual but hard to show without real data. The design had to communicate capability and sophistication without falling into abstract or confusing diagram territory.`,
    process: [
      { title: 'Problem framing', body: 'Reframed from "what does GeoXPS do?" to "what problem does the audience have?" — then the product story became the solution story.' },
      { title: 'Visual language', body: 'Developed an abstract map-inspired visual motif. Grid-based, precise, hinting at spatial relationships without literal mapping.' },
      { title: 'Section-by-section UX', body: 'Each section serves one job: hook → credibility → capability → use case → CTA. No section does double duty.' },
      { title: 'Responsive precision', body: 'Mobile required a full re-think of the grid-based visuals. Built alternate mobile-first layouts for the hero and capability sections.' }
    ],
    outcomes: [
      { num: '68%', label: 'CTA click rate' },
      { num: '3.2m', label: 'Avg. time on page' },
      { num: '↑22%', label: 'Demo requests' }
    ],
    learnings: [
      'Complex products need simpler landing pages, not more detailed ones.',
      'Showing a concrete "before" scenario sells better than abstract feature lists.',
      'Grid-based visual motifs can carry brand weight even without illustrations.'
    ],
    prev: 'hinkaku',
    next: 'trashtrails'
  },

  trashtrails: {
    title: 'TrashTrails',
    year: '2024',
    type: 'Civic Tech · Gamification',
    category: 'Product',
    color: '#1b4332',
    image: 'assets/img/trashtrails.png',
    imageAlt: 'TrashTrails civic tech app',
    live: 'https://trashtrails.hinkaku.tech',
    github: 'https://github.com/Joel-Fah/TrashTrails',
    role: 'Product Design & Engineering',
    duration: '10 weeks',
    stack: 'Django · HTML · CSS · JS · Maps API',
    overview: `TrashTrails is a gamified platform for community waste reporting and recycling tracking. The core insight: civic engagement tools fail because they feel like obligations. TrashTrails makes reporting waste feel like a game — with streaks, badges, and local leaderboards.`,
    challenge: `Gamification without trivialization. The product had to be playful enough to drive engagement but credible enough that municipalities and NGOs would take it seriously. Both audiences had to see the same product and feel differently — and both feelings had to be right.`,
    process: [
      { title: 'User research', body: 'Interviewed 12 potential users across student, resident, and civic worker segments. Found that shame and inconvenience were the two biggest barriers to reporting.' },
      { title: 'Game mechanics design', body: 'Mapped classic game loop (action → reward → progression → social proof) onto civic reporting. Designed the streak, badge, and leaderboard systems before any UI.' },
      { title: 'Map-first UX', body: 'The map is the core interaction surface. Designed a report flow that takes under 30 seconds: tap location → snap photo → submit. Friction minimized at every step.' },
      { title: 'Full-stack build', body: 'Implemented the full backend in Django, the mapping layer with Leaflet.js, and the frontend in clean HTML/CSS/JS. Real-time updates on reports and leaderboards.' }
    ],
    outcomes: [
      { num: '30s', label: 'Report time avg.' },
      { num: '4.7★', label: 'Beta user rating' },
      { num: '200+', label: 'Reports in beta' }
    ],
    learnings: [
      'Gamification only works if the core action is already valuable — mechanics amplify, they don\'t substitute.',
      'A 30-second report flow required 6 weeks of UX iteration to achieve.',
      'Designing for both end-users and institutional stakeholders requires two separate onboarding journeys.'
    ],
    prev: 'geoxps',
    next: 'clezigov'
  },

  clezigov: {
    title: 'CleziGov',
    year: '2023',
    type: 'Mobile App · Flutter',
    category: 'Mobile',
    color: '#1c2e4a',
    live: null,
    github: 'https://github.com/Joel-Fah/clezigov',
    role: 'Product Design & Flutter Dev',
    duration: '8 weeks',
    stack: 'Flutter · Dart · REST API',
    overview: `CleziGov simplifies access to government services through a mobile app — eliminating the friction of navigating dense, bureaucratic information systems. The goal: make civic processes feel approachable, not intimidating.`,
    challenge: `Government services have inherently complex information architecture — dozens of services, each with different requirements, timelines, and eligibility criteria. The challenge was to design a system that surfaced the right information without overwhelming the user.`,
    process: [
      { title: 'Service mapping', body: 'Catalogued 40+ government services, then clustered by user goal (not department structure). Most users care about the outcome, not the ministry.' },
      { title: 'Progressive disclosure', body: 'Designed a step-by-step requirements flow: what you need, what to bring, where to go, what to expect. Nothing shown until needed.' },
      { title: 'Flutter UI system', body: 'Built a complete Flutter widget library with government-appropriate colors (accessible, neutral) and clear typographic hierarchy.' },
      { title: 'Offline-first', body: 'Most service information doesn\'t change often. Implemented local caching so the app works without connectivity — critical for users in low-signal areas.' }
    ],
    outcomes: [
      { num: '40+', label: 'Services mapped' },
      { num: '↓60%', label: 'Task completion time' },
      { num: '4.6★', label: 'Tester rating' }
    ],
    learnings: [
      'Organizing by user goal (not government structure) was the single highest-impact UX decision.',
      'Progressive disclosure is underused in civic apps — show less, help more.',
      'Offline-first isn\'t optional for apps targeting users in developing regions.'
    ],
    prev: 'trashtrails',
    next: 'bden'
  },

  bden: {
    title: 'BDEN',
    year: '2023',
    type: 'Mobile App · Emergency',
    category: 'Mobile',
    color: '#4a0e0e',
    live: null,
    github: 'https://github.com/Joel-Fah/BDEN',
    role: 'Product Design & Development',
    duration: '6 weeks',
    stack: 'Flutter · Dart · Firebase',
    overview: `BDEN (Blood Donation Emergency Network) connects blood donors with recipients in critical situations. Speed and trust are the two non-negotiables — when someone needs blood, every second counts, and the app must inspire immediate confidence.`,
    challenge: `Designing for high-stakes, high-emotion scenarios. A person requesting blood for a critically ill family member is in a panicked state. The UI had to be extremely simple, fast, and reassuring — even while handling complex location-matching and donor notification logic underneath.`,
    process: [
      { title: 'Emotional UX mapping', body: 'Mapped the emotional state of both user types at each moment: requester (urgent, scared), donor (willing but uncertain). Every screen designed for the specific emotional context.' },
      { title: 'Critical path simplification', body: 'The request flow reduced to 3 taps: blood type → location → send. No account required for emergency requests.' },
      { title: 'Trust signals', body: 'Designed a donor verification system with visible "verified donor" badges. Requesters need to know the person responding is real and eligible.' },
      { title: 'Firebase real-time', body: 'Built on Firebase for real-time donor matching and push notifications. Response time from request to first donor notification: under 2 seconds.' }
    ],
    outcomes: [
      { num: '<2s', label: 'Notification time' },
      { num: '3 taps', label: 'Emergency request' },
      { num: '↑85%', label: 'Donor response rate' }
    ],
    learnings: [
      'High-stakes UX demands radical simplicity — every extra tap has a human cost.',
      'Trust signals (verification badges, real photos) dramatically increase donor response rates.',
      'Designing for emotional extremes produces better UX for normal states too.'
    ],
    prev: 'clezigov',
    next: 'busin'
  },

  busin: {
    title: 'Busin',
    year: '2023',
    type: 'Mobile App · Transport',
    category: 'Mobile',
    color: '#2d2d2d',
    image: 'assets/img/busin.png',
    imageAlt: 'Busin transport management app',
    live: null,
    github: 'https://github.com/Joel-Fah/busin',
    role: 'Product Design & Flutter Dev',
    duration: '7 weeks',
    stack: 'Flutter · Dart · QR · Analytics',
    overview: `Busin is a bus operations management app for African transport operators. It handles driver management, route tracking, QR-based passenger boarding, and a live analytics dashboard — all in a mobile-first tool operators can run from a smartphone.`,
    challenge: `Operators range from tech-savvy company managers to single-bus owners with basic smartphone experience. The app had to work intuitively across this spectrum while managing genuinely complex operational data.`,
    process: [
      { title: 'Operator research', body: 'Spent time understanding the daily workflow: morning dispatch, en-route incidents, fare collection, end-of-day reporting. The app was designed around these real moments.' },
      { title: 'Role-based UX', body: 'Designed three distinct views: operator dashboard (high-level analytics), driver app (simple, one-handed usability), and inspector view (QR scanning focus).' },
      { title: 'QR boarding flow', body: 'The boarding scan flow is the highest-frequency action. Designed for under 1 second: open → scan → confirm. Works offline, syncs later.' },
      { title: 'Analytics dashboard', body: 'Designed a mobile analytics dashboard that surfaces the 5 metrics operators actually care about: revenue, headcount, on-time %, fuel, incidents.' }
    ],
    outcomes: [
      { num: '<1s', label: 'Boarding scan time' },
      { num: '3 views', label: 'Role-based UX' },
      { num: '↓40%', label: 'Manual reporting time' }
    ],
    learnings: [
      'Role-based UX is not about feature-gating — it\'s about surface simplification for each context.',
      'Offline-first sync was critical: transport runs where internet is unreliable.',
      'Analytics on mobile must surface fewer, more meaningful metrics than desktop equivalents.'
    ],
    prev: 'bden',
    next: 'shopnest'
  },

  shopnest: {
    title: 'ShopNest',
    year: '2022',
    type: 'Web App · Django',
    category: 'Web',
    color: '#1a2a1a',
    live: null,
    github: 'https://github.com/Joel-Fah/shopnest',
    role: 'Full-Stack Design & Dev',
    duration: '5 weeks',
    stack: 'Django · PostgreSQL · Docker · HTML/CSS',
    overview: `ShopNest is a full-stack e-commerce web application built with Django and containerized with Docker. It includes product management, a shopping cart, a streamlined checkout flow, and an admin dashboard for store owners.`,
    challenge: `Building a production-grade e-commerce system end-to-end while keeping the codebase clean, the UX intuitive, and the deployment reliable. The Docker containerization requirement added a layer of infrastructure design alongside the product design.`,
    process: [
      { title: 'Database schema design', body: 'Modeled the product, cart, order, and user relationships before writing any code. A clean schema prevents messy UI edge cases later.' },
      { title: 'Checkout UX', body: 'Reduced the checkout to 3 steps: cart review → shipping → payment. Persistent summary sidebar so users never lose context mid-flow.' },
      { title: 'Admin dashboard', body: 'Designed the store owner dashboard for non-technical users: clear inventory overview, order management, and basic analytics in plain language.' },
      { title: 'Docker deployment', body: 'Configured Docker Compose for local dev parity with production. PostgreSQL + Django + Nginx in separate containers with shared volumes.' }
    ],
    outcomes: [
      { num: '3 steps', label: 'Checkout flow' },
      { num: '100%', label: 'Docker containerized' },
      { num: '<200ms', label: 'Avg. page response' }
    ],
    learnings: [
      'E-commerce UX lives or dies in the checkout flow — every extra field costs conversions.',
      'Docker dev/prod parity eliminates a class of "works on my machine" bugs entirely.',
      'Admin UX for non-developers requires speaking outcomes, not data.'
    ],
    prev: 'busin',
    next: null
  }
};

function getSlug() {
  return new URLSearchParams(window.location.search).get('project') || 'trashtrails';
}

function buildTag(text, variant = '') {
  return `<span class="detail-tag${variant ? ' detail-tag--' + variant : ''}">${text}</span>`;
}

function buildAside(project) {
  const links = [
    project.live ? `<a href="${project.live}" target="_blank" rel="noopener" class="aside-link aside-link--primary"><i class="bi bi-arrow-up-right"></i> View Live Site</a>` : '',
    project.github ? `<a href="${project.github}" target="_blank" rel="noopener" class="aside-link"><i class="bi bi-github"></i> Source on GitHub</a>` : '',
    `<a href="index.html#contact" class="aside-link"><i class="bi bi-chat-square-dots"></i> Discuss this project</a>`
  ].filter(Boolean).join('');

  return `
    <div class="detail-aside-inner">
      <div class="aside-card">
        <h3>Project info</h3>
        <div class="aside-meta">
          <div class="aside-row"><span>Year</span><span>${project.year}</span></div>
          <div class="aside-row"><span>Type</span><span>${project.type}</span></div>
          <div class="aside-row"><span>My role</span><span>${project.role}</span></div>
          <div class="aside-row"><span>Timeline</span><span>${project.duration}</span></div>
          <div class="aside-row"><span>Stack</span><span>${project.stack}</span></div>
        </div>
      </div>
      <div class="aside-card">
        <h3>Links</h3>
        <div class="aside-links">${links}</div>
      </div>
    </div>
  `;
}

function buildMain(project) {
  const processItems = project.process.map(p => `
    <div class="process-item reveal-item">
      <div class="pi-num">${String(project.process.indexOf(p) + 1).padStart(2, '0')}</div>
      <div class="pi-content"><h4>${p.title}</h4><p>${p.body}</p></div>
    </div>
  `).join('');

  const outcomes = project.outcomes.map(o => `
    <div class="outcome-cell reveal-item">
      <span class="outcome-num">${o.num}</span>
      <span class="outcome-label">${o.label}</span>
    </div>
  `).join('');

  const learnings = project.learnings.map(l => `
    <div class="learning-item reveal-item">
      <div class="li-dot"></div>
      <p>${l}</p>
    </div>
  `).join('');

  const imageBlock = project.image
    ? `<div class="detail-img-block reveal-item"><img src="${project.image}" alt="${project.imageAlt || project.title}" loading="lazy"></div>`
    : `<div class="detail-img-block reveal-item">
        <div class="detail-img-inner" style="background:${project.color};">
          <span style="font-family:'DM Serif Display',Georgia,serif;font-size:80px;font-style:italic;color:rgba(255,255,255,0.1);user-select:none;">${project.title}</span>
        </div>
      </div>`;

  return `
    <div class="detail-section reveal-item">
      <h2>Overview</h2>
      <p>${project.overview}</p>
    </div>

    ${imageBlock}

    <div class="detail-section reveal-item">
      <h2>The Challenge</h2>
      <p>${project.challenge}</p>
    </div>

    <div class="detail-section">
      <h2 class="reveal-item">Process</h2>
      <div class="process-list">${processItems}</div>
    </div>

    <div class="detail-section">
      <h2 class="reveal-item">Outcomes</h2>
      <div class="outcome-grid">${outcomes}</div>
    </div>

    <div class="detail-section">
      <h2 class="reveal-item">What I learned</h2>
      <div class="learnings-list">${learnings}</div>
    </div>
  `;
}

function buildProjectNav(project) {
  const prevProj = project.prev ? PROJECTS[project.prev] : null;
  const nextProj = project.next ? PROJECTS[project.next] : null;

  const prevHtml = prevProj
    ? `<a href="portfolio-details.html?project=${project.prev}" class="pn-card pn-card--prev">
        <span class="pn-label"><i class="bi bi-arrow-left"></i> Previous</span>
        <span class="pn-title">${prevProj.title}</span>
       </a>`
    : `<div></div>`;

  const nextHtml = nextProj
    ? `<a href="portfolio-details.html?project=${project.next}" class="pn-card pn-card--next">
        <span class="pn-label">Next <i class="bi bi-arrow-right"></i></span>
        <span class="pn-title">${nextProj.title}</span>
       </a>`
    : `<div></div>`;

  return prevHtml + nextHtml;
}

function render() {
  const slug = getSlug();
  const project = PROJECTS[slug];
  if (!project) {
    document.title = 'Project Not Found — Joël Fah';
    return;
  }

  document.title = `${project.title} — Joël Fah`;

  // Hero
  const heroBg = document.getElementById('detail-hero-bg');
  if (heroBg) heroBg.style.cssText = `background:${project.color};width:100%;height:100%;`;

  const titleEl = document.getElementById('detail-title');
  if (titleEl) titleEl.textContent = project.title;

  const bcEl = document.getElementById('bc-project');
  if (bcEl) bcEl.textContent = project.title;

  const metaEl = document.getElementById('detail-meta');
  if (metaEl) metaEl.innerHTML = buildTag(project.year) + buildTag(project.type) + buildTag(project.category);

  // Main content
  const mainEl = document.getElementById('detail-main');
  if (mainEl) mainEl.innerHTML = buildMain(project);

  // Aside
  const asideEl = document.getElementById('detail-aside');
  if (asideEl) asideEl.innerHTML = buildAside(project);

  // Project nav
  const navEl = document.getElementById('project-nav');
  if (navEl) navEl.innerHTML = buildProjectNav(project);

  // Trigger reveals for newly injected content
  requestAnimationFrame(() => {
    if (window._revealObserver) {
      document.querySelectorAll('.reveal-item:not(.visible)').forEach(el => {
        window._revealObserver.observe(el);
      });
    }
  });
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', render);
