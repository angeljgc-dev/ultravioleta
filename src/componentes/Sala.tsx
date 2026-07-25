/* LA SALA — tríptico fotográfico con parallax diferencial (useScroll por columna). */
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

/* URL base sin query: el ancho se elige por srcset según el hueco real */
const FOTOS = [
  {
    src: "https://images.pexels.com/photos/35931626/pexels-photo-35931626.jpeg",
    alt: "Pasillo de máquinas arcade bañado en neón magenta y violeta",
    pie: "EL PASILLO · 30 CABINAS",
  },
  {
    src: "https://images.pexels.com/photos/29027879/pexels-photo-29027879.jpeg",
    alt: "Panel de control arcade con borde de luz cian sobre fondo negro",
    pie: "CONTROLES ORIGINALES",
  },
  {
    src: "https://images.pexels.com/photos/30351933/pexels-photo-30351933.jpeg",
    alt: "Máquinas de premios con neón violeta y piso de ajedrez",
    pie: "ZONA DE PREMIOS",
  },
];

const px = (base: string, w: number) => `${base}?auto=compress&cs=tinysrgb&w=${w}`;

function Columna({ foto, indice }: { foto: (typeof FOTOS)[number]; indice: number }) {
  const ref = useRef<HTMLElement>(null);
  const reducido = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  /* cada columna deriva a velocidad distinta: profundidad sin WebGL */
  const desplaza = reducido ? "0%" : `${(indice - 1) * 9 + 9}%`;
  const y = useTransform(scrollYProgress, [0, 1], [desplaza, `-${desplaza}`]);

  return (
    <figure ref={ref as React.RefObject<HTMLElement>} className="group relative overflow-hidden rounded-md border border-tinta/10">
      <motion.img
        style={{ y, scale: 1.18 }}
        src={px(foto.src, 800)}
        srcSet={`${px(foto.src, 480)} 480w, ${px(foto.src, 800)} 800w, ${px(foto.src, 1200)} 1200w`}
        sizes="(min-width: 640px) 33vw, 100vw"
        alt={foto.alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="aspect-[3/4] w-full object-cover"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fondo/95 to-transparent p-5 pt-14 font-mono text-[0.6rem] tracking-[0.26em] text-tinta/85">
        {foto.pie}
      </figcaption>
    </figure>
  );
}

export default function Sala() {
  return (
    <section aria-label="La sala" className="mx-auto max-w-6xl px-6 pb-10">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {FOTOS.map((f, i) => (
          <motion.div
            key={f.pie}
            initial={{ opacity: 0, y: 44 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Columna foto={f} indice={i} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
