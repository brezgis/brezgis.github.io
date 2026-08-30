/* ============================================
   Anna Brežġis — Site Scripts
   ============================================ */

(function () {
  'use strict';

  // --- Email: assembled on click (never in the HTML source), copied to the
  // clipboard, and revealed as selectable text. Same behavior in the hero
  // button and the footer link. ---
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
    }
    // Fallback for insecure origins / older browsers
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return Promise.resolve(ok);
    } catch (_) {
      return Promise.resolve(false);
    }
  }

  function revealEmail(e) {
    e.preventDefault();
    const addr = 'anna' + '@' + 'brezgis.com';
    const clicked = e.currentTarget;
    // Hero button keeps its icon and writes into the inner span; the footer
    // link has no inner text node, so we write into the link itself.
    const label = clicked.querySelector('#email-text') || clicked;

    copyToClipboard(addr).then((ok) => {
      clicked.style.cursor = 'text';
      label.textContent = ok ? 'Copied ✓' : addr;
      if (ok) {
        window.setTimeout(() => { label.textContent = addr; }, 1100);
      }
    });
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
    // Skip the Blog section and the nav-swapped sections — they have their own
    // nav-only entrance animation instead of the scroll-triggered fade.
    const elements = Array.from(document.querySelectorAll(
      '.section-title, .section-intro, .about-content p, .research-card, .blog-card'
    )).filter((el) => !el.closest('#blog') && !el.closest('.nav-section'));

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
      // Show scroll sections, then jump (no animation) to the requested one so
      // it sits at the top as if it were its own page. We use scrollTo() with
      // the element's document offset rather than scrollIntoView(), because
      // scrollIntoView honors `scroll-padding-top` (80px) and would drop the
      // title 80px lower than Research — which is positioned via scrollTo(0).
      scrollSections.forEach(s => s.style.display = '');
      const target = document.getElementById(id);
      if (target) {
        const y = target.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: y, behavior: 'instant' });
      }
    } else {
      // Hide scroll sections except we keep them but show the nav section
      // Actually: hide home/blog, show the requested section
      scrollSections.forEach(s => s.style.display = 'none');
      const target = document.getElementById(id);
      if (target) {
        target.style.display = '';
        // 'instant' is required: html has `scroll-behavior: smooth`, so a bare
        // scrollTo animates the jump. The entrance cascade starts immediately
        // either way, so a smooth scroll from further down the page burns most
        // of the 0.9s sequence before the section is even in view — the reason
        // Research appeared to "fall in" from the top of the page but snap in
        // from lower down. The home/blog branch above already passes this.
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }

    // Update active nav
    navLinks.forEach(l => l.classList.remove('active'));
    navLinks.forEach(l => {
      if (l.getAttribute('href') === '#' + id) l.classList.add('active');
    });
  }

  // Gentle staggered entrance for a section — played ONLY when you open it
  // from the nav bar, never on manual scroll.
  function playEnter(id) {
    const sec = document.getElementById(id);
    if (!sec) return;
    sec.classList.remove('nav-enter');
    void sec.offsetWidth; // force reflow so the animation restarts each time
    sec.classList.add('nav-enter');
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const id = href.slice(1);
        showNavSection(id);
        playEnter(id);
      }
    });
  });

  // The hero's "see more" chevron opens Blog the same way the nav tab does.
  const scrollHint = document.querySelector('.scroll-hint');
  if (scrollHint) {
    scrollHint.addEventListener('click', () => {
      showNavSection('blog');
      playEnter('blog');
    });
  }

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

    // Deep-link support: visiting /#sharabara (etc.) — e.g. clicking a nav tab
    // from a blog post page — opens that section directly, with its entrance.
    const initialHash = decodeURIComponent(location.hash.slice(1));
    if (initialHash && document.getElementById(initialHash)) {
      showNavSection(initialHash);
      playEnter(initialHash);
    } else {
      playEnter('home');
    }
  });

})();
