import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-projects',
  imports: [RouterLink],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class Projects implements AfterViewInit, OnDestroy {

  private animationId: number = 0;
  private observer: IntersectionObserver | null = null;

  ngAfterViewInit(): void {
    this.initThumb();
    this.initReveal();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.observer?.disconnect();
  }

  /** Scroll-reveal sutil: fade + translateY ao entrar na viewport */
  private initReveal(): void {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (targets.length === 0) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          this.observer?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    targets.forEach((t, i) => {
      t.style.transitionDelay = `${Math.min(i, 6) * 90}ms`;
      this.observer?.observe(t);
    });
  }

  /** Mini-thumbnail com pontos, ecoando a textura da hero, em versão discreta */
  private initThumb(): void {
    const canvas = document.getElementById('thumb-1') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !canvas.parentElement) return;
    const parent = canvas.parentElement;

    const resize = (): void => {
      canvas.width = parent.offsetWidth * devicePixelRatio;
      canvas.height = parent.offsetHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Maior densidade e variedade de pontos para mais riqueza visual
    const dots = Array.from({ length: 240 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.5 + Math.random() * 1.9,
      speed: 0.15 + Math.random() * 0.45,
      offset: Math.random() * Math.PI * 2,
      alpha: 0.10 + Math.random() * 0.22
    }));

    const frame = (t: number): void => {
      this.animationId = requestAnimationFrame(frame);
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;

      // Fundo com gradiente para dar profundidade
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#141726');
      bg.addColorStop(1, '#0d0f17');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      dots.forEach(d => {
        const dy = Math.sin(t * 0.0005 * d.speed + d.offset) * 6;
        const x = d.x * w;
        const y = d.y * h + dy;
        const isAccent = (x * 7 + y * 3) % 61 < 4;
        ctx.globalAlpha = isAccent ? 0.9 : d.alpha;
        ctx.beginPath();
        ctx.arc(x, y, isAccent ? d.r * 1.5 : d.r, 0, Math.PI * 2);
        ctx.fillStyle = isAccent ? '#ff8a65' : 'rgba(255,255,255,0.9)';
        ctx.fill();
      });

      // Vinheta sutil nas bordas para foco no centro
      const vg = ctx.createRadialGradient(
        w / 2, h / 2, Math.min(w, h) * 0.35,
        w / 2, h / 2, Math.max(w, h) * 0.75
      );
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      ctx.globalAlpha = 1;
    };
    requestAnimationFrame(frame);
  }
}
