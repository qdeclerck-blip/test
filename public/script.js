/* ===========================
   Maison Yvoir — Frontend JS
   Dynamic content loading + animations
   =========================== */

(function () {
    'use strict';

    // --- SVG icon map for services ---
    var serviceIcons = {
        breakfast: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M24 4v16M16 12h16M8 24h32v4c0 8.837-7.163 16-16 16S8 36.837 8 28v-4z"/></svg>',
        key: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="14" width="36" height="28" rx="2"/><path d="M16 14V8a8 8 0 0116 0v6"/><circle cx="24" cy="28" r="4"/></svg>',
        house: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 40h40M8 40V20l16-12 16 12v20"/><rect x="18" y="28" width="12" height="12"/></svg>',
        clock: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="24" cy="24" r="20"/><path d="M24 12v12l8 8"/></svg>',
        wifi: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 24c0-11.046 8.954-20 20-20s20 8.954 20 20"/><path d="M12 24a12 12 0 0124 0"/><circle cx="24" cy="24" r="4"/><path d="M24 28v16"/></svg>',
        star: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M24 4l6 12 12 2-8 8 2 12-12-6-12 6 2-12-8-8 12-2z"/></svg>'
    };

    var seasonIcons = [
        '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M24 8c-2 4-8 8-8 14a8 8 0 0016 0c0-6-6-10-8-14z"/><path d="M24 28v8M20 32h8"/></svg>',
        '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="24" cy="24" r="8"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.86 9.86l4.24 4.24M33.9 33.9l4.24 4.24M9.86 38.14l4.24-4.24M33.9 14.1l4.24-4.24"/></svg>',
        '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 8c0 8 6 12 8 20h8c2-8 8-12 8-20"/><path d="M18 36h12M20 42h8"/></svg>',
        '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M24 4v4M24 40v4M4 24h4M40 24h4M10 10l3 3M35 35l3 3M10 38l3-3M35 13l3-3"/><circle cx="24" cy="24" r="8" stroke-dasharray="4 4"/></svg>'
    ];

    var roomGradients = [
        'linear-gradient(135deg, #3a3a3a 0%, #5a5a5a 100%)',
        'linear-gradient(135deg, #4a4035 0%, #6b5d50 100%)',
        'linear-gradient(135deg, #2d3a35 0%, #4a5d55 100%)',
        'linear-gradient(135deg, #35303a 0%, #554d5d 100%)'
    ];

    var cardGradients = [
        'linear-gradient(135deg, #3d4a3a 0%, #5d7055 100%)',
        'linear-gradient(135deg, #4a3d2a 0%, #70603a 100%)',
        'linear-gradient(135deg, #2a3d4a 0%, #3a5a70 100%)',
        'linear-gradient(135deg, #3a2d3d 0%, #5a4560 100%)',
        'linear-gradient(135deg, #4a4a3a 0%, #6a6a50 100%)',
        'linear-gradient(135deg, #3a4a40 0%, #506a58 100%)'
    ];

    var galleryGradients = [
        'linear-gradient(135deg, #3a4a3a 0%, #6a7a6a 100%)',
        'linear-gradient(135deg, #5a4a3a 0%, #8a7a6a 100%)',
        'linear-gradient(135deg, #3a3a4a 0%, #6a6a7a 100%)',
        'linear-gradient(135deg, #4a3a3a 0%, #7a6a6a 100%)',
        'linear-gradient(135deg, #2a3a4a 0%, #5a6a7a 100%)',
        'linear-gradient(135deg, #3a4a4a 0%, #6a7a7a 100%)',
        'linear-gradient(135deg, #4a4a3a 0%, #7a7a6a 100%)'
    ];

    function esc(s) {
        var div = document.createElement('div');
        div.textContent = s || '';
        return div.innerHTML;
    }

    // --- Load and render content from API ---
    function loadContent() {
        fetch('/api/content')
            .then(function (r) { return r.json(); })
            .then(function (data) { renderContent(data); })
            .catch(function () { /* content.json fallback: static HTML remains */ });
    }

    function renderContent(c) {
        // Hero
        setText('heroLabel', c.hero.label);
        setText('heroLine1', c.hero.title_line1);
        setText('heroLine2', c.hero.title_line2);
        setText('heroSubtitle', c.hero.subtitle);

        // Concept
        setText('conceptLabel', c.concept.label);
        setHTML('conceptTitle', c.concept.title);
        var pHTML = '';
        (c.concept.paragraphs || []).forEach(function (p) {
            pHTML += '<p class="concept-description">' + esc(p) + '</p>';
        });
        setHTML('conceptParagraphs', pHTML);
        setText('conceptCaption1', c.concept.image1_caption);
        setText('conceptCaption2', c.concept.image2_caption);

        // Stats
        var statsHTML = '';
        (c.stats || []).forEach(function (s) {
            statsHTML += '<div class="stat">' +
                '<span class="stat-number" data-target="' + s.value + '">0</span>' +
                '<span class="stat-unit">' + esc(s.unit) + '</span>' +
                '<span class="stat-label">' + esc(s.label) + '</span></div>';
        });
        setHTML('statsGrid', statsHTML);

        // Maison
        setText('maisonLabel', c.maison.label);
        setHTML('maisonTitle', c.maison.title);
        setText('maisonIntro', c.maison.intro);
        var roomsHTML = '';
        (c.maison.rooms || []).forEach(function (r, i) {
            roomsHTML += '<div class="room"><div class="room-image" style="background:' + roomGradients[i % roomGradients.length] + '">' +
                '<div class="room-overlay"><h3>' + esc(r.name) + '</h3><p>' + esc(r.description) + '</p></div></div></div>';
        });
        setHTML('maisonRooms', roomsHTML);

        // Services
        setText('servicesLabel', c.services.label);
        setHTML('servicesTitle', c.services.title);
        var svcHTML = '';
        (c.services.items || []).forEach(function (s) {
            var icon = serviceIcons[s.icon] || serviceIcons.star;
            svcHTML += '<div class="service"><div class="service-icon">' + icon + '</div>' +
                '<h3 class="service-title">' + esc(s.title) + '</h3>' +
                '<p class="service-desc">' + esc(s.description) + '</p></div>';
        });
        setHTML('servicesGrid', svcHTML);

        // Decouvrir
        setText('decouvrirLabel', c.decouvrir.label);
        setHTML('decouvrirTitle', c.decouvrir.title);
        setText('decouvrirIntro', c.decouvrir.intro);
        var decHTML = '';
        (c.decouvrir.cards || []).forEach(function (d, i) {
            decHTML += '<div class="decouvrir-card"><div class="decouvrir-card-image" style="background:' + cardGradients[i % cardGradients.length] + '">' +
                '<div class="decouvrir-card-number">' + esc(d.number) + '</div></div>' +
                '<div class="decouvrir-card-content"><h3>' + esc(d.title) + '</h3><p>' + esc(d.description) + '</p></div></div>';
        });
        setHTML('decouvrirGrid', decHTML);

        // Gallery
        setText('galleryLabel', c.gallery.label);
        setHTML('galleryTitle', c.gallery.title);
        var galHTML = '';
        (c.gallery.items || []).forEach(function (g, i) {
            var cls = g.wide ? 'gallery-item gallery-item-wide' : 'gallery-item';
            galHTML += '<div class="' + cls + '" style="background:' + galleryGradients[i % galleryGradients.length] + '">' +
                '<span class="gallery-caption">' + esc(g.caption) + '</span></div>';
        });
        setHTML('galleryGrid', galHTML);

        // Quote
        var el = document.getElementById('quoteText');
        if (el) el.innerHTML = '&laquo; ' + esc(c.quote) + ' &raquo;';

        // Seasons
        setText('seasonsLabel', c.seasons.label);
        setHTML('seasonsTitle', c.seasons.title);
        var seaHTML = '';
        (c.seasons.items || []).forEach(function (s, i) {
            seaHTML += '<div class="season"><div class="season-icon">' + seasonIcons[i % seasonIcons.length] + '</div>' +
                '<h3>' + esc(s.name) + '</h3><p>' + esc(s.description) + '</p></div>';
        });
        setHTML('seasonsGrid', seaHTML);

        // Contact
        setText('contactLabel', c.contact.label);
        setHTML('contactTitle', c.contact.title);
        setText('contactDescription', c.contact.description);
        setText('contactEmail', c.contact.email);
        setText('contactPhone', c.contact.phone);
        setText('contactAddress', c.contact.address);

        // Footer
        setText('footerTagline', c.footer.tagline);

        // Re-init animations after content is rendered
        setupRevealAnimations();
        animateCounters();
    }

    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text || '';
    }
    function setHTML(id, html) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = html || '';
    }

    // --- Loader ---
    var loader = document.getElementById('loader');
    window.addEventListener('load', function () {
        setTimeout(function () { loader.classList.add('hidden'); }, 2200);
    });

    // --- Navigation scroll ---
    var nav = document.getElementById('nav');
    window.addEventListener('scroll', function () {
        if (window.scrollY > 80) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    }, { passive: true });

    // --- Mobile menu ---
    var navToggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');
    navToggle.addEventListener('click', function () {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // --- Smooth scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                var top = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 20;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    // --- Reveal on scroll ---
    function setupRevealAnimations() {
        var selectors = [
            '.section-label', '.section-title', '.concept-description', '.concept-visual',
            '.maison-intro', '.service', '.decouvrir-card', '.gallery-item',
            '.season', '.contact-info', '.contact-form-wrapper', '.quote'
        ];
        selectors.forEach(function (sel) {
            document.querySelectorAll(sel).forEach(function (el) {
                if (!el.classList.contains('reveal')) el.classList.add('reveal');
            });
        });
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var parent = entry.target.parentElement;
                    var siblings = Array.from(parent.children).filter(function (c) { return c.classList.contains('reveal'); });
                    var delay = siblings.indexOf(entry.target) * 100;
                    setTimeout(function () { entry.target.classList.add('visible'); }, delay);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
        document.querySelectorAll('.reveal').forEach(function (el) { observer.observe(el); });
    }

    // --- Counter animation ---
    function animateCounters() {
        var counters = document.querySelectorAll('.stat-number');
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var target = parseInt(el.getAttribute('data-target'), 10);
                    var startTime = null;
                    function step(ts) {
                        if (!startTime) startTime = ts;
                        var p = Math.min((ts - startTime) / 2000, 1);
                        var val = Math.floor((1 - Math.pow(1 - p, 4)) * target);
                        el.textContent = val.toLocaleString('fr-FR');
                        if (p < 1) requestAnimationFrame(step);
                        else el.textContent = target.toLocaleString('fr-FR');
                    }
                    requestAnimationFrame(step);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(function (c) { observer.observe(c); });
    }

    // --- Parallax ---
    (function () {
        var heroBg = document.querySelector('.hero-bg');
        if (!heroBg) return;
        window.addEventListener('scroll', function () {
            var s = window.scrollY, h = document.querySelector('.hero').offsetHeight;
            if (s < h) heroBg.style.transform = 'translateY(' + (s * 0.3) + 'px)';
        }, { passive: true });
    })();

    // --- Hero mouse effect ---
    (function () {
        var hero = document.querySelector('.hero');
        var gradient = document.querySelector('.hero-gradient');
        if (!hero || !gradient) return;
        hero.addEventListener('mousemove', function (e) {
            var r = hero.getBoundingClientRect();
            var x = ((e.clientX - r.left) / r.width) * 100;
            var y = ((e.clientY - r.top) / r.height) * 100;
            gradient.style.background =
                'radial-gradient(ellipse at ' + x + '% ' + y + '%, rgba(139,115,85,.35) 0%, transparent 50%),' +
                'radial-gradient(ellipse at 70% 80%, rgba(42,61,44,.5) 0%, transparent 50%),' +
                'linear-gradient(to bottom, rgba(0,0,0,.15) 0%, rgba(0,0,0,.4) 100%)';
        });
    })();

    // --- Form handling ---
    (function () {
        var form = document.getElementById('contactForm');
        if (!form) return;
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = form.querySelector('.form-submit');
            var orig = btn.innerHTML;
            btn.innerHTML = '<span>Message envoyé !</span>';
            btn.style.background = '#3a5232';
            btn.disabled = true;
            setTimeout(function () { btn.innerHTML = orig; btn.style.background = ''; btn.disabled = false; form.reset(); }, 3000);
        });
    })();

    // --- Init ---
    document.addEventListener('DOMContentLoaded', function () {
        loadContent();
    });

})();
