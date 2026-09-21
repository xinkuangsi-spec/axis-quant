/**
 * DotField Canvas Component
 * Adapted from react-bits/content/Backgrounds/DotField
 * Implements interactive canvas dot grid with cursor bulge, physics, and subtle waves
 */

class DotField {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { alpha: true });
    this.options = {
      dotRadius: options.dotRadius || 1.6,
      dotSpacing: options.dotSpacing || 24,
      cursorRadius: options.cursorRadius || 240,
      cursorForce: options.cursorForce || 0.12,
      bulgeStrength: options.bulgeStrength || 45,
      gradientFrom: options.gradientFrom || 'rgba(31, 68, 255, 0.45)', // Electric Cobalt
      gradientTo: options.gradientTo || 'rgba(243, 241, 234, 0.15)',   // Ivory
      glowColor: options.glowColor || 'rgba(31, 68, 255, 0.08)',
      ...options
    };

    this.dots = [];
    this.mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
    this.rafId = null;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = 0;
    this.height = 0;
    this.rect = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    const container = this.canvas.parentElement;
    container.addEventListener('mousemove', (e) => this.onMouseMove(e));
    container.addEventListener('mouseleave', () => this.onMouseLeave());

    this.animate();
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.rect = parent.getBoundingClientRect();
    this.width = this.rect.width;
    this.height = this.rect.height;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.buildDots();
  }

  buildDots() {
    const step = this.options.dotRadius * 2 + this.options.dotSpacing;
    const cols = Math.floor(this.width / step);
    const rows = Math.floor(this.height / step);
    const padX = (this.width % step) / 2;
    const padY = (this.height % step) / 2;

    this.dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ax = padX + c * step + step / 2;
        const ay = padY + r * step + step / 2;
        this.dots.push({
          ax,
          ay,
          x: ax,
          y: ay,
          vx: 0,
          vy: 0
        });
      }
    }
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  }

  onMouseLeave() {
    this.mouse.x = -9999;
    this.mouse.y = -9999;
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const mX = this.mouse.x;
    const mY = this.mouse.y;
    const cRadius = this.options.cursorRadius;
    const cRadiusSq = cRadius * cRadius;
    const bStrength = this.options.bulgeStrength;

    // Draw subtle connecting lines or glow near cursor
    if (mX > 0 && mY > 0) {
      const grad = this.ctx.createRadialGradient(mX, mY, 10, mX, mY, cRadius);
      grad.addColorStop(0, this.options.glowColor);
      grad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    const dotCount = this.dots.length;
    for (let i = 0; i < dotCount; i++) {
      const dot = this.dots[i];

      // Physics towards mouse if near
      const dx = dot.x - mX;
      const dy = dot.y - mY;
      const distSq = dx * dx + dy * dy;

      if (!this.reducedMotion && distSq < cRadiusSq && distSq > 0.01) {
        const dist = Math.sqrt(distSq);
        const factor = (1 - dist / cRadius);
        const force = factor * bStrength;
        const targetX = dot.ax + (dx / dist) * force;
        const targetY = dot.ay + (dy / dist) * force;

        dot.vx += (targetX - dot.x) * 0.18;
        dot.vy += (targetY - dot.y) * 0.18;
      } else {
        // Return to anchor position
        dot.vx += (dot.ax - dot.x) * 0.08;
        dot.vy += (dot.ay - dot.y) * 0.08;
      }

      dot.vx *= 0.82;
      dot.vy *= 0.82;
      dot.x += dot.vx;
      dot.y += dot.vy;

      // Render dot
      const isNearMouse = distSq < cRadiusSq;
      this.ctx.beginPath();
      this.ctx.arc(dot.x, dot.y, isNearMouse ? this.options.dotRadius * 1.5 : this.options.dotRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = isNearMouse ? this.options.gradientFrom : this.options.gradientTo;
      this.ctx.fill();
    }

    this.rafId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}
