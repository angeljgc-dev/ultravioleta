/* ============================================================================
   SLAM DE ROSTER: pantalla de selección de personaje.
   ----------------------------------------------------------------------------
   Las tarjetas no suben con un fade: llegan DE FRENTE (scale 1.25 → 1), fuera
   de eje, y frenan con un resorte que rebota apenas, el golpe seco de un
   retrato entrando en su casilla del roster. El escalonado llena la rejilla
   como un tablero, no como una lista.

   Se entrega en dos formatos:
     · <SlamRoster> + <ItemRoster>     envoltorio listo para usar
     · slamContenedor() / slamItem     las variantes sueltas (./variantesSlam),
       para pegarlas sobre un <motion.article> que ya exista y no añadir un div
       de más dentro de una rejilla con col-span

   Presupuesto: opacity + scale + x/y + rotate. Nada más.
   ========================================================================== */
import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { slamContenedor, slamItem } from "./variantesSlam";
import { useEntradaArcade } from "./useEntradaArcade";

type PropsContenedor = {
  children: ReactNode;
  /** Segundos entre tarjeta y tarjeta. */
  escalonado?: number;
  /** Retraso antes de la primera (s), para encadenar tras el título. */
  retraso?: number;
  className?: string;
};

export function SlamRoster({
  children,
  escalonado = 0.07,
  retraso = 0.05,
  className = "",
}: PropsContenedor) {
  const { ref, activo, reducido } = useEntradaArcade<HTMLDivElement>({ margen: "-70px" });

  /* Movimiento reducido: rejilla plana, sin motion en medio. */
  if (reducido) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={slamContenedor(escalonado, retraso)}
      initial="banca"
      animate={activo ? "roster" : "banca"}
    >
      {children}
    </motion.div>
  );
}

type PropsItem = {
  children: ReactNode;
  /** Índice dentro de la rejilla: alimenta la dirección de llegada. */
  indice?: number;
  className?: string;
};

export function ItemRoster({ children, indice = 0, className = "" }: PropsItem) {
  const reducido = useReducedMotion() ?? false;
  if (reducido) return <div className={className}>{children}</div>;

  return (
    <motion.div variants={slamItem} custom={indice} className={className}>
      {children}
    </motion.div>
  );
}

export default SlamRoster;
