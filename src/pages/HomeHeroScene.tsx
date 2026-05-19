import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function WaveMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(28, 14, 96, 56);
    return g;
  }, []);

  useFrame(({ clock }) => {
    const m = meshRef.current;
    if (!m) return;
    const t = clock.getElapsedTime();
    const pos = m.geometry.attributes.position;
    if (!pos) return;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = arr[i] ?? 0;
      const y = arr[i + 1] ?? 0;
      const z =
        Math.sin(x * 0.45 + t * 0.8) * 0.45 +
        Math.sin(y * 0.55 + t * 0.6) * 0.35 +
        Math.sin((x + y) * 0.3 + t * 1.2) * 0.18;
      arr[i + 2] = z;
    }
    pos.needsUpdate = true;
    m.rotation.z = Math.sin(t * 0.1) * 0.06;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-1.05, 0, 0]} position={[0, -1.5, 0]}>
      <meshStandardMaterial
        color="#7aa2ff"
        wireframe
        transparent
        opacity={0.55}
        emissive="#4f7bff"
        emissiveIntensity={0.35}
      />
    </mesh>
  );
}

function FloatingProbes() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y = clock.getElapsedTime() * 0.15;
  });
  const probes = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const r = 6 + (i % 3) * 0.8;
        return {
          pos: [Math.cos(a) * r, Math.sin(i * 0.3) * 0.8, Math.sin(a) * r] as const,
          scale: 0.04 + (i % 4) * 0.015,
        };
      }),
    [],
  );
  return (
    <group ref={groupRef}>
      {probes.map((p, idx) => (
        <mesh key={idx} position={p.pos as unknown as [number, number, number]}>
          <sphereGeometry args={[p.scale, 16, 16]} />
          <meshBasicMaterial color="#9fbcff" />
        </mesh>
      ))}
    </group>
  );
}

export function HomeHeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 4, 7], fov: 50 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#04050a"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} color="#aabfff" />
      <directionalLight position={[-5, 2, -3]} intensity={0.4} color="#4fd1a4" />
      <WaveMesh />
      <FloatingProbes />
      <fog attach="fog" args={["#04050a", 9, 18]} />
    </Canvas>
  );
}
