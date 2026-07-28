/* SALA DE MÁQUINAS 3D: la cabina solitaria se vuelve pasillo.
   ────────────────────────────────────────────────────────────────────────────
   Reemplaza a la cabina única conservando su blueprint (alto 2.0, marquesina
   +20°, pantalla +15°, panel −12°) y su misma paleta. Cambia la estrategia de
   render: en vez de N grupos de mallas, TODA la sala se colapsa en ~9 draw
   calls mediante familias instanciadas + dos geometrías fusionadas a mano.

   REGLAS DE LA MESA QUE ESTE ARCHIVO RESPETA
   · Un solo canvas WebGL (este). Cero postprocesado, cero EffectComposer.
   · Una única CanvasTexture viva (la partida de motorDemo) en la cabina
     central; las demás pantallas son quads apagados con vertex color.
   · dpr capado, frameloop "demand" fuera de viewport, reduced-motion = 1 cuadro.
   · Scroll con useScroll de Motion leído por MotionValue.get() dentro de
     useFrame: cero re-render de React por cuadro. CERO GSAP.

   PRESUPUESTO (ver nota al pie del archivo).
   ──────────────────────────────────────────────────────────────────────────── */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useScroll, type MotionValue } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { lienzoDemo, textoPixel, usarDemo } from "./motorDemo";

/* ─────────────────────────────── paleta ─────────────────────────────────── */
const FONDO = "#060010";
const TINTA = "#F4F0FF";
const LAVANDA = "#B19EEF";
const VIOLETA = "#7C3AED";
const MAGENTA = "#FF2EA6";
const CIAN = "#2EE6FF";
/* carcasa: FONDO puro deja las cabinas como manchas negras cuando son seis.
   Un violeta casi negro les devuelve volumen sin salirse de la paleta. */
const CARCASA = "#150C28";

/* ───────────────────────── catálogo de la sala ──────────────────────────
   OJO con los nombres: se pintan con la fuente pixel 3×5 de motorDemo, que
   solo tiene los glifos 0-9 U P H I L T R A V O E y espacio. Todos los
   nombres de abajo están dentro de ese alfabeto a propósito: reusamos la
   fuente en vez de duplicarla. */
type FichaCabina = {
  nombre: string;
  acento: string; // color de marquesina y de su charco en el piso
  cuerpo: number; // altura del cuerpo (varía la silueta de la fila)
  viva?: boolean; // la única con la partida corriendo
  apagada?: boolean; // fuera de servicio: sin neón, marquesina en gris
  parpadeo?: number; // 0 = estable; >0 = tubo cansado
};

const CATALOGO: FichaCabina[] = [
  { nombre: "PILOTO", acento: CIAN, cuerpo: 0.78 },
  { nombre: "REPTIL", acento: VIOLETA, cuerpo: 0.95, parpadeo: 0.22 },
  { nombre: "ULTRAVIOLETA", acento: MAGENTA, cuerpo: 0.85, viva: true },
  { nombre: "TILT", acento: LAVANDA, cuerpo: 0.72, apagada: true },
  { nombre: "VOLTIO", acento: CIAN, cuerpo: 1.0 },
  { nombre: "HELIO", acento: MAGENTA, cuerpo: 0.88, parpadeo: 0.1 },
];

/* geometría del arco: radio y apertura del semicírculo de cabinas */
const RADIO = 6.4;
const APERTURA = 0.95; // radianes de arco total
const LADO_PISO = 26;
/* Encuadre por FOV HORIZONTAL, no vertical. El hueco de la sección es
   retrato (≈598×690): con fov vertical fijo el ángulo horizontal cae a ~37°
   y la fila se convierte en una sola cabina. Fijando 60° horizontales la
   fila cabe en retrato y en apaisado sin tocar la disposición. */
const FOV_HORIZONTAL = 54;

/* ─────────────────── utilidades de composición de matrices ───────────────
   Todo el mobiliario se aplana a matrices de mundo UNA sola vez (useMemo).
   Así no hay <group> anidados que three tenga que recorrer cada cuadro. */
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _q = new THREE.Quaternion();

type Tripleta = [number, number, number];

