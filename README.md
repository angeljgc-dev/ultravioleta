# ULTRAVIOLETA

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Motion](https://img.shields.io/badge/Motion-12-FF2EA6)
![WebGL](https://img.shields.io/badge/GLSL-shader%20propio-7C3AED)

Ver en vivo: https://angeljgc-dev.github.io/ultravioleta/

Landing de un arcade bar ficticio en la Colonia Americana. Es la primera página de la serie que construí con React, y a propósito no lleva ni una línea de GSAP: todo el movimiento sale de Motion, de shaders GLSL propios y de patrones del catálogo React Bits.

| Hero | Sección |
| --- | --- |
| ![Hero](docs/hero.jpg) | ![Sección](docs/seccion.png) |

## Decisiones de diseño

Cada decisión de front (paleta, tipografía, transiciones, figuras) responde a la misma pregunta: ¿esto lo haría una máquina arcade? Si algo se sentía a plantilla de SaaS, lo rehacía.

- **Attract mode.** La primera visita abre con la pantalla de reposo de una cabina: `© 1991 ULTRAVIOLETA AMUSEMENTS`, `INSERT COIN` parpadeando en pasos duros (sin fade, porque el parpadeo arcade es binario) y `CREDIT 0` abajo a la izquierda. Cualquier tecla o clic inserta la ficha y un flash de 90 ms revela el sitio. Se salta sola a los 4 s, no se repite en la sesión y con `prefers-reduced-motion` ni aparece.
- El shader del hero cuantiza su salida a 22 niveles con un patrón Bayer 4×4, así deja de leerse como degradado de fintech y pasa a verse como fósforo ditherizado de monitor.
- Las scanlines dejaron el footer y ahora son una capa fija sobre toda la página, con viñeta en las esquinas.
- **Marcadores.** Los récords suben desde cero con ceros a la izquierda (`048,750`) y frenan como un contador mecánico; las iniciales del dueño parpadean como una entrada de tabla.
- Las máquinas se inclinan con `useSpring` (`rotateX/Y` ±6°, perspectiva 900) y el glare sigue al cursor.
- **Fichas troqueladas.** Cada plan de precios es una ficha SVG con canto dentado y la denominación grabada, con el badge `HIGH SCORE`. Las esquinas del sitio bajaron a `rounded-md`, para que todo se vea rectangular y biselado como un arcade.
- **Código Konami.** `↑↑↓↓←→←→BA` dispara un barrido de sincronía horizontal, el cartel `FREE PLAY MODE` glitcheado y 30 segundos de sala a más voltaje.
- **Reservar de verdad.** El CTA abre WhatsApp con el mensaje prellenado (día, hora, jugadores, nombre), que es el canal real de un negocio en Guadalajara, sin backend.

## Gráficos hechos a mano

Las dos piezas centrales no usan un solo asset externo.

El demo screen: detrás de Torneos corre una partida fantasma estilo *Galaxian*, la máquina que da nombre a la casa. Todos los sprites están dibujados como matrices en el código (nave, dos tipos de invasor con aleteo, explosión de cuatro cuadros) y una fuente pixel 3×5 propia pinta el HUD. El juego se juega solo: la nave patrulla, elige columna, apunta y dispara con cadencia lenta (~90 s por oleada); los invasores derivan en onda triangular con aleteo síncrono cada 600 ms. Corre en un backbuffer de 240×136 escalado con `image-rendering: pixelated`, con sprites pre-horneados a canvas (30 `drawImage` por cuadro en vez de ~1,200 `fillRect`), y el bucle solo vive mientras la sección está en viewport.

La cabina: en Fichas hay una cabina arcade 3D modelada con primitivas (cajas y cilindros con `flatShading`, marquesina emisiva con el nombre en la misma fuente pixel, palanca, tres botones, puerta de fichas con ranura cian) que sigue al puntero con `MathUtils.damp`. Su pantalla reproduce en vivo la misma partida fantasma vía `CanvasTexture` del mismo backbuffer: el mismo motor alimenta las dos salidas, y la landing entera se siente como un salón encendido.

Un detalle que me costó rastrear: el timestamp del primer `requestAnimationFrame` puede ser anterior al `performance.now()` con el que arrancas el reloj. El primer `dt` sale negativo, y un módulo de JavaScript sobre un número negativo devuelve índice `-1`. Se arregla con clamp inferior a cero y módulo euclidiano.

## Animaciones

- **Seda violeta por shader.** El fondo del hero es un fragment shader con *domain warping* (fBm deformando fBm) corriendo en un `<Canvas>` de React Three Fiber. El chunk de three.js viaja aparte (`lazy` + `Suspense`): el hero pinta al instante sobre basalto y la seda aparece al estar lista. El grano fino va inyectado en el shader para romper el banding de los gradientes oscuros.
- **Título descifrado.** El nombre de la marca se revela desde el centro con un scramble de caracteres griegos y geométricos, con el contenido real siempre disponible en `sr-only`.
- El filtro por década reordena las tarjetas con animaciones `layout` de Motion y `AnimatePresence mode="popLayout"`, sin recalcular posiciones a mano.
- En el tríptico fotográfico cada columna deriva a velocidad distinta con `useScroll` + `useTransform` por elemento (parallax diferencial sin WebGL).
- Las sombras elevan con el color del elemento (tokens `--shadow-glow-*` en Tailwind v4), el patrón de los design systems futuristas.
- Chispas, cursor y marquee: click sparks en canvas, cursor gooey con estela (filtro SVG + interpolación exponencial en rAF) y cinta infinita con velocidad suavizada y pausa al hover.

## Estructura

Una sola página en siete actos: hero → cinta arcade → las máquinas (bento filtrable) → la sala (tríptico) → la barra (cocteles neón) → torneos → fichas.

## Fallbacks y accesibilidad

| Condición | Qué pasa |
| --- | --- |
| `prefers-reduced-motion` | `<MotionConfig reducedMotion="user">` desactiva toda animación de transform (el kill-rule de CSS no alcanza a Motion, que anima por WAAPI); shader congelado, sin attract mode, sin scanlines, sin chispas. Verificado con muestreo por `rAF`: el transform salta de `y:36` a `none` sin un solo valor intermedio, y dos capturas separadas 1.4 s dan 0 píxeles de diferencia |
| Táctil | Sin hovers necesarios; todo accesible por tap |
| Hero fuera de viewport | El render loop del shader pasa a `demand` |
| Sin interacción | El `rAF` de las chispas no corre: arranca al primer clic y se detiene solo cuando no queda ninguna viva |

Contraste medido resolviendo el color real en canvas (Tailwind v4 emite `oklab`, que la mayoría de auditores parsea mal) y compositando sobre `#060010`: el texto informativo pasó de 2.83–3.41 a 5.70–6.65, y las listas a 11.61, todo por encima del 4.5:1 de WCAG AA. Los filtros de década usan `aria-pressed` (antes prometían un patrón de pestañas con teclado que no existía) y el foco tiene anillo cian propio en vez del outline fino del navegador.

## Cómo correr

```bash
npm install
npm run dev
```

Build estático listo para Pages: `npm run build` → `dist/` (base relativa).

## Licencia

Código bajo licencia [MIT](LICENSE). ULTRAVIOLETA es una marca inventada solo para este trabajo de portafolio; cualquier parecido con un negocio real es coincidencia. Los recursos de terceros mantienen la licencia de sus autores (ver Créditos).

## Créditos

Fotografía: [Pexels](https://www.pexels.com). Componentes de texto descifrado, glitch, chispas, cursor y marquee adaptados de [React Bits](https://reactbits.dev) © David Haz, MIT License. Tipografías: Unbounded, Space Grotesk y JetBrains Mono vía Google Fonts.

---
Ángel Josué García Canteros · [github.com/angeljgc-dev](https://github.com/angeljgc-dev)
