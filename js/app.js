/**
 * AXIS QUANT - Main Application Controller
 * Handles dynamic canvas simulation, model initialization, open-source matrix,
 * tutorials, language toggling, and code copy.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Language Initialization
  const savedLang = localStorage.getItem('axis_quant_lang') || 'zh';
  initLanguage(savedLang);

  // 2. Dynamic Stochastic Particle & Order Flow Simulation
  window.quantFlow = new DynamicQuantFlow('hero-dynamic-canvas');

  // 3. Mathematical Models & AI Copilot Initialization
  window.bsModel = new BlackScholesModel();
  window.pairsModel = new PairsTradingModel();
  window.backtester = new InteractiveQuantBacktester();
  window.copilot = new AIStrategyCopilot();

  // 4. Open-Source Projects Matrix & Code Preview Modal
  initOpenSourceProjects();
  initCodeModal();

  // 5. Code Copy Buttons
  initCodeCopy();
});

// Internationalization
function initLanguage(defaultLang) {
  setLanguage(defaultLang);

  const langButtons = document.querySelectorAll('.lang-btn');
  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      if (lang && I18N_DICTIONARY[lang]) {
        setLanguage(lang);
      }
    });
  });
}

function setLanguage(lang) {
  if (!I18N_DICTIONARY[lang]) return;
  const dict = I18N_DICTIONARY[lang];

  localStorage.setItem('axis_quant_lang', lang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = dict[key];
      } else if (dict[key].includes('<')) {
        el.innerHTML = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });

  // Re-render curves to match font & labels
  if (window.bsModel) window.bsModel.renderCurve();
  if (window.pairsModel) window.pairsModel.render();
  if (window.backtester) window.backtester.render();
  if (window.copilot) window.copilot.renderOutput();

  // Re-render projects in current language
  if (typeof initOpenSourceProjects === 'function') {
    initOpenSourceProjects();
  }
}

// Global Code Copy Button
function initCodeCopy() {
  const copyBtn = document.getElementById('btn-copy-code');
  if (!copyBtn) return;

  copyBtn.addEventListener('click', () => {
    const codeEl = document.getElementById('python-strategy-code');
    if (!codeEl) return;

    navigator.clipboard.writeText(codeEl.textContent).then(() => {
      const curLang = localStorage.getItem('axis_quant_lang') || 'zh';
      const dict = I18N_DICTIONARY[curLang] || I18N_DICTIONARY.zh;
      const originalText = copyBtn.textContent;

      copyBtn.textContent = dict.code_copied || "已复制到剪贴板！";
      copyBtn.style.background = '#057A55';
      copyBtn.style.color = '#FFFFFF';

      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '';
        copyBtn.style.color = '';
      }, 2000);
    });
  });
}