function componer(
  padre: THREE.Matrix4 | null,
  pos: Tripleta,
  rot: Tripleta,
  esc: Tripleta
): THREE.Matrix4 {
  _v.set(pos[0], pos[1], pos[2]);
  _e.set(rot[0], rot[1], rot[2]);
  _q.setFromEuler(_e);
  _s.set(esc[0], esc[1], esc[2]);
  const m = new THREE.Matrix4().compose(_v, _q, _s);
  return padre ? m.premultiply(padre) : m; // premultiply = padre × local
}

/** Una instancia: matriz de mundo + color propio (va a instanceColor). */
type Pieza = { m: THREE.Matrix4; color: THREE.Color };
/** Un quad de la geometría fusionada: matriz (con escala = ancho/alto) + UV. */
type Quad = { m: THREE.Matrix4; uv: [number, number, number, number]; color?: THREE.Color };

/* Fusiona N quads en UNA BufferGeometry: 4 vértices y 6 índices cada uno.
   Esto es lo que permite que 6 marquesinas con 6 texturas distintas sean
   un solo draw call contra un solo atlas. */
function geometriaQuads(quads: Quad[], conColor: boolean): THREE.BufferGeometry {
  const n = quads.length;
  const posiciones = new Float32Array(n * 12);
  const uvs = new Float32Array(n * 8);
  const colores = conColor ? new Float32Array(n * 12) : null;
  const indices: number[] = [];
  /* orden antihorario visto desde +Z ⇒ cara frontal hacia +Z */
  const esquinas: Tripleta[] = [
    [-0.5, -0.5, 0],
    [0.5, -0.5, 0],
    [0.5, 0.5, 0],
    [-0.5, 0.5, 0],
  ];
  const p = new THREE.Vector3();

  quads.forEach((q, i) => {
    for (let k = 0; k < 4; k++) {
      const [ex, ey] = esquinas[k];
      p.set(ex, ey, 0).applyMatrix4(q.m);
      posiciones.set([p.x, p.y, p.z], (i * 4 + k) * 3);
      uvs.set([ex < 0 ? q.uv[0] : q.uv[2], ey < 0 ? q.uv[1] : q.uv[3]], (i * 4 + k) * 2);
      /* sin color explícito ⇒ blanco. Un buffer en ceros pintaría el quad
         negro en reduced-motion, donde nadie llega a escribirlo después. */
      if (colores) {
        const c = q.color;
        colores.set(c ? [c.r, c.g, c.b] : [1, 1, 1], (i * 4 + k) * 3);
      }
    }
    const b = i * 4;
    indices.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  if (colores) g.setAttribute("color", new THREE.BufferAttribute(colores, 3));
  g.setIndex(indices);
  g.computeBoundingSphere();
  /* sin atributo normal a propósito: ambas geometrías usan MeshBasicMaterial */
  return g;
}

/* ───────────────────────── texturas horneadas ───────────────────────────── */
const ANCHO_TIRA = 256;
const ALTO_TIRA = 72;

function luminancia(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** UN atlas para TODAS las marquesinas: una tira de 256×72 por cabina. */
function atlasMarquesinas(fichas: FichaCabina[]): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = ANCHO_TIRA;
  c.height = ALTO_TIRA * fichas.length;
  const ctx = c.getContext("2d")!;

  fichas.forEach((f, i) => {
    const y0 = i * ALTO_TIRA;
    ctx.fillStyle = f.apagada ? "#171024" : f.acento;
    ctx.fillRect(0, y0, ANCHO_TIRA, ALTO_TIRA);

    /* bisel: marco interior oscuro, la marquesina es un cajón de luz */
    ctx.strokeStyle = rgba(FONDO, 0.5);
    ctx.lineWidth = 6;
    ctx.strokeRect(3, y0 + 3, ANCHO_TIRA - 6, ALTO_TIRA - 6);

    /* la escala crece para nombres cortos: TILT ocupa lo mismo que ULTRAVIOLETA */
    const esc = Math.max(3, Math.min(7, Math.floor((ANCHO_TIRA - 40) / (f.nombre.length * 4))));
    const ancho = f.nombre.length * 4 * esc - esc; // el último tracking no se pinta
    const tinta = f.apagada ? "#2E2140" : luminancia(f.acento) > 0.5 ? FONDO : TINTA;
    textoPixel(
      ctx,
      f.nombre,
      Math.round((ANCHO_TIRA - ancho) / 2),
      y0 + Math.round((ALTO_TIRA - 5 * esc) / 2),
      tinta,
      esc
    );
  });
  return c;
}

/** Piso "reflejante" barato: los charcos de neón HORNEADOS en la textura.
    Cero espejos, cero segunda pasada de escena, cero postprocesado. */
function texturaPiso(sitios: { x: number; z: number; acento: string; apagada: boolean }[]) {
  const W = 512;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = W;
  const ctx = c.getContext("2d")!;
  const aLienzo = (x: number, z: number): [number, number] => [
    (x / LADO_PISO + 0.5) * W,
    (z / LADO_PISO + 0.5) * W,
  ];

  ctx.fillStyle = FONDO;
  ctx.fillRect(0, 0, W, W);

  /* loseta apenas insinuada: da escala al pasillo sin ruido */
  ctx.strokeStyle = rgba(LAVANDA, 0.035);
  ctx.lineWidth = 1;
  for (let i = 0; i <= 16; i++) {
    const q = (i / 16) * W;
    ctx.beginPath();
    ctx.moveTo(q, 0);
    ctx.lineTo(q, W);
    ctx.moveTo(0, q);
    ctx.lineTo(W, q);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "lighter";

  /* resplandor general del centro de la sala */
  const [ax, ay] = aLienzo(0, 0.4);
  const halo = ctx.createRadialGradient(ax, ay, 0, ax, ay, W * 0.24);
  halo.addColorStop(0, rgba(VIOLETA, 0.3));
  halo.addColorStop(0.5, rgba(VIOLETA, 0.09));
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, W);

  /* un charco por cabina, estirado hacia el espectador: el "reflejo" */
  for (const s of sitios) {
    const [cx, cy] = aLienzo(s.x, s.z);
    const radio = 24;
    const alfa = s.apagada ? 0.09 : 0.58;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 2.8); // elongación = mancha de luz derramada sobre el piso
    const g = ctx.createRadialGradient(0, 7, 0, 0, 7, radio);
    g.addColorStop(0, rgba(s.acento, alfa));
    g.addColorStop(0.38, rgba(s.acento, alfa * 0.34));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-radio, 7 - radio, radio * 2, radio * 2);
    ctx.restore();
  }

  ctx.globalCompositeOperation = "source-over";
  return c;
}

