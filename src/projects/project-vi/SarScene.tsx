import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { SarResult } from "@/projects/project-vi/sar";

export interface SarSceneProps {
  vref: number;
  bits: number;
  inputVoltage: number;
  result: SarResult;
  currentStep: number;
}

export function SarScene({
  vref: _vref,
  bits: _bits,
  inputVoltage: _inputVoltage,
  result: _result,
  currentStep: _currentStep,
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
