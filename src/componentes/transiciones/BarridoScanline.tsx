/* ============================================================================
   BARRIDO DE SCANLINE: una línea brillante cruza y deja el contenido detrás.
   ----------------------------------------------------------------------------
   El haz no "revela" por encima: el contenido se recorta desde arriba con
   clip-path y la línea viaja exactamente sobre el borde del recorte. Lo que ves
   es un tubo dibujando la sección línea a línea.

   Truco de rendimiento: el haz NO se mide ni se reposiciona. Es un elemento de
   alto 100% dentro de un contenedor con overflow oculto, y solo se TRASLADA en
   porcentaje (`y: p*100 - 100`). Su borde inferior cae siempre en p·alto sin
   que nadie lea el DOM. La estela se dibuja con paradas en píxeles fijos, así
   que conserva el mismo grosor durante todo el recorrido.

   Igual que la persiana CRT, al terminar el clip-path pasa a "none" para no
   dejar la sección recortada de por vida.
   ========================================================================== */
import { useEffect, type ReactNode } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { HAZ } from "./arcade";
import { useEntradaArcade } from "./useEntradaArcade";

type Props = {
  children: ReactNode;
  /** Duración del barrido (s). */
  duracion?: number;
  /** Retraso antes de barrer (s). */
  retraso?: number;
  /** Color del haz. Cian = marcador; magenta = acción. */
  color?: string;
  /** Alto de la estela en px (lo que arrastra el haz por detrás). */
  estela?: number;
  /** El contenido además sube un poco al ser dibujado. */
  deriva?: number;
  className?: string;
  /** Clases para la capa recortada, si el hijo mide por porcentaje. */
  claseContenido?: string;
};

export default function BarridoScanline({
  children,
  duracion = 0.95,
  retraso = 0,
  color = "#2EE6FF",
  estela = 28,
  deriva = 14,
  className = "",
  claseContenido = "",
}: Props) {
  const { ref, activo, reducido } = useEntradaArcade<HTMLDivElement>({ margen: "-80px" });

  const p = useMotionValue(reducido ? 1 : 0);

  useEffect(() => {
    if (reducido) {
      p.set(1);
      return;
    }
    if (!activo) return;
    const control = animate(p, 1, { duration: duracion, delay: retraso, ease: HAZ });
    return () => control.stop();
  }, [activo, reducido, duracion, retraso, p]);

  /* el contenido aparece de arriba abajo; al final soltamos el recorte */
  const recorte = useTransform(p, (v) =>
    v >= 1 ? "none" : `inset(0% 0% ${(1 - v) * 100}% 0%)`,
  );
  /* lo ya dibujado se asienta unos px: el tubo "empuja" la imagen */
  const y = useTransform(p, [0, 1], [deriva, 0]);

  /* el haz: traslación en % de su propio alto (= alto del contenedor) */
  const hazY = useTransform(p, (v) => `${v * 100 - 100}%`);
  const hazOpacidad = useTransform(p, [0, 0.06, 0.9, 1], [0, 1, 1, 0], { clamp: true });

  /* Movimiento reducido: contenido plano, sin haz ni recorte. */
  if (reducido)
    return (
      <div className={className}>
        <div className={claseContenido}>{children}</div>
      </div>
    );

  return (
    <div ref={ref} className={`relative isolate ${className}`}>
      <motion.div className={claseContenido} style={{ clipPath: recorte, y }}>
        {children}
      </motion.div>

      {/* capa del haz: recorta su propio desbordamiento, nunca el del contenido */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <motion.div
          className="absolute inset-x-0 top-0 h-full"
          style={{
            y: hazY,
            opacity: hazOpacidad,
            /* paradas en px: el grosor del haz no depende del alto del bloque */
            background: `linear-gradient(to bottom,
              transparent 0,
              transparent calc(100% - ${estela}px),
              color-mix(in srgb, ${color} 22%, transparent) calc(100% - ${estela}px),
              color-mix(in srgb, ${color} 65%, transparent) calc(100% - 4px),
              ${color} 100%)`,
          }}
        />
      </div>
    </div>
  );
}
