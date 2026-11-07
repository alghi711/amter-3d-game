"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, PerspectiveCamera, RoundedBox } from "@react-three/drei";
import { useRef } from "react";
import type { Group } from "three";

/** Kucing sederhana dari primitif — placeholder sebelum model glTF tersedia. */
function Cat({ color }: { color: string }) {
  const body = useRef<Group>(null);
  const tail = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (body.current) body.current.scale.y = 1 + Math.sin(t * 2) * 0.02; // napas
    if (tail.current) tail.current.rotation.z = Math.sin(t * 3) * 0.4; // ekor bergoyang
  });

  return (
    <group position={[0, 0, 0.6]}>
      <group ref={body}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* kepala */}
        <mesh position={[0, 1.05, 0.15]} castShadow>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* telinga */}
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} position={[x, 1.4, 0.1]} rotation={[0, 0, x > 0 ? -0.3 : 0.3]} castShadow>
            <coneGeometry args={[0.12, 0.25, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))}
        {/* mata */}
        {[-0.13, 0.13].map((x) => (
          <mesh key={x} position={[x, 1.1, 0.49]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        ))}
        {/* hidung */}
        <mesh position={[0, 1.0, 0.52]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color="#e88a9a" />
        </mesh>
      </group>
      <group ref={tail} position={[0, 0.35, -0.45]}>
        <mesh position={[0, 0.3, -0.05]} rotation={[-0.4, 0, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.6, 8, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    </group>
  );
}

/** Rumah 3D: lantai, dua dinding, kasur, mangkuk, dan mainan. */
function Room() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#e9d8c4" />
      </mesh>
      <mesh position={[0, 2, -4]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#fde7e1" />
      </mesh>
      <mesh position={[-4, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#fbeee0" />
      </mesh>
      {/* kasur kucing */}
      <RoundedBox args={[1.6, 0.3, 1.2]} radius={0.12} position={[-2.2, 0.15, -2.2]} castShadow>
        <meshStandardMaterial color="#9ec9e8" />
      </RoundedBox>
      {/* mangkuk makan & minum */}
      <mesh position={[1.6, 0.1, 0.8]} castShadow>
        <cylinderGeometry args={[0.3, 0.22, 0.2, 24]} />
        <meshStandardMaterial color="#f08080" />
      </mesh>
      <mesh position={[2.3, 0.1, 0.8]} castShadow>
        <cylinderGeometry args={[0.3, 0.22, 0.2, 24]} />
        <meshStandardMaterial color="#7fb3f0" />
      </mesh>
      {/* bola mainan */}
      <mesh position={[-1.2, 0.18, 1.4]} castShadow>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color="#ffd166" />
      </mesh>
    </group>
  );
}

/** Sesuaikan FOV & jarak kamera dengan rasio layar agar kucing tetap terlihat di HP (potret). */
function ResponsiveCamera() {
  const size = useThree((state) => state.size);
  const aspect = size.width / size.height;
  const fov = aspect < 0.8 ? 60 : aspect < 1.2 ? 52 : 45;
  return <PerspectiveCamera makeDefault position={[3.5, 3, 5]} fov={fov} />;
}

export default function CatRoomScene({ furColor }: { furColor: string }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      className="!touch-none"
      style={{ width: "100%", height: "100%" }}
    >
      <ResponsiveCamera />
      <color attach="background" args={["#fff6ef"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 3]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <Room />
      <Cat color={furColor} />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.35} blur={2} far={3} />
      <OrbitControls
        target={[0, 0.8, 0]}
        enablePan={false}
        minDistance={3}
        maxDistance={9}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
