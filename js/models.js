/**
 * AXIS QUANT - Rigorous Quantitative Models & Explorable Explanations
 * 1. Black-Scholes-Merton Analytical Options Engine & Greeks
 * 2. Statistical Arbitrage & Pairs Trading Mean-Reversion Simulator
 * 3. Trend Following (Dual SMA & Momentum) Multi-Asset Backtester
 */

// --- Math Utilities ---
// Standard Normal Cumulative Distribution Function (Abramowitz & Stegun approximation)
function normalCDF(x) {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (x >= 0.0) {
    const t = 1.0 / (1.0 + p * x);
    return 1.0 - c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * x);
    return c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
}

// -------------------------------------------------------------
// MODEL 1: Black-Scholes Options Calculator & Interactive Curve
// -------------------------------------------------------------
class BlackScholesModel {
  constructor() {
    this.canvas = document.getElementById('bs-curve-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.S = 100;    // Spot Price
    this.K = 100;    // Strike Price
    this.sigma = 0.25; // Volatility (25%)
    this.T = 0.5;    // Time to expiration (0.5 year = 6 months)
    this.r = 0.04;   // Risk-free rate (4%)

    this.bindInputs();
    this.calculateAndRender();
  }

  calculate(S, K, T, r, sigma) {
    if (T <= 0 || sigma <= 0) {
      const call = Math.max(0, S - K);
      const put = Math.max(0, K - S);
      return { call, put, d1: 0, d2: 0, delta: call > 0 ? 1 : 0 };
    }

    const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const call = S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
    const put = K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
    const delta = normalCDF(d1);

    return { call: Math.max(0, call), put: Math.max(0, put), d1, d2, delta };
  }

  bindInputs() {
    const spotSlider = document.getElementById('bs-spot');
    const strikeSlider = document.getElementById('bs-strike');
    const volSlider = document.getElementById('bs-vol');
    const expirySlider = document.getElementById('bs-expiry');

    if (spotSlider) {
      spotSlider.addEventListener('input', (e) => {
        this.S = parseFloat(e.target.value);
        document.getElementById('bs-spot-val').textContent = `$${this.S}`;
        this.calculateAndRender();
      });
    }

    if (strikeSlider) {
      strikeSlider.addEventListener('input', (e) => {
        this.K = parseFloat(e.target.value);
        document.getElementById('bs-strike-val').textContent = `$${this.K}`;
        this.calculateAndRender();
      });
    }

    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        this.sigma = parseFloat(e.target.value) / 100;
        document.getElementById('bs-vol-val').textContent = `${e.target.value}%`;
        this.calculateAndRender();
      });
    }

    if (expirySlider) {
      expirySlider.addEventListener('input', (e) => {
        const days = parseInt(e.target.value);
        this.T = days / 365;
        document.getElementById('bs-expiry-val').textContent = `${days} 天 (${(this.T).toFixed(2)} 年)`;
        this.calculateAndRender();
      });
    }

    window.addEventListener('resize', () => this.renderCurve());
  }

  calculateAndRender() {
    const res = this.calculate(this.S, this.K, this.T, this.r, this.sigma);

    const callEl = document.getElementById('bs-res-call');
    const putEl = document.getElementById('bs-res-put');
    const deltaEl = document.getElementById('bs-res-delta');

    if (callEl) callEl.textContent = `$${res.call.toFixed(2)}`;
    if (putEl) putEl.textContent = `$${res.put.toFixed(2)}`;
    if (deltaEl) deltaEl.textContent = res.delta.toFixed(3);

    this.renderCurve();
  }

  renderCurve() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const w = parent.getBoundingClientRect().width;
    const h = 260;

    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const padL = 40, padR = 20, padT = 20, padB = 30;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const minS = Math.max(10, this.K * 0.5);
    const maxS = this.K * 1.5;
    const maxCallVal = Math.max(1, this.calculate(maxS, this.K, this.T, this.r, this.sigma).call * 1.1);

    const getX = (spot) => padL + ((spot - minS) / (maxS - minS)) * plotW;
    const getY = (val) => padT + (1 - val / maxCallVal) * plotH;

    // Grid
    ctx.strokeStyle = '#E8E6DF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * plotH;
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
    }
    ctx.stroke();

    // Strike vertical dashed line
    const strikeX = getX(this.K);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#8C887B';
    ctx.beginPath();
    ctx.moveTo(strikeX, padT);
    ctx.lineTo(strikeX, h - padB);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#8C887B';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`行权价 K=$${this.K}`, strikeX + 4, padT + 14);

    // Draw Intrinsic Value at Expiry: max(0, S - K)
    ctx.strokeStyle = '#D1CEC7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(getX(minS), getY(0));
    ctx.lineTo(strikeX, getY(0));
    ctx.lineTo(getX(maxS), getY(maxS - this.K));
    ctx.stroke();

    // Draw Theoretical Call Option Price Curve
    ctx.strokeStyle = '#0A2540'; // Oxford Navy
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const spot = minS + (i / steps) * (maxS - minS);
      const callPrice = this.calculate(spot, this.K, this.T, this.r, this.sigma).call;
      const x = getX(spot);
      const y = getY(callPrice);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Highlight Current Spot Point
    const currentRes = this.calculate(this.S, this.K, this.T, this.r, this.sigma);
    const currX = getX(this.S);
    const currY = getY(currentRes.call);

    ctx.fillStyle = '#057A55'; // Emerald green
    ctx.beginPath();
    ctx.arc(currX, currY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1A1A1A';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText(`现价 S=$${this.S} (C=$${currentRes.call.toFixed(2)})`, Math.min(currX + 8, w - 160), currY - 8);
  }
}

