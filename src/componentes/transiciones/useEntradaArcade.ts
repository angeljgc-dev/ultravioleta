/* ============================================================================
   useEntradaArcade: el disparador único de todas las transiciones de sección.
   ----------------------------------------------------------------------------
   Devuelve { ref, activo, reducido }:
     · ref      → se cuelga del contenedor de la sección
     · activo   → true cuando la sección entra en pantalla (una sola vez)
     · reducido → true si el usuario pidió menos movimiento

   Por qué NO basta con el <MotionConfig reducedMotion="user"> de App.tsx:
   ese modo desactiva transform y layout, pero DEJA PASAR opacity y clip-path,
   que es justo con lo que están hechas estas transiciones (persianas, wipes,
   barridos). Así que cada componente consulta `reducido` y, si está activo,
   renderiza el contenido plano: cero overlays, cero recortes, cero motion.
   ========================================================================== */
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

/* Motion no exporta los tipos de `useInView`, así que los derivamos de la propia
   firma: si la librería cambia, esto cambia con ella y no hay que castear nada. */
type OpcionesInView = NonNullable<Parameters<typeof useInView>[1]>;

type Opciones = {
  /** Margen del observer: negativo = espera a que la sección entre de verdad. */
  margen?: OpcionesInView["margin"];
  /** Fracción del elemento que debe verse para disparar (0-1 | "some" | "all"). */
  cantidad?: OpcionesInView["amount"];
};

export function useEntradaArcade<T extends HTMLElement = HTMLDivElement>(
  opciones: Opciones = {},
) {
  const { margen = "-90px", cantidad } = opciones;

  const ref = useRef<T>(null);
  const reducido = useReducedMotion() ?? false;

  const enVista = useInView(ref, {
    once: true,
    margin: margen,
    ...(cantidad !== undefined ? { amount: cantidad } : {}),
  });

  /* ---- RED DE SEGURIDAD: la sección que nunca llegó a estar en pantalla ----
     IntersectionObserver evalúa una vez por frame. Si el scroll salta de golpe
     (ancla #torneos, restauración de scroll al recargar, Fin/Inicio, un flick
     agresivo en móvil), una sección puede pasar del "abajo" al "arriba" sin un
     solo frame intersecando: el observer nunca dispara y el contenido se queda
     recortado PARA SIEMPRE. Con un fade eso sería feo; con clip-path es
     contenido invisible.

     Así que vigilamos, solo hasta que la sección se active, si su borde
     inferior ya quedó por encima del viewport. Si es así, la damos por vista.
     El listener es pasivo, va en rAF y se desengancha en cuanto sirve. */
  const [rebasado, setRebasado] = useState(false);

  useEffect(() => {
    if (reducido || enVista || rebasado) return;

    let encolado = false;
    const revisar = () => {
      encolado = false;
      const el = ref.current;
      if (!el) return;
      if (el.getBoundingClientRect().bottom < 0) setRebasado(true);
    };
    const alScroll = () => {
      if (encolado) return;
      encolado = true;
      requestAnimationFrame(revisar);
    };

    revisar(); // caso recarga con el scroll ya restaurado más abajo
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, [reducido, enVista, rebasado]);

  /* Con movimiento reducido damos por "ya entrado" desde el primer frame:
     el contenido se pinta estático y ninguna capa llega a existir. */
  return { ref, reducido, activo: reducido || enVista || rebasado };
}
