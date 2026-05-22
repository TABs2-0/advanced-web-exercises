/**
 * This is a minimal config.
 *
 * If you need the full config, get it from here:
 * https://unpkg.com/browse/tailwindcss@latest/stubs/defaultConfig.stub.js
 */

module.exports = {
    content: [
        /**
         * HTML. Paths to Django template files that will contain Tailwind CSS classes.
         */

        /*  Templates within theme app (<tailwind_app_name>/templates), e.g. base.html. */
        '../templates/**/*.html',

        /*
         * Main templates directory of the project (BASE_DIR/templates).
         * Adjust the following line to match your project structure.
         */
        '../../templates/**/*.html',

        /*
         * Templates in other django apps (BASE_DIR/<any_app_name>/templates).
         * Adjust the following line to match your project structure.
         */
        '../../apps/**/templates/**/*.html',

        /**
         * Python files. Paths to Django form files that will contain Tailwind CSS classes.
         */
        '../../apps/**/forms.py',

        /**
         * JS: If you use Tailwind CSS in JavaScript, uncomment the following lines and make sure
         * patterns match your project structure.
         */
        /* JS 1: Ignore any JavaScript in node_modules folder. */
        // '!../../**/node_modules',
        /* JS 2: Process all JavaScript files in the project. */
        // '../../**/*.js',

        /**
         * Python: If you use Tailwind CSS classes in Python, uncomment the following line
         * and make sure the pattern below matches your project structure.
         */
        // '../../**/*.py'
    ],
    theme: {
        extend: {
            // ── Mastercard Design System color palette ──────────────────────────
            colors: {
                // Surfaces
                canvas: "#F3F0EE",   // warm putty — the page background
                lifted: "#FCFBFA",   // one step lighter, nested sections
                bone: "#F4F4F4",   // cool-gray alternate surface

                // Ink
                ink: "#141413",   // warm near-black — primary text & CTA bg
                charcoal: "#262627",
                slate: "#696969",   // muted secondary text
                granite: "#555555",
                graphite: "#565656",
                dust: "#D1CDC7",   // whisper / disabled

                // Signal / accent
                signal: "#CF4500",   // burnt orange — consent / accent only
                "signal-light": "#F37338",   // orbital arcs, active indicators
                clay: "#9A3A0A",   // deep rust, secondary links

                // Links
                link: "#3860BE",

                // Mastercard brand (logo only — not UI colors)
                "mc-red": "#EB001B",
                "mc-yellow": "#F79E1B",
            },

            // ── Typography ───────────────────────────────────────────────────────
            fontFamily: {
                sans: ["'Sofia Sans'", "Arial", "sans-serif"],   // MarkForMC substitute
            },
            fontSize: {
                "hero": ["64px", {lineHeight: "64px", letterSpacing: "-1.28px"}],
                "section": ["36px", {lineHeight: "44px", letterSpacing: "-0.72px"}],
                "card-title": ["24px", {lineHeight: "28.8px", letterSpacing: "-0.48px"}],
                "eyebrow": ["14px", {lineHeight: "14px", letterSpacing: "0.56px"}],
                "body": ["16px", {lineHeight: "22.4px"}],
                "btn": ["16px", {lineHeight: "16px", letterSpacing: "-0.48px"}],
                "footer-link": ["14px", {lineHeight: "20px"}],
                "footer-header": ["12px", {lineHeight: "14px", letterSpacing: "0.56px"}],
            },
            fontWeight: {
                body: "450",   // custom half-weight — the Mastercard signature
            },

            // ── Border radius scale ───────────────────────────────────────────────
            // Only three zones: tiny | medium-large | full-pill (no 8-16 middle)
            borderRadius: {
                "none": "0",
                "sm": "3px",          // tiny decorative chips
                "btn": "16px",        // primary & secondary CTA buttons
                "consent": "18px",    // consent / signal pill buttons
                "hero": "26px",       // squircle cards and media frames
                "full": "999px",      // nav pill, carousel cards, dropdowns
                "circle": "50%",      // portraits, icon buttons
            },

            // ── Spacing (8px base) ────────────────────────────────────────────────
            spacing: {
                "4.5": "18px",
                "18": "72px",
                "22": "88px",
                "26": "104px",
                "30": "120px",
            },

            // ── Box shadows ───────────────────────────────────────────────────────
            boxShadow: {
                "nav": "0px 4px 24px 0px rgba(0,0,0,0.04)",
                "card": "0px 24px 48px 0px rgba(0,0,0,0.08)",
                "hero": "0px 24px 48px 0px rgba(0,0,0,0.08)",
                "dramatic": "0px 70px 110px 0px rgba(0,0,0,0.25)",
                "none": "none",
            },

            // ── Animations ────────────────────────────────────────────────────────
            animation: {
                "fade-in": "fadeIn 0.3s ease-out",
                "slide-up": "slideUp 0.4s ease-out",
                "pulse-pin": "pulsePin 1.5s ease-in-out infinite",
                "spin-slow": "spin 3s linear infinite",
                "bounce-in": "bounceIn 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)",
                "scale-in":  "scaleIn 0.2s ease-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": {opacity: "0"},
                    "100%": {opacity: "1"},
                },
                slideUp: {
                    "0%": {opacity: "0", transform: "translateY(16px)"},
                    "100%": {opacity: "1", transform: "translateY(0)"},
                },
                pulsePin: {
                    "0%, 100%": {transform: "scale(1)", opacity: "1"},
                    "50%": {transform: "scale(1.25)", opacity: "0.7"},
                },
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

            // ── Max width ─────────────────────────────────────────────────────────
            maxWidth: {
                "content": "1280px",
            },
        },
    },
    plugins: [
        /**
         * '@tailwindcss/forms' is the forms plugin that provides a minimal styling
         * for forms. If you don't like it or have own styling for forms,
         * comment the line below to disable '@tailwindcss/forms'.
         */
        require('@tailwindcss/forms')({ strategy: 'class' }),
        require('@tailwindcss/typography'),
        require('@tailwindcss/aspect-ratio'),
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
}
