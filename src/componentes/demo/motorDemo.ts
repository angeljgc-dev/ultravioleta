/* MOTOR DE LA PARTIDA FANTASMA — el "demo screen" de una cabina real.
   Todo dibujado en código: sprites como matrices, fuente pixel 3×5 propia.
   Un solo backbuffer de 240×136 alimenta dos salidas: el fondo de Torneos
   y la pantalla de la cabina 3D (vía CanvasTexture). El bucle corre solo
   mientras algún consumidor esté visible (conteo de referencias). */

export const ANCHO = 240;
export const ALTO = 136;

const PALETA: Record<string, string> = {
  M: "#FF2EA6", // magenta
  C: "#2EE6FF", // cian
  L: "#B19EEF", // lavanda
  V: "#7C3AED", // violeta
  T: "#F4F0FF", // tinta
};

/* ---------- sprites (specs del director de arte) ---------- */
const NAVE = [
  "....T....",
  "....C....",
  "...CCC...",
  ".C.CCC.C.",
  "CCCCCCCCC",
  ".V..C..V.",
];
const INVASOR_A = [
  [
    ".M....M.",
    "..M..M..",
    ".MMMMMM.",
    "MTMMMMTM",
    "MMMMMMMM",
    "M.M..M.M",
  ],
  [
    "M......M",
    ".M....M.",
    ".MMMMMM.",
    "MTMMMMTM",
    "MMMMMMMM",
    "..M..M..",
  ],
];
const INVASOR_B = [
  [
    "...LL...",
    "..LLLL..",
    ".LLLLLL.",
    "LLTLLTLL",
    ".L.LL.L.",
    "L..LL..L",
  ],
  [
    "...LL...",
    "..LLLL..",
    ".LLLLLL.",
    "LLTLLTLL",
    "..L..L..",
    ".L....L.",
  ],
];
const EXPLOSION = [
  ["...CC...", "..CTTC..", "..CTTC..", "...CC..."],
  [
    "...MM...",
    "..M..M..",
    ".M.TT.M.",
    "M.TCCT.M",
    "M.TCCT.M",
    ".M.TT.M.",
    "..M..M..",
    "...MM...",
  ],
  [
    "M......M",
    "..V..V..",
    ".V....V.",
    "...MM...",
    "...MM...",
    ".V....V.",
    "..V..V..",
    "M......M",
  ],
  [
    "V......V",
    "........",
    "..V..V..",
    "........",
    "........",
    "..V..V..",
    "........",
    "V......V",
  ],
];

/* ---------- fuente pixel 3×5 (solo los glifos que usamos) ---------- */
const FUENTE: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  U: ["101", "101", "101", "101", "111"],
  P: ["111", "101", "111", "100", "100"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  L: ["100", "100", "100", "100", "111"],
  T: ["111", "010", "010", "010", "010"],
  R: ["111", "101", "110", "101", "101"],
  A: ["010", "101", "111", "101", "101"],
  V: ["101", "101", "101", "101", "010"],
  O: ["111", "101", "101", "101", "111"],
  E: ["111", "100", "111", "100", "111"],
  " ": ["000", "000", "000", "000", "000"],
};

