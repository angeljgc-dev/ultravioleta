/* ============================================================================
   WIPE "STAGE CLEAR": barrido de bloques de píxel que revela la sección.
   ----------------------------------------------------------------------------
   La sección ya está renderizada debajo; encima vive una rejilla de bloques
   opacos del color del fondo. Al entrar en pantalla los bloques se van en
   diagonal, escalonados y CUANTIZADOS A 4 CUADROS (easing `escalones`), que es
   lo que hace que parezca hardware de 16 bits y no un fade con retraso.

   Presupuesto: cada bloque solo anima opacity + scale. La rejilla se dibuja con
   CSS grid (1fr), así que redimensionar no cuesta ni una animación.

   Al terminar, la capa se DESMONTA: no dejamos 140 divs muertos en el DOM.
   ========================================================================== */
import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { motion } from "motion/react";
import { azar, colorBloque, escalones } from "./arcade";
import { useEntradaArcade } from "./useEntradaArcade";

type Direccion = "diagonal" | "horizontal" | "vertical";

type Props = {
  children: ReactNode;
  /** Lado objetivo del bloque en px. Más chico = más bloques = más "pixel". */
  lado?: number;
  /** Ventana total de escalonado (s): cuánto tarda el barrido en cruzar. */
  ventana?: number;
  /** Duración de la muerte de cada bloque (s). */
  duracion?: number;
  /** Sentido del barrido. */
  direccion?: Direccion;
  /** Cuadros de la cuantización. 4 = sabor Mega Drive. 12 = casi continuo. */
  cuadros?: number;
  className?: string;
};

/* --- rejilla adaptativa: medimos hasta disparar, y ahí la congelamos -------- */
function useRejilla(ref: RefObject<HTMLElement | null>, lado: number, congelar: boolean) {
  const [rejilla, setRejilla] = useState({ cols: 6, filas: 5 });

  useEffect(() => {
    const el = ref.current;
    if (!el || congelar) return;

    const medir = () => {
      const { width, height } = el.getBoundingClientRect();
      let cols = Math.max(4, Math.min(18, Math.round(width / lado)));
      let filas = Math.max(3, Math.min(14, Math.round(height / lado)));
      /* techo de 140 nodos: más allá la ganancia visual es nula y el coste de
         compositing deja de ser gratis en móvil de gama baja */
      while (cols * filas > 140) {
        if (cols >= filas) cols -= 1;
        else filas -= 1;
      }
      setRejilla((p) => (p.cols === cols && p.filas === filas ? p : { cols, filas }));
    };

    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, lado, congelar]);

  return rejilla;
}

export default function WipeBloques({
  children,
  lado = 78,
  ventana = 0.5,
  duracion = 0.3,
  direccion = "diagonal",
  cuadros = 4,
  className = "",
}: Props) {
  const { ref, activo, reducido } = useEntradaArcade<HTMLDivElement>({ margen: "-70px" });
  const { cols, filas } = useRejilla(ref, lado, activo);
  const [listo, setListo] = useState(false);

  /* desmontaje de la capa cuando el último bloque ya se fue */
  useEffect(() => {
    if (!activo || reducido) return;
    const t = setTimeout(() => setListo(true), (ventana + duracion + 0.1) * 1000);
    return () => clearTimeout(t);
  }, [activo, reducido, ventana, duracion]);

  /* Movimiento reducido: ni siquiera montamos la rejilla. Contenido plano. */
  if (reducido) return <div className={className}>{children}</div>;

  const pesoX = direccion === "vertical" ? 0 : direccion === "horizontal" ? 1 : 0.62;
  const pesoY = direccion === "horizontal" ? 0 : direccion === "vertical" ? 1 : 0.38;

  return (
    <div ref={ref} className={`relative isolate ${className}`}>
      {children}

      {!listo && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${filas}, 1fr)`,
          }}
        >
          {Array.from({ length: cols * filas }, (_, i) => {
            const col = i % cols;
            const fila = Math.floor(i / cols);
            /* progreso 0→1 por eje, mezclado según la dirección, más un jitter
               reproducible: el borde del barrido no debe ser una línea perfecta
               (los wipes de cartucho nunca lo eran) */
            const px = cols > 1 ? col / (cols - 1) : 0;
            const py = filas > 1 ? fila / (filas - 1) : 0;
            const retraso = (px * pesoX + py * pesoY + azar(i) * 0.16) * ventana;
            const tinte = colorBloque(i);

            return (
              <motion.span
                key={i}
                initial={{ opacity: 1, scale: 1 }}
                animate={activo ? { opacity: 0, scale: 0.15 } : { opacity: 1, scale: 1 }}
                transition={{ duration: duracion, delay: retraso, ease: escalones(cuadros) }}
                style={{
                  background: tinte,
                  /* anillo de 1px: tapa las costuras subpíxel entre celdas 1fr.
                     box-shadow es pintura pura, no toca layout */
                  boxShadow: `0 0 0 1px ${tinte}`,
                  /* cada bloque colapsa hacia un punto distinto: desintegración,
                     no una cuadrícula de cuadros encogiendo al unísono */
                  transformOrigin: `${azar(i * 2.1) * 100}% ${azar(i * 5.7) * 100}%`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
