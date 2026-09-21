/**
 * AXIS QUANT - Google Ecosystem Integration Suite
 * 1. Google Colab One-Click Strategy Execution
 * 2. Google Charts (Google Visualization API) Candlestick & Indicator View
 * 3. Google Trends Alternative Data Alpha Radar
 * 4. Google AdSense Responsive High-RPM Ad Units
 * 5. react-bits SpotlightCard Dynamic Cursor Lighting
 */

class GoogleSuiteManager {
  constructor() {
    this.googleChartsLoaded = false;
    this.currentChartMode = 'canvas'; // 'canvas' | 'google-charts'
    this.init();
  }

  init() {
    this.initSpotlightCards();
    this.initGoogleChartsLoader();
    this.initGoogleTrendsRadar();
    this.initColabLauncher();
  }

  // 1. react-bits SpotlightCard implementation
  initSpotlightCards() {
    const cards = document.querySelectorAll('.card-spotlight');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  // 2. Google Charts Integration (Visualization API)
  initGoogleChartsLoader() {
    if (typeof google !== 'undefined' && google.charts) {
      google.charts.load('current', { packages: ['corechart'] });
      google.charts.setOnLoadCallback(() => {
        this.googleChartsLoaded = true;
        this.renderGoogleCandleChart();
      });
    }

    const toggleBtn = document.getElementById('chart-engine-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const canvasContainer = document.getElementById('sim-canvas');
        const googleContainer = document.getElementById('google-chart-view');

        if (this.currentChartMode === 'canvas') {
          this.currentChartMode = 'google-charts';
          if (canvasContainer) canvasContainer.style.display = 'none';
          if (googleContainer) {
            googleContainer.style.display = 'block';
            this.renderGoogleCandleChart();
          }
          toggleBtn.textContent = '切换为: 极速 Canvas 回测引擎';
        } else {
          this.currentChartMode = 'canvas';
          if (canvasContainer) canvasContainer.style.display = 'block';
          if (googleContainer) googleContainer.style.display = 'none';
          toggleBtn.textContent = '切换为: Google Charts 专业蜡烛图';
        }
      });
    }
  }

  renderGoogleCandleChart() {
    const container = document.getElementById('google-chart-view');
    if (!container || !this.googleChartsLoaded || typeof google === 'undefined') return;

    // Use simulator prices if available
    const sim = window.quantSimInstance;
    if (!sim || !sim.priceData || sim.priceData.length === 0) return;

    const dataArray = [['Day', 'Low', 'Open', 'Close', 'High']];
    sim.priceData.slice(-60).forEach(d => {
      dataArray.push([
        `D${d.day}`,
        Math.round(d.low * 100) / 100,
        Math.round(d.open * 100) / 100,
        Math.round(d.close * 100) / 100,
        Math.round(d.high * 100) / 100
      ]);
    });

    const dataTable = google.visualization.arrayToDataTable(dataArray, true);

    const options = {
      legend: 'none',
      backgroundColor: 'transparent',
      bar: { groupWidth: '85%' },
      candlestick: {
        fallingColor: { strokeWidth: 1, fill: '#DC2626', stroke: '#DC2626' },
        risingColor: { strokeWidth: 1, fill: '#1F44FF', stroke: '#1F44FF' }
      },
      hAxis: {
        textStyle: { color: '#6B6A66', fontName: 'JetBrains Mono', fontSize: 10 },
        gridlines: { color: '#E5E3DC' }
      },
      vAxis: {
        textStyle: { color: '#6B6A66', fontName: 'JetBrains Mono', fontSize: 10 },
        gridlines: { color: '#E5E3DC' },
        format: '$#,###.0'
      },
      chartArea: { width: '88%', height: '80%' }
    };

    const chart = new google.visualization.CandlestickChart(container);
    chart.draw(dataTable, options);
  }

  // 3. Google Trends Alternative Data Alpha Radar
  initGoogleTrendsRadar() {
    const trendKeywords = [
      { name: 'Bitcoin Halving', score: 94, delta: '+38%', signal: 'BULLISH_MOMENTUM' },
      { name: 'Federal Reserve Rate Cut', score: 82, delta: '+22%', signal: 'MACRO_VOLATILITY' },
      { name: 'Quant Trading Python', score: 88, delta: '+45%', signal: 'RETAIL_FLOW' },
      { name: 'Stock Market Crash', score: 26, delta: '-14%', signal: 'LOW_PANIC_INDEX' }
    ];

    const radarContainer = document.getElementById('google-trends-radar-list');
    if (!radarContainer) return;

    radarContainer.innerHTML = trendKeywords.map(k => `
      <div class="trend-item-row">
        <div class="trend-keyword">
          <span class="google-icon">G</span>
          <strong>${k.name}</strong>
        </div>
        <div class="trend-bar-wrapper">
          <div class="trend-bar-fill" style="width: ${k.score}%;"></div>
        </div>
        <div class="trend-score mono-tag">${k.score}/100</div>
        <div class="trend-delta mono-tag ${k.delta.startsWith('+') ? 'positive' : 'negative'}">${k.delta}</div>
        <div class="trend-signal mono-tag">${k.signal}</div>
      </div>
    `).join('');
  }

  // 4. Google Colab Interactive Launcher
  initColabLauncher() {
    const colabBtns = document.querySelectorAll('.btn-open-colab');
    colabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const notebookUrl = 'https://colab.research.google.com/github/xinkuangsi-spec/axis-quant/blob/main/notebooks/quant_tutorial_sma.ipynb';
        window.open(notebookUrl, '_blank', 'noopener,noreferrer');
      });
    });
  }
}