// -------------------------------------------------------------
// MODEL 2: Pairs Trading & Statistical Arbitrage Simulator
// -------------------------------------------------------------
class PairsTradingModel {
  constructor() {
    this.canvas = document.getElementById('stat-arb-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.days = 120;
    this.threshold = 2.0; // Entry at +/- 2.0 std dev
    this.spreadData = [];

    this.generateData();
    this.bindControls();
    this.render();
  }

  generateData() {
    let spread = 0;
    const data = [];
    const meanReversionSpeed = 0.12;

    for (let i = 0; i < this.days; i++) {
      // Ornstein-Uhlenbeck mean-reverting process
      const noise = (Math.random() - 0.5) * 1.8;
      spread += -meanReversionSpeed * spread + noise;

      data.push({
        day: i + 1,
        zscore: spread
      });
    }
    this.spreadData = data;
  }

  bindControls() {
    const threshSlider = document.getElementById('stat-arb-thresh');
    const resetBtn = document.getElementById('stat-arb-reset');

    if (threshSlider) {
      threshSlider.addEventListener('input', (e) => {
        this.threshold = parseFloat(e.target.value);
        document.getElementById('stat-arb-thresh-val').textContent = `±${this.threshold.toFixed(1)}σ`;
        this.render();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.generateData();
        this.render();
      });
    }

    window.addEventListener('resize', () => this.render());
  }

  render() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const w = parent.getBoundingClientRect().width;
    const h = 260;

    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const padL = 45, padR = 25, padT = 20, padB = 30;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const maxZ = 3.5;
    const minZ = -3.5;

    const getX = (idx) => padL + (idx / (this.days - 1)) * plotW;
    const getY = (z) => padT + (1 - (z - minZ) / (maxZ - minZ)) * plotH;

    const zeroY = getY(0);
    const upperY = getY(this.threshold);
    const lowerY = getY(-this.threshold);

    // Shaded Arbitrage Entry Zones
    ctx.fillStyle = 'rgba(5, 122, 85, 0.08)'; // Green Long Spread zone
    ctx.fillRect(padL, lowerY, plotW, getY(-maxZ) - lowerY);

    ctx.fillStyle = 'rgba(220, 38, 38, 0.08)'; // Red Short Spread zone
    ctx.fillRect(padL, padT, plotW, upperY - padT);

    // Threshold lines
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, upperY);
    ctx.lineTo(w - padR, upperY);
    ctx.stroke();

    ctx.strokeStyle = '#057A55';
    ctx.beginPath();
    ctx.moveTo(padL, lowerY);
    ctx.lineTo(w - padR, lowerY);
    ctx.stroke();

