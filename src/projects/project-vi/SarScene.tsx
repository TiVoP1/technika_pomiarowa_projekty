import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { SarResult } from "@/projects/project-vi/sar";

export interface SarSceneProps {
  vref: number;
  bits: number;
  inputVoltage: number;
  result: SarResult;
  currentStep: number;
}

/**
 * 3D visualisation of one SAR conversion cycle.
 *
 * - Tall column on the left = input voltage v_in.
 * - Stacked cubes in the centre = SAR register, bottom is LSB.
 * - Bar on the right = current DAC output. Glows when comparator says ≥.
 * - Plane at v_in level draws a "water line" across the scene so it is easy
 *   to see whether each trial is above or below the input.
 */
export function SarScene({
  vref,
  bits,
  inputVoltage,
  result,
  currentStep,
}: SarSceneProps) {
  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [4, 3.5, 6.5], fov: 42 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#04050a"]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 8, 5]} intensity={0.9} color="#dde7ff" />
        <directionalLight position={[-6, 2, -3]} intensity={0.3} color="#7aa2ff" />
        <hemisphereLight args={["#7aa2ff", "#04050a", 0.25]} />

        <SceneContent
          vref={vref}
          bits={bits}
          inputVoltage={inputVoltage}
          result={result}
          currentStep={currentStep}
        />

        <gridHelper
          args={[10, 20, "#1c2030", "#11131e"]}
          position={[0, -0.001, 0]}
        />
        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={14}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.05}
          autoRotate
          autoRotateSpeed={0.35}
        />
        <fog attach="fog" args={["#04050a", 11, 22]} />
      </Canvas>
    </div>
  );
}

function SceneContent({
  vref,
  bits,
  inputVoltage,
  result,
  currentStep,
}: SarSceneProps) {
  const heightOf = (v: number): number => (v / vref) * 4;
  const inputHeight = heightOf(inputVoltage);
  const currentDac =
    currentStep >= 0 && currentStep < result.steps.length
      ? result.steps[currentStep]?.current ?? 0
      : result.dacOut;
  const trial =
    currentStep >= 0 && currentStep < result.steps.length
      ? result.steps[currentStep]?.trial ?? 0
      : result.dacOut;

  return (
    <>
      {/* Input column */}
      <VoltageColumn
        position={[-2.4, 0, 0]}
        height={inputHeight}
        color="#7aa2ff"
        label="V in"
      />
      {/* Trial column (DAC trying a level) */}
      <TrialColumn
        position={[0, 0, 0]}
        height={heightOf(trial)}
        active={currentStep >= 0 && currentStep < result.steps.length}
      />
      {/* Current DAC output column */}
      <VoltageColumn
        position={[2.4, 0, 0]}
        height={heightOf(currentDac)}
        color="#4fd1a4"
        label="V dac"
      />

      {/* Bit stack */}
      <BitStack
        bits={bits}
        steps={result.steps}
        currentStep={currentStep}
        position={[0, 0, -2.5]}
      />

      {/* Input water-line plane */}
      <WaterLine y={inputHeight} />
    </>
  );
}

function VoltageColumn({
  position,
  height,
  color,
  label,
}: {
  position: readonly [number, number, number];
  height: number;
  color: string;
  label: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = meshRef.current;
    if (!m) return;
    const target = Math.max(0.001, height);
    const cur = m.scale.y;
    m.scale.y = cur + (target - cur) * 0.18;
    m.position.y = m.scale.y / 2;
  });
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.6, 1, 0.6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          metalness={0.2}
          roughness={0.4}
          transparent
          opacity={0.85}
        />
      </mesh>
      <ColumnBase color={color} label={label} />
    </group>
  );
}

function TrialColumn({
  position,
  height,
  active,
}: {
  position: readonly [number, number, number];
  height: number;
  active: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = meshRef.current;
    if (!m) return;
    const target = Math.max(0.001, height);
    const cur = m.scale.y;
    m.scale.y = cur + (target - cur) * 0.25;
    m.position.y = m.scale.y / 2;
    const mat = m.material;
    if (mat instanceof THREE.MeshStandardMaterial) {
      mat.emissiveIntensity =
        0.35 + (active ? 0.35 + 0.2 * Math.sin(clock.elapsedTime * 6) : 0);
    }
  });
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.55, 1, 0.55]} />
        <meshStandardMaterial
          color="#f5b54b"
          emissive="#f5b54b"
          emissiveIntensity={0.4}
          metalness={0.3}
          roughness={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>
      <ColumnBase color="#f5b54b" label="próba" />
    </group>
  );
}

function ColumnBase({ color, label }: { color: string; label: string }) {
  return (
    <>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[0.55, 0.7, 0.1, 24]} />
        <meshStandardMaterial color="#11131e" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <ringGeometry args={[0.36, 0.5, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <Label3D text={label} position={[0, -0.35, 0]} color={color} />
    </>
  );
}

function BitStack({
  bits,
  steps,
  currentStep,
  position,
}: {
  bits: number;
  steps: SarResult["steps"];
  currentStep: number;
  position: readonly [number, number, number];
}) {
  const items = useMemo(
    () => Array.from({ length: bits }, (_, i) => bits - 1 - i),
    [bits],
  );
  return (
    <group position={position}>
      {items.map((bit, idx) => {
        const step = steps.find((s) => s.bit === bit);
        const decided = step !== undefined && idx <= currentStep;
        const kept = decided ? step.kept : false;
        const y = idx * 0.5 + 0.3;
        return (
          <BitCube
            key={bit}
            position={[0, y, 0]}
            bit={bit}
            decided={decided}
            kept={kept}
            current={idx === currentStep}
          />
        );
      })}
      <Label3D text="SAR" position={[0, items.length * 0.5 + 0.55, 0]} color="#9fbcff" />
    </group>
  );
}

function BitCube({
  position,
  bit,
  decided,
  kept,
  current,
}: {
  position: readonly [number, number, number];
  bit: number;
  decided: boolean;
  kept: boolean;
  current: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = meshRef.current;
    if (!m) return;
    if (current) {
      m.rotation.y = clock.elapsedTime * 1.4;
    } else {
      m.rotation.y += (0 - m.rotation.y) * 0.1;
    }
  });
  const color = !decided ? "#1c2030" : kept ? "#4fd1a4" : "#475067";
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.45, 0.4, 0.45]} />
        <meshStandardMaterial
          color={color}
          emissive={current ? "#f5b54b" : decided && kept ? "#4fd1a4" : "#11131e"}
          emissiveIntensity={current ? 0.7 : decided ? 0.3 : 0.05}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
      <Label3D
        text={`b${bit}`}
        position={[0.45, 0, 0]}
        color={current ? "#f5b54b" : "#9fbcff"}
      />
    </group>
  );
}

function WaterLine({ y }: { y: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = meshRef.current;
    if (!m) return;
    m.position.y = y;
    const mat = m.material;
    if (mat instanceof THREE.MeshBasicMaterial) {
      mat.opacity = 0.15 + 0.08 * Math.sin(clock.elapsedTime * 2);
    }
  });
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <planeGeometry args={[7.5, 5.5]} />
      <meshBasicMaterial
        color="#7aa2ff"
        transparent
        opacity={0.18}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Label3D({
  text,
  position,
  color,
}: {
  text: string;
  position: readonly [number, number, number];
  color: string;
}) {
  const texture = useMemo(() => makeTextTexture(text, color), [text, color]);
  return (
    <sprite position={position} scale={[0.7, 0.22, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

function makeTextTexture(text: string, color: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 80;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = color;
    ctx.font = "600 40px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, c.width / 2, c.height / 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}
