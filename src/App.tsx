import ClickSpark from "./componentes/reactbits/ClickSpark";
import BlobCursor from "./componentes/reactbits/BlobCursor";
import LogoLoop from "./componentes/reactbits/LogoLoop";
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
      i % 3 === 0 ? "neon-magenta" : i % 3 === 1 ? "text-tinta/25" : "neon-cian"
    }`}
  >
    {p}
  </span>
));

export default function App() {
  return (
    <ClickSpark sparkColor="#FF2EA6" sparkCount={10} sparkRadius={22} sparkSize={9}>
      <BlobCursor />
      <main>
        <Hero />

        <div className="border-y border-tinta/8 py-8">
          <LogoLoop items={PALABRAS} speed={90} gap={64} ariaLabel="Frases arcade" />
        </div>

        <Maquinas />
        <Sala />
        <Barra />
        <Torneos />
        <Fichas />
      </main>
      <Pie />
    </ClickSpark>
  );
}
