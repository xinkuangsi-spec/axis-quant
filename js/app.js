/**
 * AXIS QUANT - Main Application Controller
 * Handles model initialization, language toggling, checkout modal, and code copy
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Language Initialization
  const savedLang = localStorage.getItem('axis_quant_lang') || 'zh';
  initLanguage(savedLang);

  // 2. Interactive Models Initialization
  window.bsModel = new BlackScholesModel();
  window.pairsModel = new PairsTradingModel();
  window.backtester = new InteractiveQuantBacktester();
  window.copilot = new AIStrategyCopilot();

  // 3. Checkout Modal Wiring
  initCheckout();

  // 4. Code Copy Button
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
}

// Checkout Modal
function initCheckout() {
  const modal = document.getElementById('checkout-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const payBtn = document.getElementById('modal-pay-btn');
  const successCloseBtn = document.getElementById('modal-success-close-btn');
  const planDisplay = document.getElementById('modal-plan-name');

  const formView = document.getElementById('modal-form-view');
  const successView = document.getElementById('modal-success-view');

  const openCheckout = (tierName, price) => {
    if (planDisplay) planDisplay.textContent = `${tierName} (${price})`;
    if (formView) formView.style.display = 'block';
    if (successView) successView.style.display = 'none';
    if (modal) modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeCheckout = () => {
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.btn-buy-tier').forEach(btn => {
    btn.addEventListener('click', () => {
      const tier = btn.getAttribute('data-tier') || 'Research Dispatch';
      const price = btn.getAttribute('data-price') || '$29';
      openCheckout(tier, price);
    });
  });

  const headerBtn = document.getElementById('btn-header-access');
  if (headerBtn) {
    headerBtn.addEventListener('click', () => {
      openCheckout('RESEARCH DISPATCH', '$29/月');
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeCheckout);
  if (successCloseBtn) successCloseBtn.addEventListener('click', closeCheckout);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCheckout();
    });
  }

  if (payBtn) {
    payBtn.addEventListener('click', () => {
      const email = document.getElementById('modal-email').value.trim();
      if (!email || !email.includes('@')) {
        alert('请输入有效的电子邮箱以接收许可证密钥与研报。');
        return;
      }

      payBtn.disabled = true;
      payBtn.textContent = '正在处理结算...';

      setTimeout(() => {
        payBtn.disabled = false;
        payBtn.textContent = '确认结算并生成许可证';

        const token = `AQ-KEY-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        document.getElementById('modal-token-display').textContent = token;

        if (formView) formView.style.display = 'none';
        if (successView) successView.style.display = 'block';
      }, 1000);
    });
  }
}

// Code Copy
function initCodeCopy() {
  const copyBtn = document.getElementById('btn-copy-code');
  const codeEl = document.getElementById('python-strategy-code');

  if (copyBtn && codeEl) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(codeEl.textContent).then(() => {
        const orig = copyBtn.textContent;
        copyBtn.textContent = '✓ 已复制';
        setTimeout(() => copyBtn.textContent = orig, 2000);
      });
    });
  }
}
