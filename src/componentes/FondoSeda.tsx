/* FONDO DE SEDA: WebGL crudo, sin three ni R3F.
   Acuerdo de la mesa: el hero solo necesita un quad fullscreen con un fragment
   shader; arrastrar three (234 KB gz) para eso metía la librería entera en el
   critical path, porque este componente carga en el primer viewport. Ahora
   three solo se descarga cuando la cabina de Fichas se acerca.
   dpr fijo a 1: el dither Bayer opera en bloques de 2 px, así que el detalle
   subpíxel que pagaba dpr 1.75 se destruía a propósito, y el grano más grande
   lee como más fósforo de CRT, no como menos acabado. */
import { useEffect, useRef, useState } from "react";

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform float uTiempo;
uniform vec2 uResolucion;
varying vec2 vUv;

/* paleta ULTRAVIOLETA (uniforms desde tokens, ver abajo) */
uniform vec3 uFondo;
uniform vec3 uVioleta;
uniform vec3 uLavanda;
uniform vec3 uMagenta;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float ruido(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * ruido(p);
    p = r * p * 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  uv.x *= uResolucion.x / max(uResolucion.y, 1.0);

  float t = uTiempo * 0.05;

  /* domain warping: el ruido deforma al ruido -> pliegues de seda */
  vec2 q = vec2(fbm(uv * 1.4 + t), fbm(uv * 1.4 - t * 0.7 + 5.2));
  vec2 w = vec2(
    fbm(uv * 1.8 + q * 1.6 + vec2(1.7, 9.2) + t * 0.6),
    fbm(uv * 1.8 + q * 1.6 + vec2(8.3, 2.8) - t * 0.4)
  );
  float pliegue = fbm(uv * 2.2 + w * 1.8);

  vec3 col = uFondo;
  col = mix(col, uVioleta * 0.55, smoothstep(0.25, 0.75, pliegue));
  col = mix(col, uLavanda * 0.50, smoothstep(0.55, 0.95, pliegue) * 0.6);
  col = mix(col, uMagenta * 0.45, smoothstep(0.80, 1.00, pliegue + q.x * 0.2) * 0.5);

  /* viñeta hacia el fondo: el centro respira, los bordes se apagan */
  float r = length((vUv - 0.5) * vec2(1.15, 1.0));
  col = mix(col, uFondo, smoothstep(0.45, 0.95, r) * 0.85);

  /* grano fino: rompe el banding de los gradientes oscuros */
  col += (hash21(vUv * uResolucion + uTiempo) - 0.5) * 0.02;

  /* cuantización con patrón Bayer 4x4: fósforo ditherizado de CRT */
  vec2 px = floor(vUv * uResolucion * 0.5);
  float bx = mod(px.x, 4.0), by = mod(px.y, 4.0);
  float bayer = mod(bx * 2.0 + by * 3.0 + bx * by, 16.0) / 16.0;
  float niveles = 22.0;
  col = floor(col * niveles + bayer) / niveles;

  gl_FragColor = vec4(col, 1.0);
}`;

/* lee un token de color del CSS y lo pasa a [0..1]: la paleta vive en un solo
   sitio (index.css), el shader no la re-hardcodea */
function tokenRGB(nombre: string, respaldo: [number, number, number]): [number, number, number] {
  if (typeof window === "undefined") return respaldo;
  const v = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  const m = v.match(/^#([0-9a-f]{6})$/i);
  if (!m) return respaldo;
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compilar(gl: WebGLRenderingContext, tipo: number, fuente: string) {
  const s = gl.createShader(tipo)!;
  gl.shaderSource(s, fuente);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export default function FondoSeda() {
  const lienzoRef = useRef<HTMLCanvasElement>(null);
  const [soportado, setSoportado] = useState(true);

  useEffect(() => {
    const lienzo = lienzoRef.current;
    if (!lienzo) return;

    const gl = (lienzo.getContext("webgl", { antialias: false, alpha: false }) ||
      lienzo.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) {
      setSoportado(false);
      return;
    }

    const vs = compilar(gl, gl.VERTEX_SHADER, VERT);
    const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      setSoportado(false);
      return;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setSoportado(false);
      return;
    }
    gl.useProgram(prog);

    /* un solo triángulo-par que cubre el viewport en clip space */
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTiempo = gl.getUniformLocation(prog, "uTiempo");
    const uResolucion = gl.getUniformLocation(prog, "uResolucion");
    gl.uniform3fv(gl.getUniformLocation(prog, "uFondo"), tokenRGB("--color-fondo", [0.024, 0, 0.063]));
    gl.uniform3fv(gl.getUniformLocation(prog, "uVioleta"), tokenRGB("--color-violeta", [0.486, 0.227, 0.929]));
    gl.uniform3fv(gl.getUniformLocation(prog, "uLavanda"), tokenRGB("--color-lavanda", [0.694, 0.62, 0.937]));
    gl.uniform3fv(gl.getUniformLocation(prog, "uMagenta"), tokenRGB("--color-magenta", [1.0, 0.18, 0.651]));

    const medir = () => {
      /* dpr 1 a propósito: ver cabecera del archivo */
      const w = Math.max(1, lienzo.clientWidth);
      const h = Math.max(1, lienzo.clientHeight);
      if (lienzo.width !== w || lienzo.height !== h) {
        lienzo.width = w;
        lienzo.height = h;
      }
      gl.viewport(0, 0, lienzo.width, lienzo.height);
      gl.uniform2f(uResolucion, lienzo.width, lienzo.height);
    };
    const ro = new ResizeObserver(medir);
    ro.observe(lienzo);
    medir();

    const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = false;
    let raf = 0;
    let t0 = performance.now();

    const pintar = (t: number) => {
      gl.uniform1f(uTiempo, (t - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    if (reducido) {
      /* un cuadro fijo, sin bucle */
      pintar(t0 + 7300);
    } else {
      const tic = (t: number) => {
        pintar(t);
        raf = requestAnimationFrame(tic);
      };
      const sincronizar = () => {
        if (visible && !document.hidden) {
          if (!raf) raf = requestAnimationFrame(tic);
        } else if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      };
      const io = new IntersectionObserver(
        ([e]) => {
          visible = e.isIntersecting;
          sincronizar();
        },
        { rootMargin: "10% 0px" }
      );
      io.observe(lienzo);
      document.addEventListener("visibilitychange", sincronizar);

      return () => {
        io.disconnect();
        document.removeEventListener("visibilitychange", sincronizar);
        if (raf) cancelAnimationFrame(raf);
        ro.disconnect();
      };
    }

    return () => {
      ro.disconnect();
    };
  }, []);

  if (!soportado) return null; /* sin WebGL el hero se queda en basalto: legible igual */

  return (
    <canvas
      ref={lienzoRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}
