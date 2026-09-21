/**
 * AXIS QUANT - Dynamic Market Stochastic Particle & Order Flow Simulation
 * Real-time HTML5 Canvas engine rendering Brownian motion, Ornstein-Uhlenbeck drift,
 * and high-frequency order-flow network graph.
 */

class DynamicQuantFlow {
  constructor(canvasId = 'hero-dynamic-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.particles = [];
    this.numParticles = 90;
    this.mouse = { x: -1000, y: -1000, active: false, radius: 140 };
    this.mode = 'order_flow'; // 'order_flow', 'brownian', 'ou_reversion'
    this.isRunning = true;
    this.isVisible = true;

    this.initDimensions();
    this.initParticles();
    this.bindEvents();
    this.loop();
  }

  initDimensions() {
    const parent = this.canvas.parentElement;
    this.w = parent.clientWidth;
    this.h = parent.clientHeight || 560;

    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  initParticles() {
    this.particles = [];
    const colors = ['rgba(56, 189, 248, ', 'rgba(52, 211, 153, ', 'rgba(251, 191, 36, ', 'rgba(167, 139, 250, '];

    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.4) * 1.8,
        vy: (Math.random() - 0.5) * 0.9,
        size: Math.random() * 2.2 + 1.2,
        baseColor: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.3,
        trail: [],
        maxTrail: Math.floor(Math.random() * 12 + 6),
        driftTargetX: Math.random() * this.w,
        driftTargetY: Math.random() * this.h
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.initDimensions();
    });

    const parent = this.canvas.parentElement;
    parent.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.active = true;
    });

    parent.addEventListener('mouseleave', () => {
      this.mouse.active = false;
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });

    // Observer for offscreen pausing
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.1 });
      observer.observe(this.canvas);
    }

    // Mode toggles
    const modeBtns = document.querySelectorAll('.flow-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mode = btn.getAttribute('data-mode') || 'order_flow';
      });
    });
  }

  update() {
    const w = this.w;
    const h = this.h;
    const dt = 1.0;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Save trail history
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > p.maxTrail) p.trail.pop();

      // Dynamics based on mode
      if (this.mode === 'brownian') {
        // Pure Brownian Random Walk: dX = sigma * dW
        p.vx += (Math.random() - 0.5) * 0.4;
        p.vy += (Math.random() - 0.5) * 0.4;
        p.vx = Math.max(-2.5, Math.min(2.5, p.vx));
        p.vy = Math.max(-1.8, Math.min(1.8, p.vy));
      } else if (this.mode === 'ou_reversion') {
        // Ornstein-Uhlenbeck Mean-Reverting: dX = theta * (target - X) dt + sigma dW
        const targetX = this.mouse.active ? this.mouse.x : p.driftTargetX;
        const targetY = this.mouse.active ? this.mouse.y : p.driftTargetY;
        const theta = 0.015;
        p.vx += theta * (targetX - p.x) + (Math.random() - 0.5) * 0.6;
        p.vy += theta * (targetY - p.y) + (Math.random() - 0.5) * 0.6;
        p.vx *= 0.94;
        p.vy *= 0.94;
      } else {
        // Order Flow: Stream left to right with stochastic volatility
        p.vx += (1.4 - p.vx) * 0.05 + (Math.random() - 0.48) * 0.3;
        p.vy += (Math.random() - 0.5) * 0.25;
        p.vy *= 0.95;
      }

      // Mouse repulsive / dispersion effect
      if (this.mouse.active && this.mode !== 'ou_reversion') {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius && dist > 1) {
          const force = (1 - dist / this.mouse.radius) * 3.5;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Wrap around bounds
      if (p.x > w + 20) { p.x = -20; p.trail = []; }
      if (p.x < -20) { p.x = w + 20; p.trail = []; }
      if (p.y > h + 20) { p.y = -20; p.trail = []; }
      if (p.y < -20) { p.y = h + 20; p.trail = []; }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    // Draw connecting graph edges for order-flow network
    const maxDist = 95;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.18;
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    // Draw particle trails
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        for (let t = 0; t < p.trail.length; t++) {
          ctx.lineTo(p.trail[t].x, p.trail[t].y);
        }
        ctx.strokeStyle = `${p.baseColor}0.18)`;
        ctx.lineWidth = p.size * 0.7;
        ctx.stroke();
      }

      // Draw particle head
      ctx.fillStyle = `${p.baseColor}${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Glowing halo
      ctx.fillStyle = `${p.baseColor}${p.alpha * 0.25})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  loop() {
    if (this.isRunning && this.isVisible) {
      this.update();
      this.draw();
    }
    requestAnimationFrame(() => this.loop());
  }
}
