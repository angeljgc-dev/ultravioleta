/* CABINA ARCADE 3D — modelada con primitivas, cero assets externos.
   Blueprint del equipo: alto 2.0, marquesina +20°, pantalla +15°, panel −12°.
   La pantalla es una CanvasTexture del MISMO backbuffer de la partida fantasma:
   la cabina reproduce el juego que el visitante ya vio de fondo en Torneos. */
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { lienzoDemo, textoPixel, usarDemo } from "./motorDemo";

const FONDO = "#060010";
const VIOLETA = "#7C3AED";
const LAVANDA = "#B19EEF";
const MAGENTA = "#FF2EA6";
const CIAN = "#2EE6FF";

/* marquesina: texto pixel horneado a un canvas propio (misma fuente 3×5) */
function texturaMarquesina(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 72;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = MAGENTA;
  ctx.fillRect(0, 0, 256, 72);
  /* "ULTRAVIOLETA" = 12 glifos × 4 de avance × escala 4 = 188 px */
  textoPixel(ctx, "ULTRAVIOLETA", Math.floor((256 - 12 * 4 * 4) / 2) + 2, 26, "#F4F0FF", 4);
  return c;
}

function Cabina({ animar }: { animar: boolean }) {
  const grupo = useRef<THREE.Group>(null!);
  const texPantalla = useMemo(() => {
    const t = new THREE.CanvasTexture(lienzoDemo);
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter; // pixel-perfect también en 3D
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  }, []);
  const texMarquesina = useMemo(() => {
    const t = new THREE.CanvasTexture(texturaMarquesina());
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);

  useFrame(({ pointer, clock }, delta) => {
    texPantalla.needsUpdate = true; // el motor pinta; la textura lo refleja
    if (!animar) return;
    /* deriva del puntero + respiración propia, amortiguada e independiente del fps */
    const objetivoY = pointer.x * 0.4 + Math.sin(clock.elapsedTime * 0.25) * 0.25;
    const objetivoX = -pointer.y * 0.1;
    grupo.current.rotation.y = THREE.MathUtils.damp(grupo.current.rotation.y, objetivoY, 3.5, delta);
    grupo.current.rotation.x = THREE.MathUtils.damp(grupo.current.rotation.x, objetivoX, 3.5, delta);
  });

  const mate = (color: string) => <meshStandardMaterial color={color} flatShading />;

  return (
    <group ref={grupo} position={[0, -0.95, 0]}>
      {/* zócalo y cuerpo */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.94, 0.1, 0.9]} />
        {mate(FONDO)}
      </mesh>
      <mesh position={[0, 0.525, 0]}>
        <boxGeometry args={[0.9, 0.85, 0.8]} />
        {mate(FONDO)}
      </mesh>

      {/* trim violeta: la silueta dibujada en la oscuridad (aristas frontales) */}
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.525, 0.4]}>
          <boxGeometry args={[0.02, 0.85, 0.02]} />
          <meshStandardMaterial color={VIOLETA} emissive={VIOLETA} emissiveIntensity={0.6} />
        </mesh>
      ))}

      {/* puerta de fichas con ranura cian */}
      <mesh position={[0, 0.45, 0.41]}>
        <boxGeometry args={[0.2, 0.15, 0.02]} />
        {mate("#0b0618")}
      </mesh>
      <mesh position={[0, 0.45, 0.425]}>
        <boxGeometry args={[0.06, 0.01, 0.01]} />
        <meshStandardMaterial color={CIAN} emissive={CIAN} emissiveIntensity={2} toneMapped={false} />
      </mesh>

      {/* panel de control inclinado hacia el jugador (borde trasero elevado) */}
      <group position={[0, 1.0, 0.28]} rotation={[0.21, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.9, 0.08, 0.38]} />
          {mate(VIOLETA)}
        </mesh>
        {/* palanca: cilindro + esfera magenta */}
        <group position={[-0.22, 0.09, 0]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
            {mate(LAVANDA)}
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <sphereGeometry args={[0.035, 12, 8]} />
            <meshStandardMaterial color={MAGENTA} emissive={MAGENTA} emissiveIntensity={0.5} />
          </mesh>
        </group>
        {/* tres botones en arco: cian, magenta, lavanda */}
        {[
          { x: 0.13, z: 0.0, c: CIAN },
          { x: 0.22, z: -0.02, c: MAGENTA },
          { x: 0.31, z: 0.0, c: LAVANDA },
        ].map((b) => (
          <mesh key={b.x} position={[b.x, 0.045, b.z]} scale={[1, 0.4, 1]}>
            <sphereGeometry args={[0.03, 10, 8]} />
            <meshStandardMaterial color={b.c} emissive={b.c} emissiveIntensity={0.35} />
          </mesh>
        ))}
      </group>

      {/* carcasa de pantalla + cristal ligeramente saliente con la partida viva
          (la carcasa se retrasa para que el plano inclinado no quede enterrado) */}
      <mesh position={[0, 1.35, -0.08]}>
        <boxGeometry args={[0.9, 0.6, 0.55]} />
        {mate(FONDO)}
      </mesh>
      <mesh position={[0, 1.35, 0.26]} rotation={[-0.26, 0, 0]}>
        <planeGeometry args={[0.68, 0.44]} />
        <meshBasicMaterial map={texPantalla} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {/* marquesina como visera, magenta emisivo con el nombre */}
      <group position={[0, 1.86, 0.08]} rotation={[0.35, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.9, 0.25, 0.4]} />
          {mate(FONDO)}
        </mesh>
        <mesh position={[0, 0, 0.201]}>
          <planeGeometry args={[0.86, 0.21]} />
          <meshBasicMaterial map={texMarquesina} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

export default function Cabina3D() {
  const contRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducido, setReducido] = useState(false);

  useEffect(() => {
    setReducido(matchMedia("(prefers-reduced-motion: reduce)").matches);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: "10% 0px",
    });
    if (contRef.current) io.observe(contRef.current);
    return () => io.disconnect();
  }, []);

  /* mientras la cabina está a la vista, el motor de la partida corre para su pantalla */
  useEffect(() => {
    if (!visible) return;
    const soltar = usarDemo();
    return soltar;
  }, [visible]);

  return (
    <div ref={contRef} className="h-full w-full" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0.12, 3.4], fov: 36 }}
        frameloop={visible && !reducido ? "always" : "demand"}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 5, 2]} intensity={1.25} />
        <directionalLight position={[-2, 1, -3]} intensity={0.4} color={VIOLETA} />
        <Cabina animar={!reducido} />
      </Canvas>
    </div>
  );
}
