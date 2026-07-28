/* ============================================================================
   PERSIANA CRT: la sección enciende como un monitor de tubo.
   ----------------------------------------------------------------------------
   Secuencia real de un CRT al recibir corriente, en tres fases sobre un único
   progreso `p` (0→1):
     fase 1 (0 → 0.30) el punto central se estira en HORIZONTAL hasta ser línea
     fase 2 (0.30 → 1) la línea se abre en VERTICAL y aparece la imagen
     en paralelo: un destello cian que se apaga y un rebote de escala

   Truco importante: manejamos el clip-path desde un MotionValue en vez de con
   `animate={{ clipPath: [...] }}`. Así, al llegar a p=1 podemos emitir
   literalmente "none" y DEJAR DE RECORTAR. Si nos quedáramos en
   `inset(0% 0% 0% 0%)`, el contenedor seguiría cortando para siempre los glows,
   las insignias que sobresalen y cualquier sombra de neón.

   Presupuesto: clip-path + transform + opacity. Cero propiedades de layout.
   ========================================================================== */
import { useEffect, type ReactNode } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { HAZ } from "./arcade";
import { useEntradaArcade } from "./useEntradaArcade";

type Props = {
  children: ReactNode;
  /** Duración total del encendido (s). */
  duracion?: number;
  /** Retraso antes de encender (s). */
  retraso?: number;
  /** Color del destello del haz. */
  color?: string;
  className?: string;
  /** Clases para la capa recortada. Necesario si el hijo mide por porcentaje
   *  (un canvas con h-full, por ejemplo): pásale aquí el `h-full`. */
  claseContenido?: string;
};

/** Punto de corte entre la fase horizontal y la vertical. */
const CORTE = 0.3;
/** Grosor de la línea inicial, en % del alto (0.6% ≈ 2-4px en bloques reales). */
const LINEA = 49.7;

export default function EncendidoCRT({
  children,
  duracion = 0.85,
  retraso = 0,
  color = "#2EE6FF",
  className = "",
  claseContenido = "",
}: Props) {
  const { ref, activo, reducido } = useEntradaArcade<HTMLDivElement>({ margen: "-80px" });

  /* progreso único: de él cuelgan el recorte, el destello y el rebote */
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

  /* ---- recorte en tres fases -------------------------------------------- */
  const recorte = useTransform(p, (v) => {
    /* al final soltamos el recorte por completo: nada queda cortado */
    if (v >= 1) return "none";
    if (v < CORTE) {
      /* fase 1: se abre en horizontal, sigue siendo una línea */
      const lados = 48 * (1 - v / CORTE); // 48% → 0%
      return `inset(${LINEA}% ${lados}% ${LINEA}% ${lados}%)`;
    }
    /* fase 2: la línea se abre en vertical */
    const q = (v - CORTE) / (1 - CORTE);
    return `inset(${LINEA * (1 - q)}% 0% ${LINEA * (1 - q)}% 0%)`;
  });

  /* el contenido "respira" al abrirse: leve sobre-escala vertical que asienta */
  const escalaY = useTransform(p, [CORTE, 0.75, 1], [1.06, 1.01, 1], { clamp: true });

  /* ---- destello del haz: barra que se estira y se apaga ------------------- */
  const destelloX = useTransform(p, [0, CORTE], [0.04, 1], { clamp: true });
  const destelloOpacidad = useTransform(p, [0, 0.12, CORTE, 0.62], [0, 1, 0.9, 0], {
    clamp: true,
  });

  /* Movimiento reducido: contenido plano, sin capas ni recortes. */
  if (reducido)
    return (
      <div className={className}>
        <div className={claseContenido}>{children}</div>
      </div>
    );

  return (
    <div ref={ref} className={`relative isolate ${className}`}>
      <motion.div className={claseContenido} style={{ clipPath: recorte, scaleY: escalaY }}>
        {children}
      </motion.div>

      {/* haz de encendido: 2px centrados, sin afectar al layout */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-0 z-10 h-[2px] w-full"
        style={{
          background: `linear-gradient(to right, transparent, ${color}, transparent)`,
          boxShadow: `0 0 18px 2px ${color}`,
          translateY: "-50%",
          scaleX: destelloX,
          opacity: destelloOpacidad,
        }}
      />
    </div>
  );
}