/** Rejilla CRT de 1×4 px que se repite sobre las pantallas apagadas.
    Potencia de dos ⇒ mipmaps válidos ⇒ a lo lejos promedia a gris, sin hervir. */
function texturaScanline(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1;
  c.height = 4;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1, 3);
  ctx.fillStyle = "#8e8e96"; // el hueco oscuro entre líneas de barrido
  ctx.fillRect(0, 3, 1, 1);
  return c;
}

/* ─────────────────────── disposición de la sala ─────────────────────────
   Un solo useMemo produce TODO: instancias, geometrías fusionadas y texturas.
   Este es el "componente parametrizado" pedido: la cabina existe como función
   que emite piezas, no como árbol de mallas duplicado N veces. */
type Disposicion = ReturnType<typeof construirSala>;

function construirSala(cantidad: number) {
  const fichas = CATALOGO.slice(0, Math.max(1, Math.min(CATALOGO.length, cantidad)));
  const n = fichas.length;
  const iVivo = Math.max(0, fichas.findIndex((f) => f.viva));

  const cajas: Pieza[] = []; // MeshStandard  · caja unitaria
  const neones: Pieza[] = []; // MeshBasic     · caja unitaria
  const esferas: Pieza[] = []; // MeshBasic     · esfera unitaria
  const cilindros: Pieza[] = []; // MeshStandard  · cilindro unitario
  const quadsMarquesina: Quad[] = [];
  const quadsApagadas: Quad[] = [];
  const sitios: { x: number; z: number; acento: string; apagada: boolean }[] = [];
  let matrizViva = new THREE.Matrix4();

  const BOTONES: [number, number, string][] = [
    [0.13, 0.0, CIAN],
    [0.22, -0.02, MAGENTA],
    [0.31, 0.0, LAVANDA],
  ];

  fichas.forEach((f, i) => {
    /* arco cóncavo: la central al fondo, las de los extremos avanzan hacia ti
       y giran hacia el eje. Entrar al pasillo = quedar rodeado. */
    const t = n === 1 ? 0 : i / (n - 1) - 0.5;
    const ang = t * APERTURA;
    const px = Math.sin(ang) * RADIO;
    const pz = (1 - Math.cos(ang)) * RADIO;
    const mCab = componer(null, [px, 0, pz], [0, -ang, 0], [1, 1, 1]);

    const viva = i === iVivo;
    const yT = 0.1 + f.cuerpo; // tapa del cuerpo: de aquí cuelga todo lo alto

    /* colores: cada carcasa tiñe un pelín hacia su acento, así incluso en
       penumbra las cabinas no son el mismo bloque negro repetido */
    const cCarcasa = new THREE.Color(CARCASA).lerp(new THREE.Color(f.acento), 0.1);
    const cPlinto = new THREE.Color(FONDO).lerp(new THREE.Color(f.acento), 0.06);
    const cPanel = new THREE.Color(VIOLETA).multiplyScalar(f.apagada ? 0.22 : 1);

    /* ── cuerpo ─────────────────────────────────────────────────────────── */
    cajas.push({ m: componer(mCab, [0, 0.05, 0], [0, 0, 0], [0.94, 0.1, 0.9]), color: cPlinto });
    cajas.push({
      m: componer(mCab, [0, 0.05 + f.cuerpo / 2, 0], [0, 0, 0], [0.9, f.cuerpo, 0.8]),
      color: cCarcasa,
    });
    const yFichas = 0.05 + f.cuerpo * 0.47;
    cajas.push({
      m: componer(mCab, [0, yFichas, 0.41], [0, 0, 0], [0.2, 0.15, 0.02]),
      color: new THREE.Color("#0b0618"),
    });
    cajas.push({
      m: componer(mCab, [0, yT + 0.4, -0.08], [0, 0, 0], [0.9, 0.6, 0.55]),
      color: cCarcasa,
    });

    /* ── trim violeta y ranura de fichas: la silueta dibujada en la oscuridad.
       Si la cabina está apagada bajan a la familia mate (sin neón). ──────── */
    for (const sx of [-0.45, 0.45]) {
      const m = componer(mCab, [sx, 0.05 + f.cuerpo / 2, 0.4], [0, 0, 0], [0.02, f.cuerpo, 0.02]);
      if (f.apagada) cajas.push({ m, color: new THREE.Color(VIOLETA).multiplyScalar(0.16) });
      else neones.push({ m, color: new THREE.Color(f.acento).multiplyScalar(viva ? 1 : 0.85) });
    }
    const mRanura = componer(mCab, [0, yFichas, 0.425], [0, 0, 0], [0.06, 0.012, 0.012]);
    if (f.apagada) cajas.push({ m: mRanura, color: new THREE.Color(CIAN).multiplyScalar(0.12) });
    else neones.push({ m: mRanura, color: new THREE.Color(CIAN) });

    /* ── panel de control inclinado −12° hacia el jugador ───────────────── */
    const mPanel = componer(mCab, [0, yT + 0.05, 0.28], [0.21, 0, 0], [1, 1, 1]);
    cajas.push({ m: componer(mPanel, [0, 0, 0], [0, 0, 0], [0.9, 0.08, 0.38]), color: cPanel });

    const mJoy = componer(mPanel, [-0.22, 0.09, 0], [0, 0, 0], [1, 1, 1]);
    cilindros.push({
      m: componer(mJoy, [0, 0, 0], [0, 0, 0], [0.02, 0.1, 0.02]),
      color: new THREE.Color(LAVANDA).multiplyScalar(f.apagada ? 0.4 : 1),
    });
    esferas.push({
      m: componer(mJoy, [0, 0.07, 0], [0, 0, 0], [0.035, 0.035, 0.035]),
      color: new THREE.Color(MAGENTA).multiplyScalar(f.apagada ? 0.24 : 1),
    });
    for (const [bx, bz, bc] of BOTONES) {
      esferas.push({
        m: componer(mPanel, [bx, 0.045, bz], [0, 0, 0], [0.03, 0.012, 0.03]),
        color: new THREE.Color(bc).multiplyScalar(f.apagada ? 0.22 : 0.92),
      });
    }

    /* ── marquesina: caja mate + quad que muerde SU tira del atlas ──────── */
    const mMarq = componer(mCab, [0, yT + 0.91, 0.08], [0.35, 0, 0], [1, 1, 1]);
    cajas.push({ m: componer(mMarq, [0, 0, 0], [0, 0, 0], [0.9, 0.25, 0.4]), color: cPlinto });
    /* flipY por defecto ⇒ la tira i (canvas y = i·72) vive en v ∈ [1−(i+1)/n, 1−i/n] */
    const brilloBase = f.apagada ? 0.5 : 1;
    quadsMarquesina.push({
      m: componer(mMarq, [0, 0, 0.201], [0, 0, 0], [0.86, 0.21, 1]),
      uv: [0, 1 - (i + 1) / n, 1, 1 - i / n],
      /* brillo de reposo: es el que se ve en reduced-motion, cuando el
         useFrame del parpadeo no llega a correr nunca */
      color: new THREE.Color(brilloBase, brilloBase, brilloBase),
    });

    /* ── pantalla: solo la central lleva la CanvasTexture de la partida ─── */
    const mPantalla = componer(mCab, [0, yT + 0.4, 0.26], [-0.26, 0, 0], [0.68, 0.44, 1]);
    if (viva) {
      matrizViva = mPantalla;
    } else {
      /* v de 0 a 14 ⇒ la rejilla CRT se repite 14 veces sin geometría extra */
      quadsApagadas.push({
        m: mPantalla,
        uv: [0, 0, 1, 14],
        color: new THREE.Color(f.acento).multiplyScalar(f.apagada ? 0.008 : 0.035),
      });
    }

    sitios.push({ x: px, z: pz, acento: f.acento, apagada: !!f.apagada });
  });

  return {
    fichas,
    iVivo,
    cajas,
    neones,
    esferas,
    cilindros,
    matrizViva,
    geoMarquesinas: geometriaQuads(quadsMarquesina, true),
    geoApagadas: geometriaQuads(quadsApagadas, true),
    lienzoAtlas: atlasMarquesinas(fichas),
    lienzoPiso: texturaPiso(sitios),
  };
}

