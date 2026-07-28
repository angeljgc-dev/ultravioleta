/* ============================================================================
   VOCABULARIO DE MOVIMIENTO ARCADE: tokens compartidos
   ----------------------------------------------------------------------------
   Todas las transiciones de sección salen de este archivo para que la página
   hable un solo idioma: mismas curvas, mismo azar reproducible, mismos pasos.

   Regla de presupuesto: aquí solo se definen valores que terminan aplicados a
   transform / opacity / clip-path. Nada que dispare layout (width, height, top,
   margin, filter...).
   ========================================================================== */

/** Salida de cabina: arranca disparado y frena en seco, como un marcador.
 *  Es la misma curva que ya usa el resto del sitio; la mantenemos por coherencia. */
export const SALIDA_CABINA: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Entrada dura: se va de golpe. Para lo que DESAPARECE (bloques del wipe). */
export const CORTE_SECO: [number, number, number, number] = [0.7, 0, 0.84, 0];

/** Haz de electrones: acelera al centro y frena al final del recorrido. */
export const HAZ: [number, number, number, number] = [0.4, 0, 0.2, 1];

/** Golpe de sprite: el "clac" de una ficha entrando en su ranura. */
export const RESORTE_SPRITE = {
  type: "spring",
  stiffness: 700,
  damping: 30,
  mass: 0.65,
} as const;

/** Slam de roster: llega con más peso y rebota un pelo (character select). */
export const RESORTE_SLAM = {
  type: "spring",
  stiffness: 420,
  damping: 24,
  mass: 0.8,
} as const;

/* ---------------------------------------------------------------------------
   ESCALONES: easing de N cuadros.
   Motion acepta funciones de easing (las convierte a linear() para la WAAPI),
   así que podemos cuantizar el progreso y conseguir que una animación se vea
   dibujada a 4 cuadros en vez de interpolada. Es LA diferencia entre "fade
   genérico" y "hardware de 16 bits".
   --------------------------------------------------------------------------- */
export const escalones =
  (n: number) =>
  (t: number): number =>
    Math.min(1, Math.floor(t * n + 1e-6) / (n - 1));

/* ---------------------------------------------------------------------------
   AZAR DETERMINISTA: mismo índice, mismo número, siempre.
   Math.random() en render haría que cada re-render recolocase los bloques y la
   animación diera saltos. Esto es ruido reproducible (truco de shader).
   --------------------------------------------------------------------------- */
export const azar = (i: number): number => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Cuantiza un valor a la rejilla de sprites: nada aterriza "entre píxeles". */
export const aRejilla = (v: number, cuadro = 8): number => Math.round(v / cuadro) * cuadro;

/* ---------------------------------------------------------------------------
   PALETA DE BLOQUES del wipe.
   La mayoría de bloques son el fondo de la página (el wipe "es" la sala en
   negro); una minoría sube un escalón de superficie y ~6% son violeta puro:
   la chispa de color que delata que esto es una pantalla, no un telón.
   --------------------------------------------------------------------------- */
export const colorBloque = (i: number): string => {
  const r = azar(i * 7.3);
  if (r > 0.94) return "var(--color-violeta)";
  if (r > 0.82) return "var(--color-fondo-2)";
  if (r > 0.62) return "var(--color-fondo-1)";
  return "var(--color-fondo)";
};