    // Center Zero Mean Line
    ctx.strokeStyle = '#8C887B';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(padL, zeroY);
    ctx.lineTo(w - padR, zeroY);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#8C887B';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`+${this.threshold.toFixed(1)}σ 做空价差`, padL + 6, upperY - 4);
    ctx.fillText(`-${this.threshold.toFixed(1)}σ 做多价差`, padL + 6, lowerY + 12);
    ctx.fillText(`均值 (0σ)`, padL + 6, zeroY - 4);

    // Plot Z-Score Spread Line
    ctx.strokeStyle = '#0A2540';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < this.spreadData.length; i++) {
      const x = getX(i);
      const y = getY(this.spreadData[i].zscore);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Trade Signals Markers & Stats
    let trades = 0;
    let inTrade = false;
    for (let i = 0; i < this.spreadData.length; i++) {
      const z = this.spreadData[i].zscore;
      const x = getX(i);
      const y = getY(z);

      if (!inTrade) {
        if (z >= this.threshold || z <= -this.threshold) {
          inTrade = true;
          trades++;
          ctx.fillStyle = z <= -this.threshold ? '#057A55' : '#DC2626';
          ctx.beginPath();
          ctx.arc(x, y, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Exit when reverted back toward 0
        if (Math.abs(z) < 0.25) {
          inTrade = false;
        }
      }
    }

    const tradesEl = document.getElementById('stat-arb-trades-val');
    if (tradesEl) tradesEl.textContent = trades;
  }
}

// -------------------------------------------------------------
// MODEL 3: Interactive Multi-Asset Dual SMA Backtester
// -------------------------------------------------------------
class InteractiveQuantBacktester {
  constructor() {
    this.canvas = document.getElementById('main-backtest-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.selectedAsset = 'SPY';
    this.fastPeriod = 10;
    this.slowPeriod = 30;
    this.stopLossPct = 5.0;
    this.capital = 100000;

    this.assetData = {};
    this.initAssetData();
    this.bindEvents();
    this.run();
  }

  // Pre-loaded realistic historical-like price paths for 4 benchmark assets
  initAssetData() {
    const assets = ['SPY', 'BTC', 'NVDA', 'AAPL'];
    const seeds = {
      SPY: { start: 380, drift: 0.0006, vol: 0.011 },
      BTC: { start: 28000, drift: 0.0018, vol: 0.032 },
      NVDA: { start: 42, drift: 0.0028, vol: 0.026 },
      AAPL: { start: 140, drift: 0.0008, vol: 0.014 }
    };

    const days = 180;
    assets.forEach(sym => {
      const cfg = seeds[sym];
      let price = cfg.start;
      const series = [];

      for (let i = 0; i < days; i++) {
        const shock = (Math.sin(i * 0.15) * 0.008) + ((Math.random() - 0.48) * cfg.vol);
        price = Math.max(5, price * (1 + cfg.drift + shock));
        series.push({
          day: i + 1,
          close: price
        });
      }
      this.assetData[sym] = series;
    });
  }

  bindEvents() {
    const assetBtns = document.querySelectorAll('.asset-select-btn');
    assetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        assetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedAsset = btn.getAttribute('data-asset');
        this.run();
      });
    });

    const fastInput = document.getElementById('bt-fast');
    const slowInput = document.getElementById('bt-slow');
    const stoplossInput = document.getElementById('bt-stoploss');

    if (fastInput) {
      fastInput.addEventListener('input', (e) => {
        let v = parseInt(e.target.value);
        const slow = parseInt(slowInput.value);
        if (v >= slow) {
          v = slow - 1;
          fastInput.value = v;
        }
        document.getElementById('bt-fast-val').textContent = `${v} 日`;
        this.fastPeriod = v;
        this.run();
      });
    }

    if (slowInput) {
      slowInput.addEventListener('input', (e) => {
        let v = parseInt(e.target.value);
        const fast = parseInt(fastInput.value);
        if (v <= fast) {
          v = fast + 1;
          slowInput.value = v;
        }
        document.getElementById('bt-slow-val').textContent = `${v} 日`;
        this.slowPeriod = v;
        this.run();
      });
    }

    if (stoplossInput) {
      stoplossInput.addEventListener('input', (e) => {
        this.stopLossPct = parseFloat(e.target.value);
        document.getElementById('bt-stoploss-val').textContent = `${this.stopLossPct.toFixed(1)}%`;
        this.run();
      });
    }

    window.addEventListener('resize', () => this.render());
  }

  run() {
    const series = this.assetData[this.selectedAsset];
    if (!series) return;

    // 1. Moving Averages
    const fastSMA = new Array(series.length).fill(null);
    const slowSMA = new Array(series.length).fill(null);

    for (let i = this.fastPeriod - 1; i < series.length; i++) {
      let sum = 0;
      for (let j = 0; j < this.fastPeriod; j++) sum += series[i - j].close;
      fastSMA[i] = sum / this.fastPeriod;
    }

    for (let i = this.slowPeriod - 1; i < series.length; i++) {
      let sum = 0;
      for (let j = 0; j < this.slowPeriod; j++) sum += series[i - j].close;
      slowSMA[i] = sum / this.slowPeriod;
    }

    // 2. Step-by-Step Position & Equity Calculation
    let position = 0; // 0: Flat, 1: Long
    let cash = this.capital;
    let shares = 0;
    let entryPrice = 0;
    let tradesCount = 0;
    let winCount = 0;

    const equityCurve = [];
    const signals = [];

    for (let i = 0; i < series.length; i++) {
      const price = series[i].close;

      if (i >= this.slowPeriod) {
        const prevF = fastSMA[i - 1];
        const prevS = slowSMA[i - 1];
        const currF = fastSMA[i];
        const currS = slowSMA[i];

        // Hard Stop-Loss
        if (position === 1 && this.stopLossPct > 0) {
          const loss = (entryPrice - price) / entryPrice * 100;
          if (loss >= this.stopLossPct) {
            cash = shares * price;
            shares = 0;
            position = 0;
            tradesCount++;
            signals.push({ day: i, type: 'SELL_STOP', price });
          }
        }

        // Golden Cross -> Buy
        if (position === 0 && prevF <= prevS && currF > currS) {
          position = 1;
          shares = cash / price;
          cash = 0;
          entryPrice = price;
          tradesCount++;
          signals.push({ day: i, type: 'BUY', price });
        }
        // Death Cross -> Sell
        else if (position === 1 && prevF >= prevS && currF < currS) {
          position = 0;
          cash = shares * price;
          if (price > entryPrice) winCount++;
          shares = 0;
          tradesCount++;
          signals.push({ day: i, type: 'SELL', price });
        }
      }

      const totalVal = position === 1 ? shares * price : cash;
      equityCurve.push(totalVal);
    }

    // 3. Performance Metrics
    const finalEq = equityCurve[equityCurve.length - 1];
    const totalReturnPct = ((finalEq - this.capital) / this.capital) * 100;
    const benchReturnPct = ((series[series.length - 1].close - series[0].close) / series[0].close) * 100;

    // Drawdown & Sharpe
    let peak = equityCurve[0];
    let maxDD = 0;
    const returns = [];

    for (let i = 1; i < equityCurve.length; i++) {
      if (equityCurve[i] > peak) peak = equityCurve[i];
      const dd = ((peak - equityCurve[i]) / peak) * 100;
      if (dd > maxDD) maxDD = dd;
      returns.push((equityCurve[i] - equityCurve[i - 1]) / equityCurve[i - 1]);
    }

    const mean = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
    const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (returns.length || 1);
    const std = Math.sqrt(variance) || 0.001;
    const sharpe = ((mean - (0.03 / 252)) / std) * Math.sqrt(252);
    const winRate = tradesCount > 0 ? (winCount / Math.max(1, Math.floor(tradesCount / 2))) * 100 : 0;

    this.metrics = {
      totalReturnPct,
      benchReturnPct,
      sharpe: Math.max(-2.5, Math.min(5.0, sharpe)),
      maxDD,
      tradesCount,
      winRate: Math.min(100, Math.max(0, winRate)),
      signals,
      fastSMA,
      slowSMA,
      equityCurve
    };

    this.updateMetricsDisplay();
    this.render();
  }

  updateMetricsDisplay() {
    const m = this.metrics;
    if (!m) return;

    const retEl = document.getElementById('bt-stat-return');
    const benchEl = document.getElementById('bt-stat-bench');
    const sharpeEl = document.getElementById('bt-stat-sharpe');
    const mddEl = document.getElementById('bt-stat-mdd');
    const winEl = document.getElementById('bt-stat-winrate');
    const tradesEl = document.getElementById('bt-stat-trades');

    if (retEl) {
      retEl.textContent = `${m.totalReturnPct >= 0 ? '+' : ''}${m.totalReturnPct.toFixed(2)}%`;
      retEl.style.color = m.totalReturnPct >= 0 ? '#057A55' : '#DC2626';
    }
    if (benchEl) {
      benchEl.textContent = `${m.benchReturnPct >= 0 ? '+' : ''}${m.benchReturnPct.toFixed(2)}%`;
    }
    if (sharpeEl) {
      sharpeEl.textContent = m.sharpe.toFixed(2);
    }
    if (mddEl) {
      mddEl.textContent = `-${m.maxDD.toFixed(2)}%`;
    }
    if (winEl) {
      winEl.textContent = `${m.winRate.toFixed(1)}%`;
    }
    if (tradesEl) {
      tradesEl.textContent = m.tradesCount;
    }
  }

  render() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const w = parent.getBoundingClientRect().width;
    const h = 360;

    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const padL = 50, padR = 25, padT = 30, padB = 40;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const series = this.assetData[this.selectedAsset];
    const prices = series.map(d => d.close);
    const minP = Math.min(...prices) * 0.95;
    const maxP = Math.max(...prices) * 1.05;

    const getX = (i) => padL + (i / (series.length - 1)) * plotW;
    const getY = (p) => padT + (1 - (p - minP) / (maxP - minP)) * plotH;

    // Grid lines
    ctx.strokeStyle = '#E8E6DF';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * plotH;
      const val = maxP - (i / 4) * (maxP - minP);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();

      ctx.fillStyle = '#8C887B';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`$${val.toFixed(1)}`, padL - 8, y + 3);
    }

    // Slow SMA Line (Warm Gold / Ocre)
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    let slowStarted = false;
    for (let i = 0; i < series.length; i++) {
      if (this.metrics.slowSMA[i] !== null) {
        const x = getX(i);
        const y = getY(this.metrics.slowSMA[i]);
        if (!slowStarted) { ctx.moveTo(x, y); slowStarted = true; }
        else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Fast SMA Line (Oxford Navy)
    ctx.strokeStyle = '#0A2540';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let fastStarted = false;
    for (let i = 0; i < series.length; i++) {
      if (this.metrics.fastSMA[i] !== null) {
        const x = getX(i);
        const y = getY(this.metrics.fastSMA[i]);
        if (!fastStarted) { ctx.moveTo(x, y); fastStarted = true; }
        else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Price Curve
    ctx.strokeStyle = '#2D3748';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < series.length; i++) {
      const x = getX(i);
      const y = getY(series[i].close);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Signals
    this.metrics.signals.forEach(sig => {
      const x = getX(sig.day);
      const y = getY(sig.price);

      if (sig.type === 'BUY') {
        ctx.fillStyle = '#057A55';
        ctx.beginPath();
        ctx.moveTo(x, y + 5);
        ctx.lineTo(x - 5, y + 14);
        ctx.lineTo(x + 5, y + 14);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x - 5, y - 14);
        ctx.lineTo(x + 5, y - 14);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Legend
    ctx.textAlign = 'left';
    ctx.font = '11px "JetBrains Mono", monospace';

    ctx.fillStyle = '#2D3748';
    ctx.fillRect(padL + 10, padT - 16, 12, 2);
    ctx.fillText(`${this.selectedAsset} 资产价格`, padL + 28, padT - 12);

    ctx.fillStyle = '#0A2540';
    ctx.fillRect(padL + 160, padT - 16, 12, 2);
    ctx.fillText(`快线 SMA (${this.fastPeriod}d)`, padL + 178, padT - 12);

    ctx.fillStyle = '#B45309';
    ctx.fillRect(padL + 300, padT - 16, 12, 2);
    ctx.fillText(`慢线 SMA (${this.slowPeriod}d)`, padL + 318, padT - 12);
  }
}
