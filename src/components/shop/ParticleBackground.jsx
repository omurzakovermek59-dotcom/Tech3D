import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvas = useRef(null);
  useEffect(() => {
    const element = canvas.current;
    const context = element.getContext('2d');
    let width = 0;
    let height = 0;
    let particles = [];
    let mouse = { x: -999, y: -999 };
    let frame;
    const resize = () => {
      width = element.width = window.innerWidth;
      height = element.height = window.innerHeight;
      particles = Array.from({ length: Math.min(80, width / 16 | 0) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35
      }));
    };
    const move = event => { mouse = { x: event.clientX, y: event.clientY }; };
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', move);
    resize();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const draw = () => {
        context.clearRect(0, 0, width, height);
        const studioMode = document.documentElement.dataset.theme === 'studio';
        particles.forEach((particle, index) => {
          const dx = particle.x - mouse.x;
          const dy = particle.y - mouse.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 120 && distance > 0) {
            particle.x += dx / distance * 1.6;
            particle.y += dy / distance * 1.6;
          }
          particle.x = (particle.x + particle.vx + width) % width;
          particle.y = (particle.y + particle.vy + height) % height;
          context.fillStyle = studioMode ? 'rgba(152,115,66,.55)' : 'rgba(182,255,60,.8)';
          context.fillRect(particle.x, particle.y, 2, 2);
          for (let other = index + 1; other < particles.length; other++) {
            const neighbor = particles[other];
            const separation = Math.hypot(particle.x - neighbor.x, particle.y - neighbor.y);
            if (separation < 120) {
              context.strokeStyle = `rgba(${studioMode ? '120,103,79' : '122,60,255'},${(studioMode ? 0.15 : 0.35) * (1 - separation / 120)})`;
              context.beginPath();
              context.moveTo(particle.x, particle.y);
              context.lineTo(neighbor.x, neighbor.y);
              context.stroke();
            }
          }
        });
        frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', move);
    };
  }, []);
  return <canvas id="fx" ref={canvas} aria-hidden="true" />;
}
