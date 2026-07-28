import { MotionConfig } from "motion/react";
import ClickSpark from "./componentes/reactbits/ClickSpark";
import LogoLoop from "./componentes/reactbits/LogoLoop";
import AttractMode from "./componentes/AttractMode";
import FreePlay from "./componentes/FreePlay";
import Hud from "./componentes/Hud";
import Hero from "./componentes/Hero";
import Sala from "./componentes/Sala";
import Maquinas from "./componentes/Maquinas";
import Barra from "./componentes/Barra";
import Torneos from "./componentes/Torneos";
import Fichas from "./componentes/Fichas";
import Pie from "./componentes/Pie";
import { MARQUEE } from "./contenido";

const PALABRAS = MARQUEE.map((p, i) => (
  <span
    key={p}
    className={`font-display text-2xl font-bold tracking-wide sm:text-4xl ${
      i % 3 === 0 ? "neon-magenta" : i % 3 === 1 ? "text-tinta/30" : "neon-cian"
    }`}
  >
    {p}
  </span>
));

export default function App() {
  return (
    /* reducedMotion="user" corta TODAS las animaciones declarativas de Motion:
       el kill-rule de CSS no alcanza a WAAPI, que es como Motion anima */
    <MotionConfig reducedMotion="user">
      <ClickSpark sparkColor="#FF2EA6" sparkCount={10} sparkRadius={22} sparkSize={9}>
        <AttractMode />
        <FreePlay />
        <Hud />
        {/* la sala entera vista a través de un CRT */}
        <div className="crt-global" aria-hidden="true" />

        <main>
          <Hero />

          <div className="border-y border-tinta/8 py-8" aria-hidden="true">
            <LogoLoop items={PALABRAS} speed={90} gap={64} ariaLabel="Cinta decorativa de frases arcade" />
          </div>

          <Maquinas />
          <Sala />
          <Barra />
          <Torneos />
          <Fichas />
        </main>
        <Pie />
      </ClickSpark>
    </MotionConfig>
  );
}
