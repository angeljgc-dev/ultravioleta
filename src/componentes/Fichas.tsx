/* FICHAS — precios. La ficha destacada respira con un glow animado. */
import { motion, useReducedMotion } from "motion/react";
import { PLANES } from "../contenido";

export default function Fichas() {
  const reducido = useReducedMotion();
  return (
    <section id="fichas" aria-label="Precios" className="mx-auto max-w-6xl px-6 py-28 sm:py-36">
      <motion.header
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12 text-center"
      >
        <p className="font-mono text-[0.65rem] tracking-[0.28em] text-lavanda">CAMBIO EXACTO NO NECESARIO</p>
        <h2 className="font-display mt-3 text-3xl font-bold sm:text-5xl">Fichas</h2>
      </motion.header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLANES.map((p, i) => (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: reducido ? 0 : i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className={`relative flex flex-col rounded-2xl border p-8 ${
              p.destacado
                ? "border-magenta/60 bg-magenta/[0.06] shadow-glow-magenta"
                : "border-tinta/12 bg-white/[0.03]"
            }`}
          >
            {p.destacado && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-magenta px-4 py-1 font-mono text-[0.6rem] font-semibold tracking-[0.2em] text-fondo">
                EL FAVORITO
              </span>
            )}
            <h3 className="font-display text-lg font-semibold tracking-wide">{p.nombre}</h3>
            <p className="mt-4 flex items-baseline gap-2">
              <span className={`font-display text-5xl font-bold ${p.destacado ? "neon-magenta" : ""}`}>
                ${p.precio}
              </span>
              <span className="font-mono text-[0.65rem] tracking-[0.18em] text-tinta/50">{p.unidad}</span>
            </p>
            <ul className="mt-6 flex flex-col gap-3 border-t border-tinta/10 pt-6">
              {p.incluye.map((linea) => (
                <li key={linea} className="flex gap-3 text-sm text-tinta/75">
                  <span aria-hidden="true" className={p.destacado ? "text-magenta" : "text-lavanda"}>
                    ▸
                  </span>
                  {linea}
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
