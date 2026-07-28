/* HUD DE CONVERSIÓN: el marcador que toda cabina mantiene fijo en pantalla.
   El velo va tokenizado (nada de bg-black/N suelto), CREDIT en cian porque
   es estado del sistema, y RESERVA es el único elemento en magenta con glow
   de toda la barra: un HUD que grita durante todo el scroll devalúa el glow.
   z-index por debajo de 55 para que las scanlines del CRT le pasen por
   encima, porque un HUD de arcade vive dentro de la pantalla, no fuera. */
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { RESERVA } from "../contenido";

export default function Hud() {
  const [visible, setVisible] = useState(false);
  const [credito, setCredito] = useState(0);
  const reducido = useReducedMotion();

  useEffect(() => {
    /* aparece al dejar atrás el hero: antes compite con el título */
    const alScroll = () => setVisible(window.scrollY > window.innerHeight * 0.85);
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  useEffect(() => {
    /* la ficha que insertaste en el attract queda registrada */
    if (sessionStorage.getItem("uv-attract-visto")) setCredito(1);
  }, []);

  const enlace = `https://wa.me/${RESERVA.whatsapp}?text=${encodeURIComponent(RESERVA.mensaje)}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: reducido ? 0 : "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: reducido ? 0 : "-100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          className="fixed inset-x-0 top-0 z-50 border-b border-borde backdrop-blur-sm"
          style={{ background: "var(--color-velo)" }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <p className="marquesina shrink-0 text-marcador">
              CREDIT {credito} <span className="hidden sm:inline">· 1UP 048750</span>
            </p>
            <a
              href={enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 border-2 border-accion bg-accion/15 px-4 py-2 font-mono text-[0.62rem] font-semibold tracking-[0.2em] text-accion shadow-glow-magenta transition-colors hover:bg-accion hover:text-fondo sm:px-6 sm:text-[0.68rem]"
              style={{ borderRadius: "var(--radius-cabina)" }}
            >
              RESERVA
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
