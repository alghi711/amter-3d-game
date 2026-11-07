"use client";

import { RoundedBox } from "@react-three/drei";

/** Posisi benda rumah — dipakai ulang oleh interaksi (makan, minum, main, tidur). */
export const HOUSE_SPOTS = {
  bed: [-2.2, 0, -2.2],
  foodBowl: [1.6, 0, 0.8],
  waterBowl: [2.3, 0, 0.8],
  toy: [-1.2, 0, 1.4],
  litterBox: [2.6, 0, -2.6],
  scratchPost: [-3.1, 0, 0.6],
} as const satisfies Record<string, [number, number, number]>;

function Bowl({ position, color, fill }: { position: readonly number[]; color: string; fill: string }) {
  const [x, , z] = position;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.22, 0.2, 24]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.02, 24]} />
        <meshStandardMaterial color={fill} />
      </mesh>
    </group>
  );
}

/** Rumah kucing 3D: lantai kayu, dinding, jendela, karpet, kasur, mangkuk, mainan, pasir, tiang garuk. */
export default function CatHouse() {
  const { bed, foodBowl, waterBowl, toy, litterBox, scratchPost } = HOUSE_SPOTS;
  return (
    <group>
      {/* lantai */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#e3c9a8" />
      </mesh>
      {/* karpet bulat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0.4]} receiveShadow>
        <circleGeometry args={[1.6, 48]} />
        <meshStandardMaterial color="#f7c6c7" />
      </mesh>
      {/* dinding */}
      <mesh position={[0, 2, -4]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#fde7e1" />
      </mesh>
      <mesh position={[-4, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#fbeee0" />
      </mesh>
      {/* jendela */}
      <group position={[0.8, 2.3, -3.98]}>
        <mesh>
          <planeGeometry args={[1.8, 1.3]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[1.6, 1.1]} />
          <meshStandardMaterial color="#bfe3ff" emissive="#bfe3ff" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* kasur kucing */}
      <group position={[bed[0], 0, bed[2]]}>
        <RoundedBox args={[1.6, 0.3, 1.2]} radius={0.12} position={[0, 0.15, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#9ec9e8" />
        </RoundedBox>
        <RoundedBox args={[1.3, 0.12, 0.9]} radius={0.06} position={[0, 0.33, 0]}>
          <meshStandardMaterial color="#f5f0e6" />
        </RoundedBox>
      </group>

      <Bowl position={foodBowl} color="#f08080" fill="#a0522d" />
      <Bowl position={waterBowl} color="#7fb3f0" fill="#cdeaff" />

      {/* bola mainan */}
      <mesh position={[toy[0], 0.18, toy[2]]} castShadow>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color="#ffd166" />
      </mesh>

      {/* kotak pasir */}
      <group position={[litterBox[0], 0, litterBox[2]]}>
        <RoundedBox args={[1, 0.3, 0.8]} radius={0.05} position={[0, 0.15, 0]} castShadow>
          <meshStandardMaterial color="#b8d8ba" />
        </RoundedBox>
        <mesh position={[0, 0.29, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.85, 0.65]} />
          <meshStandardMaterial color="#efe2c0" />
        </mesh>
      </group>

      {/* tiang garuk */}
      <group position={[scratchPost[0], 0, scratchPost[2]]}>
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.1, 0.8]} />
          <meshStandardMaterial color="#c49a6c" />
        </mesh>
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 1.2, 16]} />
          <meshStandardMaterial color="#d9b98c" />
        </mesh>
        <mesh position={[0, 1.35, 0]} castShadow>
          <boxGeometry args={[0.6, 0.1, 0.6]} />
          <meshStandardMaterial color="#c49a6c" />
        </mesh>
      </group>
    </group>
  );
}
