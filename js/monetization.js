/**
 * AXIS QUANT - Monetization & Revenue Generation Engine
 * Controls billing toggles, checkout modal, Stripe/Crypto payment simulation, and affiliate handlers
 */

class MonetizationManager {
  constructor() {
    this.isYearly = false;
    this.selectedPlan = 'pro';
    this.init();
  }

  init() {
    this.bindBillingToggle();
    this.bindPlanButtons();
    this.bindModal();
    this.bindTipJar();
  }

  bindBillingToggle() {
    const toggleMo = document.getElementById('billing-monthly-btn');
    const toggleYr = document.getElementById('billing-yearly-btn');
    const pricePro = document.getElementById('plan2-price-display');
    const periodPro = document.getElementById('plan2-period-display');

    if (!toggleMo || !toggleYr) return;

    toggleMo.addEventListener('click', () => {
      this.isYearly = false;
      toggleMo.classList.add('active');
      toggleYr.classList.remove('active');
      if (pricePro) pricePro.textContent = '$39';
      if (periodPro) periodPro.textContent = '/ 月';
    });

    toggleYr.addEventListener('click', () => {
      this.isYearly = true;
      toggleYr.classList.add('active');
      toggleMo.classList.remove('active');
      if (pricePro) pricePro.textContent = '$27';
      if (periodPro) periodPro.textContent = '/ 月 (年付 $324)';
    });
  }

  bindPlanButtons() {
    const proBtns = document.querySelectorAll('.btn-select-pro');
    const repoBtns = document.querySelectorAll('.btn-select-repo');

    proBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.openCheckout('ALPHA PRO TERMINAL', this.isYearly ? '$324 / 年' : '$39 / 月');
      });
    });

    repoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.openCheckout('INSTITUTIONAL ALGO REPO & MASTERCLASS', '$499 (一次性买断)');
      });
    });
  }

  openCheckout(planName, priceText) {
    const modal = document.getElementById('checkout-modal');
    const planDisplay = document.getElementById('modal-plan-name');
    const priceDisplay = document.getElementById('modal-plan-price');
    const stepForm = document.getElementById('modal-step-form');
    const stepSuccess = document.getElementById('modal-step-success');

    if (!modal) return;

    if (planDisplay) planDisplay.textContent = planName;
    if (priceDisplay) priceDisplay.textContent = priceText;

    if (stepForm) stepForm.style.display = 'block';
    if (stepSuccess) stepSuccess.style.display = 'none';

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  bindModal() {
    const modal = document.getElementById('checkout-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const successCloseBtn = document.getElementById('modal-success-close-btn');
    const payBtn = document.getElementById('modal-pay-btn');
    const emailInput = document.getElementById('modal-email');
    const stepForm = document.getElementById('modal-step-form');
    const stepSuccess = document.getElementById('modal-step-success');
    const keyDisplay = document.getElementById('modal-api-key');

    const closeModal = () => {
      if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (successCloseBtn) successCloseBtn.addEventListener('click', closeModal);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    if (payBtn) {
      payBtn.addEventListener('click', () => {
        const email = emailInput ? emailInput.value.trim() : '';
        if (!email || !email.includes('@')) {
          this.showToast('请输入有效的电子邮箱地址以便接收许可证！', true);
          if (emailInput) emailInput.focus();
          return;
        }

        payBtn.disabled = true;
        payBtn.textContent = '正在处理安全结算与密钥生成...';

        setTimeout(() => {
          payBtn.disabled = false;
          payBtn.textContent = '确认支付并生成许可证';

          // Generate simulated unique cryptographic API token
          const tokenPart = Math.random().toString(36).substring(2, 8).toUpperCase();
          const tokenPart2 = Math.random().toString(36).substring(2, 8).toUpperCase();
          const apiKey = `AQ-KEY-2026-${tokenPart}-${tokenPart2}-PRO`;

          if (keyDisplay) keyDisplay.textContent = apiKey;
          if (stepForm) stepForm.style.display = 'none';
          if (stepSuccess) stepSuccess.style.display = 'block';

          this.showToast('支付处理完成！许可证已生成。');
        }, 1200);
      });
    }
  }

  bindTipJar() {
    const copyBtn = document.getElementById('tip-copy-btn');
    const addrInput = document.getElementById('tip-wallet-addr');

    if (copyBtn && addrInput) {
      copyBtn.addEventListener('click', () => {
        const addr = addrInput.value || addrInput.textContent;
        navigator.clipboard.writeText(addr).then(() => {
          this.showToast('链上钱包地址已复制到剪贴板！');
        }).catch(() => {
          this.showToast('复制成功：' + addr);
        });
      });
    }
  }

  showToast(message, isError = false) {
    let toast = document.getElementById('global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'global-toast';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.borderColor = isError ? '#DC2626' : '#1F44FF';
    toast.classList.add('visible');

    setTimeout(() => {
      toast.classList.remove('visible');
    }, 3200);
  }
}
