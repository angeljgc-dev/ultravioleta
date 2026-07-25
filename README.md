# ULTRAVIOLETA — Arcade bar · La noche en modo dos jugadores

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Motion](https://img.shields.io/badge/Motion-12-FF2EA6)
![WebGL](https://img.shields.io/badge/GLSL-shader%20propio-7C3AED)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)

Landing de un arcade bar ficticio en la Colonia Americana. Es la **primera página
de la serie construida con React** — y a propósito no lleva ni una línea de GSAP:
todo el movimiento sale de Motion, de shaders GLSL propios y de patrones del
catálogo React Bits.

| Hero | Sección |
| --- | --- |
| ![Hero](docs/hero.jpg) | ![Sección](docs/seccion.png) |

## La fantasía manda

Cada decisión de front —paleta, tipografía, transiciones, figuras— responde a una
sola pregunta de control: **«¿esto lo haría una máquina arcade?»**. Si algo se
sentía a plantilla de SaaS, se rehízo.

- **Attract mode.** La primera visita abre con la pantalla de reposo de una
  cabina: `© 1991 ULTRAVIOLETA AMUSEMENTS`, `INSERT COIN` parpadeando en pasos
  duros (nunca en *fade*: el parpadeo arcade es binario), `CREDIT 0` abajo a la
  izquierda. Cualquier tecla o clic inserta la ficha y un flash de 90 ms revela el
  sitio. Se salta sola a los 4 s, no se repite en la sesión y con
  `prefers-reduced-motion` ni aparece.
- **Fósforo, no gradiente.** El shader del hero cuantiza su salida a 22 niveles
  con un patrón Bayer 4×4: la seda deja de parecer degradado de fintech y pasa a
  leerse como fósforo ditherizado de monitor.
- **CRT sistémico.** Las scanlines dejaron el footer y son ahora una capa fija
  sobre toda la página, con viñeta en las esquinas.
- **Marcadores que cuentan.** Los récords suben desde cero con ceros a la
  izquierda (`048,750`) y frenan como un contador mecánico; las iniciales del
  dueño parpadean como una entrada de tabla.
- **Marquesinas, no *cards*.** Las máquinas se inclinan con `useSpring`
  (`rotateX/Y` ±6°, perspectiva 900) y el glare sigue al cursor.
- **Fichas troqueladas.** Los precios ya no son una tabla comparativa: cada plan
  es una ficha SVG con canto dentado y la denominación grabada, y el badge dice
  `HIGH SCORE`. Las esquinas del sitio bajaron a `rounded-md` — el arcade es
  rectangular y biselado.
- **Código Konami.** `↑↑↓↓←→←→BA` dispara un barrido de sincronía horizontal,
  el cartel `FREE PLAY MODE` glitcheado y 30 segundos de sala a más voltaje.
- **Reservar de verdad.** El CTA abre WhatsApp con el mensaje prellenado (día,
  hora, jugadores, nombre) — el canal real de un negocio en Guadalajara, sin
  backend.

## Dibujado en casa: la partida fantasma y la cabina

Las dos piezas centrales no usan un solo asset externo.

- **El demo screen.** Detrás de Torneos corre una partida fantasma estilo
  *Galaxian* — la máquina que da nombre a la casa. Todos los sprites están
  dibujados como matrices en el código (nave, dos tipos de invasor con aleteo,
  explosión de cuatro cuadros) y una fuente pixel 3×5 propia pinta el HUD. El
  juego se juega solo: la nave patrulla, elige columna, apunta y dispara con
  cadencia contemplativa (~90 s por oleada); los invasores derivan en onda
  triangular con aleteo síncrono cada 600 ms. Corre en un backbuffer de 240×136
  escalado con `image-rendering: pixelated`, sprites pre-horneados a canvas
  (30 `drawImage` por cuadro en vez de ~1,200 `fillRect`), y el bucle solo vive
  mientras la sección está en viewport.
- **La cabina.** En Fichas hay una cabina arcade 3D modelada con primitivas —
  cajas y cilindros con `flatShading`, marquesina emisiva con el nombre en la
  misma fuente pixel, palanca, tres botones, puerta de fichas con ranura cian —
  que sigue al puntero con `MathUtils.damp`. Y su pantalla **reproduce en vivo
  la misma partida fantasma** vía `CanvasTexture` del mismo backbuffer: un solo
  motor, dos salidas, y la landing entera se siente como un salón encendido.
- Cazado en el camino: el timestamp del primer `requestAnimationFrame` puede ser
  *anterior* al `performance.now()` con el que arrancas el reloj — el primer
  `dt` sale negativo y un módulo de JavaScript sobre un número negativo devuelve
  índice `-1`. Clamp inferior a cero y módulo euclidiano.

## El vocabulario de animación

- **Seda violeta por shader** — el fondo del hero es un fragment shader con
  *domain warping* (fBm deformando fBm) corriendo en un `<Canvas>` de React Three
  Fiber. El chunk de three.js viaja aparte (`lazy` + `Suspense`): el hero pinta al
  instante sobre basalto y la seda aparece al estar lista. Grano fino inyectado en
  el shader para romper el banding de los gradientes oscuros.
- **Título descifrado** — el nombre de la marca se revela desde el centro con un
  scramble de caracteres griegos y geométricos, con el contenido real siempre
  disponible en `sr-only`.
- **Bento con FLIP real** — el filtro por década reordena las tarjetas con
  animaciones `layout` de Motion y `AnimatePresence mode="popLayout"`; nada de
  recalcular posiciones a mano.
- **Parallax diferencial sin WebGL** — en el tríptico fotográfico cada columna
  deriva a velocidad distinta vía `useScroll` + `useTransform` por elemento.
- **Glow de color, nunca gris** — las sombras elevan con el color del elemento
  (tokens `--shadow-glow-*` en Tailwind v4), el patrón de los design systems
  "futuristas".
- **Chispas, cursor y marquee** — click sparks en canvas, cursor gooey con estela
  (filtro SVG + interpolación exponencial en rAF) y cinta infinita con velocidad
  suavizada y pausa al hover.

## Estructura

Una sola página en siete actos: hero → cinta arcade → las máquinas (bento
filtrable) → la sala (tríptico) → la barra (cocteles neón) → torneos → fichas.

## Degradación

| Condición | Qué pasa |
| --- | --- |
| `prefers-reduced-motion` | `<MotionConfig reducedMotion="user">` desactiva toda animación de transform (el *kill-rule* de CSS no alcanza a Motion, que anima por WAAPI); shader congelado, sin attract mode, sin scanlines, sin chispas. Verificado con muestreo por `rAF`: el transform salta de `y:36` a `none` sin un solo valor intermedio, y dos capturas separadas 1.4 s dan **0 píxeles** de diferencia |
| Táctil | Sin hovers necesarios; todo accesible por tap |
| Hero fuera de viewport | El render loop del shader pasa a `demand` |
| Sin interacción | El `rAF` de las chispas no corre: arranca al primer clic y se detiene solo cuando no queda ninguna viva |

### Accesibilidad

Contraste medido resolviendo el color real en canvas (Tailwind v4 emite `oklab`,
que la mayoría de auditores parsea mal) y compositando sobre `#060010`: el texto
informativo pasó de **2.83–3.41** a **5.70–6.65**, y las listas a **11.61** — todo
por encima del 4.5:1 de WCAG AA. Los filtros de década usan `aria-pressed`
(antes prometían un patrón de pestañas con teclado que no existía) y el foco
tiene anillo cian propio en vez del *outline* fino del navegador.

## Cómo correr

```bash
npm install
npm run dev
```

Build estático listo para Pages: `npm run build` → `dist/` (base relativa).

## Licencia

Código bajo licencia [MIT](LICENSE). **ULTRAVIOLETA** es una marca ficticia creada para demostrar trabajo de portafolio; cualquier parecido con un negocio real es coincidencia. Los recursos de terceros conservan la licencia original de sus autores — ver Créditos.

## Créditos

Fotografía: [Pexels](https://www.pexels.com). Componentes de texto descifrado,
glitch, chispas, cursor y marquee adaptados de [React Bits](https://reactbits.dev)
© David Haz, MIT License. Tipografías: Unbounded, Space Grotesk y JetBrains Mono
vía Google Fonts.

---
**Ángel Josué García Cantero** · Serie *páginas-película* (12 sitios con vocabularios de animación distintos).
