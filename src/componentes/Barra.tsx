/* LA BARRA — cocteles con glow del color del trago (sombra de color, nunca gris). */
import { motion, useReducedMotion } from "motion/react";
import { COCTELES, type Coctel } from "../contenido";

const GLOW: Record<Coctel["color"], string> = {
  lavanda: "hover:shadow-glow-lavanda hover:border-lavanda/50",
  magenta: "hover:shadow-glow-magenta hover:border-magenta/50",
  cian: "hover:shadow-glow-cian hover:border-cian/50",
};

const NEON: Record<Coctel["color"], string> = {
  lavanda: "neon-lavanda",
  magenta: "neon-magenta",
  cian: "neon-cian",
};

export default function Barra() {
  const reducido = useReducedMotion();
  return (
    <section id="barra" aria-label="La barra" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <motion.header
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 max-w-xl"
        >
          <p className="font-mono text-[0.65rem] tracking-[0.28em] text-cian">LUZ NEGRA · SERVICIO EN CABINA</p>
          <h2 className="font-display mt-3 text-3xl font-bold sm:text-5xl">La barra</h2>
          <p className="mt-4 text-tinta/70">
            Cocteles que brillan bajo luz UV. Pide desde tu máquina: llegan antes de que pierdas la segunda vida.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {COCTELES.map((c, i) => (
            <motion.article
              key={c.id}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: reducido ? 0 : i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-2xl border border-tinta/10 bg-white/[0.03] p-7 transition-all duration-300 ${GLOW[c.color]}`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className={`font-display text-xl font-semibold sm:text-2xl ${NEON[c.color]}`}>{c.nombre}</h3>
                <span className="font-mono text-lg font-semibold">
                  {c.precio === 0 ? "2×1" : `$${c.precio}`}
                </span>
              </div>
              <p className="mt-1 font-mono text-[0.62rem] tracking-[0.24em] text-tinta/40 uppercase">{c.juego}</p>
              <p className="mt-4 text-sm leading-relaxed text-tinta/70">{c.desc}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
