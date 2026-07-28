/* ============================================================================
   ENSAMBLADO POR SPRITES: el título se compone de cuadros que vuelan a su sitio.
   ----------------------------------------------------------------------------
   Cada carácter entra desde una posición fuera de rejilla (siempre múltiplo de
   8px: nada aterriza "entre píxeles") y encaja con un resorte duro, el "clac"
   de una ficha entrando en su ranura, no un fade.

   Detrás viaja una ESTELA magenta: una copia del título que llega un poco más
   tarde y se apaga. Es el ghosting de sprite de una cabina real, y es lo que
   convierte el efecto en vocabulario arcade en vez de "letras que aparecen".

   Accesibilidad: el elemento externo lleva `aria-label` con el texto completo y
   las dos capas van `aria-hidden`. El lector anuncia el encabezado entero,
   nunca letra por letra.

   Presupuesto: solo x / y / scale / opacity. El texto no se re-mide en ningún
   momento porque los transforms no afectan al flujo.
   ========================================================================== */
import { Fragment } from "react";
import { motion, type Variants } from "motion/react";
import { RESORTE_SPRITE, SALIDA_CABINA, aRejilla, azar } from "./arcade";
import { useEntradaArcade } from "./useEntradaArcade";

type Etiqueta = "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span";

type Props = {
  texto: string;
  /** Etiqueta real que se renderiza. Por defecto h2. */
  como?: Etiqueta;
  /** Retraso entre carácter y carácter (s). */
  escalonado?: number;
  /** Retraso antes del primer carácter (s), para encadenar con el wipe. */
  retraso?: number;
  /** Estela de sprite detrás del título. */
  estela?: boolean;
  /** Clase de color de la estela. */
  claseEstela?: string;
  className?: string;
};

/* Posición de salida de cada sprite: ángulo y distancia reproducibles,
   cuantizados a la rejilla de 8px. La componente X se aplana (×0.62) para que
   en 320px ninguna letra se dispare fuera del borde. */
function salida(i: number) {
  const a = azar(i * 3.7) * Math.PI * 2;
  const d = 28 + azar(i * 9.1) * 40; // 28-68px
  return {
    x: aRejilla(Math.cos(a) * d * 0.62),
    y: aRejilla(Math.sin(a) * d),
  };
}

/** Lo que cada carácter recibe por `custom`: su índice (semilla) y su retraso. */
type Sprite = { n: number; delay: number };

const caracter: Variants = {
  fuera: ({ n }: Sprite) => ({ opacity: 0, scale: 0.5, ...salida(n) }),
  puesto: ({ delay }: Sprite) => ({
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    transition: { ...RESORTE_SPRITE, delay },
  }),
};

const caracterEstela: Variants = {
  fuera: ({ n }: Sprite) => ({ opacity: 0, scale: 0.5, ...salida(n) }),
  puesto: ({ delay }: Sprite) => ({
    opacity: [0.85, 0.85, 0],
    scale: 1,
    x: 0,
    y: 0,
    /* tween más lento que el resorte de la capa principal: por eso queda detrás */
    transition: {
      duration: 0.62,
      delay,
      ease: SALIDA_CABINA,
      opacity: { duration: 0.62, delay, times: [0, 0.45, 1] },
    },
  }),
};

/** Una capa completa del título, partida en palabras → caracteres. */
function Capa({
  texto,
  variantes,
  escalonado,
  retraso,
  activo,
  className = "",
}: {
  texto: string;
  variantes: Variants;
  escalonado: number;
  retraso: number;
  activo: boolean;
  className?: string;
}) {
  let n = -1; // índice global de carácter, continuo entre palabras
  const palabras = texto.split(" ");

  return (
    /* la raíz de la capa dispara la etiqueta de variante; los <span> de palabra
       son motion para que la propagación llegue hasta los caracteres */
    <motion.span
      className={`block ${className}`}
      initial="fuera"
      animate={activo ? "puesto" : "fuera"}
    >
      {palabras.map((palabra, p) => (
        <Fragment key={`${palabra}-${p}`}>
          {/* palabra = inline-block + nowrap: el salto de línea ocurre ENTRE
              palabras, nunca a media palabra transformada */}
          <motion.span className="inline-block whitespace-nowrap">
            {[...palabra].map((letra, l) => {
              n += 1;
              return (
                <motion.span
                  key={`${letra}-${l}`}
                  className="inline-block"
                  variants={variantes}
                  custom={{ n, delay: retraso + n * escalonado } satisfies Sprite}
                >
                  {letra}
                </motion.span>
              );
            })}
          </motion.span>
          {/* espacio real entre palabras: mantiene el wrapping natural */}
          {p < palabras.length - 1 ? " " : null}
        </Fragment>
      ))}
    </motion.span>
  );
}

export default function TituloSprite({
  texto,
  como = "h2",
  escalonado = 0.028,
  retraso = 0,
  estela = true,
  claseEstela = "text-magenta",
  className = "",
}: Props) {
  const { ref, activo, reducido } = useEntradaArcade<HTMLHeadingElement>({ margen: "-60px" });

  /* un único cast: TS necesita una etiqueta concreta para validar el ref, y
     todas las opciones de `Etiqueta` aceptan un ref de HTMLElement */
  const Como = como as "h2";

  /* Movimiento reducido: texto plano, sin partir en spans. */
  if (reducido) return <Como className={className}>{texto}</Como>;

  return (
    <Como ref={ref} aria-label={texto} className={`relative isolate ${className}`}>
      {estela && (
        <span aria-hidden="true" className={`absolute inset-0 -z-10 ${claseEstela}`}>
          <Capa
            texto={texto}
            variantes={caracterEstela}
            escalonado={escalonado}
            retraso={retraso}
            activo={activo}
          />
        </span>
      )}

      <span aria-hidden="true">
        <Capa
          texto={texto}
          variantes={caracter}
          escalonado={escalonado}
          retraso={retraso}
          activo={activo}
        />
      </span>
    </Como>
  );
}
