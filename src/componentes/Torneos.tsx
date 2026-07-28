/* TORNEOS: programa semanal como tabla de posiciones, con la partida
   fantasma corriendo de fondo: la metáfora literal de la sección. */
import { TORNEOS } from "../contenido";
import DemoScreen from "./demo/DemoScreen";
import { BarridoScanline, TituloSprite } from "./transiciones";

export default function Torneos() {
  return (
    <section id="torneos" aria-label="Torneos" className="relative overflow-hidden py-28 sm:py-36">
      <DemoScreen opacidad={0.15} />
      <div className="relative mx-auto max-w-6xl px-6">
      <header className="mb-12 max-w-xl">
        <p className="marquesina text-accion">RANKED · INSCRIPCIÓN EN BARRA</p>
        <TituloSprite
          texto="Torneos"
          claseEstela="text-marcador"
          className="font-display mt-3 text-3xl font-bold sm:text-5xl"
        />
        <p className="mt-4 text-tinta-media">
          Cuatro noches, cuatro reglas distintas. El marcador vive en el neón de la entrada y no se borra nunca.
        </p>
      </header>

      {/* el haz imprime el marcador renglón a renglón: los <li> ya no se
          animan por su cuenta, el barrido hace el escalonado */}
      <BarridoScanline color="#FF2EA6">
      <ol className="divide-y divide-borde border-y border-borde">
        {TORNEOS.map((t) => (
          <li
            key={t.dia}
            className="group grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-1 py-6 sm:grid-cols-[6rem_1fr_1fr_auto] sm:gap-x-10"
          >
            <span className="neon-lavanda font-display text-2xl font-bold sm:text-3xl">{t.dia}</span>
            <div>
              <h3 className="font-display text-lg font-semibold transition-colors group-hover:text-accion sm:text-xl">
                {t.nombre}
              </h3>
              <p className="font-mono text-[0.62rem] tracking-[0.2em] text-tinta-media sm:hidden">{t.maquina}</p>
            </div>
            <p className="hidden font-mono text-[0.68rem] tracking-[0.16em] text-tinta-media sm:block">{t.maquina}</p>
            <p className="col-start-2 font-mono text-[0.68rem] tracking-[0.14em] text-marcador sm:col-start-auto sm:text-right">
              {t.premio}
            </p>
          </li>
        ))}
      </ol>
      </BarridoScanline>
      </div>
    </section>
  );
}
