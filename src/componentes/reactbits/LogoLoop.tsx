/* LogoLoop — adaptado de React Bits (reactbits.dev) © David Haz, MIT License.
   Versión horizontal compacta: marquee infinito por rAF con velocidad suavizada,
   pausa en hover y respeto de prefers-reduced-motion. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface LogoLoopProps {
  items: React.ReactNode[];
  speed?: number; // px/s; negativo invierte
  gap?: number;
  pauseOnHover?: boolean;
  fadeOut?: boolean;
  fadeOutColor?: string;
  ariaLabel?: string;
  className?: string;
}

const TAU_SUAVIZADO = 0.25;

export default function LogoLoop({
  items,
  speed = 110,
  gap = 48,
  pauseOnHover = true,
  fadeOut = true,
  fadeOutColor = "#060010",
  ariaLabel = "Cinta",
  className = "",
}: LogoLoopProps) {
  const contRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef<HTMLUListElement>(null);
  const [anchoSeq, setAnchoSeq] = useState(0);
  const [copias, setCopias] = useState(2);
  const [hover, setHover] = useState(false);

  const medir = useCallback(() => {
    const cont = contRef.current?.clientWidth ?? 0;
    const seq = seqRef.current?.getBoundingClientRect().width ?? 0;
    if (seq > 0) {
      setAnchoSeq(Math.ceil(seq));
      setCopias(Math.max(2, Math.ceil(cont / seq) + 2));
    }
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver(medir);
    if (contRef.current) ro.observe(contRef.current);
    if (seqRef.current) ro.observe(seqRef.current);
    medir();
    return () => ro.disconnect();
  }, [medir, items, gap]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      track.style.transform = "translate3d(0,0,0)";
      return;
    }

    let raf = 0;
    let ultimo: number | null = null;
    let offset = 0;
    let vel = 0;

    const animar = (t: number) => {
      const dt = Math.max(0, t - (ultimo ?? t)) / 1000;
      ultimo = t;
      const objetivo = hover && pauseOnHover ? 0 : speed;
      vel += (objetivo - vel) * (1 - Math.exp(-dt / TAU_SUAVIZADO));
      if (anchoSeq > 0) {
        offset = (((offset + vel * dt) % anchoSeq) + anchoSeq) % anchoSeq;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }
      raf = requestAnimationFrame(animar);
    };
    raf = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(raf);
  }, [speed, anchoSeq, hover, pauseOnHover]);

  const listas = useMemo(
    () =>
      Array.from({ length: copias }, (_, c) => (
        <ul
          key={c}
          role="list"
          aria-hidden={c > 0}
          ref={c === 0 ? seqRef : undefined}
          className="flex items-center"
          style={{ gap, paddingRight: gap }}
        >
          {items.map((item, i) => (
            <li key={`${c}-${i}`} className="flex-none">
              {item}
            </li>
          ))}
        </ul>
      )),
    [copias, items, gap]
  );

  return (
    <div
      ref={contRef}
      role="region"
      aria-label={ariaLabel}
      className={`relative overflow-x-hidden ${className}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {fadeOut && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[clamp(24px,8%,120px)]"
            style={{ background: `linear-gradient(to right, ${fadeOutColor}, transparent)` }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[clamp(24px,8%,120px)]"
            style={{ background: `linear-gradient(to left, ${fadeOutColor}, transparent)` }}
          />
        </>
      )}
      <div ref={trackRef} className="flex w-max select-none will-change-transform">
        {listas}
      </div>
    </div>
  );
}
