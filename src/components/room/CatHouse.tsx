"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import {
  createBraidedRugTexture,
  createContactShadowTexture,
  createRopeTexture,
  createWallWallpaperTexture,
  createWoodFloorTextures,
  LIGHTING_PRESETS,
  type LightingMode,
} from "@/lib/procedural-textures";

/** Dimensi Kamar Tertutup (Enclosed 4-Wall Cozy Room). */
export const ROOM_W = 14.4;
export const ROOM_D = 14.4;
export const ROOM_H = 6.8;
export const HALF_W = ROOM_W / 2; // 7.2
export const HALF_D = ROOM_D / 2; // 7.2

/** Posisi benda rumah — dipakai ulang oleh interaksi (makan, minum, main, tidur, pasir, garuk). */
export const HOUSE_SPOTS = {
  bed: [-1.45, 0, -3.35],
  foodBowl: [1.25, 0, 1.4],
  waterBowl: [2.12, 0, 1.7],
  toy: [-1.35, 0.25, 0.55],
  litterBox: [3.0, 0, -0.55],
  scratchPost: [-2.7, 0, -0.5],
} as const satisfies Record<string, [number, number, number]>;

export type HouseSpot = keyof typeof HOUSE_SPOTS;

/** Label & aksi tiap objek — ditampilkan di UI dan tooltip saat objek dipakai/disorot. */
export const SPOT_LABELS: Record<HouseSpot, string> = {
  bed: "Kasur Nyaman · Klik untuk Istirahat",
  foodBowl: "Mangkuk Makan · Klik untuk Makan",
  waterBowl: "Mangkuk Air · Klik untuk Minum",
  toy: "Bola Benang · Klik untuk Main",
  litterBox: "Kotak Pasir · Klik untuk Bersihkan",
  scratchPost: "Tiang Garukan · Klik untuk Main",
};

export type BowlState = { level: number; fill: string };

function ContactShadowPlane({
  texture,
  radiusX,
  radiusZ,
  yOffset = 0.012,
}: {
  texture: THREE.Texture | null;
  radiusX: number;
  radiusZ: number;
  yOffset?: number;
}) {
  if (!texture) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, yOffset, 0]}>
      <planeGeometry args={[radiusX * 2, radiusZ * 2]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

/** Bungkus objek agar bisa disentuh: kursor pointer + membesar sedikit saat disorot + tooltip. */
function Usable({
  spot,
  rotationY = 0,
  onUse,
  onHoverSpot,
  children,
}: {
  spot: HouseSpot;
  rotationY?: number;
  onUse?: (s: HouseSpot) => void;
  onHoverSpot?: (label: string | null, clientX?: number, clientY?: number) => void;
  children: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const [x, , z] = HOUSE_SPOTS[spot];
  return (
    <group
      position={[x, 0, z]}
      rotation={[0, rotationY, 0]}
      scale={hover ? 1.04 : 1}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
        onHoverSpot?.(SPOT_LABELS[spot], e.clientX, e.clientY);
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHoverSpot?.(SPOT_LABELS[spot], e.clientX, e.clientY);
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "auto";
        onHoverSpot?.(null);
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

function WallFrame({
  xPos,
  yPos,
  zPos,
  rotY,
  bgColor,
  iconColor,
}: {
  xPos: number;
  yPos: number;
  zPos: number;
  rotY: number;
  bgColor: string;
  iconColor: string;
}) {
  return (
    <group position={[xPos, yPos, zPos]} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.1, 1.25, 0.09]} />
        <meshStandardMaterial color="#b87b46" roughness={0.5} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.9, 1.05, 0.1]} />
        <meshStandardMaterial color={bgColor} roughness={0.75} />
      </mesh>
      <mesh position={[0, -0.06, 0.05]} scale={[1.2, 1, 0.3]}>
        <sphereGeometry args={[0.14, 14, 14]} />
        <meshStandardMaterial color={iconColor} roughness={0.45} />
      </mesh>
      {[-1, 0, 1].map((i) => (
        <mesh
          key={i}
          position={[i * 0.14, 0.14 + (i === 0 ? 0.04 : 0), 0.05]}
          scale={[1, 1, 0.3]}
        >
          <sphereGeometry args={[0.065, 10, 10]} />
          <meshStandardMaterial color={iconColor} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function YarnBallToy({ color, active }: { color: string; active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, dt) => {
    const elapsed = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = active ? 0.25 + Math.abs(Math.sin(elapsed * 11)) * 0.42 : 0.25;
      groupRef.current.position.x = active ? Math.sin(elapsed * 5) * 0.35 : 0;
    }
    if (ballRef.current && active) {
      ballRef.current.rotation.x += dt * 7;
      ballRef.current.rotation.z += dt * 6;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.25, 0]}>
      <mesh ref={ballRef} castShadow receiveShadow>
        <sphereGeometry args={[0.25, 28, 28]} />
        <meshStandardMaterial color={color || "#f4b928"} roughness={0.62} />
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[i * 0.95, i * 0.7, 0]}>
            <torusGeometry args={[0.242, 0.022, 10, 32]} />
            <meshStandardMaterial color="#df9c14" roughness={0.65} />
          </mesh>
        ))}
      </mesh>
    </group>
  );
}

