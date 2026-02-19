/* ===========================
   Maison Yvoir — JavaScript
   Animations & Interactivity
   =========================== */

(function () {
    'use strict';

    // --- Loader ---
    const loader = document.getElementById('loader');
    window.addEventListener('load', function () {
        setTimeout(function () {
            loader.classList.add('hidden');
        }, 2200);
    });

    // --- Navigation scroll behavior ---
    const nav = document.getElementById('nav');
    let lastScroll = 0;

    function handleNavScroll() {
        const currentScroll = window.scrollY;
        if (currentScroll > 80) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    }

    window.addEventListener('scroll', handleNavScroll, { passive: true });

    // --- Mobile menu toggle ---
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    navToggle.addEventListener('click', function () {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // --- Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                var offset = nav.offsetHeight + 20;
                var top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    // --- Reveal on scroll ---
    function setupRevealAnimations() {
        var reveals = [];

        // Add reveal class to elements
        var selectors = [
            '.section-label',
            '.section-title',
            '.concept-description',
            '.concept-visual',
            '.maison-intro',
            '.service',
            '.decouvrir-card',
            '.gallery-item',
            '.season',
            '.contact-info',
            '.contact-form-wrapper',
            '.quote'
        ];

        selectors.forEach(function (selector) {
            document.querySelectorAll(selector).forEach(function (el) {
                el.classList.add('reveal');
                reveals.push(el);
            });
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    // Stagger children of the same parent
                    var parent = entry.target.parentElement;
                    var siblings = Array.from(parent.children).filter(function (child) {
                        return child.classList.contains('reveal');
                    });
                    var index = siblings.indexOf(entry.target);
                    var delay = index * 100;

                    setTimeout(function () {
                        entry.target.classList.add('visible');
                    }, delay);

                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        reveals.forEach(function (el) {
            observer.observe(el);
        });
    }

    // --- Animated counter ---
    function animateCounters() {
        var counters = document.querySelectorAll('.stat-number');

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var target = parseInt(el.getAttribute('data-target'), 10);
                    var duration = 2000;
                    var start = 0;
                    var startTime = null;

                    function easeOutQuart(t) {
                        return 1 - Math.pow(1 - t, 4);
                    }

                    function step(timestamp) {
                        if (!startTime) startTime = timestamp;
                        var progress = Math.min((timestamp - startTime) / duration, 1);
                        var value = Math.floor(easeOutQuart(progress) * target);
                        el.textContent = value.toLocaleString('fr-FR');
                        if (progress < 1) {
                            requestAnimationFrame(step);
                        } else {
                            el.textContent = target.toLocaleString('fr-FR');
                        }
                    }

                    requestAnimationFrame(step);
                    observer.unobserve(el);
                }
            });
        }, {
            threshold: 0.5
        });

        counters.forEach(function (counter) {
            observer.observe(counter);
        });
    }

    // --- Parallax effect on hero ---
    function setupParallax() {
        var heroBg = document.querySelector('.hero-bg');
        if (!heroBg) return;

        window.addEventListener('scroll', function () {
            var scrolled = window.scrollY;
            var heroHeight = document.querySelector('.hero').offsetHeight;
            if (scrolled < heroHeight) {
                heroBg.style.transform = 'translateY(' + (scrolled * 0.3) + 'px)';
            }
        }, { passive: true });
    }

    // --- Form handling ---
    function setupForm() {
        var form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var btn = form.querySelector('.form-submit');
            var originalText = btn.innerHTML;

            btn.innerHTML = '<span>Message envoyé !</span>';
            btn.style.background = '#3a5232';
            btn.disabled = true;

            setTimeout(function () {
                btn.innerHTML = originalText;
                btn.style.background = '';
                btn.disabled = false;
                form.reset();
            }, 3000);
        });
    }

    // --- Mouse move effect on hero ---
    function setupHeroMouseEffect() {
        var hero = document.querySelector('.hero');
        var gradient = document.querySelector('.hero-gradient');
        if (!hero || !gradient) return;

        hero.addEventListener('mousemove', function (e) {
            var rect = hero.getBoundingClientRect();
            var x = ((e.clientX - rect.left) / rect.width) * 100;
            var y = ((e.clientY - rect.top) / rect.height) * 100;

            gradient.style.background =
                'radial-gradient(ellipse at ' + x + '% ' + y + '%, rgba(139, 115, 85, 0.35) 0%, transparent 50%), ' +
                'radial-gradient(ellipse at 70% 80%, rgba(42, 61, 44, 0.5) 0%, transparent 50%), ' +
                'linear-gradient(to bottom, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)';
        });
    }

    // --- Init ---
    document.addEventListener('DOMContentLoaded', function () {
        setupRevealAnimations();
        animateCounters();
        setupParallax();
        setupForm();
        setupHeroMouseEffect();
    });
})();
