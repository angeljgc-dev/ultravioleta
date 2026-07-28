/* ATTRACT MODE: la pantalla de reposo de una cabina real.
   "INSERT COIN" parpadeando en pasos duros; cualquier click/tecla inserta la
   ficha (CREDIT 1) y un flash de 80ms revela el sitio. Se salta sola a los 4s,
   no se repite en la misma sesión, y con reduced-motion ni aparece. */
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

const CLAVE = "uv-attract-visto";

export default function AttractMode() {
  const [fase, setFase] = useState<"oculto" | "attract" | "flash">(() => {
    if (typeof window === "undefined") return "oculto";
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return "oculto";
    return sessionStorage.getItem(CLAVE) ? "oculto" : "attract";
  });

  const insertar = useCallback(() => {
    setFase((f) => (f === "attract" ? "flash" : f));
  }, []);

  useEffect(() => {
    if (fase !== "attract") return;
    sessionStorage.setItem(CLAVE, "1");
    const timer = setTimeout(insertar, 4000);   // nunca secuestrar al usuario
    const alTeclear = () => insertar();
    window.addEventListener("keydown", alTeclear);
    window.addEventListener("pointerdown", alTeclear);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", alTeclear);
      window.removeEventListener("pointerdown", alTeclear);
    };
  }, [fase, insertar]);

  useEffect(() => {
    if (fase !== "flash") return;
    const timer = setTimeout(() => setFase("oculto"), 90);
    return () => clearTimeout(timer);
  }, [fase]);

  return (
    <AnimatePresence>
      {fase === "attract" && (
        <motion.div
          key="attract"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.05 }}
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-10 bg-fondo font-mono"
          role="dialog"
          aria-label="Pantalla de inicio. Toca o presiona una tecla para entrar."
        >
          <p className="text-[0.6rem] tracking-[0.34em] text-tinta-media">© 1991 ULTRAVIOLETA AMUSEMENTS</p>
          <p className="font-display text-[clamp(1.6rem,6vw,4rem)] font-extrabold tracking-wide text-tinta">
            ULTRAVIOLETA
          </p>
          <p className="parpadeo neon-magenta text-sm font-semibold tracking-[0.4em] sm:text-lg">
            INSERT COIN
          </p>
          <p className="absolute bottom-8 left-8 text-[0.62rem] tracking-[0.3em] text-marcador">CREDIT 0</p>
          <p className="absolute right-8 bottom-8 text-[0.62rem] tracking-[0.3em] text-tinta-media">
            1UP · HI 212360
          </p>
        </motion.div>
      )}
      {fase === "flash" && (
        <motion.div
          key="flash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[80] bg-tinta"
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}