/** Rumah diorama 3D tertutup 4 sisi (Fully Enclosed Room) dengan langit-langit, balok kayu, jendela taman, rak buku, pintu kamar, sofa, dan tanaman hias. */
export default function CatHouse({
  onUse,
  onHoverSpot,
  foodBowlState,
  waterBowlState,
  litterDirty = false,
  toyColor = "#f4b928",
  playingToy = false,
  lightingMode = "day",
}: {
  onUse?: (spot: HouseSpot) => void;
  onHoverSpot?: (label: string | null, clientX?: number, clientY?: number) => void;
  foodBowlState?: BowlState;
  waterBowlState?: BowlState;
  litterDirty?: boolean;
  toyColor?: string;
  playingToy?: boolean;
  lightingMode?: LightingMode;
}) {
  const textures = useMemo(() => {
    if (typeof document === "undefined") return null;
    return {
      wood: createWoodFloorTextures(),
      wall: createWallWallpaperTexture(),
      rug: createBraidedRugTexture(),
      rope: createRopeTexture(),
      shadow: createContactShadowTexture(),
    };
  }, []);

  const dustGeometry = useMemo(() => {
    const count = 55;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const s1 = Math.sin(i * 12.9898) * 43758.5453;
      const s2 = Math.sin(i * 78.233) * 43758.5453;
      const s3 = Math.sin(i * 45.164) * 43758.5453;
      const r1 = s1 - Math.floor(s1);
      const r2 = s2 - Math.floor(s2);
      const r3 = s3 - Math.floor(s3);
      pos[i * 3] = (r1 - 0.5) * 10.0;
      pos[i * 3 + 1] = 0.4 + r2 * 4.6;
      pos[i * 3 + 2] = (r3 - 0.5) * 10.0;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  const dustRef = useRef<THREE.Points>(null);
  const pomPomRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (dustRef.current) {
      dustRef.current.rotation.y = elapsed * 0.03;
      dustRef.current.position.y = Math.sin(elapsed * 0.8) * 0.08;
    }
    if (pomPomRef.current) {
      pomPomRef.current.position.x = 0.38 + Math.sin(elapsed * 3) * 0.035;
    }
  });

  const preset = LIGHTING_PRESETS[lightingMode];
  const foodLevel = Math.max(0.1, Math.min(1, foodBowlState?.level ?? 0.9));
  const waterLevel = Math.max(0.1, Math.min(1, waterBowlState?.level ?? 0.9));

  return (
    <group>
      {/* 1. Lantai Kayu Luas (Floor Slab) */}
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <boxGeometry args={[ROOM_W + 0.8, 0.5, ROOM_D + 0.8]} />
        <meshStandardMaterial
          map={textures?.wood.map ?? null}
          bumpMap={textures?.wood.bumpMap ?? null}
          bumpScale={0.018}
          color={textures ? "#ffffff" : "#b67c4c"}
          roughness={0.52}
          metalness={0.04}
        />
      </mesh>

      {/* 2. Langit-langit (Ceiling Slab) & Balok Kayu Ekspos */}
      <mesh position={[0, ROOM_H + 0.2, 0]}>
        <boxGeometry args={[ROOM_W + 0.8, 0.4, ROOM_D + 0.8]} />
        <meshStandardMaterial color="#eeddca" roughness={0.85} />
      </mesh>
      {[-5.0, -2.5, 0, 2.5, 5.0].map((z) => (
        <mesh key={z} position={[0, ROOM_H - 0.14, z]}>
          <boxGeometry args={[ROOM_W, 0.28, 0.32]} />
          <meshStandardMaterial color="#8f5b34" roughness={0.6} />
        </mesh>
      ))}

      {/* Lampu Gantung Rotan Anyam di Tengah Plafon */}
      <group position={[0, ROOM_H, 0]}>
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.9, 8]} />
          <meshStandardMaterial color="#8f5b34" />
        </mesh>
        <mesh position={[0, -0.9, 0]}>
          <cylinderGeometry args={[0.35, 0.62, 0.52, 24, 1, true]} />
          <meshStandardMaterial color="#d89f62" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.88, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial color="#ffe6a3" />
        </mesh>
      </group>

      {/* 3. Keempat Dinding Tertutup (North, South, West, East Walls) */}
      {/* North Wall (-Z) */}
      <mesh position={[0, ROOM_H / 2, -HALF_D]} receiveShadow>
        <boxGeometry args={[ROOM_W + 0.6, ROOM_H, 0.4]} />
        <meshStandardMaterial
          map={textures?.wall ?? null}
          color={textures ? "#ffffff" : "#e5d4c0"}
          roughness={0.82}
        />
      </mesh>
      {/* South Wall (+Z) */}
      <mesh position={[0, ROOM_H / 2, HALF_D]} receiveShadow>
        <boxGeometry args={[ROOM_W + 0.6, ROOM_H, 0.4]} />
        <meshStandardMaterial
          map={textures?.wall ?? null}
          color={textures ? "#ffffff" : "#e5d4c0"}
          roughness={0.82}
        />
      </mesh>
      {/* West Wall (-X) */}
      <mesh position={[-HALF_W, ROOM_H / 2, 0]} receiveShadow>
        <boxGeometry args={[0.4, ROOM_H, ROOM_D + 0.6]} />
        <meshStandardMaterial
          map={textures?.wall ?? null}
          color={textures ? "#ffffff" : "#e5d4c0"}
          roughness={0.82}
        />
      </mesh>
      {/* East Wall (+X) */}
      <mesh position={[HALF_W, ROOM_H / 2, 0]} receiveShadow>
        <boxGeometry args={[0.4, ROOM_H, ROOM_D + 0.6]} />
        <meshStandardMaterial
          map={textures?.wall ?? null}
          color={textures ? "#ffffff" : "#e5d4c0"}
          roughness={0.82}
        />
      </mesh>

      {/* Lis Bawah (Baseboards) sekeliling ruangan */}
      <mesh position={[0, 0.17, -HALF_D + 0.22]}>
        <boxGeometry args={[ROOM_W, 0.34, 0.12]} />
        <meshStandardMaterial color="#9e683e" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.17, HALF_D - 0.22]}>
        <boxGeometry args={[ROOM_W, 0.34, 0.12]} />
        <meshStandardMaterial color="#9e683e" roughness={0.55} />
      </mesh>
      <mesh position={[-HALF_W + 0.22, 0.17, 0]}>
        <boxGeometry args={[0.12, 0.34, ROOM_D]} />
        <meshStandardMaterial color="#9e683e" roughness={0.55} />
      </mesh>
      <mesh position={[HALF_W - 0.22, 0.17, 0]}>
        <boxGeometry args={[0.12, 0.34, ROOM_D]} />
        <meshStandardMaterial color="#9e683e" roughness={0.55} />
      </mesh>

      {/* 4. Jendela Panorama dengan Pemandangan Taman di Dinding Utara */}
      <group position={[2.2, 3.45, -HALF_D + 0.22]}>
        <mesh>
          <boxGeometry args={[2.8, 2.1, 0.05]} />
          <meshBasicMaterial color={preset.skyHex} />
        </mesh>
        {/* Bukit Hijau Taman (Pas di dalam bingkai jendela tanpa bocor ke samping/bawah) */}
        <mesh position={[-0.45, -0.68, 0.03]} scale={[1.15, 0.42, 0.08]}>
          <sphereGeometry args={[0.72, 16, 12]} />
          <meshBasicMaterial color="#76b87c" />
        </mesh>
        <mesh position={[0.48, -0.72, 0.035]} scale={[1.15, 0.38, 0.08]}>
          <sphereGeometry args={[0.68, 16, 12]} />
          <meshBasicMaterial color="#5da165" />
        </mesh>
        {/* Rumput Dasar Jendela agar bagian bawah kaca tertutup rapi */}
        <mesh position={[0, -0.88, 0.038]}>
          <boxGeometry args={[2.72, 0.28, 0.04]} />
          <meshBasicMaterial color="#5da165" />
        </mesh>
        {/* Awan Putih Lembut */}
        <mesh position={[-0.55, 0.42, 0.04]} scale={[1.45, 0.65, 0.12]}>
          <sphereGeometry args={[0.26, 12, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
        </mesh>
        <mesh position={[0.55, 0.25, 0.04]} scale={[1.35, 0.6, 0.12]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
        </mesh>
        {/* Lapisan Kaca Jendela Halus */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[2.72, 2.02]} />
          <meshStandardMaterial color="#e0f2fe" transparent opacity={0.14} roughness={0.1} metalness={0.2} />
        </mesh>
        {/* Kusen & Palang Jendela */}
        <mesh position={[0, 1.08, 0]}>
          <boxGeometry args={[3.15, 0.18, 0.22]} />
          <meshStandardMaterial color="#fff5e8" roughness={0.45} />
        </mesh>
        <mesh position={[0, -1.08, 0.08]}>
          <boxGeometry args={[3.25, 0.2, 0.36]} />
          <meshStandardMaterial color="#fff5e8" roughness={0.45} />
        </mesh>
        <mesh position={[-1.42, 0, 0]}>
          <boxGeometry args={[0.18, 2.2, 0.18]} />
          <meshStandardMaterial color="#fff5e8" roughness={0.45} />
        </mesh>
        <mesh position={[1.42, 0, 0]}>
          <boxGeometry args={[0.18, 2.2, 0.18]} />
          <meshStandardMaterial color="#fff5e8" roughness={0.45} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.08, 2.1, 0.12]} />
          <meshStandardMaterial color="#fff5e8" roughness={0.45} />
        </mesh>
        <mesh>
          <boxGeometry args={[2.8, 0.08, 0.12]} />
          <meshStandardMaterial color="#fff5e8" roughness={0.45} />
        </mesh>
        {/* Gorden Kiri & Kanan */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 1.52, -0.04, 0.15]} scale={[1, 1, 0.45]} castShadow>
            <cylinderGeometry args={[0.26, 0.36, 2.45, 16]} />
            <meshStandardMaterial color="#f4c2a8" roughness={0.82} />
          </mesh>
        ))}
        {/* Pot Tanaman di Ambang Jendela */}
        <mesh position={[-0.82, -0.85, 0.16]}>
          <cylinderGeometry args={[0.17, 0.12, 0.26, 18]} />
          <meshStandardMaterial color="#d96b4c" roughness={0.5} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={i}
            position={[-0.82 + (i - 2) * 0.06, -0.62 + (i % 2) * 0.06, 0.16]}
            rotation={[0, 0, (i - 2) * -0.22]}
            scale={[0.8, 1.6, 0.5]}
          >
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color="#4ca165" roughness={0.45} />
          </mesh>
        ))}
      </group>

      {/* Sinar Matahari Diagonal (Sunbeams) */}
      <group>
        {[0, 1].map((i) => (
          <mesh
            key={i}
            position={[1.8 + i * 0.4, 2.0, -3.8]}
            rotation={[-0.55, -0.22, 0]}
          >
            <planeGeometry args={[2.5, 5.8]} />
            <meshBasicMaterial
              color={preset.beamHex}
              transparent
              opacity={preset.beamOpacity}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Partikel Debu Emas Melayang (Dust Motes) */}
      <points ref={dustRef} geometry={dustGeometry}>
        <pointsMaterial
          color="#ffe8a3"
          size={0.065}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </points>

      {/* Lampu Fairy Lights di Dinding Utara & Barat */}
      <group>
        {Array.from({ length: 15 }, (_, i) => {
          const t = i / 14;
          const pos = -6.6 + t * 13.2;
          const sag = Math.sin(t * Math.PI * 3) * 0.22;
          return (
            <group key={i}>
              <mesh position={[pos, 5.55 - sag, -HALF_D + 0.25]}>
                <sphereGeometry args={[0.06, 10, 10]} />
                <meshBasicMaterial color="#ffd97d" />
              </mesh>
              <mesh position={[-HALF_W + 0.25, 5.55 - sag, pos]}>
                <sphereGeometry args={[0.06, 10, 10]} />
                <meshBasicMaterial color="#ffd97d" />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* 5. Dinding Barat: Bingkai Tapak Kaki, Rak Buku, Lampu Meja */}
      <WallFrame xPos={-HALF_W + 0.24} yPos={3.4} zPos={-1.6} rotY={Math.PI / 2} bgColor="#fff5eb" iconColor="#f07b8e" />
      <WallFrame xPos={-HALF_W + 0.24} yPos={3.7} zPos={0.1} rotY={Math.PI / 2} bgColor="#eef7f2" iconColor="#56ab78" />

      {/* Lemari Buku Kayu & Koleksi Buku */}
      <group position={[-HALF_W + 0.65, 0, 2.5]}>
        <ContactShadowPlane texture={textures?.shadow ?? null} radiusX={0.65} radiusZ={1.2} />
        <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.85, 2.5, 1.9]} />
          <meshStandardMaterial color="#a86b3c" roughness={0.55} />
        </mesh>
        {/* 7 Buku Berwarna-warni */}
        {["#e76f51", "#2a9d8f", "#e9c46a", "#8ab17d", "#f4a261", "#2a9d8f", "#e76f51"].map((col, b) => (
          <mesh key={b} position={[0.05, 2.71, -0.65 + b * 0.13]} castShadow>
            <boxGeometry args={[0.36, 0.42 - (b % 2) * 0.05, 0.11]} />
            <meshStandardMaterial color={col} roughness={0.6} />
          </mesh>
        ))}
        {/* Lampu Meja Kayu Hangat */}
        <mesh position={[0, 2.62, 0.55]}>
          <cylinderGeometry args={[0.14, 0.18, 0.25, 16]} />
          <meshStandardMaterial color="#e6ccb2" roughness={0.4} />
        </mesh>
        <mesh position={[0, 2.9, 0.55]}>
          <cylinderGeometry args={[0.16, 0.28, 0.32, 18]} />
          <meshStandardMaterial color="#ffddb0" emissive="#ff9e3d" emissiveIntensity={0.45} />
        </mesh>
      </group>

      {/* 6. Dinding Timur: Pintu Kamar Kayu Mewah & Handle Emas */}
      <group position={[HALF_W - 0.22, 0, -2.2]}>
        <mesh position={[0, 2.05, 0]}>
          <boxGeometry args={[0.14, 4.1, 2.0]} />
          <meshStandardMaterial color="#a66c3e" roughness={0.55} />
        </mesh>
        <mesh position={[-0.12, 1.9, 0.72]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#ffcb47" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* 7. Sudut Tenggara: Tanaman Hias Daun Lebar (Potted Monstera) */}
      <group position={[5.2, 0, 4.8]}>
        <ContactShadowPlane texture={textures?.shadow ?? null} radiusX={0.7} radiusZ={0.7} />
        <mesh position={[0, 0.39, 0]} castShadow>
          <cylinderGeometry args={[0.45, 0.34, 0.78, 24]} />
          <meshStandardMaterial color="#f4ebe1" roughness={0.4} />
        </mesh>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const ang = (i / 7) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(ang) * 0.42, 0.95 + (i % 3) * 0.22, Math.sin(ang) * 0.42]}
              rotation={[0, -ang, 0.35]}
              scale={[1.4, 0.25, 0.85]}
              castShadow
            >
              <sphereGeometry args={[0.32, 14, 14]} />
              <meshStandardMaterial color="#4ca165" roughness={0.45} />
            </mesh>
          );
        })}
      </group>

      {/* 8. Dinding Selatan: Sofa Santai Pastel (Pastel Lounge Sofa) */}
      <group position={[-1.5, 0, HALF_D - 1.15]}>
        <ContactShadowPlane texture={textures?.shadow ?? null} radiusX={2.1} radiusZ={1.0} />
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.6, 0.55, 1.35]} />
          <meshStandardMaterial color="#d8a48f" roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.9, 0.5]} castShadow>
          <boxGeometry args={[3.6, 1.1, 0.38]} />
          <meshStandardMaterial color="#d8a48f" roughness={0.78} />
        </mesh>
      </group>

      {/* 9. Karpet Rajut Bundar di Tengah Ruangan */}
      <group position={[0.1, 0.01, 0.35]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[2.65, 2.7, 0.045, 64]} />
          <meshStandardMaterial color="#f7e1e6" roughness={0.88} />
        </mesh>
        <mesh receiveShadow>
          <cylinderGeometry args={[2.45, 2.45, 0.065, 64]} />
          <meshStandardMaterial
            map={textures?.rug ?? null}
            color={textures ? "#ffffff" : "#e091a9"}
            roughness={0.85}
          />
        </mesh>
      </group>

      {/* --- OBJEK INTERAKTIF --- */}

      {/* 10. Tiang Garukan Kucing (Scratching Post) */}
      <Usable spot="scratchPost" onUse={onUse} onHoverSpot={onHoverSpot}>
        <ContactShadowPlane texture={textures?.shadow ?? null} radiusX={1.0} radiusZ={1.0} />
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.42, 0.16, 1.42]} />
          <meshStandardMaterial color="#bf8750" roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.18, 0]} receiveShadow>
          <boxGeometry args={[1.22, 0.06, 1.22]} />
          <meshStandardMaterial color="#fff3e6" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.08, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.24, 1.92, 28]} />
          <meshStandardMaterial
            map={textures?.rope ?? null}
            bumpMap={textures?.rope ?? null}
            bumpScale={0.02}
            color={textures ? "#ffffff" : "#c48e4f"}
            roughness={0.82}
          />
        </mesh>
        <mesh position={[0, 2.04, 0]} castShadow>
          <boxGeometry args={[1.22, 0.16, 1.22]} />
          <meshStandardMaterial color="#bf8750" roughness={0.55} />
        </mesh>
        <mesh position={[0, 2.14, 0]} castShadow>
          <boxGeometry args={[1.08, 0.1, 1.08]} />
          <meshStandardMaterial color="#fff3e6" roughness={0.85} />
        </mesh>
        <mesh position={[0.38, 1.75, 0.38]}>
          <cylinderGeometry args={[0.012, 0.012, 0.45, 8]} />
          <meshBasicMaterial color="#fff5eb" />
        </mesh>
        <mesh ref={pomPomRef} position={[0.38, 1.5, 0.38]} castShadow>
          <sphereGeometry args={[0.13, 20, 20]} />
          <meshStandardMaterial color="#ff6b9d" roughness={0.6} />
        </mesh>
      </Usable>

      {/* 11. Kasur Kucing Biru Langit (Cozy Bolster Bed) */}
      <Usable spot="bed" rotationY={0.22} onUse={onUse} onHoverSpot={onHoverSpot}>
        <ContactShadowPlane texture={textures?.shadow ?? null} radiusX={1.2} radiusZ={1.0} />
        <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.88, 0.28, 1.48]} />
          <meshStandardMaterial color="#6ea8dc" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.32, -0.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 1.84, 16]} />
          <meshStandardMaterial color="#6ea8dc" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.56, 0.24, 1.16]} />
          <meshStandardMaterial color="#fff8ef" roughness={0.8} />
        </mesh>
        <mesh position={[-0.35, 0.4, -0.2]} rotation={[0, 0, -0.1]} scale={[1.3, 0.45, 0.85]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#ff9270" roughness={0.65} />
        </mesh>
      </Usable>

      {/* 12. Kotak Pasir Mint dengan Sekop Mini (Litter Box) */}
      <Usable spot="litterBox" rotationY={-0.25} onUse={onUse} onHoverSpot={onHoverSpot}>
        <ContactShadowPlane texture={textures?.shadow ?? null} radiusX={0.95} radiusZ={0.75} />
        <mesh position={[0, 0.175, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.42, 0.35, 1.08]} />
          <meshStandardMaterial color="#76b8a1" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[1.48, 0.07, 1.14]} />
          <meshStandardMaterial color="#eaf6f1" roughness={0.42} />
        </mesh>
        <mesh position={[0, 0.36, 0]} receiveShadow>
          <boxGeometry args={[1.26, 0.06, 0.92]} />
          <meshStandardMaterial color={litterDirty ? "#d4c39c" : "#ebd9c0"} roughness={0.95} />
        </mesh>
        <mesh position={[0.76, 0.25, 0]}>
          <boxGeometry args={[0.08, 0.25, 0.15]} />
          <meshStandardMaterial color="#52947e" roughness={0.4} />
        </mesh>
        {litterDirty && (
          <group position={[0, 0.38, 0]}>
            {[
              [-0.22, -0.12],
              [0.18, 0.1],
              [0.04, -0.18],
            ].map(([cx, cz], i) => (
              <mesh key={i} position={[cx, 0.03, cz]} castShadow>
                <sphereGeometry args={[0.055, 10, 10]} />
                <meshStandardMaterial color="#8b6b4a" />
              </mesh>
            ))}
          </group>
        )}
      </Usable>

      {/* 13. Mangkuk Makan Keramik Merah */}
      <Usable spot="foodBowl" onUse={onUse} onHoverSpot={onHoverSpot}>
        <ContactShadowPlane texture={textures?.shadow ?? null} radiusX={0.54} radiusZ={0.54} />
        <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.44, 0.35, 0.28, 32]} />
          <meshStandardMaterial color="#e25b52" roughness={0.32} />
        </mesh>
        <mesh position={[0, 0.15 + foodLevel * 0.09, 0]}>
          <cylinderGeometry args={[0.37, 0.37, 0.05, 24]} />
          <meshStandardMaterial color={foodBowlState?.fill ?? "#8a4b22"} roughness={0.65} />
        </mesh>
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const rad = (i % 3) * 0.095 + 0.04;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * rad, 0.18 + foodLevel * 0.09, Math.sin(angle) * rad]}
            >
              <sphereGeometry args={[0.048, 10, 10]} />
              <meshStandardMaterial color={foodBowlState?.fill ?? "#8a4b22"} roughness={0.65} />
            </mesh>
          );
        })}
      </Usable>

      {/* 14. Mangkuk Air Keramik Biru */}
      <Usable spot="waterBowl" onUse={onUse} onHoverSpot={onHoverSpot}>
        <ContactShadowPlane texture={textures?.shadow ?? null} radiusX={0.54} radiusZ={0.54} />
        <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.44, 0.35, 0.28, 32]} />
          <meshStandardMaterial color="#4b87db" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.15 + waterLevel * 0.09, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.04, 28]} />
          <meshStandardMaterial
            color={waterBowlState?.fill ?? "#82d6ff"}
            roughness={0.12}
            transparent
            opacity={0.88}
          />
        </mesh>
      </Usable>

      {/* 15. Bola Benang Mainan Emas */}
      <Usable spot="toy" onUse={onUse} onHoverSpot={onHoverSpot}>
        <YarnBallToy color={toyColor} active={playingToy} />
      </Usable>
    </group>
  );
}