/* ─────────────────────────── piezas de escena ───────────────────────────── */

/** Una familia instanciada = 1 draw call para todas sus piezas de la sala. */
function Familia({ piezas, children }: { piezas: Pieza[]; children: ReactNode }) {
  const ref = useRef<THREE.InstancedMesh>(null!);

  useLayoutEffect(() => {
    const im = ref.current;
    for (let i = 0; i < piezas.length; i++) {
      im.setMatrixAt(i, piezas[i].m);
      im.setColorAt(i, piezas[i].color);
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }, [piezas]);

  return (
    /* frustumCulled=false: con ~9 draw calls el culling no ahorra nada y la
       cámara termina DENTRO del arco, donde una esfera de límites mal
       calculada haría desaparecer media sala. */
    <instancedMesh ref={ref} args={[undefined, undefined, piezas.length]} frustumCulled={false}>
      {children}
    </instancedMesh>
  );
}

/** Marquesinas: 1 geometría fusionada + 1 atlas + vertex color como brillo.
    El parpadeo mueve 4 vértices por cabina, no toca materiales ni uniforms. */
function Marquesinas({
  disposicion,
  textura,
  animar,
}: {
  disposicion: Disposicion;
  textura: THREE.Texture;
  animar: boolean;
}) {
  const { geoMarquesinas, fichas } = disposicion;

  useFrame(({ clock }) => {
    if (!animar) return;
    const attr = geoMarquesinas.getAttribute("color") as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < fichas.length; i++) {
      const f = fichas[i];
      let b = f.apagada ? 0.5 : 1;
      if (!f.apagada) {
        b *= 0.93 + 0.07 * Math.sin(t * (0.7 + i * 0.31) + i * 1.9); // respiración del tubo
        if (f.parpadeo) {
          /* ruido barato y determinista: un tubo con mal contacto */
          const s = Math.sin(t * 27.3 + i) * Math.sin(t * 11.1 + i * 3.7);
          if (s > 0.72) b *= 1 - f.parpadeo;
        }
      }
      for (let k = 0; k < 4; k++) attr.setXYZ(i * 4 + k, b, b, b);
    }
    attr.needsUpdate = true;
  });

  return (
    <mesh geometry={geoMarquesinas} frustumCulled={false}>
      <meshBasicMaterial map={textura} vertexColors toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** La única pantalla viva. Se suscribe al motor: la textura sube al GPU solo
    cuando el motor repintó de verdad, no una vez por cuadro de render. */
function PantallaViva({ matriz, activa }: { matriz: THREE.Matrix4; activa: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  const textura = useMemo(() => {
    const t = new THREE.CanvasTexture(lienzoDemo);
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter; // pixel-perfect también en 3D
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  }, []);
  useEffect(() => () => textura.dispose(), [textura]);

  useEffect(() => {
    if (!activa) return;
    return usarDemo(() => {
      textura.needsUpdate = true;
      invalidate(); // en reduced-motion basta este único cuadro
    });
  }, [activa, textura, invalidate]);

  const ref = useRef<THREE.Mesh>(null!);
  useLayoutEffect(() => {
    ref.current.matrixAutoUpdate = false;
    ref.current.matrix.copy(matriz);
    ref.current.matrixWorldNeedsUpdate = true;
  }, [matriz]);

  return (
    <mesh ref={ref} frustumCulled={false}>
      {/* el quad ya trae ancho/alto en la matriz: geometría unitaria */}
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={textura} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* Poses del dolly. Distancias calculadas contra el frustum, no a ojo: con
   FOV_HORIZONTAL=54 (media tangente 0.5095) la cabina más externa queda al
   85% del semiancho en la entrada, y las vecinas de la central siguen
   mordiendo el borde al final. Si tocas el FOV, recalcula estas dos z. */
const POSE_ENTRADA = { pos: new THREE.Vector3(0, 1.95, 7.4), mira: new THREE.Vector3(0, 1.02, 0.5) };
const POSE_DENTRO = { pos: new THREE.Vector3(0, 1.25, 3.15), mira: new THREE.Vector3(0, 1.34, -0.3) };

/** Cámara: dolly por el pasillo gobernado por el progreso de scroll.
    Lee el MotionValue con .get() dentro de useFrame ⇒ ni un solo re-render. */
function CamaraPasillo({ progreso, animar }: { progreso: MotionValue<number>; animar: boolean }) {
  const objetivoPos = useRef(POSE_ENTRADA.pos.clone());
  const objetivoMira = useRef(POSE_ENTRADA.mira.clone());
  const miraActual = useRef(POSE_ENTRADA.mira.clone());
  const arrancado = useRef(false);

  useFrame(({ camera, pointer, size }, delta) => {
    /* fov vertical derivado del horizontal deseado y del aspecto real */
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as THREE.PerspectiveCamera;
      const aspecto = size.width / Math.max(1, size.height);
      const media = Math.tan(THREE.MathUtils.degToRad(FOV_HORIZONTAL) / 2) / aspecto;
      const fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(media)), 28, 64);
      if (Math.abs(cam.fov - fov) > 0.05) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
      }
    }

    /* reduced-motion: una pose fija a mitad del recorrido, sin amortiguación */
    const p = animar ? progreso.get() : 0.45;
    const t = THREE.MathUtils.smoothstep(p, 0.08, 0.78);

    objetivoPos.current.lerpVectors(POSE_ENTRADA.pos, POSE_DENTRO.pos, t);
    objetivoMira.current.lerpVectors(POSE_ENTRADA.mira, POSE_DENTRO.mira, t);

    if (animar) {
      /* deriva del puntero, que se apaga conforme te metes entre las cabinas */
      const amp = 0.5 * (1 - t * 0.65);
      objetivoPos.current.x += pointer.x * amp;
      objetivoPos.current.y += -pointer.y * 0.1;
      objetivoMira.current.x += pointer.x * 0.22;
    }

    if (animar && arrancado.current) {
      /* damp: independiente del framerate, sin librería de animación */
      const l = 4.5;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, objetivoPos.current.x, l, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, objetivoPos.current.y, l, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, objetivoPos.current.z, l, delta);
      miraActual.current.x = THREE.MathUtils.damp(miraActual.current.x, objetivoMira.current.x, l, delta);
      miraActual.current.y = THREE.MathUtils.damp(miraActual.current.y, objetivoMira.current.y, l, delta);
      miraActual.current.z = THREE.MathUtils.damp(miraActual.current.z, objetivoMira.current.z, l, delta);
    } else {
      camera.position.copy(objetivoPos.current);
      miraActual.current.copy(objetivoMira.current);
      arrancado.current = true;
    }
    camera.lookAt(miraActual.current);
  });

  return null;
}

