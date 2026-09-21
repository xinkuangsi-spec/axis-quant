/**
 * Interactive Quantitative Strategy Backtest Engine & Canvas Visualizer
 * Simulates Dual Moving Average (SMA Cross) with Hard Stop Loss on synthetic daily price series
 */

class QuantSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Initial state
    this.days = 160;
    this.initialCapital = 100000;
    this.fastPeriod = 8;
    this.slowPeriod = 24;
    this.stopLossPct = 5;

    // Time series data
    this.priceData = [];
    this.backtestResult = null;

    this.initData();
    this.bindEvents();
    this.run();
  }

  // Generate realistic synthetic asset prices with trend and drift
  initData() {
    let price = 100.0;
    const data = [];
    // Seeded random walk with regimes
    const seedPoints = [0.002, -0.001, 0.004, -0.003, 0.005, 0.001, -0.002];

    for (let i = 0; i < this.days; i++) {
      const regime = seedPoints[Math.floor(i / 25) % seedPoints.length];
      const noise = (Math.sin(i * 0.2) * 0.015) + ((Math.random() - 0.48) * 0.025);
      const ret = regime + noise;
      const open = price;
      price = Math.max(20, price * (1 + ret));
      const high = Math.max(open, price) * (1 + Math.random() * 0.008);
      const low = Math.min(open, price) * (1 - Math.random() * 0.008);
      const close = price;

      data.push({
        day: i + 1,
        open,
        high,
        low,
        close
      });
    }
    this.priceData = data;
  }

  bindEvents() {
    const fastInput = document.getElementById('sim-fast');
    const slowInput = document.getElementById('sim-slow');
    const stoplossInput = document.getElementById('sim-stoploss');
    const fastVal = document.getElementById('sim-fast-val');
    const slowVal = document.getElementById('sim-slow-val');
    const stoplossVal = document.getElementById('sim-stoploss-val');
    const runBtn = document.getElementById('sim-run-btn');

    if (fastInput && fastVal) {
      fastInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        const slow = parseInt(slowInput.value);
        if (val >= slow) {
          val = slow - 1;
          fastInput.value = val;
        }
        fastVal.textContent = val;
        this.fastPeriod = val;
        this.run();
      });
    }

    if (slowInput && slowVal) {
      slowInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        const fast = parseInt(fastInput.value);
        if (val <= fast) {
          val = fast + 1;
          slowInput.value = val;
        }
        slowVal.textContent = val;
        this.slowPeriod = val;
        this.run();
      });
    }

    if (stoplossInput && stoplossVal) {
      stoplossInput.addEventListener('input', (e) => {
        stoplossVal.textContent = `${e.target.value}%`;
        this.stopLossPct = parseFloat(e.target.value);
        this.run();
      });
    }

    if (runBtn) {
      runBtn.addEventListener('click', () => {
        this.initData();
        this.run();
      });
    }

    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.render();
    });
  }

  // Calculate Simple Moving Average
  calculateSMA(period) {
    const sma = new Array(this.priceData.length).fill(null);
    for (let i = period - 1; i < this.priceData.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += this.priceData[i - j].close;
      }
      sma[i] = sum / period;
    }
    return sma;
  }

  // Run backtest execution logic
  run() {
    const fastSMA = this.calculateSMA(this.fastPeriod);
    const slowSMA = this.calculateSMA(this.slowPeriod);

    let position = 0; // 1: Long, 0: Cash
    let cash = this.initialCapital;
    let shares = 0;
    let entryPrice = 0;
    let tradesCount = 0;
    let winningTrades = 0;

    const equityCurve = [];
    const signals = []; // { dayIndex, type: 'BUY' | 'SELL', price }

    const startIndex = this.slowPeriod;

    for (let i = 0; i < this.priceData.length; i++) {
      const price = this.priceData[i].close;

      if (i >= startIndex) {
        const prevFast = fastSMA[i - 1];
        const prevSlow = slowSMA[i - 1];
        const currFast = fastSMA[i];
        const currSlow = slowSMA[i];

        // Hard Stop-Loss check
        if (position === 1 && this.stopLossPct > 0) {
          const lossPct = (entryPrice - price) / entryPrice * 100;
          if (lossPct >= this.stopLossPct) {
            cash = shares * price;
            shares = 0;
            position = 0;
            tradesCount++;
            if (price > entryPrice) winningTrades++;
            signals.push({ dayIndex: i, type: 'SELL', price, reason: 'STOP_LOSS' });
          }
        }

        // Golden Cross -> Buy Signal
        if (position === 0 && prevFast <= prevSlow && currFast > currSlow) {
          position = 1;
          shares = cash / price;
          cash = 0;
          entryPrice = price;
          tradesCount++;
          signals.push({ dayIndex: i, type: 'BUY', price, reason: 'GOLDEN_CROSS' });
        }
        // Death Cross -> Sell Signal
        else if (position === 1 && prevFast >= prevSlow && currFast < currSlow) {
          position = 0;
          cash = shares * price;
          shares = 0;
          tradesCount++;
          if (price > entryPrice) winningTrades++;
          signals.push({ dayIndex: i, type: 'SELL', price, reason: 'DEATH_CROSS' });
        }
      }

      const totalEquity = position === 1 ? shares * price : cash;
      equityCurve.push(totalEquity);
    }

    // Performance calculations
    const finalEquity = equityCurve[equityCurve.length - 1];
    const totalReturnPct = ((finalEquity - this.initialCapital) / this.initialCapital) * 100;
    const benchmarkReturnPct = ((this.priceData[this.priceData.length - 1].close - this.priceData[0].close) / this.priceData[0].close) * 100;

    // Daily returns & Sharpe Ratio
    let peak = equityCurve[0];
    let maxDrawdownPct = 0;
    const dailyReturns = [];

    for (let i = 1; i < equityCurve.length; i++) {
      if (equityCurve[i] > peak) peak = equityCurve[i];
      const dd = ((peak - equityCurve[i]) / peak) * 100;
      if (dd > maxDrawdownPct) maxDrawdownPct = dd;

      const dailyRet = (equityCurve[i] - equityCurve[i - 1]) / equityCurve[i - 1];
      dailyReturns.push(dailyRet);
    }

    const meanRet = dailyReturns.reduce((a, b) => a + b, 0) / (dailyReturns.length || 1);
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanRet, 2), 0) / (dailyReturns.length || 1);
    const stdDev = Math.sqrt(variance) || 0.0001;
    const annualRiskFree = 0.02;
    const dailyRf = annualRiskFree / 252;
    const sharpe = ((meanRet - dailyRf) / stdDev) * Math.sqrt(252);

    const winRatePct = tradesCount > 0 ? (winningTrades / Math.ceil(tradesCount / 2)) * 100 : 0;

    this.backtestResult = {
      fastSMA,
      slowSMA,
      equityCurve,
      signals,
      totalReturnPct,
      benchmarkReturnPct,
      sharpe: Math.max(-2.0, Math.min(6.0, sharpe)),
      maxDrawdownPct,
      tradesCount,
      winRatePct: Math.min(100, Math.max(0, winRatePct))
    };

    this.updateUI();
    this.render();
  }

  updateUI() {
    const res = this.backtestResult;
    if (!res) return;

    const elReturn = document.getElementById('res-return');
    const elBenchmark = document.getElementById('res-benchmark');
    const elSharpe = document.getElementById('res-sharpe');
    const elMdd = document.getElementById('res-mdd');
    const elTrades = document.getElementById('res-trades');
    const elWinrate = document.getElementById('res-winrate');

    if (elReturn) {
      elReturn.textContent = `${res.totalReturnPct >= 0 ? '+' : ''}${res.totalReturnPct.toFixed(2)}%`;
      elReturn.style.color = res.totalReturnPct >= 0 ? '#1F44FF' : '#DC2626';
    }
    if (elBenchmark) {
      elBenchmark.textContent = `${res.benchmarkReturnPct >= 0 ? '+' : ''}${res.benchmarkReturnPct.toFixed(2)}%`;
    }
    if (elSharpe) {
      elSharpe.textContent = res.sharpe.toFixed(2);
      elSharpe.style.color = res.sharpe >= 1.5 ? '#1F44FF' : '#111114';
    }
    if (elMdd) {
      elMdd.textContent = `-${res.maxDrawdownPct.toFixed(2)}%`;
      elMdd.style.color = res.maxDrawdownPct > 15 ? '#DC2626' : '#6B6A66';
    }
    if (elTrades) {
      elTrades.textContent = res.tradesCount;
    }
    if (elWinrate) {
      elWinrate.textContent = `${res.winRatePct.toFixed(1)}%`;
    }
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = 380;

    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  render() {
    this.resizeCanvas();
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    // Padding
    const padLeft = 55;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 40;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Price Bounds
    const prices = this.priceData.map(d => d.close);
    const minPrice = Math.min(...prices) * 0.96;
    const maxPrice = Math.max(...prices) * 1.04;
    const priceRange = maxPrice - minPrice || 1;

    const getX = (index) => padLeft + (index / (this.priceData.length - 1)) * plotW;
    const getY = (price) => padTop + (1 - (price - minPrice) / priceRange) * plotH;

    // Draw Background Grid
    ctx.strokeStyle = '#E5E3DC';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padTop + (i / gridLines) * plotH;
      const pVal = maxPrice - (i / gridLines) * priceRange;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = '#6B6A66';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`$${pVal.toFixed(1)}`, padLeft - 8, y + 3);
      ctx.setLineDash([4, 4]);
    }
    ctx.setLineDash([]);

    // Draw Slow SMA Line (Amber Gold)
    const slowSMA = this.backtestResult.slowSMA;
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let slowStarted = false;
    for (let i = 0; i < slowSMA.length; i++) {
      if (slowSMA[i] !== null) {
        const x = getX(i);
        const y = getY(slowSMA[i]);
        if (!slowStarted) {
          ctx.moveTo(x, y);
          slowStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.stroke();

    // Draw Fast SMA Line (Electric Cobalt)
    const fastSMA = this.backtestResult.fastSMA;
    ctx.strokeStyle = '#1F44FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let fastStarted = false;
    for (let i = 0; i < fastSMA.length; i++) {
      if (fastSMA[i] !== null) {
        const x = getX(i);
        const y = getY(fastSMA[i]);
        if (!fastStarted) {
          ctx.moveTo(x, y);
          fastStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.stroke();

    // Draw Price Candles or Line
    ctx.strokeStyle = '#111114';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < this.priceData.length; i++) {
      const x = getX(i);
      const y = getY(this.priceData[i].close);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw Signal Badges
    const signals = this.backtestResult.signals;
    signals.forEach(sig => {
      const x = getX(sig.dayIndex);
      const y = getY(sig.price);

      ctx.beginPath();
      if (sig.type === 'BUY') {
        ctx.fillStyle = '#1F44FF';
        ctx.moveTo(x, y + 6);
        ctx.lineTo(x - 5, y + 16);
        ctx.lineTo(x + 5, y + 16);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#1F44FF';
        ctx.textAlign = 'center';
        ctx.fillText('BUY', x, y + 27);
      } else {
        ctx.fillStyle = '#DC2626';
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x - 5, y - 16);
        ctx.lineTo(x + 5, y - 16);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#DC2626';
        ctx.textAlign = 'center';
        ctx.fillText('SELL', x, y - 20);
      }
    });

    // Legend
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';

    // Price Line Legend
    ctx.fillStyle = '#111114';
    ctx.fillRect(padLeft + 10, padTop - 15, 14, 2);
    ctx.fillText('资产收盘价 (Price)', padLeft + 30, padTop - 11);

    // Fast SMA Legend
    ctx.fillStyle = '#1F44FF';
    ctx.fillRect(padLeft + 180, padTop - 15, 14, 2);
    ctx.fillText(`快线 SMA (${this.fastPeriod}d)`, padLeft + 200, padTop - 11);

    // Slow SMA Legend
    ctx.fillStyle = '#D97706';
    ctx.fillRect(padLeft + 320, padTop - 15, 14, 2);
    ctx.fillText(`慢线 SMA (${this.slowPeriod}d)`, padLeft + 340, padTop - 11);
  }
}
