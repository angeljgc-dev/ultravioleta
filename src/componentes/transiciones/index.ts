/* ============================================================================
   TRANSICIONES DE SECCIÓN: vocabulario arcade de ULTRAVIOLETA
   ----------------------------------------------------------------------------
   Cinco cambios de pantalla, uno por tipo de contenido. Ninguna sección debería
   volver a entrar con el fade-up genérico.

   WipeBloques      STAGE CLEAR: rejilla de píxeles que se desintegra.
                    → para la sección grande que "es" el nivel (Las máquinas).

   TituloSprite     El encabezado se ensambla de cuadros con estela de sprite.
                    → para los h2 de cada sección; se encadena con lo demás.

   EncendidoCRT     Punto → línea → imagen. La sección enciende como un tubo.
                    → para bloques que YA son pantallas (fotos, 3D, vídeo).

   BarridoScanline  Un haz cruza y deja el contenido dibujado detrás.
                    → para listas y tablas: el tubo imprime el marcador.

   SlamRoster       Selección de personaje: las tarjetas llegan de frente.
                    → para rejillas de tarjetas comparables (planes, cocteles).

   Todas respetan prefers-reduced-motion devolviendo el contenido estático, sin
   capas, sin recortes y sin componentes de motion en medio.
   ========================================================================== */
export { useEntradaArcade } from "./useEntradaArcade";
export {
  SALIDA_CABINA,
  CORTE_SECO,
  HAZ,
  RESORTE_SPRITE,
  RESORTE_SLAM,
  escalones,
  azar,
  aRejilla,
  colorBloque,
} from "./arcade";

export { default as WipeBloques } from "./WipeBloques";
export { default as TituloSprite } from "./TituloSprite";
export { default as EncendidoCRT } from "./EncendidoCRT";
export { default as BarridoScanline } from "./BarridoScanline";
export { SlamRoster, ItemRoster } from "./SlamRoster";
export { slamContenedor, slamItem } from "./variantesSlam";