/** El scroll también despierta al canvas cuando está en modo "demand". */
function DespertarPorScroll({ progreso }: { progreso: MotionValue<number> }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => progreso.on("change", () => invalidate()), [progreso, invalidate]);
  return null;
}

/* ──────────────────────────── la sala completa ──────────────────────────── */
function Sala({
  cantidad,
  progreso,
  animar,
  visible,
}: {
  cantidad: number;
  progreso: MotionValue<number>;
  animar: boolean;
  visible: boolean;
}) {
  const d = useMemo(() => construirSala(cantidad), [cantidad]);

  const texAtlas = useMemo(() => {
    const t = new THREE.CanvasTexture(d.lienzoAtlas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    return t;
  }, [d]);

  const texPiso = useMemo(() => {
    const t = new THREE.CanvasTexture(d.lienzoPiso);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [d]);

  const texScan = useMemo(() => {
    const t = new THREE.CanvasTexture(texturaScanline());
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  }, []);

  /* nada de esto lo creó R3F declarativamente ⇒ lo liberamos a mano */
  useEffect(
    () => () => {
      d.geoMarquesinas.dispose();
      d.geoApagadas.dispose();
      texAtlas.dispose();
      texPiso.dispose();
      texScan.dispose();
    },
    [d, texAtlas, texPiso, texScan]
  );

  return (
    <>
      {/* la niebla come el borde del piso y hunde el fondo de la sala en #060010 */}
      <fog attach="fog" args={[FONDO, 6, 22]} />

      <ambientLight intensity={0.34} />
      <directionalLight position={[3, 6, 5]} intensity={0.8} />
      <directionalLight position={[-4, 2, -3]} intensity={0.45} color={VIOLETA} />
      {/* único punto de luz: el aliento magenta de la cabina que sigue viva.
          Flojo y alto a propósito: si domina, la sala se vuelve un chicle rosa. */}
      <pointLight position={[0, 1.75, 0.9]} intensity={2} distance={6} decay={2} color={MAGENTA} />

      {/* piso: un plano, un gradiente radial horneado. Sin espejos ni segunda pasada. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[LADO_PISO, LADO_PISO]} />
        <meshBasicMaterial map={texPiso} toneMapped={false} />
      </mesh>

      {/* cuatro familias instanciadas = cuatro draw calls para toda la sala */}
      <Familia piezas={d.cajas}>
        <boxGeometry args={[1, 1, 1]} />
        {/* color blanco: el color real viaja en instanceColor */}
        <meshStandardMaterial color="#ffffff" flatShading roughness={0.85} metalness={0} />
      </Familia>

      <Familia piezas={d.neones}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </Familia>

      <Familia piezas={d.cilindros}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color="#ffffff" flatShading roughness={0.6} metalness={0} />
      </Familia>

      <Familia piezas={d.esferas}>
        <sphereGeometry args={[1, 10, 7]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </Familia>

      <Marquesinas disposicion={d} textura={texAtlas} animar={animar} />

      {/* pantallas dormidas: 1 quad fusionado por sala, color tenue por vértice */}
      {d.geoApagadas.getAttribute("position").count > 0 && (
        <mesh geometry={d.geoApagadas} frustumCulled={false}>
          <meshBasicMaterial
            map={texScan}
            vertexColors
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      <PantallaViva matriz={d.matrizViva} activa={visible} />

      <CamaraPasillo progreso={progreso} animar={animar} />
      <DespertarPorScroll progreso={progreso} />
    </>
  );
}

/* ─────────────────────────────── montaje ────────────────────────────────── */
export default function SalaDeMaquinas3D({
  cantidad = 5,
  progreso,
}: {
  /** 4 a 6 cabinas. Se toman del catálogo en orden; la central es la viva. */
  cantidad?: number;
  /** Progreso de scroll externo. Si no llega, se mide la propia sección. */
  progreso?: MotionValue<number>;
} = {}) {
  const contRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducido, setReducido] = useState(false);

  /* useScroll de Motion sobre el propio contenedor: 0 al asomar por abajo,
     1 al salir por arriba. Es un MotionValue: no provoca render de React. */
  const { scrollYProgress } = useScroll({
    target: contRef,
    offset: ["start end", "end start"],
  });
  const p = progreso ?? scrollYProgress;

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setReducido(mq.matches);
    const alCambiar = () => setReducido(mq.matches);
    mq.addEventListener("change", alCambiar);

    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: "10% 0px",
    });
    if (contRef.current) io.observe(contRef.current);

    /* pestaña oculta = sala congelada, aunque siga en viewport */
    const alOcultar = () => setVisible((v) => (document.hidden ? false : v));
    document.addEventListener("visibilitychange", alOcultar);

    return () => {
      mq.removeEventListener("change", alCambiar);
      io.disconnect();
      document.removeEventListener("visibilitychange", alOcultar);
    };
  }, []);

  const animar = visible && !reducido;

  return (
    <div ref={contRef} className="h-full w-full" aria-hidden="true">
      <Canvas
        /* dpr capado por debajo de la cabina original: ahora hay sala entera */
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 1.95, 7.4], fov: 55, near: 0.1, far: 40 }}
        /* fuera de viewport (o reduced-motion) el bucle no corre: solo cuadros
           bajo demanda, que es lo que deja el frame estático pedido */
        frameloop={animar ? "always" : "demand"}
      >
        <Sala cantidad={cantidad} progreso={p} animar={animar} visible={visible} />
      </Canvas>
    </div>
  );
}

