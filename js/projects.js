/**
 * AXIS QUANT - Curated Open-Source Quant Projects & Interactive Tutorials
 */

const QUANT_PROJECTS = [
  {
    id: "vectorbt",
    name: "VectorBT",
    category: "backtest",
    stars: "4.8k+",
    lang: "Python / Numba",
    desc: {
      zh: "基于 Numba 编译加速的极速向量化回测与超参数探索引擎，秒级遍历数万次参数组合。",
      en: "Ultra-fast vectorized backtesting and parameter exploration engine powered by Numba JIT.",
      ja: "Numba JITを活用した超高速ベクトル化バックテスト＆ハイパーパラメータ探索ライブラリ。",
      de: "Extrem schnelle vektorisierte Backtest-Engine mit Numba JIT für blitzschnelle Parameterraster."
    },
    url: "https://github.com/polakowo/vectorbt",
    code: `import vectorbt as vbt

# 抓取标的并执行双均线跨周期快速回测
price = vbt.YFData.download('SPY').get('Close')
fast_ma = vbt.MA.run(price, 10)
slow_ma = vbt.MA.run(price, 30)

entries = fast_ma.ma_crossed_above(slow_ma)
exits = fast_ma.ma_crossed_below(slow_ma)

portfolio = vbt.Portfolio.from_signals(price, entries, exits, init_cash=100000)
print(portfolio.total_return())
print(portfolio.sharpe_ratio())`
  },
  {
    id: "backtrader",
    name: "Backtrader",
    category: "backtest",
    stars: "14.2k+",
    lang: "Python",
    desc: {
      zh: "量化工业界最经典的事件驱动回测框架，支持多标的、动态杠杆、滑点建模与实盘交易无缝迁移。",
      en: "Feature-rich, event-driven quantitative trading framework supporting multi-asset feeds and live brokers.",
      ja: "実務で広く使われるイベント駆動型バックテストフレームワーク。多銘柄・ブローカー実盤接続対応。",
      de: "Klassisches ereignisgesteuertes Python-Framework für Multi-Asset-Backtesting und Live-Broker."
    },
    url: "https://github.com/mementum/backtrader",
    code: `import backtrader as bt

class SmaStrategy(bt.Strategy):
    params = (('period', 20),)
    def __init__(self):
        self.sma = bt.indicators.SMA(self.data.close, period=self.params.period)
    def next(self):
        if not self.position and self.data.close[0] > self.sma[0]:
            self.buy()
        elif self.position and self.data.close[0] < self.sma[0]:
            self.close()

cerebro = bt.Cerebro()
cerebro.addstrategy(SmaStrategy)
# cerebro.run()`
  },
  {
    id: "qlib",
    name: "Microsoft Qlib",
    category: "ai_ml",
    stars: "16.8k+",
    lang: "Python / C++",
    desc: {
      zh: "微软亚洲研究院开源的 AI 导向量化投资平台，覆盖全流程高维因子挖掘、GBDT 与深度时序模型。",
      en: "Microsoft's AI-oriented quantitative investment platform covering data mining, GBDT, and DL forecasting.",
      ja: "マイクロソフト開発のAI指向クオンツ投資プラットフォーム。高次元特徴抽出とGBDT/深層学習。",
      de: "Microsofts KI-orientierte Quant-Plattform für Datenspeicherung, Modellierung und Alpha-Mining."
    },
    url: "https://github.com/microsoft/qlib",
    code: `import qlib
from qlib.constant import REG_US
from qlib.utils import init_instance_by_config
from qlib.workflow import R

qlib.init(provider_uri="~/.qlib/qlib_data/us_data", region=REG_US)
# 初始化数据集与 LightGBM 模型
# model = init_instance_by_config(model_config)
# model.fit(dataset)`
  },
  {
    id: "finrl",
    name: "FinRL",
    category: "ai_ml",
    stars: "9.5k+",
    lang: "Python / PyTorch",
    desc: {
      zh: "基于 OpenAI Gym 的全栈金融深度强化学习框架，支持 DDPG、PPO、SAC 算法训练多智能体交易。",
      en: "Deep Reinforcement Learning (DRL) framework for algorithmic trading based on OpenAI Gym and PyTorch.",
      ja: "金融特化の深層強化学習（DRL）フレームワーク。DDPG、PPO等のエージェント学習を標準サポート。",
      de: "Deep Reinforcement Learning Framework für algorithmischen Handel auf Basis von OpenAI Gym."
    },
    url: "https://github.com/AI4Finance-Foundation/FinRL",
    code: `from finrl.agents.stablebaselines3.models import DRLAgent
from finrl.meta.env_stock_trading.env_stocktrading import StockTradingEnv

# 构建强化学习交易环境与 PPO 智能体
# env = StockTradingEnv(df=processed_df, **env_kwargs)
# agent = DRLAgent(env=env)
# ppo_model = agent.get_model("ppo")`
  },
  {
    id: "nautilus",
    name: "NautilusTrader",
    category: "execution",
    stars: "6.1k+",
    lang: "Rust / Python / Cython",
    desc: {
      zh: "纳秒级生产级事件驱动量化交易系统，底层由 Rust 构建，专为高频做市、低延迟套利与多账户执行设计。",
      en: "High-performance algorithmic trading platform built in Rust and Cython for low-latency execution.",
      ja: "RustとCythonで構築された超低遅延・高頻度トレード向けプロダクション級執行システム。",
      de: "Hochperformante Handelsplattform in Rust und Cython für extrem niedrige Latenzen und HFT."
    },
    url: "https://github.com/nautechsystems/nautilus_trader",
    code: `from nautilus_trader.config import StrategyConfig
from nautilus_trader.trading.strategy import Strategy

class MarketMaker(Strategy):
    def on_order_book_delta(self, delta):
        # 纳秒级订单簿变化回调与微观结构做市报价
        pass`
  },
  {
    id: "hummingbot",
    name: "Hummingbot",
    category: "execution",
    stars: "8.3k+",
    lang: "Python / Cython",
    desc: {
      zh: "模块化做市与网格套利机器人，内置订单簿失衡、跨交易所做市（CMM）与永续合约套保策略。",
      en: "Open-source framework for building high-frequency market making and cross-exchange arbitrage bots.",
      ja: "自動マーケットメイクとクロス取引所裁定取引に特化したモジュール式ボットフレームワーク。",
      de: "Open-Source-Bot für algorithmisches Market-Making und Cross-Exchange-Arbitrage."
    },
    url: "https://github.com/hummingbot/hummingbot",
    code: `# Hummingbot 支持 CLI 与 Python Script 策略扩展
# 示例：通过 Pure Market Making 模块在买卖一档挂单捕捉利差
# ./bin/hummingbot`
  },
  {
    id: "ccxt",
    name: "CCXT",
    category: "execution",
    stars: "34.5k+",
    lang: "JavaScript / Python / PHP",
    desc: {
      zh: "连接全球 100+ 交易所的统一接口库，支持毫秒级订单撮合路由、WebSocket 深度行情与资产划转。",
      en: "A JavaScript / Python / PHP cryptocurrency trading library with 100+ exchange integrations.",
      ja: "世界100以上の取引所APIを単一インターフェースで統合する業界標準ライブラリ。",
      de: "Branchenstandard-Bibliothek zur einheitlichen Anbindung von über 100 weltweiten Krypto-Börsen."
    },
    url: "https://github.com/ccxt/ccxt",
    code: `import ccxt

exchange = ccxt.binance({
    'apiKey': 'YOUR_API_KEY',
    'secret': 'YOUR_SECRET',
    'enableRateLimit': True,
})
# 获取实时订单簿
orderbook = exchange.fetch_order_book('BTC/USDT')
bid = orderbook['bids'][0][0] if len(orderbook['bids']) > 0 else None
ask = orderbook['asks'][0][0] if len(orderbook['asks']) > 0 else None`
  },
  {
    id: "talib",
    name: "TA-Lib / Pandas-TA",
    category: "data",
    stars: "11.1k+",
    lang: "C / Python",
    desc: {
      zh: "涵盖 150+ 经典技术分析与动量因子的工业标准底层计算库（RSI, MACD, 布林带, ATR）。",
      en: "Widely-used industrial calculation engine for 150+ technical indicators and momentum factors.",
      ja: "150以上のテクニカル指標とモメンタム因子を高速計算する世界標準ライブラリ。",
      de: "Leistungsstarke C/Python-Bibliothek für über 150 technische Indikatoren und quantitative Faktoren."
    },
    url: "https://github.com/ta-lib/ta-lib-python",
    code: `import talib
import numpy as np

close = np.random.random(100)
# 计算 RSI 与 布林带
rsi = talib.RSI(close, timeperiod=14)
upper, middle, lower = talib.BBANDS(close, timeperiod=20)`
  },
  {
    id: "openbb",
    name: "OpenBB Terminal",
    category: "data",
    stars: "39.0k+",
    lang: "Python",
    desc: {
      zh: "全球最活跃的开源金融终端，提供宏观经济、外汇、股票微观基本面与量化计量分析工具箱。",
      en: "Open-source Bloomberg Terminal alternative providing multi-asset market data and econometric tools.",
      ja: "ブルームバーグ端末のオープンソース代替。マクロ経済、株式、為替、暗号資産の総合データ基盤。",
      de: "Die führende Open-Source-Alternative zum Bloomberg Terminal für quantitative Marktdaten."
    },
    url: "https://github.com/OpenBB-finance/OpenBB",
    code: `from openbb import obb

# 获取标的历史行情与因子数据
data = obb.equity.price.historical(symbol="NVDA", provider="fmp")
df = data.to_df()`
  },
  {
    id: "lean",
    name: "QuantConnect LEAN",
    category: "backtest",
    stars: "10.4k+",
    lang: "C# / Python",
    desc: {
      zh: "专为机构多资产组合设计的跨资产事件驱动引擎，支持股票、期权、外汇、期货与加密资产。",
      en: "Industrial-strength, event-driven trading engine built in C# with full Python bindings for multi-asset portfolios.",
      ja: "機関投資家向けの本格的イベント駆動エンジン。株式・先物・オプションの複合ポートフォリオに対応。",
      de: "Leistungsstarke, modulare Handels-Engine in C# und Python für Multi-Asset-Portfolios."
    },
    url: "https://github.com/QuantConnect/Lean",
    code: `from AlgorithmImports import *

class DualCross(QCAlgorithm):
    def Initialize(self):
        self.SetStartDate(2023, 1, 1)
        self.SetCash(100000)
        self.AddEquity("SPY", Resolution.Minute)`
  }
];

function initOpenSourceProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  const curLang = localStorage.getItem('axis_quant_lang') || 'zh';

  function render(filter = 'all') {
    grid.innerHTML = '';
    const filtered = filter === 'all' 
      ? QUANT_PROJECTS 
      : QUANT_PROJECTS.filter(p => p.category === filter);

    filtered.forEach(proj => {
      const card = document.createElement('div');
      card.className = 'project-card';
      const descText = proj.desc[curLang] || proj.desc.zh;

      card.innerHTML = `
        <div class="project-header">
          <div>
            <h3 class="project-name">${proj.name}</h3>
            <span class="project-lang">${proj.lang}</span>
          </div>
          <span class="project-stars">★ ${proj.stars}</span>
        </div>
        <p class="project-desc">${descText}</p>
        <div class="project-footer">
          <button class="btn-proj-code" data-proj-id="${proj.id}">查看核心代码</button>
          <a href="${proj.url}" target="_blank" rel="noopener" class="btn-proj-github">GitHub 仓库 →</a>
        </div>
      `;
      grid.appendChild(card);
    });

    // Wire up code preview buttons
    grid.querySelectorAll('.btn-proj-code').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-proj-id');
        const proj = QUANT_PROJECTS.find(p => p.id === id);
        if (proj) openCodeModal(proj);
      });
    });
  }

  // Filter Buttons
  const filterBtns = document.querySelectorAll('.proj-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat') || 'all';
      render(cat);
    });
  });

  render('all');
}

function openCodeModal(proj) {
  const modal = document.getElementById('code-preview-modal');
  const title = document.getElementById('code-modal-title');
  const codeEl = document.getElementById('code-modal-body');
  const link = document.getElementById('code-modal-link');

  if (!modal || !title || !codeEl) return;

  title.textContent = `${proj.name} · 快速启动模板 (${proj.lang})`;
  codeEl.textContent = proj.code;
  if (link) link.href = proj.url;

  modal.classList.add('open');
}

function initCodeModal() {
  const modal = document.getElementById('code-preview-modal');
  const closeBtn = document.getElementById('code-modal-close');
  if (!modal || !closeBtn) return;

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  const copyBtn = document.getElementById('code-modal-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const code = document.getElementById('code-modal-body').textContent;
      navigator.clipboard.writeText(code).then(() => {
        const orig = copyBtn.textContent;
        copyBtn.textContent = "已复制！";
        setTimeout(() => copyBtn.textContent = orig, 1800);
      });
    });
  }
}
