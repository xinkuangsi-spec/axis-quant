/**
 * AXIS QUANT - High-Frequency Limit Order Book (L2) & Microstructure Simulation
 * Simulates real-time bids/asks queue, trade tape, order book imbalance (OBI),
 * and liquidity replenishment after market order impacts.
 */

class MicrostructureSimulator {
  constructor() {
    this.midPrice = 520.40;
    this.tickSize = 0.05;
    this.levels = 8;
    this.bids = [];
    this.asks = [];
    this.trades = [];
    this.maxTrades = 12;
    this.isRunning = true;

    this.initOrderBook();
    this.bindDOM();
    this.startStreaming();
  }

  initOrderBook() {
    this.bids = [];
    this.asks = [];

    for (let i = 0; i < this.levels; i++) {
      const askPrice = this.midPrice + (i + 1) * this.tickSize;
      const askSize = Math.floor(Math.random() * 400 + 150);
      this.asks.push({ price: askPrice, size: askSize });

      const bidPrice = this.midPrice - (i + 1) * this.tickSize;
      const bidSize = Math.floor(Math.random() * 400 + 150);
      this.bids.push({ price: bidPrice, size: bidSize });
    }
  }

  bindDOM() {
    this.asksTable = document.getElementById('ob-asks-body');
    this.bidsTable = document.getElementById('ob-bids-body');
    this.tradesList = document.getElementById('ob-trades-list');
    this.midPriceEl = document.getElementById('ob-mid-price');
    this.spreadEl = document.getElementById('ob-spread-val');
    this.obiValEl = document.getElementById('ob-obi-val');
    this.obiBarEl = document.getElementById('ob-obi-bar');

    const btnBuy = document.getElementById('btn-order-buy');
    const btnSell = document.getElementById('btn-order-sell');
    const btnReset = document.getElementById('btn-order-reset');

    if (btnBuy) {
      btnBuy.addEventListener('click', () => this.injectMarketOrder('BUY', 450));
    }
    if (btnSell) {
      btnSell.addEventListener('click', () => this.injectMarketOrder('SELL', 450));
    }
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.midPrice = 520.40;
        this.initOrderBook();
        this.trades = [];
        this.render();
      });
    }
  }

  injectMarketOrder(side, quantity) {
    let remaining = quantity;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

    if (side === 'BUY') {
      // Sweeps through asks from lowest to highest
      while (remaining > 0 && this.asks.length > 0) {
        const topAsk = this.asks[0];
        const fillQty = Math.min(remaining, topAsk.size);
        remaining -= fillQty;
        topAsk.size -= fillQty;

        this.trades.unshift({
          time: timeStr,
          side: 'BUY',
          price: topAsk.price,
          qty: fillQty
        });

        if (topAsk.size <= 0) {
          this.midPrice = topAsk.price;
          this.asks.shift();
          // Add new outer level
          const lastAsk = this.asks[this.asks.length - 1];
          const newPrice = lastAsk ? lastAsk.price + this.tickSize : this.midPrice + this.tickSize;
          this.asks.push({ price: newPrice, size: Math.floor(Math.random() * 300 + 100) });
        }
      }
    } else {
      // Sweeps through bids from highest to lowest
      while (remaining > 0 && this.bids.length > 0) {
        const topBid = this.bids[0];
        const fillQty = Math.min(remaining, topBid.size);
        remaining -= fillQty;
        topBid.size -= fillQty;

        this.trades.unshift({
          time: timeStr,
          side: 'SELL',
          price: topBid.price,
          qty: fillQty
        });

        if (topBid.size <= 0) {
          this.midPrice = topBid.price;
          this.bids.shift();
          // Add new outer level
          const lastBid = this.bids[this.bids.length - 1];
          const newPrice = lastBid ? lastBid.price - this.tickSize : this.midPrice - this.tickSize;
          this.bids.push({ price: newPrice, size: Math.floor(Math.random() * 300 + 100) });
        }
      }
    }

    if (this.trades.length > this.maxTrades) {
      this.trades = this.trades.slice(0, this.maxTrades);
    }

    this.render();
  }

  tickSimulation() {
    if (!this.isRunning) return;

    // Small stochastic noise: market makers tweaking liquidity
    const askIdx = Math.floor(Math.random() * this.asks.length);
    const bidIdx = Math.floor(Math.random() * this.bids.length);

    this.asks[askIdx].size = Math.max(50, this.asks[askIdx].size + Math.floor((Math.random() - 0.48) * 35));
    this.bids[bidIdx].size = Math.max(50, this.bids[bidIdx].size + Math.floor((Math.random() - 0.48) * 35));

    // Occasional passive order fill
    if (Math.random() < 0.35) {
      const isBuy = Math.random() > 0.5;
      const fillQty = Math.floor(Math.random() * 80 + 20);
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

      if (isBuy && this.asks[0]) {
        this.trades.unshift({ time: timeStr, side: 'BUY', price: this.asks[0].price, qty: fillQty });
        this.asks[0].size = Math.max(30, this.asks[0].size - fillQty);
      } else if (!isBuy && this.bids[0]) {
        this.trades.unshift({ time: timeStr, side: 'SELL', price: this.bids[0].price, qty: fillQty });
        this.bids[0].size = Math.max(30, this.bids[0].size - fillQty);
      }

      if (this.trades.length > this.maxTrades) {
        this.trades = this.trades.slice(0, this.maxTrades);
      }
    }

    this.render();
  }

  startStreaming() {
    setInterval(() => this.tickSimulation(), 350);
  }

  render() {
    if (!this.asksTable || !this.bidsTable) return;

    const totalAskVol = this.asks.reduce((sum, a) => sum + a.size, 0);
    const totalBidVol = this.bids.reduce((sum, b) => sum + b.size, 0);
    const maxSingleSize = Math.max(...this.asks.map(a => a.size), ...this.bids.map(b => b.size), 600);

    // Order Book Imbalance (OBI): (BidVol - AskVol) / (BidVol + AskVol)
    const obi = (totalBidVol - totalAskVol) / (totalBidVol + totalAskVol || 1);

    // Update Top Stats
    const bestAsk = this.asks[0] ? this.asks[0].price : this.midPrice;
    const bestBid = this.bids[0] ? this.bids[0].price : this.midPrice;
    const spread = (bestAsk - bestBid);

    if (this.midPriceEl) this.midPriceEl.textContent = `$${this.midPrice.toFixed(2)}`;
    if (this.spreadEl) this.spreadEl.textContent = `$${Math.max(0, spread).toFixed(2)}`;

    if (this.obiValEl) {
      this.obiValEl.textContent = `${obi >= 0 ? '+' : ''}${(obi * 100).toFixed(1)}%`;
      this.obiValEl.style.color = obi >= 0 ? '#10B981' : '#EF4444';
    }
    if (this.obiBarEl) {
      // 50% is neutral
      const pct = Math.max(5, Math.min(95, 50 + obi * 50));
      this.obiBarEl.style.width = `${pct}%`;
      this.obiBarEl.style.background = obi >= 0 ? '#10B981' : '#EF4444';
    }

    // Render Asks (Reverse so highest ask is at top)
    const reversedAsks = [...this.asks].reverse();
    let asksHtml = '';
    reversedAsks.forEach(a => {
      const depthPct = (a.size / maxSingleSize) * 100;
      asksHtml += `
        <div class="ob-row ask-row">
          <span class="ob-price ask-price">$${a.price.toFixed(2)}</span>
          <span class="ob-size">${a.size}</span>
          <div class="ob-depth-bar ask-bar" style="width: ${depthPct}%;"></div>
        </div>
      `;
    });
    this.asksTable.innerHTML = asksHtml;

    // Render Bids
    let bidsHtml = '';
    this.bids.forEach(b => {
      const depthPct = (b.size / maxSingleSize) * 100;
      bidsHtml += `
        <div class="ob-row bid-row">
          <span class="ob-price bid-price">$${b.price.toFixed(2)}</span>
          <span class="ob-size">${b.size}</span>
          <div class="ob-depth-bar bid-bar" style="width: ${depthPct}%;"></div>
        </div>
      `;
    });
    this.bidsTable.innerHTML = bidsHtml;

    // Render Trade Tape
    if (this.tradesList) {
      let tradesHtml = '';
      this.trades.forEach(t => {
        const isBuy = t.side === 'BUY';
        tradesHtml += `
          <div class="tape-row ${isBuy ? 'tape-buy' : 'tape-sell'}">
            <span class="tape-time">${t.time}</span>
            <span class="tape-side">${isBuy ? '买入 B' : '卖出 S'}</span>
            <span class="tape-price">$${t.price.toFixed(2)}</span>
            <span class="tape-qty">${t.qty}</span>
          </div>
        `;
      });
      this.tradesList.innerHTML = tradesHtml || '<div class="tape-empty">等待撮合数据流...</div>';
    }
  }
}
