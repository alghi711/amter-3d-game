"use client";

import { RoundedBox } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useState, type ReactNode } from "react";

/** Posisi benda rumah — dipakai ulang oleh interaksi (makan, minum, main, tidur). */
export const HOUSE_SPOTS = {
  bed: [-2.2, 0, -2.2],
  foodBowl: [1.6, 0, 0.8],
  waterBowl: [2.3, 0, 0.8],
  toy: [-1.2, 0, 1.4],
  litterBox: [2.6, 0, -2.6],
  scratchPost: [-3.1, 0, 0.6],
} as const satisfies Record<string, [number, number, number]>;

export type HouseSpot = keyof typeof HOUSE_SPOTS;

/** Label & aksi tiap objek — ditampilkan di UI saat objek dipakai. */
export const SPOT_LABELS: Record<HouseSpot, string> = {
  bed: "Kasur — waktunya tidur siang",
  foodBowl: "Mangkuk makan",
  waterBowl: "Mangkuk minum",
  toy: "Bola mainan",
  litterBox: "Kotak pasir",
  scratchPost: "Tiang garuk",
};

/** Bungkus objek agar bisa disentuh: kursor pointer + membesar sedikit saat disorot. */
function Usable({ spot, onUse, children }: { spot: HouseSpot; onUse?: (s: HouseSpot) => void; children: ReactNode }) {
  const [hover, setHover] = useState(false);
  const [x, , z] = HOUSE_SPOTS[spot];
  return (
    <group
      position={[x, 0, z]}
      scale={hover ? 1.06 : 1}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "auto";
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onUse?.(spot);
      }}
    >
      {children}
    </group>
  );
}

export type BowlState = { level: number; fill: string };

function Bowl({ color, fill, level = 0.7 }: { color: string; fill: string; level?: number }) {
  const clamped = Math.max(0.05, Math.min(1, level));
  return (
    <group>
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.22, 0.2, 24]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.05 + clamped * 0.14, 0]}>
        <cylinderGeometry args={[0.21 + clamped * 0.04, 0.21, 0.03, 24]} />
        <meshStandardMaterial color={fill} />
      </mesh>
    </group>
  );
}

/** Rumah kucing 3D: lantai kayu, dinding, jendela, karpet, kasur, mangkuk, mainan, pasir, tiang garuk. */
export default function CatHouse({
  onUse,
  foodBowlState,
  waterBowlState,
  litterDirty = false,
}: {
  onUse?: (spot: HouseSpot) => void;
  foodBowlState?: BowlState;
  waterBowlState?: BowlState;
  litterDirty?: boolean;
}) {
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
      <Usable spot="bed" onUse={onUse}>
        <RoundedBox args={[1.6, 0.3, 1.2]} radius={0.12} position={[0, 0.15, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#9ec9e8" />
        </RoundedBox>
        <RoundedBox args={[1.3, 0.12, 0.9]} radius={0.06} position={[0, 0.33, 0]}>
          <meshStandardMaterial color="#f5f0e6" />
        </RoundedBox>
      </Usable>

      <Usable spot="foodBowl" onUse={onUse}>
        <Bowl color="#f08080" fill={foodBowlState?.fill ?? "#a0522d"} level={foodBowlState?.level ?? 0.7} />
      </Usable>
      <Usable spot="waterBowl" onUse={onUse}>
        <Bowl color="#7fb3f0" fill={waterBowlState?.fill ?? "#cdeaff"} level={waterBowlState?.level ?? 0.7} />
      </Usable>

      {/* bola mainan */}
      <Usable spot="toy" onUse={onUse}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial color="#ffd166" />
        </mesh>
      </Usable>

      {/* kotak pasir */}
      <Usable spot="litterBox" onUse={onUse}>
        <RoundedBox args={[1, 0.3, 0.8]} radius={0.05} position={[0, 0.15, 0]} castShadow>
          <meshStandardMaterial color="#b8d8ba" />
        </RoundedBox>
        <mesh position={[0, 0.29, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.85, 0.65]} />
          <meshStandardMaterial color={litterDirty ? "#d4c39c" : "#f5ecd5"} />
        </mesh>
        {litterDirty && (
          <group position={[0, 0.31, 0]}>
            {[
              [-0.18, -0.1],
              [0.14, 0.08],
              [0.02, -0.15],
            ].map(([cx, cz], i) => (
              <mesh key={i} position={[cx, 0.03, cz]} castShadow>
                <sphereGeometry args={[0.055, 10, 10]} />
                <meshStandardMaterial color="#8b6b4a" />
              </mesh>
            ))}
          </group>
        )}
      </Usable>

      {/* tiang garuk */}
      <Usable spot="scratchPost" onUse={onUse}>
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
      </Usable>
    </group>
  );
}
