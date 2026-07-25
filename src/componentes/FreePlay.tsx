/* CÓDIGO KONAMI → MODO FREE PLAY.
   ↑↑↓↓←→←→BA: barrido de sincronía horizontal, cartel glitcheado y 30 segundos
   con la sala a más voltaje (clase .freeplay en <html>). Puro huevo de pascua. */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import GlitchText from "./reactbits/GlitchText";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

export default function FreePlay() {
  const [activo, setActivo] = useState(false);
  const [cartel, setCartel] = useState(false);

  useEffect(() => {
    let progreso = 0;
    const alTeclear = (e: KeyboardEvent) => {
      const tecla = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      progreso = tecla === KONAMI[progreso] ? progreso + 1 : tecla === KONAMI[0] ? 1 : 0;
      if (progreso === KONAMI.length) {
        progreso = 0;
        setActivo(true);
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  useEffect(() => {
    if (!activo) return;
    document.documentElement.classList.add("freeplay");
    setCartel(true);
    const timerCartel = setTimeout(() => setCartel(false), 4500);
    const timer = setTimeout(() => {
      document.documentElement.classList.remove("freeplay");
      setActivo(false);
    }, 30000);
    return () => {
      clearTimeout(timer);
      clearTimeout(timerCartel);
      document.documentElement.classList.remove("freeplay");
    };
  }, [activo]);

  return (
    <AnimatePresence>
      {activo && cartel && (
        <>
          {/* barrido de sincronía horizontal, como un CRT perdiendo la señal */}
          <motion.div
            initial={{ top: "-2%" }}
            animate={{ top: "102%" }}
            transition={{ duration: 0.5, ease: "linear" }}
            className="pointer-events-none fixed left-0 z-[75] h-[3px] w-full bg-tinta/90"
            style={{ boxShadow: "0 0 24px rgb(244 240 255 / .8)" }}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.45 }}
            className="pointer-events-none fixed inset-x-0 top-[12vh] z-[75] flex flex-col items-center gap-2"
            role="status"
          >
            <GlitchText speed={0.4} className="font-display text-[clamp(1.4rem,5vw,3rem)]">
              FREE PLAY MODE
            </GlitchText>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.8, duration: 1.2 }}
              className="font-mono text-[0.65rem] tracking-[0.32em] text-cian"
            >
              30 LIVES · CÓDIGO ACEPTADO
            </motion.p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
