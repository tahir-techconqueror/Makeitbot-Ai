"use client";

import { useEffect, useRef } from "react";

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: any[] = [];
    let animationId: number;

    const mouseRadius = 180;
    const minDistance = 40; // minimum gap between particles



    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // 🔥 Auto-scale particle count based on screen size
      const area = canvas.width * canvas.height;
     const particleCount = Math.floor(area / 3200); 
// density control

      particles = Array.from({ length: particleCount }).map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.current.x = -9999;
      mouse.current.y = -9999;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

 let time = 0;

const animate = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  time += 0.01;

 for (let i = 0; i < particles.length; i++) {
  let p = particles[i];

  // 🌊 Independent organic drift
  p.vx += Math.sin(time + p.x * 0.01) * 0.02;
  p.vy += Math.cos(time + p.y * 0.01) * 0.02;

  // 🌀 Gentle randomness
  p.vx += (Math.random() - 0.5) * 0.015;
  p.vy += (Math.random() - 0.5) * 0.015;

  // 🔥 Mouse magnetic interaction
  const dxMouse = mouse.current.x - p.x;
  const dyMouse = mouse.current.y - p.y;
  const mouseDistance = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

  if (mouseDistance < mouseRadius) {
    const force = (mouseRadius - mouseDistance) / mouseRadius;
    p.vx -= dxMouse * force * 0.0015;
    p.vy -= dyMouse * force * 0.0015;
  }

  // 🧲 Particle separation (anti-merge system)
  for (let j = i + 1; j < particles.length; j++) {
    let p2 = particles[j];
    const dx = p2.x - p.x;
    const dy = p2.y - p.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      const angle = Math.atan2(dy, dx);
      const overlap = minDistance - distance;
      const force = overlap * 0.02;

      p.vx -= Math.cos(angle) * force;
      p.vy -= Math.sin(angle) * force;
      p2.vx += Math.cos(angle) * force;
      p2.vy += Math.sin(angle) * force;
    }
  }

  // Movement
  p.x += p.vx;
  p.y += p.vy;

  // Smooth friction
  p.vx *= 0.96;
  p.vy *= 0.96;

  // Wrap edges
  if (p.x > canvas.width) p.x = 0;
  if (p.x < 0) p.x = canvas.width;
  if (p.y > canvas.height) p.y = 0;
  if (p.y < 0) p.y = canvas.height;

  // Subtle pulse
  const pulse = 1 + Math.sin(time * 2 + p.x * 0.02) * 0.15;

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(99,102,241,0.85)";
  ctx.fill();
}


  animationId = requestAnimationFrame(animate);
};


    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"

    />
  );
}
