/**
 * service-details.js
 * Reads ?service=slug, renders the full service detail page dynamically.
 */
'use strict';

const SERVICES = {
  'product-design': {
    num: '01',
    icon: 'bi-layers',
    title: 'Product Design',
    tagline: 'From messy problem to precise, shippable solution.',
    description: `End-to-end product design: understanding the problem, structuring the flows, and crafting high-fidelity UI that development teams can build from directly. Not just beautiful screens — design that's grounded in user behavior and business constraints.`,
    includes: [
      { icon: 'bi-search', title: 'UX Research', desc: 'User interviews, competitive audits, and usability testing to surface what really matters.' },
      { icon: 'bi-diagram-3', title: 'User Flows & IA', desc: 'Information architecture and user journey mapping before any visual design begins.' },
      { icon: 'bi-vector-pen', title: 'Wireframing', desc: 'Low-fidelity layouts that validate structure and sequence without visual noise.' },
      { icon: 'bi-display', title: 'High-Fidelity UI', desc: 'Pixel-precise Figma designs with real copy, real states, and full responsive variants.' },
      { icon: 'bi-cursor-fill', title: 'Interaction Design', desc: 'Microinteractions, transitions, and motion that make the product feel alive and intentional.' },
      { icon: 'bi-universal-access', title: 'Accessibility', desc: 'WCAG-aligned contrast, keyboard navigation, semantic structure — baked in, not bolted on.' }
    ],
    engagement: [
      { title: 'Discovery call', desc: 'We talk through the product, the users, and what you\'re trying to achieve. I ask a lot of questions. This is where the real brief emerges.' },
      { title: 'Proposal & scope', desc: 'I send a clear scope document: deliverables, timeline, and what I need from you. No surprise additions mid-engagement.' },
      { title: 'Research & exploration', desc: 'I work through the problem space — competitive review, user flows, initial wireframe concepts. We align before I move to high-fidelity.' },
      { title: 'Design iterations', desc: 'High-fidelity designs, async reviews, and up to two rounds of revisions based on your feedback.' },
      { title: 'Handoff', desc: 'Figma file organized for developers — components named, specs annotated, interactions prototyped, assets exported.' }
    ],
    cta: 'Start with a design brief',
    others: [
      { slug: 'frontend', icon: 'bi-code-slash', title: 'Frontend Implementation', desc: 'Design → production code' },
      { slug: 'design-systems', icon: 'bi-grid-3x3-gap', title: 'Design Systems', desc: 'Scalable component libraries' },
      { slug: 'ux-audit', icon: 'bi-eye', title: 'UX Audits', desc: 'Fast, actionable feedback' }
    ]
  },

  'frontend': {
    num: '02',
    icon: 'bi-code-slash',
    title: 'Frontend Implementation',
    tagline: 'The code that makes design real.',
    description: `I build the frontend layer between your design file and a working product. Clean HTML, CSS, and JavaScript — responsive, performant, and true to the design intent. I care about the 20% of implementation details that make the experience feel premium.`,
    includes: [
      { icon: 'bi-filetype-html', title: 'Semantic HTML', desc: 'Structure that\'s accessible, SEO-friendly, and easy to maintain — not div soup.' },
      { icon: 'bi-palette', title: 'CSS & Design Tokens', desc: 'Custom properties, responsive layouts, and animation that matches the design spec.' },
      { icon: 'bi-lightning-charge', title: 'Vanilla JavaScript', desc: 'Interaction logic, scroll behavior, and dynamic content — without framework overhead.' },
      { icon: 'bi-bootstrap', title: 'Bootstrap', desc: 'Rapid, consistent layouts using Bootstrap\'s grid and utilities, customized to fit the design system.' },
      { icon: 'bi-phone', title: 'Responsive Engineering', desc: 'Every layout tested at 320px, 768px, and 1440px. Mobile isn\'t an afterthought.' },
      { icon: 'bi-speedometer', title: 'Performance', desc: 'Optimized assets, lazy loading, minimal JS, and <100ms interaction targets.' }
    ],
    engagement: [
      { title: 'Design file review', desc: 'I audit the Figma file (or whatever you\'re working from) for completeness — missing states, unclear breakpoints, undefined interactions.' },
      { title: 'Scope & tech alignment', desc: 'We agree on the tech stack, hosting, and any backend constraints. I build for what\'s real, not ideal.' },
      { title: 'Component-first build', desc: 'I start with the smallest reusable units and build up — buttons, inputs, cards — before assembling pages.' },
      { title: 'Review & QA', desc: 'I share a staging URL for your review. I test across browsers and devices before calling anything done.' },
      { title: 'Delivery & documentation', desc: 'Clean, commented code with a brief implementation guide. You own it, you can maintain it.' }
    ],
    cta: 'Send me your Figma file',
    others: [
      { slug: 'product-design', icon: 'bi-layers', title: 'Product Design', desc: 'End-to-end UX design' },
      { slug: 'design-systems', icon: 'bi-grid-3x3-gap', title: 'Design Systems', desc: 'Scalable component libraries' },
      { slug: 'ux-audit', icon: 'bi-eye', title: 'UX Audits', desc: 'Fast, actionable feedback' }
    ]
  },

  'design-systems': {
    num: '03',
    icon: 'bi-grid-3x3-gap',
    title: 'Design Systems',
    tagline: 'Build once. Scale everywhere.',
    description: `A design system is the foundation that makes a product consistent, scalable, and fast to build. I design and document component libraries in Figma — with variants, auto-layout, design tokens, and developer-ready documentation that teams actually use.`,
    includes: [
      { icon: 'bi-bezier2', title: 'Figma Component Library', desc: 'Atomic components with variants, auto-layout, and clear naming conventions your team can navigate.' },
      { icon: 'bi-palette2', title: 'Design Tokens', desc: 'Color, spacing, typography, and radius tokens defined once and propagated everywhere — Figma and code.' },
      { icon: 'bi-card-text', title: 'Typography System', desc: 'A complete type scale with defined use cases: display, heading, body, caption, label. Nothing ad-hoc.' },
      { icon: 'bi-collection', title: 'Pattern Library', desc: 'Reusable UI patterns (forms, tables, modals, empty states) that solve recurring problems consistently.' },
      { icon: 'bi-file-earmark-text', title: 'Documentation', desc: 'Usage guidelines, do/don\'t examples, and variant explanations — in the Figma file and as a handoff doc.' },
      { icon: 'bi-arrow-repeat', title: 'Maintenance plan', desc: 'How to add new components, how to deprecate old ones, and how to keep the system alive as the product grows.' }
    ],
    engagement: [
      { title: 'Audit', desc: 'I review your existing product or design files to inventory what\'s already there — components, colors, patterns — before defining what needs to be built.' },
      { title: 'Token definition', desc: 'We establish the design token foundation: semantic color names, spacing scale, type ramp. This is the system\'s DNA.' },
      { title: 'Component build', desc: 'I build components in order of frequency: most-used first. Each component is fully specced with all states and variants.' },
      { title: 'Documentation', desc: 'Every component gets a usage guide with examples, do/don\'ts, and accessibility notes.' },
      { title: 'Handoff & training', desc: 'A Figma walkthrough with your team to show how to use, extend, and contribute to the system.' }
    ],
    cta: 'Let\'s audit your product first',
    others: [
      { slug: 'product-design', icon: 'bi-layers', title: 'Product Design', desc: 'End-to-end UX design' },
      { slug: 'frontend', icon: 'bi-code-slash', title: 'Frontend Implementation', desc: 'Design → production code' },
      { slug: 'ux-audit', icon: 'bi-eye', title: 'UX Audits', desc: 'Fast, actionable feedback' }
    ]
  },

  'ux-audit': {
    num: '04',
    icon: 'bi-eye',
    title: 'UX Audits',
    tagline: 'Honest, prioritized, actionable.',
    description: `A UX audit is a structured review of your existing product — identifying friction points, accessibility gaps, and UX anti-patterns, then prioritizing them by user impact. You get a clear, ranked list of what to fix first, with explanation and suggested direction.`,
    includes: [
      { icon: 'bi-map', title: 'User flow analysis', desc: 'Walk through the critical paths in your product as a first-time user. Where does clarity break down?' },
      { icon: 'bi-universal-access', title: 'Accessibility review', desc: 'Color contrast, keyboard navigation, focus states, ARIA landmarks — tested against WCAG 2.1 AA.' },
      { icon: 'bi-phone', title: 'Mobile UX check', desc: 'Tap target sizes, scroll behavior, mobile navigation, and responsive layout issues.' },
      { icon: 'bi-hourglass-split', title: 'Performance perception', desc: 'Loading states, skeleton screens, optimistic updates — how fast does the product *feel*, not just load?' },
      { icon: 'bi-list-check', title: 'Prioritized findings', desc: 'Every issue ranked by severity and estimated fix effort — quick wins separated from larger investments.' },
      { icon: 'bi-lightbulb', title: 'Recommendations', desc: 'Not just "this is broken" — direction on how to fix it, with references to patterns that work.' }
    ],
    engagement: [
      { title: 'Scope definition', desc: 'We agree on which flows and screens to audit. Full product, onboarding only, checkout — scoped to what matters most for you right now.' },
      { title: 'Independent walkthrough', desc: 'I use the product without briefing, as a fresh user. The first impression is data.' },
      { title: 'Structured review', desc: 'I systematically evaluate each screen against heuristics, accessibility standards, and UX principles.' },
      { title: 'Audit report', desc: 'A clear Figma or Notion document: annotated screenshots, findings ranked by impact, and a recommended action order.' },
      { title: 'Review call', desc: 'A 60-minute walkthrough of the findings where you can ask questions and we can discuss tradeoffs and priorities.' }
    ],
    cta: 'Book an audit',
    others: [
      { slug: 'product-design', icon: 'bi-layers', title: 'Product Design', desc: 'End-to-end UX design' },
      { slug: 'frontend', icon: 'bi-code-slash', title: 'Frontend Implementation', desc: 'Design → production code' },
      { slug: 'design-systems', icon: 'bi-grid-3x3-gap', title: 'Design Systems', desc: 'Scalable component libraries' }
    ]
  }
};

