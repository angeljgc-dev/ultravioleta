/* BlobCursor — adaptado de React Bits (reactbits.dev) © David Haz, MIT License.
   Reescrito sin GSAP (rAF + interpolación exponencial) y convertido en overlay
   fijo de página completa que escucha en window; solo escritorio con puntero fino. */
import { useEffect, useRef, useState } from "react";

interface BlobCursorProps {
  fillColor?: string;
  trailCount?: number;
  sizes?: number[];
  opacities?: number[];
  fastDuration?: number;
  slowDuration?: number;
}

export default function BlobCursor({
  fillColor = "#B19EEF",
  trailCount = 3,
  sizes = [28, 56, 40],
  opacities = [0.55, 0.25, 0.35],
  fastDuration = 0.09,
  slowDuration = 0.45,
}: BlobCursorProps) {
  const blobsRef = useRef<(HTMLDivElement | null)[]>([]);
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const positionsRef = useRef<{ x: number; y: number }[]>([]);
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    const puntero = matchMedia("(hover: hover) and (pointer: fine)");
    const reducido = matchMedia("(prefers-reduced-motion: reduce)");
    if (!puntero.matches || reducido.matches) return;
    setActivo(true);

    const alMover = (e: PointerEvent) => {
      const next = { x: e.clientX, y: e.clientY };
      if (targetRef.current === null) {
        positionsRef.current = Array.from({ length: trailCount }, () => ({ ...next }));
      }
      targetRef.current = next;
    };
    window.addEventListener("pointermove", alMover, { passive: true });

    let raf = 0;
    let ultimo: number | null = null;
    const animar = (t: number) => {
      const dt = Math.min((t - (ultimo ?? t)) / 1000, 0.05);
      ultimo = t;
      const target = targetRef.current;
      if (target) {
        for (let i = 0; i < positionsRef.current.length; i++) {
          const pos = positionsRef.current[i];
          const dur = i === 0 ? fastDuration : slowDuration * (1 + i * 0.3);
          const k = 1 - Math.exp(-dt / Math.max(dur / 3, 0.001));
          pos.x += (target.x - pos.x) * k;
          pos.y += (target.y - pos.y) * k;
          const el = blobsRef.current[i];
          if (el) el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
        }
      }
      raf = requestAnimationFrame(animar);
    };
    raf = requestAnimationFrame(animar);

    return () => {
      window.removeEventListener("pointermove", alMover);
      cancelAnimationFrame(raf);
    };
  }, [trailCount, fastDuration, slowDuration]);

  if (!activo) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
      <svg className="absolute h-0 w-0">
        <filter id="goo-uv">
          <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="8" />
          <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
        </filter>
      </svg>
      <div className="absolute inset-0" style={{ filter: "url(#goo-uv)" }}>
        {Array.from({ length: trailCount }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              blobsRef.current[i] = el;
            }}
            className="absolute rounded-full will-change-transform"
            style={{
              width: sizes[i],
              height: sizes[i],
              backgroundColor: fillColor,
              opacity: opacities[i],
              mixBlendMode: "screen",
              transform: "translate3d(-9999px,-9999px,0) translate(-50%,-50%)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
