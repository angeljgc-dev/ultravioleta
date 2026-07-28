/* HERO: seda violeta por shader + título descifrado + parallax de salida con useScroll. */
import { useRef, lazy, Suspense } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import DecryptedText from "./reactbits/DecryptedText";
import { MARCA, RESERVA } from "../contenido";

/* el shader viaja en su propio chunk: el hero pinta al instante sobre el
   fondo basalto y la seda aparece en cuanto está lista */
const FondoSeda = lazy(() => import("./FondoSeda"));

/* Cascada física en vez de relojes encadenados (acuerdo de la mesa: el CTA
   tardaba 3.2 s en existir). Springs escalonados: cada elemento persigue al
   anterior en lugar de esperar un delay fijo, y el conjunto es interrumpible. */
const ENTRADA = {
  oculto: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 220, damping: 26, delay: i * 0.07 },
  }),
};

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reducido = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  /* el contenido se despide flotando hacia arriba mientras el hero cede el paso */
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reducido ? "0%" : "-32%"]);
  const opacidad = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      aria-label="Ultravioleta, arcade bar"
      className="relative flex min-h-svh items-center justify-center overflow-hidden"
    >
      <Suspense fallback={null}>
        <FondoSeda />
      </Suspense>
      {/* velo radial: protege la lectura del centro */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 58%, rgb(6 0 16 / 0.1), rgb(6 0 16 / 0.82) 82%)",
        }}
      />

      <motion.div style={{ y, opacity: opacidad }} className="relative z-10 px-6 text-center">
        <motion.p
          variants={ENTRADA}
          initial="oculto"
          animate="visible"
          custom={0}
          className="marquesina text-guia sm:text-[0.7rem]"
        >
          ARCADE BAR · COL. AMERICANA · GDL
        </motion.p>

        <h1 className="font-display mt-6 text-[clamp(1.9rem,8.4vw,8.5rem)] leading-none font-extrabold">
          <DecryptedText
            text={MARCA.nombre}
            animateOn="view"
            sequential
            revealDirection="center"
            speed={55}
            characters="0123456789ABCDEF█▓▒░"
            className="text-tinta"
            encryptedClassName="neon-magenta"
          />
        </h1>

        <motion.p
          variants={ENTRADA}
          initial="oculto"
          animate="visible"
          custom={1}
          className="neon-lavanda font-display mx-auto mt-5 text-base font-semibold sm:text-xl"
        >
          {MARCA.eslogan}
        </motion.p>

        <motion.p
          variants={ENTRADA}
          initial="oculto"
          animate="visible"
          custom={2}
          className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-tinta-media sm:text-base"
        >
          {MARCA.bajada}
        </motion.p>

        {/* CTA como ranura de monedas: la ficha cae al pasar el cursor */}
        <motion.a
          variants={ENTRADA}
          initial="oculto"
          animate="visible"
          custom={3}
          whileTap={reducido ? undefined : { scale: 0.97 }}
          href={`https://wa.me/${RESERVA.whatsapp}?text=${encodeURIComponent(RESERVA.mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-10 inline-flex items-center gap-3 rounded-(--radius-cabina) border-2 border-accion bg-accion/12 px-8 py-4 font-mono text-[0.7rem] font-semibold tracking-[0.26em] text-accion shadow-glow-magenta transition-colors hover:bg-accion hover:text-fondo"
        >
          <motion.svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            aria-hidden="true"
            className="shrink-0"
            variants={{ reposo: { y: 0, rotate: 0 }, cae: { y: [0, -3, 6], rotate: 180 } }}
            initial="reposo"
            whileHover={reducido ? undefined : "cae"}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            <circle cx="9" cy="9" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="9" cy="9" r="3" fill="currentColor" />
          </motion.svg>
          {MARCA.cta}
        </motion.a>
      </motion.div>

      <motion.p
        variants={ENTRADA}
        initial="oculto"
        animate="visible"
        custom={4}
        className="marquesina absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
      >
        {MARCA.horario}
      </motion.p>
    </section>
  );
}