/* ─────────────────────── NOTA DE PRESUPUESTO ────────────────────────────────
   Medido para cantidad = 5 (por defecto). Con 6 solo crecen las instancias.

   DRAW CALLS ............................................................ 8
     1  piso               · 1 plano             · CanvasTexture 512²
     2  familia CAJAS      · InstancedMesh box   · 33 instancias · Standard
     3  familia NEONES     · InstancedMesh box   · 12 instancias · Basic
     4  familia CILINDROS  · InstancedMesh cyl   ·  5 instancias · Standard
     5  familia ESFERAS    · InstancedMesh sph   · 20 instancias · Basic
     6  marquesinas        · 5 quads fusionados  · 1 atlas 256×360
     7  pantallas apagadas · 4 quads fusionados  · scanline 1×4
     8  pantalla viva      · 1 quad              · CanvasTexture 240×136
     Culling desactivado en todo lo instanciado: el conteo NO fluctúa con la
     cámara, que es justo lo que quieres para que el p95 no dependa del scroll.

     Las 33 cajas son 6 por cabina (zócalo, cuerpo, puerta, carcasa, marquesina,
     panel = 30) más las 3 piezas de la cabina apagada que bajan de la familia
     de neón a la mate: apagar una cabina no añade draw calls, solo mueve
     instancias de un cubo al otro.

   VÉRTICES ENVIADOS ................................ ≈ 3 100 (≈ 3 800 con 6)
     cajas    33 × 24 =  792   ·  neones   12 × 24 = 288
     esferas  20 × 88 = 1 760  ·  cilindros 5 × 52 = 260
     quads    (5+4+1) × 4 = 40 ·  piso 4
     Los InstancedMesh suben la geometría UNA vez; lo de arriba es carga de
     vertex shader, no memoria: en VRAM viven 4 geometrías unitarias.
     El grueso son las esferas (perillas y botones). Si hiciera falta recortar,
     sphereGeometry(1, 10, 7) → (1, 6, 4) baja los vértices a ≈ 1 800 sin que
     se note a esta distancia.

   TEXTURAS RESIDENTES ................................. 4 · ≈ 1.4 MB en GPU
     piso 512×512 RGBA+mips (1.4 MB) · atlas 256×360 sin mips (0.37 MB)
     scanline 1×4 (≈0) · partida 240×136 sin mips (0.13 MB)
     Solo la última se re-sube, y solo cuando motorDemo repinta de verdad
     (callback de usarDemo), no una vez por cuadro de render.

   LUCES ......................... 1 ambient + 2 directional + 1 point, 0 sombras
     Ningún shadow map ⇒ ninguna pasada extra de escena.

   LO QUE NO HAY, A PROPÓSITO
     · Sin EffectComposer, sin bloom, sin ninguna pasada fullscreen.
     · Sin segundo canvas WebGL: este reemplaza al de la cabina y es el único.
     · Sin reflejo real (sin cámara espejo ni render target): el "reflejo" son
       charcos horneados en la textura del piso, coste cero en tiempo de render.

   RIESGO DE p95: la compilación de los 5 programas GLSL en el primer cuadro.
   Se paga una vez, con la sección todavía fuera de viewport gracias al
   rootMargin de 10% del IntersectionObserver.

   ENCUADRE
   El FOV se fija por el eje horizontal (54°) y el vertical se despeja del
   aspecto. Al revés no funciona: el contenedor es casi cuadrado y fijando el
   vertical el ángulo horizontal se queda en unos 37°, con el pasillo cortado
   por los lados. Con el dolly a z 7.4 entran las cinco cabinas y a z 3.15
   quedan las tres centrales, que es justo el cierre que se busca.
   ──────────────────────────────────────────────────────────────────────────── */
