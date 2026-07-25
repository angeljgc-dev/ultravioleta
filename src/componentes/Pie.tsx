/* FOOTER — pantalla CRT: scanlines, logo con glitch y créditos. */
import GlitchText from "./reactbits/GlitchText";
import { MARCA, FOOTER } from "../contenido";

export default function Pie() {
  return (
    <footer className="crt relative overflow-hidden border-t border-tinta/10 px-6 py-20 text-center">
      <GlitchText speed={0.7} className="font-display text-[clamp(2rem,8vw,5rem)]">
        {MARCA.nombre}
      </GlitchText>

      <p className="mt-6 font-mono text-[0.62rem] tracking-[0.24em] text-tinta/60">
        {MARCA.direccion}
      </p>
      <p className="mt-2 font-mono text-[0.62rem] tracking-[0.24em] text-lavanda">{MARCA.horario}</p>

      <p className="mx-auto mt-10 max-w-md font-mono text-[0.56rem] leading-relaxed tracking-[0.18em] text-tinta/35">
        {FOOTER.extra}
      </p>
      <p className="mt-3 font-mono text-[0.56rem] tracking-[0.14em] text-tinta/35">
        {FOOTER.legal} · Fotografía: Pexels · Componentes de animación adaptados de React Bits (MIT)
      </p>
    </footer>
  );
}
