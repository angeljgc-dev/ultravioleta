/* TORNEOS — programa semanal como tabla de posiciones. */
import { motion, useReducedMotion } from "motion/react";
import { TORNEOS } from "../contenido";

export default function Torneos() {
  const reducido = useReducedMotion();
  return (
    <section id="torneos" aria-label="Torneos" className="mx-auto max-w-6xl px-6 py-28 sm:py-36">
      <motion.header
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12 max-w-xl"
      >
        <p className="font-mono text-[0.65rem] tracking-[0.28em] text-magenta">RANKED · INSCRIPCIÓN EN BARRA</p>
        <h2 className="font-display mt-3 text-3xl font-bold sm:text-5xl">Torneos</h2>
        <p className="mt-4 text-tinta/70">
          Cuatro noches, cuatro reglas distintas. El marcador vive en el neón de la entrada y no se borra nunca.
        </p>
      </motion.header>

      <ol className="divide-y divide-tinta/10 border-y border-tinta/10">
        {TORNEOS.map((t, i) => (
          <motion.li
            key={t.dia}
            initial={{ opacity: 0, x: reducido ? 0 : -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: reducido ? 0 : i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="group grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-1 py-6 sm:grid-cols-[6rem_1fr_1fr_auto] sm:gap-x-10"
          >
            <span className="neon-lavanda font-display text-2xl font-bold sm:text-3xl">{t.dia}</span>
            <div>
              <h3 className="font-display text-lg font-semibold transition-colors group-hover:text-magenta sm:text-xl">
                {t.nombre}
              </h3>
              <p className="font-mono text-[0.62rem] tracking-[0.2em] text-tinta/60 sm:hidden">{t.maquina}</p>
            </div>
            <p className="hidden font-mono text-[0.68rem] tracking-[0.16em] text-tinta/60 sm:block">{t.maquina}</p>
            <p className="col-start-2 font-mono text-[0.68rem] tracking-[0.14em] text-cian sm:col-start-auto sm:text-right">
              {t.premio}
            </p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
