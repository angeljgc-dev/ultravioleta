/* LAS MÁQUINAS: bento de juegos con filtro por década.
   El reacomodo usa animaciones `layout` de Motion (FLIP automático); cada
   tarjeta se inclina como la marquesina de una cabina y su récord cuenta
   de cero como un marcador de verdad. */
import { useRef, useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
  animate,
} from "motion/react";
import { MAQUINAS, type Maquina } from "../contenido";
import { WipeBloques, TituloSprite } from "./transiciones";

const FILTROS = ["TODAS", "80s", "90s"] as const;
type Filtro = (typeof FILTROS)[number];

/* ---- récord con conteo de marcador: rápido al inicio, frena al final ---- */
function Marcador({ record }: { record: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const enVista = useInView(ref, { once: true, margin: "-40px" });
  const reducido = useReducedMotion();
  const [texto, setTexto] = useState(record);

  useEffect(() => {
    /* separa la parte numérica del sufijo: "48,750" · "31 victorias" · "1:38.42" */
    const m = record.match(/^([\d,]+)(.*)$/);
    if (!m || record.includes(":")) return;         // los tiempos quedan estáticos
    const objetivo = parseInt(m[1].replace(/,/g, ""), 10);
    const sufijo = m[2];
    const digitos = m[1].replace(/,/g, "").length;

    const formatear = (n: number) =>
      Math.round(n)
        .toString()
        .padStart(digitos, "0")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",") + sufijo;

    if (!enVista) {
      setTexto(formatear(0));
      return;
    }
    if (reducido) {
      setTexto(formatear(objetivo));
      return;
    }
    const control = animate(0, objetivo, {
      duration: 1.3,
      ease: [0.16, 1, 0.3, 1],                       // arranca disparado, frena como contador
      onUpdate: (v) => setTexto(formatear(v)),
    });
    return () => control.stop();
  }, [enVista, record, reducido]);

  return (
    <p ref={ref} className="neon-cian font-mono text-lg font-semibold sm:text-xl">
      {texto}
    </p>
  );
}

/* ---- tarjeta con tilt de marquesina (springs de Motion, sin librerías) ---- */
function TarjetaMaquina({ m }: { m: Maquina }) {
  const reducido = useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotX = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 260, damping: 22 });
  const rotY = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 260, damping: 22 });

  return (
    <motion.article
      layout={!reducido}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      style={
        reducido
          ? undefined
          : { rotateX: rotX, rotateY: rotY, transformPerspective: 900 }
      }
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      onMouseLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
      className={`group relative overflow-hidden rounded-(--radius-cabina) border border-borde bg-fondo-1 p-6 ${
        m.grande ? "sm:col-span-2" : ""
      }`}
    >
      {/* glare que sigue el cursor: mismas variables que alimenta el tilt */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgb(177 158 239 / 0.14), transparent 65%)",
        }}
      />
      <div className="relative flex h-full flex-col justify-between gap-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-semibold sm:text-2xl">{m.nombre}</h3>
            <p className="mt-1 font-mono text-[0.65rem] tracking-[0.22em] text-tinta-media">
              {m.anio} · {m.genero}
            </p>
          </div>
          <span className="rounded-(--radius-cabina) border border-lavanda/25 px-3 py-1 font-mono text-[0.6rem] tracking-[0.2em] text-guia">
            {m.decada}
          </span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[0.6rem] tracking-[0.24em] text-tinta-media">HIGH SCORE</p>
            <Marcador record={m.record} />
          </div>
          <p className="parpadeo font-mono text-[0.65rem] tracking-[0.18em] text-accion">{m.dueno}</p>
        </div>
      </div>
    </motion.article>
  );
}

export default function Maquinas() {
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const visibles = MAQUINAS.filter((m) => filtro === "TODAS" || m.decada === filtro);

  return (
    /* STAGE CLEAR: esta es la sección-nivel, se lleva la transición más
       agresiva. Si el wipe estuviera en las cinco dejaría de significar nada. */
    <WipeBloques>
    <section id="maquinas" aria-label="Las máquinas" className="mx-auto max-w-6xl px-6 py-28 sm:py-36">
      <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="marquesina text-guia">SALA PRINCIPAL · 30 CABINAS</p>
          {/* el retraso deja que el wipe despeje antes de que aterricen las letras */}
          <TituloSprite
            texto="Las máquinas"
            retraso={0.42}
            claseEstela="text-accion"
            className="font-display mt-3 text-3xl font-bold sm:text-5xl"
          />
        </div>
        <div role="group" aria-label="Filtrar máquinas por década" className="flex gap-2">
          {FILTROS.map((f) => (
            <button
              key={f}
              aria-pressed={filtro === f}
              onClick={() => setFiltro(f)}
              className={`min-h-11 rounded-(--radius-cabina) border px-5 font-mono text-[0.65rem] tracking-[0.2em] transition-colors ${
                filtro === f
                  ? "border-accion bg-accion/15 text-accion shadow-glow-magenta"
                  : "border-borde text-tinta-media hover:border-guia hover:text-tinta"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visibles.map((m) => (
            <TarjetaMaquina key={m.id} m={m} />
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
    </WipeBloques>
  );
}
