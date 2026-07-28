/* ClickSpark: adaptado de React Bits (reactbits.dev) © David Haz, MIT License. */
import React, { useRef, useEffect, useCallback } from "react";

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  extraScale?: number;
  children?: React.ReactNode;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

const ClickSpark: React.FC<ClickSparkProps> = ({
  sparkColor = "#fff",
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = "ease-out",
  extraScale = 1.0,
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const rafRef = useRef<number>(0);
  const dibujaRef = useRef<((t: number) => void) | null>(null);

  /* el canvas es del VIEWPORT (fixed), no del documento: antes medía
     1280×5186 px (~26 MB de buffer) por colgar del wrapper de toda la página */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const medir = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  const easeFunc = useCallback(
    (t: number) => {
      switch (easing) {
        case "linear":
          return t;
        case "ease-in":
          return t * t;
        case "ease-in-out":
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:
          return t * (2 - t);
      }
    },
    [easing]
  );

  /* el rAF solo corre mientras haya chispas vivas: cero trabajo en reposo */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    dibujaRef.current = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;

        const eased = easeFunc(elapsed / duration);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
          spark.x + distance * Math.cos(spark.angle),
          spark.y + distance * Math.sin(spark.angle)
        );
        ctx.lineTo(
          spark.x + (distance + lineLength) * Math.cos(spark.angle),
          spark.y + (distance + lineLength) * Math.sin(spark.angle)
        );
        ctx.stroke();
        return true;
      });
      if (sparksRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(dibujaRef.current!);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rafRef.current = 0;
      }
    };
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [sparkColor, sparkSize, sparkRadius, duration, easeFunc, extraScale]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    /* coordenadas de viewport directas: el canvas es fixed */
    const now = performance.now();
    sparksRef.current.push(
      ...Array.from({ length: sparkCount }, (_, i) => ({
        x: e.clientX,
        y: e.clientY,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now,
      }))
    );
    if (!rafRef.current && dibujaRef.current) {
      rafRef.current = requestAnimationFrame(dibujaRef.current);
    }
  };

  return (
    <div className="relative h-full w-full" onClick={handleClick}>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" />
      {children}
    </div>
  );
};

export default ClickSpark;
