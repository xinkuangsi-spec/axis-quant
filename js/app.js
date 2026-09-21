/**
 * AXIS QUANT - Main Application Controller
 * Handles global clock, language switcher, scroll animations, accordions, and component wiring
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Global Clock
  initGlobalClock();

  // Initialize Language Manager
  const currentLang = localStorage.getItem('axis_quant_lang') || 'zh';
  initLanguage(currentLang);

  // Initialize DotField Canvas (react-bits adaptation)
  const dotfield = new DotField('hero-dotfield', {
    dotRadius: 1.5,
    dotSpacing: 26,
    cursorRadius: 260,
    bulgeStrength: 50,
    gradientFrom: 'rgba(31, 68, 255, 0.7)',
    gradientTo: 'rgba(255, 255, 255, 0.2)'
  });

  // Initialize Quant Backtest Simulator
  const simulator = new QuantSimulator('sim-canvas');
  window.quantSimInstance = simulator;

  // Initialize Monetization Manager
  const monetization = new MonetizationManager();

  // Initialize Code Copy
  initCodeCopy();

  // Initialize Accordions
  initAccordions();

  // Initialize Scroll Reveals
  initScrollReveals();

  // Initialize Mobile Navigation
  initMobileNav();
});

// Real-time Global Financial Market Clock
function initGlobalClock() {
  const clockEl = document.getElementById('global-clock-display');
  if (!clockEl) return;

  const updateClock = () => {
    const now = new Date();
    // UTC time strings
    const nyTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);

    const londonTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);

    const tokyoTime = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(now);

    clockEl.innerHTML = `<span class="clock-city">NYC</span> ${nyTime} &middot; <span class="clock-city">LON</span> ${londonTime} &middot; <span class="clock-city">TYO</span> ${tokyoTime}`;
  };

  updateClock();
  setInterval(updateClock, 1000);
}

// Multi-Language Switcher
function initLanguage(defaultLang) {
  setLanguage(defaultLang);

  const langButtons = document.querySelectorAll('.lang-btn');
  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      if (lang && I18N_DATA[lang]) {
        setLanguage(lang);
      }
    });
  });
}

function setLanguage(lang) {
  if (!I18N_DATA[lang]) return;
  const dict = I18N_DATA[lang];

  localStorage.setItem('axis_quant_lang', lang);

  // Update button active state
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Replace text in all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });

  // Re-run backtest simulator UI update to refresh chart labels if needed
  if (window.quantSimInstance) {
    window.quantSimInstance.render();
  }
}

// Code Copy Button
function initCodeCopy() {
  const copyBtn = document.getElementById('code-copy-btn');
  const codeBlock = document.getElementById('strategy-python-code');

  if (copyBtn && codeBlock) {
    copyBtn.addEventListener('click', () => {
      const code = codeBlock.textContent;
      navigator.clipboard.writeText(code).then(() => {
        const origText = copyBtn.textContent;
        copyBtn.textContent = '✓ 已复制源码';
        setTimeout(() => {
          copyBtn.textContent = origText;
        }, 2200);
      });
    });
  }
}

// Accordions for FAQ
function initAccordions() {
  const accHeaders = document.querySelectorAll('.faq-accordion-header');
  accHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('active');

      // Close all others
      document.querySelectorAll('.faq-accordion-item').forEach(i => i.classList.remove('active'));

      // Toggle current
      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });
}

// Scroll Reveals via IntersectionObserver
function initScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

// Mobile Navigation
function initMobileNav() {
  const toggleBtn = document.getElementById('mobile-nav-toggle');
  const navMenu = document.getElementById('site-nav-menu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });

    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('mobile-open');
      });
    });
  }
}
