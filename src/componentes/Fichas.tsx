/* FICHAS — deja de ser tabla de precios de SaaS: cada plan es una ficha
   troquelada de verdad, con canto dentado y la denominación grabada. */
import { motion } from "motion/react";
import { PLANES, RESERVA, type Plan } from "../contenido";

/* ficha troquelada: canto dentado por 24 marcas radiales */
function Ficha({ plan, destacado }: { plan: Plan; destacado: boolean }) {
  const color = destacado ? "#FF2EA6" : "#B19EEF";
  const dientes = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return (
      <line
        key={i}
        x1={50 + Math.cos(a) * 41}
        y1={50 + Math.sin(a) * 41}
        x2={50 + Math.cos(a) * 46}
        y2={50 + Math.sin(a) * 46}
        stroke={color}
        strokeWidth="2.5"
        opacity="0.55"
      />
    );
  });

  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20 shrink-0" aria-hidden="true">
      {dientes}
      <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="50" cy="50" r="31" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      <text
        x="50"
        y="57"
        textAnchor="middle"
        fill={color}
        style={{ font: "600 20px 'JetBrains Mono', monospace", letterSpacing: "0.05em" }}
      >
        UV
      </text>
      <text
        x="50"
        y="72"
        textAnchor="middle"
        fill={color}
        opacity="0.7"
        style={{ font: "600 9px 'JetBrains Mono', monospace" }}
      >
        {plan.id === "ficha" ? "1 CRÉDITO" : plan.id === "rollo" ? "×10" : "∞"}
      </text>
    </svg>
  );
}

export default function Fichas() {
  return (
    <section id="fichas" aria-label="Fichas y precios" className="mx-auto max-w-6xl px-6 py-28 sm:py-36">
      <motion.header
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12 text-center"
      >
        <p className="font-mono text-[0.65rem] tracking-[0.28em] text-lavanda">
          CAMBIO EXACTO NO NECESARIO · FICHAS TROQUELADAS EN CASA
        </p>
        <h2 className="font-display mt-3 text-3xl font-bold sm:text-5xl">Fichas</h2>
      </motion.header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLANES.map((p, i) => (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className={`relative flex flex-col rounded-md border-2 p-8 ${
              p.destacado
                ? "border-magenta bg-magenta/[0.07] shadow-glow-magenta"
                : "border-tinta/12 bg-white/[0.03]"
            }`}
          >
            {p.destacado && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-magenta px-4 py-1 font-mono text-[0.6rem] font-semibold tracking-[0.2em] text-fondo">
                HIGH SCORE
              </span>
            )}

            <div className="flex items-center gap-5">
              <Ficha plan={p} destacado={!!p.destacado} />
              <div>
                <h3 className="font-display text-lg font-semibold tracking-wide">{p.nombre}</h3>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className={`font-display text-4xl font-bold ${p.destacado ? "neon-magenta" : ""}`}>
                    ${p.precio}
                  </span>
                  <span className="font-mono text-[0.65rem] tracking-[0.18em] text-tinta/60">{p.unidad}</span>
                </p>
              </div>
            </div>

            <ul className="mt-6 flex flex-col gap-3 border-t border-tinta/10 pt-6">
              {p.incluye.map((linea) => (
                <li key={linea} className="flex gap-3 text-sm text-tinta/80">
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

      {/* la reserva vive aquí, después de ver el precio */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mt-14 text-center"
      >
        <a
          href={`https://wa.me/${RESERVA.whatsapp}?text=${encodeURIComponent(RESERVA.mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-3 border-2 border-cian px-8 py-4 font-mono text-[0.7rem] font-semibold tracking-[0.26em] text-cian shadow-glow-cian transition-colors hover:bg-cian hover:text-fondo"
        >
          APARTAR POR WHATSAPP
        </a>
        <p className="mt-4 font-mono text-[0.62rem] tracking-[0.2em] text-tinta/60">
          TE CONTESTAMOS ANTES DE QUE SE ACABE TU CRÉDITO
        </p>
      </motion.div>
    </section>
  );
}
