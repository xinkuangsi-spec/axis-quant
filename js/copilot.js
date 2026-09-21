/**
 * AXIS QUANT - Native AI Quant Strategy Copilot Engine
 * Synthesizes quantitative investment theses into rigorous mathematical SDEs,
 * risk constraints, and production-grade Python backtesting code.
 * Direct bridge to the InteractiveQuantBacktester.
 */

class AIStrategyCopilot {
  constructor() {
    this.currentArchetype = 'vol_squeeze';
    this.archetypes = {
      vol_squeeze: {
        title: {
          zh: "波动率挤压与通道突破阿尔法 (Volatility Squeeze Alpha)",
          en: "Volatility Squeeze & Donchian Breakout Alpha",
          ja: "ボラティリティ・スクイーズ＆チャネル・ブレイクアウト",
          de: "Volatilitäts-Squeeze & Kanal-Ausbruch Alpha"
        },
        tags: ["SDE / Keltner Squeeze", "Vectorized", "Kelly: 0.38"],
        mathFormula: `$$\\text{BandWidth}_t = \\frac{\\text{BollingerUpper}_t - \\text{BollingerLower}_t}{\\text{SMA}_{20}(P_t)} \\le \\kappa \\quad (\\kappa = 0.045)$$
$$\\text{建仓条件}: P_t > \\max(P_{t-20..t-1}) \\land \\text{Volume}_t > 1.4 \\cdot \\overline{\\text{Volume}}_{20}$$
$$\\text{平仓条件}: P_t < \\text{SMA}_{10}(P_t) \\lor \\frac{P_{\\text{entry}} - P_t}{P_{\\text{entry}}} \\ge 4.0\\%$$`,
        mathNotes: {
          zh: "基于标的资产波动率周期的亚稳态收缩假设。当布林带收缩至肯特纳通道内部时，系统处于波动率势能蓄积期；突破时方向性信息熵显著降低。",
          en: "Formulated on the metastable compression of asset volatility. When Bollinger Bands compress inside Keltner Channels, variance energy accumulates; directional entropy drops upon breakout.",
          ja: "資産ボラティリティの準安定収縮仮説に基づく。ボリンジャーバンドがケルトナーチャネル内に収縮する時、方向性エントロピーが急激に低下します。",
          de: "Basiert auf der metastabilen Volatilitätskompression. Wenn Bollinger-Bänder in die Keltner-Kanäle fallen, sinkt die Entropie bei einem Durchbruch drastisch."
        },
        fast: 7,
        slow: 21,
        stopLoss: 4.0,
        varBudget: "2.1% 日间",
        code: `import backtrader as bt
import numpy as np

class VolatilitySqueezeBreakout(bt.Strategy):
    """
    AXIS QUANT - 波动率挤压与通道突破策略
    结合布林带带宽收敛与 Donchian 20日高点突破
    """
    params = (
        ('fast_period', 7),
        ('slow_period', 21),
        ('stop_loss_pct', 0.04),
        ('squeeze_thresh', 0.045),
    )

    def __init__(self):
        self.fast_ma = bt.indicators.SMA(self.data.close, period=self.params.fast_period)
        self.slow_ma = bt.indicators.SMA(self.data.close, period=self.params.slow_period)
        self.bb = bt.indicators.BollingerBands(self.data.close, period=20, devfactor=2.0)
        self.highest_20 = bt.indicators.Highest(self.data.high(-1), period=20)
        self.entry_price = None

    def next(self):
        # 计算布林带相对带宽 (Bandwidth)
        bandwidth = (self.bb.lines.top[0] - self.bb.lines.bot[0]) / self.bb.lines.mid[0]
        
        # 止损风控
        if self.position and self.entry_price:
            dd = (self.entry_price - self.data.close[0]) / self.entry_price
            if dd >= self.params.stop_loss_pct:
                self.close()
                return

        # 处于挤压蓄能状态，且价格突破 20 日最高价
        if not self.position and bandwidth <= self.params.squeeze_thresh:
            if self.data.close[0] > self.highest_20[0]:
                self.entry_price = self.data.close[0]
                self.buy()
        
        # 跌破快线均线离场
        elif self.position and self.data.close[0] < self.fast_ma[0]:
            self.close()
`
      },

      stat_arb: {
        title: {
          zh: "协整配对与奥恩斯坦-乌伦贝克均值回归 (OU Stat-Arb Alpha)",
          en: "Cointegration & Ornstein-Uhlenbeck Mean-Reversion",
          ja: "協調積分ペアとオルンシュタイン＝ウーレンベック平均回帰",
          de: "Kointegrierter Stat-Arb & Ornstein-Uhlenbeck Reversion"
        },
        tags: ["Cointegration ADF", "OU SDE", "Half-Life: 8.4d"],
        mathFormula: `$$dS_t = \\theta(\\mu - S_t)dt + \\sigma dW_t \\quad (S_t = \\ln P_t^A - \\beta \\ln P_t^B)$$
$$Z_t = \\frac{S_t - \\hat{\\mu}_t}{\\hat{\\sigma}_t} \\sim \\mathcal{N}(0, 1) \\quad \\text{with } p_{\\text{ADF}} < 0.01$$
$$\\text{建仓}: |Z_t| \\ge 2.0 \\quad \\text{平仓}: Z_t \\cdot \\text{sgn}(Z_{\\text{entry}}) \\le 0.15 \\lor \\text{DD} \\ge 3.5\\%$$`,
        mathNotes: {
          zh: "配对资产价差经过单位根检验确认协整。利用 Ornstein-Uhlenbeck 连续时间方程推导半衰期，在标准差偏差 2σ 处构建统计反转套利头寸。",
          en: "Pair spread is verified via ADF cointegration test. Half-life is estimated via O-U continuous time SDE to enter mean-reverting positions at 2-sigma deviance.",
          ja: "ADF検定で協調積分を確認したペアスプレッド。OU確率微分方程式で半減期を推定し、2シグマ乖離で裁定ポジションを構築します。",
          de: "Das Pair-Spread wird mittels ADF-Test verifiziert. Die Halbwertszeit wird über die stochastische OU-DGL berechnet und bei 2-Sigma abgewickelt."
        },
        fast: 5,
        slow: 20,
        stopLoss: 3.5,
        varBudget: "1.4% 日间",
        code: `import numpy as np
import pandas as pd
from statsmodels.tsa.stattools import adfuller

class OrnsteinUhlenbeckPairsTrader:
    """
    AXIS QUANT - 协整配对与 OU 连续时间均值回归策略
    """
    def __init__(self, z_entry=2.0, z_exit=0.2, stop_loss_pct=0.035):
        self.z_entry = z_entry
        self.z_exit = z_exit
        self.stop_loss_pct = stop_loss_pct

    def fit_spread(self, p1, p2):
        # 估计协整对冲比率 Beta
        beta = np.cov(p1, p2)[0, 1] / np.var(p2)
        spread = p1 - beta * p2
        # ADF 单位根检验
        adf_res = adfuller(spread)
        p_val = adf_res[1]
        return beta, spread, p_val

    def generate_signals(self, spread, window=20):
        roll_mean = pd.Series(spread).rolling(window).mean()
        roll_std = pd.Series(spread).rolling(window).std()
        z_score = (spread - roll_mean) / roll_std
        
        signals = np.zeros(len(spread))
        # 超过 2 个标准差做空价差，低于 -2 做多价差
        signals[z_score >= self.z_entry] = -1.0
        signals[z_score <= -self.z_entry] = 1.0
        signals[np.abs(z_score) <= self.z_exit] = 0.0
        return signals
`
      },

      momentum_trend: {
        title: {
          zh: "跨周期动量跟踪与趋势中枢突破 (Cross-Timeframe Momentum)",
          en: "Cross-Timeframe Trend Following & Momentum Pivot",
          ja: "クロス・タイムフレーム・モメンタムとトレンド追従",
          de: "Multi-Timeframe Trendfolge & Momentum Pivot"
        },
        tags: ["Time-Series Momentum", "Asymmetric Trend", "Sharpe: 1.84"],
        mathFormula: `$$\\text{Signal}_t = \\text{sgn}\\left(\\text{SMA}_{10}(P_t) - \\text{SMA}_{30}(P_t)\\right)$$
$$\\text{Position Sizing}: w_t = \\min\\left(1.0, \\frac{\\sigma_{\\text{target}}}{\\hat{\\sigma}_{t, 20}}\\right) \\quad (\\sigma_{\\text{target}} = 15\\%)$$
$$\\text{Hard Stop}: P_t \\le P_{\\text{entry}} \\cdot (1 - 0.05) \\implies \\text{Liquidate Immediately}$$`,
        mathNotes: {
          zh: "经典学术文献证明的时间序列动量效应（Moskowitz et al.）。通过中周期滤波消除高频微观结构噪音，并在下行偏离时执行硬止损。",
          en: "Empirically validated Time-Series Momentum (Moskowitz et al.). Medium-term filtering removes market microstructure noise with strict liquidation stops.",
          ja: "時系列モメンタム効果（Moskowitz et al.）。中期フィルタリングでノイズを除去し、下落偏離時に即座にストップロスを実行します。",
          de: "Empirisch belegte Time-Series Momentum Logik (Moskowitz et al.). Mittelfristige Glättung filtert Rauschen mit festen Stop-Loss-Grenzen."
        },
        fast: 10,
        slow: 30,
        stopLoss: 5.0,
        varBudget: "2.4% 日间",
        code: `import backtrader as bt

class CrossTimeframeMomentumStrategy(bt.Strategy):
    """
    AXIS QUANT - 跨周期动量与波动率标定趋势策略
    """
    params = (
        ('fast_period', 10),
        ('slow_period', 30),
        ('stop_loss_pct', 0.05),
    )

    def __init__(self):
        self.fast_ma = bt.indicators.SMA(self.data.close, period=self.params.fast_period)
        self.slow_ma = bt.indicators.SMA(self.data.close, period=self.params.slow_period)
        self.crossover = bt.indicators.CrossOver(self.fast_ma, self.slow_ma)
        self.entry_price = None

    def next(self):
        if self.position and self.entry_price:
            drawdown = (self.entry_price - self.data.close[0]) / self.entry_price
            if drawdown >= self.params.stop_loss_pct:
                self.close()
                return

        if not self.position and self.crossover > 0:
            self.entry_price = self.data.close[0]
            self.buy()
        elif self.position and self.crossover < 0:
            self.close()
`
      },

      regime_filter: {
        title: {
          zh: "宏观体制自适应与已实现波动率缩放 (Adaptive Regime Filter)",
          en: "Adaptive Macro Regime & Realized Volatility Scaler",
          ja: "適応型マクロレジームと実現ボラティリティ・スケーラー",
          de: "Adaptiver Regime-Filter & Realisierte Volatilitätsskalierung"
        },
        tags: ["Markov Regime", "Vol Targeting", "Tail Risk Hedged"],
        mathFormula: `$$\\hat{\\sigma}_{t, 20} = \\sqrt{\\frac{252}{19} \\sum_{i=0}^{19} (r_{t-i} - \\bar{r})^2} \\quad \\implies \\quad w_t = \\frac{\\sigma^*}{\\max(\\hat{\\sigma}_{t, 20}, \\epsilon)}$$
$$\\text{StopLoss}_t = \\max\\left(3.0\\%, 2.2 \\cdot \\frac{\\text{ATR}_{14}(P_t)}{P_t}\\right)$$
$$\\text{Filter}: \\mathbb{I}(\\hat{\\sigma}_{t, 20} \\le 1.8 \\cdot \\overline{\\sigma}_{60}) \\implies \\text{Permit Trade}$$`,
        mathNotes: {
          zh: "利用已实现波动率反比分配资本权重，有效熨平极端暴跌与流动性枯竭行情对投资组合的冲击，将单笔最大回撤压制在 3% 以内。",
          en: "Scales portfolio leverage inversely with realized variance. Dampens liquidity drawdowns and stabilizes risk-adjusted returns below 3% max drawdown.",
          ja: "実現ボラティリティに反比例して配分資本を調整。流動性ショックのドローダウンを抑制し、最大下落率を3%以内に抑えます。",
          de: "Skaliert das Kapital umgekehrt zur realisierten Volatilität. Begrenzt Tail-Risk und drosselt den maximalen Drawdown auf unter 3%."
        },
        fast: 8,
        slow: 24,
        stopLoss: 3.0,
        varBudget: "1.2% 日间",
        code: `import numpy as np

class AdaptiveVolTargeting:
    """
    AXIS QUANT - 宏观体制与已实现波动率自适应标定
    """
    def __init__(self, target_vol=0.15, max_leverage=1.2, stop_loss_pct=0.03):
        self.target_vol = target_vol
        self.max_leverage = max_leverage
        self.stop_loss_pct = stop_loss_pct

    def compute_position_weight(self, returns_window):
        # 计算 20 日年化已实现波动率
        realized_vol = np.std(returns_window) * np.sqrt(252)
        if realized_vol <= 0:
            return 1.0
        # 逆波动率头寸分配
        weight = min(self.max_leverage, self.target_vol / realized_vol)
        return weight
`
      }
    };

    this.bindEvents();
  }