function getSlug() {
  return new URLSearchParams(window.location.search).get('service') || 'product-design';
}

function render() {
  const slug = getSlug();
  const svc = SERVICES[slug];
  if (!svc) return;

  document.title = `${svc.title} — Joël Fah`;

  const includesHTML = svc.includes.map(inc => `
    <div class="include-card reveal-item">
      <i class="bi ${inc.icon} include-icon"></i>
      <h4>${inc.title}</h4>
      <p>${inc.desc}</p>
    </div>
  `).join('');

  const engagementHTML = svc.engagement.map((step, i) => `
    <div class="es-item reveal-item">
      <div class="es-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="es-content"><h4>${step.title}</h4><p>${step.desc}</p></div>
    </div>
  `).join('');

  const othersHTML = svc.others.map(o => `
    <a href="service-details.html?service=${o.slug}" class="os-card reveal-item">
      <i class="bi ${o.icon} os-icon"></i>
      <h4>${o.title}</h4>
      <span>${o.desc}</span>
    </a>
  `).join('');

  const html = `
    <!-- Hero -->
    <div class="service-detail-hero">
      <div class="container">
        <div class="detail-breadcrumb" style="color:rgba(255,255,255,0.5);margin-bottom:24px;">
          <a href="index.html" style="color:rgba(255,255,255,0.5)">Home</a>
          <i class="bi bi-chevron-right" style="font-size:11px"></i>
          <a href="index.html#services" style="color:rgba(255,255,255,0.5)">Services</a>
          <i class="bi bi-chevron-right" style="font-size:11px"></i>
          <span style="color:rgba(255,255,255,0.8)">${svc.title}</span>
        </div>
        <div class="section-eyebrow" style="color:rgba(255,255,255,0.45)">Service ${svc.num}</div>
        <h1>${svc.tagline}</h1>
        <p>${svc.description}</p>
      </div>
    </div>

    <!-- What's included -->
    <section class="detail-body section">
      <div class="container">
        <div class="section-eyebrow reveal-item">What's included</div>
        <h2 class="section-heading reveal-item">${svc.title}</h2>
        <div class="includes-grid">${includesHTML}</div>
      </div>
    </section>

    <!-- How it works -->
    <section class="section light-bg" style="padding:80px 0;">
      <div class="container">
        <div class="section-eyebrow reveal-item">How it works</div>
        <h2 class="section-heading reveal-item">The engagement</h2>
        <div class="engagement-steps">${engagementHTML}</div>
      </div>
    </section>

    <!-- Other services -->
    <section class="section" style="padding:80px 0;">
      <div class="container">
        <div class="section-eyebrow reveal-item">Also available</div>
        <h2 class="section-heading reveal-item">Other services</h2>
        <div class="other-services">${othersHTML}</div>
      </div>
    </section>

    <!-- CTA strip -->
    <div class="container" style="padding-bottom:80px;">
      <div class="service-cta-strip reveal-item">
        <h2>Ready to start?</h2>
        <p>Tell me about your project and what you're trying to achieve. I'll respond within 24–48 hours.</p>
        <a href="index.html#contact" class="btn-primary-hero">${svc.cta} <i class="bi bi-arrow-right"></i></a>
      </div>
    </div>
  `;

  const root = document.getElementById('service-root');
  if (root) {
    root.innerHTML = html;
    // Trigger reveals for injected content
    requestAnimationFrame(() => {
      if (window._revealObserver) {
        document.querySelectorAll('.reveal-item:not(.visible)').forEach(el => {
          window._revealObserver.observe(el);
        });
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', render);
