/* Fondo del hero: gradiente de seda animado por shader (GLSL propio).
   Ruido fBm que fluye lento entre violeta profundo, lavanda y magenta —
   el vocabulario visual de shadergradient, implementado a mano. */
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform float uTiempo;
  uniform vec2 uResolucion;
  varying vec2 vUv;

  // paleta ULTRAVIOLETA
  const vec3 FONDO   = vec3(0.024, 0.000, 0.063);  // #060010
  const vec3 VIOLETA = vec3(0.486, 0.227, 0.929);  // #7C3AED
  const vec3 LAVANDA = vec3(0.694, 0.620, 0.937);  // #B19EEF
  const vec3 MAGENTA = vec3(1.000, 0.180, 0.651);  // #FF2EA6

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float ruido(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
      mix(hash21(i), hash21(i + vec2(1, 0)), u.x),
      mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), u.x),
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

    // domain warping: el ruido deforma al ruido -> pliegues de seda
    vec2 q = vec2(fbm(uv * 1.4 + t), fbm(uv * 1.4 - t * 0.7 + 5.2));
    vec2 w = vec2(fbm(uv * 1.8 + q * 1.6 + vec2(1.7, 9.2) + t * 0.6),
                  fbm(uv * 1.8 + q * 1.6 + vec2(8.3, 2.8) - t * 0.4));
    float pliegue = fbm(uv * 2.2 + w * 1.8);

    // capas de color: fondo -> violeta -> lavanda; magenta solo en las crestas
    vec3 col = FONDO;
    col = mix(col, VIOLETA * 0.55, smoothstep(0.25, 0.75, pliegue));
    col = mix(col, LAVANDA * 0.50, smoothstep(0.55, 0.95, pliegue) * 0.6);
    col = mix(col, MAGENTA * 0.45, smoothstep(0.80, 1.00, pliegue + q.x * 0.2) * 0.5);

    // viñeta hacia el fondo: el centro respira, los bordes se apagan
    float r = length((vUv - 0.5) * vec2(1.15, 1.0));
    col = mix(col, FONDO, smoothstep(0.45, 0.95, r) * 0.85);

    // grano fino: rompe el banding de los gradientes oscuros
    col += (hash21(vUv * uResolucion + uTiempo) - 0.5) * 0.02;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function PlanoSeda({ animar }: { animar: boolean }) {
  const ref = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(
    () => ({
      uTiempo: { value: 0 },
      uResolucion: { value: new THREE.Vector2(1, 1) },
    }),
    []
  );

  useFrame(({ clock, size }) => {
    if (animar) ref.current.uniforms.uTiempo.value = clock.elapsedTime;
    ref.current.uniforms.uResolucion.value.set(size.width, size.height);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={ref} uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} />
    </mesh>
  );
}

export default function FondoSeda() {
  const [visible, setVisible] = useState(true);
  const [reducido, setReducido] = useState(false);
  const contRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setReducido(mq.matches);
    const alCambiar = () => setReducido(mq.matches);
    mq.addEventListener("change", alCambiar);

    // el shader se apaga cuando el hero sale del viewport
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: "10% 0px",
    });
    if (contRef.current) io.observe(contRef.current);

    return () => {
      mq.removeEventListener("change", alCambiar);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={contRef} className="absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        frameloop={visible && !reducido ? "always" : "demand"}
      >
        <PlanoSeda animar={!reducido} />
      </Canvas>
    </div>
  );
}
