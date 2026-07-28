/* ============================================================================
   Variantes del SLAM DE ROSTER, en archivo aparte.
   ----------------------------------------------------------------------------
   Viven fuera del componente por dos razones:
     1. Fast Refresh: un módulo que exporta componentes Y constantes pierde el
        hot reload fino en dev.
     2. Se pueden pegar directamente sobre un <motion.article> que ya exista,
        sin meter un div envoltorio de más en una rejilla con col-span.
   ========================================================================== */
import type { Variants } from "motion/react";
import { RESORTE_SLAM, azar } from "./arcade";

/** Variantes del contenedor: solo orquesta el escalonado, no anima nada propio. */
export const slamContenedor = (escalonado = 0.07, retraso = 0.05): Variants => ({
  banca: {},
  roster: {
    transition: { staggerChildren: escalonado, delayChildren: retraso },
  },
});

/** Variantes de cada ficha. `custom` = índice, decide de dónde llega el golpe. */
export const slamItem: Variants = {
  banca: (i: number = 0) => ({
    opacity: 0,
    /* llega DE FRENTE: más grande que su sitio y frenando. No es un fade-up. */
    scale: 1.25,
    /* dirección reproducible por índice: dos vecinas nunca entran igual */
    x: (azar(i * 4.4) - 0.5) * 44,
    y: -22 - azar(i * 8.2) * 16,
    rotate: (azar(i * 6.1) - 0.5) * 4,
  }),
  roster: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transition: RESORTE_SLAM,
  },
};
