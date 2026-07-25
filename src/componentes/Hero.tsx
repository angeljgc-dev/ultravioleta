/* HERO — seda violeta por shader + título descifrado + parallax de salida con useScroll. */
import { useRef, lazy, Suspense } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import DecryptedText from "./reactbits/DecryptedText";
import { MARCA } from "../contenido";

/* three.js viaja en su propio chunk: el hero pinta al instante sobre el
   fondo basalto y la seda aparece en cuanto el shader está listo */
const FondoSeda = lazy(() => import("./FondoSeda"));

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-mono text-[0.62rem] tracking-[0.34em] text-lavanda sm:text-[0.7rem]"
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
            characters="ΔΨΦΩ▲▼◆●01"
            className="text-tinta"
            encryptedClassName="neon-magenta"
          />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="neon-lavanda font-display mx-auto mt-5 text-base font-semibold sm:text-xl"
        >
          {MARCA.eslogan}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-tinta/70 sm:text-base"
        >
          {MARCA.bajada}
        </motion.p>

        <motion.a
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
          whileHover={reducido ? undefined : { scale: 1.04 }}
          whileTap={reducido ? undefined : { scale: 0.97 }}
          href="#fichas"
          className="mt-10 inline-block rounded-full border border-magenta bg-magenta/12 px-9 py-4 font-mono text-[0.7rem] font-semibold tracking-[0.26em] text-magenta shadow-glow-magenta transition-colors hover:bg-magenta hover:text-fondo"
        >
          {MARCA.cta}
        </motion.a>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 font-mono text-[0.58rem] tracking-[0.3em] text-tinta/40"
      >
        {MARCA.horario}
      </motion.p>
    </section>
  );
}