/* ---------- horneado: cada sprite/frame a su propio canvas ---------- */
function hornear(matriz: string[]): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = matriz[0].length;
  c.height = matriz.length;
  const ctx = c.getContext("2d")!;
  matriz.forEach((fila, y) => {
    for (let x = 0; x < fila.length; x++) {
      const ch = fila[x];
      if (ch !== ".") {
        ctx.fillStyle = PALETA[ch];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  return c;
}

export function textoPixel(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  color: string,
  escala = 1
) {
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of texto) {
    const g = FUENTE[ch] ?? FUENTE[" "];
    g.forEach((fila, gy) => {
      for (let gx = 0; gx < 3; gx++) {
        if (fila[gx] === "1") ctx.fillRect(cx + gx * escala, y + gy * escala, escala, escala);
      }
    });
    cx += 4 * escala; // 3 de glifo + 1 de tracking
  }
  return cx - x;
}

/* ---------- estado del juego ---------- */
type Invasor = { col: number; fila: number; vivo: boolean; explosion: number };
type Proyectil = { x: number; y: number; vy: number; nuestro: boolean };

const FILAS = 4, COLS = 6, PITCH_X = 16, PITCH_Y = 12, ORIGEN_X = 76, ORIGEN_Y = 26;

interface Estado {
  t: number;
  invasores: Invasor[];
  faseOnda: number;      // px de barrido lateral (onda triangular)
  dirOnda: 1 | -1;
  descenso: number;
  naveX: number;
  colObjetivo: number;
  cooldown: number;
  cooldownEnemigo: number;
  proyectiles: Proyectil[];
  puntos: number;
  hi: number;
  fadeOleada: number;    // 0..1 al reaparecer
  pausaOleada: number;
}

function nuevaOleada(): Invasor[] {
  const inv: Invasor[] = [];
  for (let f = 0; f < FILAS; f++)
    for (let c = 0; c < COLS; c++) inv.push({ col: c, fila: f, vivo: true, explosion: -1 });
  return inv;
}

const estado: Estado = {
  t: 0,
  invasores: nuevaOleada(),
  faseOnda: 0,
  dirOnda: 1,
  descenso: 0,
  naveX: 116,
  colObjetivo: 2,
  cooldown: 2,
  cooldownEnemigo: 5,
  proyectiles: [],
  puntos: 48750,
  hi: 212360,
  fadeOleada: 1,
  pausaOleada: 0,
};

const xInvasor = (i: Invasor) => ORIGEN_X + i.col * PITCH_X + estado.faseOnda;
const yInvasor = (i: Invasor) => ORIGEN_Y + i.fila * PITCH_Y + estado.descenso;

function actualizar(dt: number) {
  const e = estado;
  e.t += dt;

  /* oleada muerta: pausa y reaparición con fade */
  const vivos = e.invasores.filter((i) => i.vivo);
  if (vivos.length === 0 && e.invasores.every((i) => i.explosion < 0)) {
    e.pausaOleada += dt;
    if (e.pausaOleada > 2) {
      e.invasores = nuevaOleada();
      e.descenso = 0;
      e.fadeOleada = 0;
      e.pausaOleada = 0;
    }
  }
  if (e.fadeOleada < 1) e.fadeOleada = Math.min(1, e.fadeOleada + dt / 1.5);

  /* barrido lateral triangular 6 px/s, ±20 px; desciende 3 px por rebote */
  e.faseOnda += e.dirOnda * 6 * dt;
  if (Math.abs(e.faseOnda) >= 20) {
    e.faseOnda = Math.sign(e.faseOnda) * 20;
    e.dirOnda = (e.dirOnda * -1) as 1 | -1;
    e.descenso = Math.min(24, e.descenso + 3);
  }

  /* explosiones avanzan (90 ms por frame, 4 frames) */
  for (const i of e.invasores) {
    if (i.explosion >= 0) {
      i.explosion += dt;
      if (i.explosion > 0.36) i.explosion = -1;
    }
  }

  /* nave fantasma: patrulla hacia una columna viva y dispara alineada */
  const columnasVivas = [...new Set(vivos.map((i) => i.col))];
  if (columnasVivas.length && !columnasVivas.includes(e.colObjetivo)) {
    e.colObjetivo = columnasVivas[Math.floor(Math.random() * columnasVivas.length)];
  }
  const objetivoX = ORIGEN_X + e.colObjetivo * PITCH_X + e.faseOnda;
  const delta = objetivoX - e.naveX;
  e.naveX += Math.sign(delta) * Math.min(Math.abs(delta), 24 * dt);

  /* esquiva: si un proyectil enemigo baja cerca, deslizarse al lado libre */
  const amenaza = e.proyectiles.find((p) => !p.nuestro && Math.abs(p.x - e.naveX) < 18 && p.y > 90);
  if (amenaza) e.naveX += amenaza.x > e.naveX ? -20 * dt * 3 : 20 * dt * 3;
  e.naveX = Math.max(8, Math.min(ANCHO - 8, e.naveX));

  e.cooldown -= dt;
  if (e.cooldown <= 0 && Math.abs(delta) < 2 && vivos.length) {
    e.proyectiles.push({ x: e.naveX, y: 120, vy: -90, nuestro: true });
    e.cooldown = 2.8 + (Math.random() - 0.5) * 2.4;
    e.colObjetivo = columnasVivas[Math.floor(Math.random() * columnasVivas.length)] ?? 0;
  }

  /* fuego enemigo esporádico desde la fila inferior */
  e.cooldownEnemigo -= dt;
  if (e.cooldownEnemigo <= 0 && vivos.length) {
    const col = columnasVivas[Math.floor(Math.random() * columnasVivas.length)];
    const inferior = vivos.filter((i) => i.col === col).sort((a, b) => b.fila - a.fila)[0];
    if (inferior) {
      e.proyectiles.push({ x: xInvasor(inferior) + 4, y: yInvasor(inferior) + 7, vy: 45, nuestro: false });
    }
    e.cooldownEnemigo = 7 + (Math.random() - 0.5) * 4;
  }

  /* proyectiles: mover y colisionar */
  e.proyectiles = e.proyectiles.filter((p) => {
    p.y += p.vy * dt;
    if (p.y < -4 || p.y > ALTO + 4) return false;
    if (p.nuestro) {
      for (const i of e.invasores) {
        if (!i.vivo || i.explosion >= 0) continue;
        const ix = xInvasor(i), iy = yInvasor(i);
        if (p.x >= ix && p.x <= ix + 8 && p.y >= iy && p.y <= iy + 6) {
          i.vivo = false;
          i.explosion = 0;
          e.puntos += i.fila < 2 ? 150 : 100;
          if (e.puntos > e.hi) e.hi = e.puntos; // quien se queda mirando lo ve pasar
          return false;
        }
      }
    }
    return true;
  });
}

/* ---------- dibujo ---------- */
let horneados: {
  nave: HTMLCanvasElement;
  a: HTMLCanvasElement[];
  b: HTMLCanvasElement[];
  exp: HTMLCanvasElement[];
} | null = null;

function dibujar(ctx: CanvasRenderingContext2D) {
  if (!horneados) {
    horneados = {
      nave: hornear(NAVE),
      a: INVASOR_A.map(hornear),
      b: INVASOR_B.map(hornear),
      exp: EXPLOSION.map(hornear),
    };
  }
  const e = estado;
  ctx.fillStyle = "#060010";
  ctx.fillRect(0, 0, ANCHO, ALTO);

  /* HUD: dos datos, nada más */
  const punt = String(Math.min(e.puntos, 999999)).padStart(6, "0");
  textoPixel(ctx, `1UP ${punt}`, 4, 4, PALETA.L);
  const hiTexto = `HI ${e.hi}`;
  textoPixel(ctx, hiTexto, Math.floor((ANCHO - hiTexto.length * 4) / 2), 4, PALETA.T);

  /* formación (aleteo síncrono cada 600 ms, fade al reaparecer);
     módulo euclidiano: nunca índice negativo aunque e.t retrocediera */
  const frame = ((Math.floor(e.t / 0.6) % 2) + 2) % 2;
  ctx.globalAlpha = e.fadeOleada;
  for (const i of e.invasores) {
    const ix = Math.round(xInvasor(i)), iy = Math.round(yInvasor(i));
    if (i.explosion >= 0) {
      const f = Math.min(3, Math.floor(i.explosion / 0.09));
      const s = horneados.exp[f];
      ctx.drawImage(s, ix + 4 - (s.width >> 1), iy + 3 - (s.height >> 1));
    } else if (i.vivo) {
      ctx.drawImage((i.fila < 2 ? horneados.b : horneados.a)[frame], ix, iy);
    }
  }
  ctx.globalAlpha = 1;

  /* nave y proyectiles */
  ctx.drawImage(horneados.nave, Math.round(e.naveX) - 4, 124);
  for (const p of e.proyectiles) {
    const x = Math.round(p.x), y = Math.round(p.y);
    if (p.nuestro) {
      ctx.fillStyle = PALETA.T; ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = PALETA.C; ctx.fillRect(x, y + 1, 1, 2);
    } else {
      ctx.fillStyle = PALETA.M; ctx.fillRect(x, y, 1, 2);
      ctx.fillStyle = PALETA.V; ctx.fillRect(x, y + 2, 1, 1);
    }
  }
}

/* ---------- bucle compartido con conteo de referencias ---------- */
export const lienzoDemo = document.createElement("canvas");
lienzoDemo.width = ANCHO;
lienzoDemo.height = ALTO;
const ctxDemo = lienzoDemo.getContext("2d")!;

let consumidores = 0;
let raf = 0;
let ultimo = 0;
const alPintar = new Set<() => void>();

function tic(ahora: number) {
  /* el timestamp del primer rAF puede ser ANTERIOR al performance.now() con el
     que arrancamos (marca el inicio del vsync): clamp inferior a 0 o el primer
     dt sale negativo, e.t se vuelve negativo y el módulo de JS da índice -1 */
  const dt = Math.min(Math.max((ahora - ultimo) / 1000, 0), 0.1);
  ultimo = ahora;
  actualizar(dt);
  dibujar(ctxDemo);
  alPintar.forEach((fn) => fn());
  raf = requestAnimationFrame(tic);
}

/** Un consumidor visible pide el bucle; devuelve la función para soltarlo. */
export function usarDemo(onFrame?: () => void): () => void {
  if (onFrame) alPintar.add(onFrame);
  consumidores++;
  if (consumidores === 1) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      /* un solo cuadro congelado, sin bucle */
      actualizar(0);
      dibujar(ctxDemo);
      alPintar.forEach((fn) => fn());
    } else {
      ultimo = performance.now();
      raf = requestAnimationFrame(tic);
    }
  } else {
    onFrame?.(); /* ya hay cuadro pintado: sincroniza al entrar */
  }
  return () => {
    consumidores = Math.max(0, consumidores - 1);
    if (onFrame) alPintar.delete(onFrame);
    if (consumidores === 0) cancelAnimationFrame(raf);
  };
}
