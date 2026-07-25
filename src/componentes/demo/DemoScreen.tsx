/* DEMO SCREEN — la partida fantasma como fondo de sección.
   Blitea el backbuffer compartido del motor a un canvas propio, escalado con
   image-rendering: pixelated. El bucle solo corre si la sección está en
   viewport y la pestaña visible. Decorativo puro: aria-hidden. */
import { useEffect, useRef } from "react";
import { ANCHO, ALTO, lienzoDemo, usarDemo } from "./motorDemo";

export default function DemoScreen({ opacidad = 0.15 }: { opacidad?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let soltar: (() => void) | null = null;
    const blit = () => ctx.drawImage(lienzoDemo, 0, 0);

    const engancha = () => {
      if (!soltar) soltar = usarDemo(blit);
    };
    const suelta = () => {
      soltar?.();
      soltar = null;
    };
    const sincroniza = (visible: boolean) => {
      if (visible && !document.hidden) engancha();
      else suelta();
    };

    let visible = false;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        sincroniza(visible);
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);
    const alCambiarPestana = () => sincroniza(visible);
    document.addEventListener("visibilitychange", alCambiarPestana);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", alCambiarPestana);
      suelta();
    };
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ opacity: opacidad }}>
      <canvas
        ref={canvasRef}
        width={ANCHO}
        height={ALTO}
        className="h-full w-full object-cover"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
