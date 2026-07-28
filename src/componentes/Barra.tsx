/* LA BARRA: cocteles con glow del color del trago (sombra de color, nunca gris). */
import { motion } from "motion/react";
import { COCTELES, type Coctel } from "../contenido";
import { SlamRoster, slamItem, TituloSprite } from "./transiciones";

const GLOW: Record<Coctel["color"], string> = {
  lavanda: "hover:shadow-glow-lavanda hover:border-lavanda/50",
  magenta: "hover:shadow-glow-magenta hover:border-accion/50",
  cian: "hover:shadow-glow-cian hover:border-marcador/50",
};

const NEON: Record<Coctel["color"], string> = {
  lavanda: "neon-lavanda",
  magenta: "neon-magenta",
  cian: "neon-cian",
};

export default function Barra() {
  return (
    <section id="barra" aria-label="La barra" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <header className="mb-12 max-w-xl">
          <p className="marquesina text-marcador">LUZ NEGRA · SERVICIO EN CABINA</p>
          <TituloSprite
            texto="La barra"
            claseEstela="text-marcador"
            className="font-display mt-3 text-3xl font-bold sm:text-5xl"
          />
          <p className="mt-4 text-tinta-media">
            Cocteles que brillan bajo luz UV. Pide desde tu máquina: llegan antes de que pierdas la segunda vida.
          </p>
        </header>

        {/* roster de selección: los tragos llegan de frente, uno tras otro */}
        <SlamRoster className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {COCTELES.map((c, i) => (
            <motion.article
              key={c.id}
              variants={slamItem}
              custom={i}
              className={`rounded-(--radius-cabina) border border-borde bg-fondo-1 p-7 transition-all duration-300 ${GLOW[c.color]}`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className={`font-display text-xl font-semibold sm:text-2xl ${NEON[c.color]}`}>{c.nombre}</h3>
                <span className="font-mono text-lg font-semibold">
                  {c.promo ?? `$${c.precio}`}
                </span>
              </div>
              <p className="mt-1 font-mono text-[0.62rem] tracking-[0.24em] text-tinta-media uppercase">{c.juego}</p>
              <p className="mt-4 text-sm leading-relaxed text-tinta-media">{c.desc}</p>
            </motion.article>
          ))}
        </SlamRoster>
      </div>
    </section>
  );
}
