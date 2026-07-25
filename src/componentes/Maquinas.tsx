/* LAS MÁQUINAS — bento de juegos con filtro por década.
   El reacomodo usa animaciones `layout` de Motion (FLIP automático). */
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { MAQUINAS, type Maquina } from "../contenido";

const FILTROS = ["TODAS", "80s", "90s"] as const;
type Filtro = (typeof FILTROS)[number];

function TarjetaMaquina({ m }: { m: Maquina }) {
  const reducido = useReducedMotion();
  return (
    <motion.article
      layout={!reducido}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      whileHover={reducido ? undefined : { y: -6 }}
      className={`group relative overflow-hidden rounded-2xl border border-lavanda/15 bg-white/[0.03] p-6 ${
        m.grande ? "sm:col-span-2" : ""
      }`}
    >
      {/* spotlight que sigue el cursor vía variables CSS (patrón React Bits) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgb(177 158 239 / 0.14), transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.parentElement!.style.setProperty("--mx", `${e.clientX - r.left}px`);
          e.currentTarget.parentElement!.style.setProperty("--my", `${e.clientY - r.top}px`);
        }}
      />
      <div className="relative flex h-full flex-col justify-between gap-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-semibold sm:text-2xl">{m.nombre}</h3>
            <p className="mt-1 font-mono text-[0.65rem] tracking-[0.22em] text-tinta/50">
              {m.anio} · {m.genero}
            </p>
          </div>
          <span className="rounded-full border border-lavanda/25 px-3 py-1 font-mono text-[0.6rem] tracking-[0.2em] text-lavanda">
            {m.decada}
          </span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[0.6rem] tracking-[0.24em] text-tinta/40">HIGH SCORE</p>
            <p className="neon-cian font-mono text-lg font-semibold sm:text-xl">{m.record}</p>
          </div>
          <p className="font-mono text-[0.65rem] tracking-[0.18em] text-magenta">{m.dueno}</p>
        </div>
      </div>
    </motion.article>
  );
}

export default function Maquinas() {
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const visibles = MAQUINAS.filter((m) => filtro === "TODAS" || m.decada === filtro);

  return (
    <section id="maquinas" aria-label="Las máquinas" className="mx-auto max-w-6xl px-6 py-28 sm:py-36">
      <motion.header
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12 flex flex-wrap items-end justify-between gap-6"
      >
        <div>
          <p className="font-mono text-[0.65rem] tracking-[0.28em] text-lavanda">SALA PRINCIPAL · 30 CABINAS</p>
          <h2 className="font-display mt-3 text-3xl font-bold sm:text-5xl">Las máquinas</h2>
        </div>
        <div role="tablist" aria-label="Filtrar por década" className="flex gap-2">
          {FILTROS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filtro === f}
              onClick={() => setFiltro(f)}
              className={`min-h-11 rounded-full border px-5 font-mono text-[0.65rem] tracking-[0.2em] transition-colors ${
                filtro === f
                  ? "border-magenta bg-magenta/15 text-magenta shadow-glow-magenta"
                  : "border-tinta/15 text-tinta/60 hover:border-tinta/40 hover:text-tinta"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.header>

      <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visibles.map((m) => (
            <TarjetaMaquina key={m.id} m={m} />
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