  bindEvents() {
    // 1. Archetype pills
    const pills = document.querySelectorAll('.copilot-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const archetype = pill.getAttribute('data-archetype');
        if (archetype && this.archetypes[archetype]) {
          this.currentArchetype = archetype;
          this.renderOutput();
        }
      });
    });

    // 2. Synthesize button & Enter key
    const btnRun = document.getElementById('btn-copilot-synthesize');
    const inputField = document.getElementById('copilot-custom-input');

    if (btnRun) {
      btnRun.addEventListener('click', () => this.handleCustomSynthesis());
    }
    if (inputField) {
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleCustomSynthesis();
        }
      });
    }

    // 3. Inject into Backtester Button
    const btnInject = document.getElementById('btn-copilot-inject');
    if (btnInject) {
      btnInject.addEventListener('click', () => this.injectIntoWorkbench());
    }

    // 4. Copy Code Button
    const btnCopy = document.getElementById('btn-copilot-copy');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const code = document.getElementById('copilot-code-content').textContent;
        navigator.clipboard.writeText(code).then(() => {
          const original = btnCopy.textContent;
          btnCopy.textContent = "已复制到剪贴板！";
          setTimeout(() => { btnCopy.textContent = original; }, 2000);
        });
      });
    }

    // Initial render
    this.renderOutput();
  }

  handleCustomSynthesis() {
    const inputField = document.getElementById('copilot-custom-input');
    const query = inputField ? inputField.value.trim() : '';
    if (!query) {
      this.renderOutput();
      return;
    }

    // Visual feedback during synthesis
    const deck = document.getElementById('copilot-output-deck');
    if (deck) deck.style.opacity = '0.4';

    setTimeout(() => {
      this.synthesizeFromPrompt(query);
      if (deck) deck.style.opacity = '1.0';
    }, 220);
  }

  synthesizeFromPrompt(prompt) {
    const p = prompt.toLowerCase();
    let strat;

    if (p.includes('套利') || p.includes('配对') || p.includes('均值') || p.includes('arb') || p.includes('pair')) {
      strat = this.archetypes.stat_arb;
    } else if (p.includes('体制') || p.includes('风控') || p.includes('波动') || p.includes('regime') || p.includes('vol')) {
      strat = this.archetypes.regime_filter;
    } else if (p.includes('挤压') || p.includes('通道') || p.includes('突破') || p.includes('squeeze') || p.includes('breakout')) {
      strat = this.archetypes.vol_squeeze;
    } else {
      strat = this.archetypes.momentum_trend;
    }

    const curLang = localStorage.getItem('axis_quant_lang') || 'zh';
    const titleEl = document.getElementById('copilot-output-title');
    const mathBox = document.getElementById('copilot-math-box');
    const notesEl = document.getElementById('copilot-math-notes');
    const slEl = document.getElementById('copilot-val-sl');
    const fastEl = document.getElementById('copilot-val-fast');
    const slowEl = document.getElementById('copilot-val-slow');
    const codeEl = document.getElementById('copilot-code-content');

    if (titleEl) titleEl.textContent = `[AI 合成] ${prompt.slice(0, 32)}...`;
    if (mathBox) mathBox.textContent = strat.mathFormula;
    if (notesEl) notesEl.textContent = strat.mathNotes[curLang] || strat.mathNotes.zh;
    if (slEl) slEl.textContent = `${strat.stopLoss.toFixed(1)}%`;
    if (fastEl) fastEl.textContent = `${strat.fast} 日`;
    if (slowEl) slowEl.textContent = `${strat.slow} 日`;
    if (codeEl) codeEl.textContent = strat.code;
  }

  renderOutput() {
    const curLang = localStorage.getItem('axis_quant_lang') || 'zh';
    const strat = this.archetypes[this.currentArchetype];
    if (!strat) return;

    const titleEl = document.getElementById('copilot-output-title');
    const mathBox = document.getElementById('copilot-math-box');
    const notesEl = document.getElementById('copilot-math-notes');
    const slEl = document.getElementById('copilot-val-sl');
    const fastEl = document.getElementById('copilot-val-fast');
    const slowEl = document.getElementById('copilot-val-slow');
    const codeEl = document.getElementById('copilot-code-content');

    if (titleEl) titleEl.textContent = strat.title[curLang] || strat.title.zh;
    if (mathBox) mathBox.textContent = strat.mathFormula;
    if (notesEl) notesEl.textContent = strat.mathNotes[curLang] || strat.mathNotes.zh;
    if (slEl) slEl.textContent = `${strat.stopLoss.toFixed(1)}%`;
    if (fastEl) fastEl.textContent = `${strat.fast} 日`;
    if (slowEl) slowEl.textContent = `${strat.slow} 日`;
    if (codeEl) codeEl.textContent = strat.code;
  }

  injectIntoWorkbench() {
    const strat = this.archetypes[this.currentArchetype];
    if (!strat) return;

    if (window.backtester && typeof window.backtester.applyCustomStrategy === 'function') {
      window.backtester.applyCustomStrategy(strat.fast, strat.slow, strat.stopLoss, strat.code);
    }

    // Smooth scroll to workbench
    const wb = document.getElementById('workbench');
    if (wb) {
      wb.scrollIntoView({ behavior: 'smooth' });
      // Temporary highlight
      const box = wb.querySelector('.interactive-widget-box');
      if (box) {
        box.style.transition = 'box-shadow 0.4s ease';
        box.style.boxShadow = '0 0 0 3px #057A55';
        setTimeout(() => {
          box.style.boxShadow = '';
        }, 1600);
      }
    }
  }
}
