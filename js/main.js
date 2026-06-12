/* ============================================
   Anna Brežġis — Site Scripts
   ============================================ */

(function () {
  'use strict';

  // --- Email obfuscation ---
  // Email is never in the HTML source; assembled on click.
  function revealEmail(e) {
    e.preventDefault();
    const user = 'anna';
    const domain = 'brezgis.com';
    const addr = user + '@' + domain;

    // Update the main hero email button text — plain text only, no mailto
    const textEl = document.getElementById('email-text');
    if (textEl) {
      textEl.textContent = addr;
    }

    // Also update any other email-link elements that were clicked
    const clicked = e.currentTarget;
    if (clicked && clicked !== document.getElementById('email-btn')) {
      clicked.textContent = addr;
      clicked.onclick = null;
      clicked.style.cursor = 'text';
    }
  }

  // Expose to onclick handlers
  window.revealEmail = revealEmail;

  // --- Navbar scroll effect ---
  const navbar = document.getElementById('navbar');
  let lastScrollY = 0;

  function handleNavScroll() {
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScrollY = scrollY;
  }

  // --- Active nav link based on scroll ---
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateActiveNav() {
    const scrollY = window.scrollY + 120;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach((link) => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  // --- Scroll-triggered fade-in ---
  function initFadeIn() {
    const elements = document.querySelectorAll(
      '.section-title, .section-intro, .about-content p, .research-card, .blog-card'
    );

    elements.forEach((el) => el.classList.add('fade-in'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
  }

  // --- Hide scroll hint on scroll ---
  function initScrollHint() {
    const hint = document.querySelector('.scroll-hint');
    if (!hint) return;

    function hideHint() {
      if (window.scrollY > 100) {
        hint.style.opacity = '0';
        hint.style.transition = 'opacity 0.5s ease';
      } else {
        hint.style.opacity = '0.5';
      }
    }

    window.addEventListener('scroll', hideHint, { passive: true });
  }

  // --- Nav click: show/hide sections ---
  const navSections = document.querySelectorAll('.nav-section');
  const scrollSections = document.querySelectorAll('#home, #blog');

  function showNavSection(id) {
    // Hide all nav-only sections
    navSections.forEach(s => s.style.display = 'none');
    
    if (id === 'home' || id === 'blog') {
      // Show scroll sections, hide nav sections
      scrollSections.forEach(s => s.style.display = '');
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Hide scroll sections except we keep them but show the nav section
      // Actually: hide home/blog, show the requested section
      scrollSections.forEach(s => s.style.display = 'none');
      document.querySelector('.scroll-hint').style.display = 'none';
      const target = document.getElementById(id);
      if (target) {
        target.style.display = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    // Update active nav
    navLinks.forEach(l => l.classList.remove('active'));
    navLinks.forEach(l => {
      if (l.getAttribute('href') === '#' + id) l.classList.add('active');
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        showNavSection(href.slice(1));
      }
    });
  });

  // --- Init ---
  window.addEventListener('scroll', () => {
    handleNavScroll();
    updateActiveNav();
  }, { passive: true });

  document.addEventListener('DOMContentLoaded', () => {
    initFadeIn();
    initScrollHint();
    handleNavScroll();
    updateActiveNav();

    // Deep-link support: visiting /#sharabara (etc.) opens that section directly.
    const initialHash = decodeURIComponent(location.hash.slice(1));
    if (initialHash && document.getElementById(initialHash)) {
      showNavSection(initialHash);
    }
  });

})();
