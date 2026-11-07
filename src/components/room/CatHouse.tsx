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

/** Posisi benda rumah — dipakai ulang oleh interaksi (makan, minum, main, tidur, pasir, garuk). */
export const HOUSE_SPOTS = {
  bed: [-1.35, 0, -3.1],
  foodBowl: [1.2, 0, 1.35],
  waterBowl: [2.05, 0, 1.65],
  toy: [-1.35, 0, 0.55],
  litterBox: [2.9, 0, -0.45],
  scratchPost: [-2.6, 0, -0.4],
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
  zPos,
  yPos,
  bgColor,
  iconColor,
}: {
  zPos: number;
  yPos: number;
  bgColor: string;
  iconColor: string;
}) {
  return (
    <group position={[-4.75, yPos, zPos]}>
      <mesh castShadow>
        <boxGeometry args={[0.09, 1.08, 0.92]} />
        <meshStandardMaterial color="#c28752" roughness={0.5} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.1, 0.86, 0.74]} />
        <meshStandardMaterial color={bgColor} roughness={0.75} />
      </mesh>
      <mesh position={[0.045, -0.05, 0]} scale={[0.3, 1, 1.2]}>
        <sphereGeometry args={[0.11, 14, 14]} />
        <meshStandardMaterial color={iconColor} roughness={0.45} />
      </mesh>
      {[-1, 0, 1].map((i) => (
        <mesh
          key={i}
          position={[0.045, 0.12 + (i === 0 ? 0.04 : 0), i * 0.12]}
          scale={[0.3, 1, 1]}
        >
          <sphereGeometry args={[0.055, 10, 10]} />
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
      groupRef.current.position.y = active ? 0.24 + Math.abs(Math.sin(elapsed * 11)) * 0.38 : 0.25;
    }
    if (ballRef.current && active) {
      ballRef.current.rotation.x += dt * 6;
      ballRef.current.rotation.z += dt * 5;
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

/** Rumah diorama 3D Mochi lengkap dengan tekstur prosedural, jendela awan, sinar matahari, partikel debu, lampu gantung, & furnitur detail. */
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
    const count = 42;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random based on index
      const s1 = Math.sin(i * 12.9898) * 43758.5453;
      const s2 = Math.sin(i * 78.233) * 43758.5453;
      const s3 = Math.sin(i * 45.164) * 43758.5453;
      const r1 = s1 - Math.floor(s1);
      const r2 = s2 - Math.floor(s2);
      const r3 = s3 - Math.floor(s3);
      pos[i * 3] = (r1 - 0.3) * 6.5;
      pos[i * 3 + 1] = 0.4 + r2 * 4.2;
      pos[i * 3 + 2] = (r3 - 0.5) * 6.5;
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
      pomPomRef.current.position.x = 0.38 + Math.sin(elapsed * 3) * 0.03;
    }
  });

  const preset = LIGHTING_PRESETS[lightingMode];
  const foodLevel = Math.max(0.1, Math.min(1, foodBowlState?.level ?? 0.9));
  const waterLevel = Math.max(0.1, Math.min(1, waterBowlState?.level ?? 0.9));

  return (
    <group>
      {/* Lantai Kayu Tebal (Floor Slab) */}
      <mesh position={[0, -0.21, 0]} receiveShadow>
        <boxGeometry args={[10.4, 0.42, 10.4]} />
        <meshStandardMaterial
          map={textures?.wood.map ?? null}
          bumpMap={textures?.wood.bumpMap ?? null}
          bumpScale={0.015}
          color={textures ? "#ffffff" : "#c58e5e"}
          roughness={0.55}
          metalness={0.04}
        />
      </mesh>

      {/* Dinding Belakang & Kiri (Back Wall & Left Wall) */}
      <mesh position={[0, 2.7, -5.0]} receiveShadow castShadow>
        <boxGeometry args={[10.4, 5.8, 0.4]} />
        <meshStandardMaterial
          map={textures?.wall ?? null}
          color={textures ? "#ffffff" : "#f5ebe1"}
          roughness={0.85}
        />
      </mesh>
      <mesh position={[-5.0, 2.7, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.4, 5.8, 10.4]} />
        <meshStandardMaterial
          map={textures?.wall ?? null}
          color={textures ? "#ffffff" : "#f5ebe1"}
          roughness={0.85}
        />
      </mesh>

      {/* Baseboards & Chair Rails */}
      <mesh position={[0, 0.16, -4.76]}>
        <boxGeometry args={[10.0, 0.32, 0.1]} />
        <meshStandardMaterial color="#c89d7c" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.55, -4.76]}>
        <boxGeometry args={[10.0, 0.1, 0.09]} />
        <meshStandardMaterial color="#c89d7c" roughness={0.55} />
      </mesh>
      <mesh position={[-4.76, 0.16, 0]}>
        <boxGeometry args={[0.1, 0.32, 10.0]} />
        <meshStandardMaterial color="#c89d7c" roughness={0.55} />
      </mesh>
      <mesh position={[-4.76, 1.55, 0]}>
        <boxGeometry args={[0.09, 0.1, 10.0]} />
        <meshStandardMaterial color="#c89d7c" roughness={0.55} />
      </mesh>

      {/* Jendela dengan Awan 3D, Gorden & Tanaman Pot */}
      <group position={[2.2, 3.15, -4.74]}>
        <mesh>
          <boxGeometry args={[2.4, 1.85, 0.05]} />
          <meshBasicMaterial color={preset.skyHex} />
        </mesh>
        {/* Awan 3D */}
        <mesh position={[-0.45, 0.3, 0.03]} scale={[1.8, 0.8, 0.2]}>
          <sphereGeometry args={[0.28, 12, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
        <mesh position={[0.5, 0.1, 0.03]} scale={[1.6, 0.75, 0.2]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
        {/* Kusen Jendela */}
        <mesh position={[0, 0.94, 0]}>
          <boxGeometry args={[2.7, 0.16, 0.18]} />
          <meshStandardMaterial color="#fff6eb" roughness={0.45} />
        </mesh>
        <mesh position={[0, -0.94, 0.08]}>
          <boxGeometry args={[2.8, 0.18, 0.32]} />
          <meshStandardMaterial color="#fff6eb" roughness={0.45} />
        </mesh>
        <mesh position={[-1.22, 0, 0]}>
          <boxGeometry args={[0.16, 1.95, 0.16]} />
          <meshStandardMaterial color="#fff6eb" roughness={0.45} />
        </mesh>
        <mesh position={[1.22, 0, 0]}>
          <boxGeometry args={[0.16, 1.95, 0.16]} />
          <meshStandardMaterial color="#fff6eb" roughness={0.45} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.08, 1.85, 0.1]} />
          <meshStandardMaterial color="#fff6eb" roughness={0.45} />
        </mesh>
        <mesh>
          <boxGeometry args={[2.4, 0.08, 0.1]} />
          <meshStandardMaterial color="#fff6eb" roughness={0.45} />
        </mesh>
        {/* Gorden Kiri & Kanan */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 1.32, -0.02, 0.14]} scale={[1, 1, 0.45]} castShadow>
            <cylinderGeometry args={[0.22, 0.32, 2.15, 16]} />
            <meshStandardMaterial color="#ffe4d1" roughness={0.85} />
          </mesh>
        ))}
        {/* Tanaman Pot di Ambang Jendela */}
        <mesh position={[-0.72, -0.73, 0.14]}>
          <cylinderGeometry args={[0.16, 0.11, 0.25, 18]} />
          <meshStandardMaterial color="#e07a5f" roughness={0.5} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={i}
            position={[-0.72 + (i - 2) * 0.055, -0.52 + (i % 2) * 0.06, 0.14]}
            rotation={[0, 0, (i - 2) * -0.22]}
            scale={[0.8, 1.6, 0.5]}
          >
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshStandardMaterial color="#4ca165" roughness={0.45} />
          </mesh>
        ))}
      </group>

      {/* Sinar Matahari Diagonal (Sunbeams) */}
      <group>
        {[0, 1].map((i) => (
          <mesh
            key={i}
            position={[1.8 + i * 0.35, 1.85, -2.5]}
            rotation={[-0.58, -0.25, 0]}
          >
            <planeGeometry args={[2.2, 5.0]} />
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

      {/* Lampu Gantung Hangat (Fairy String Lights) */}
      <group>
        {Array.from({ length: 11 }, (_, i) => {
          const t = i / 10;
          const x = -4.5 + t * 9.0;
          const sag = Math.sin(t * Math.PI) * 0.28;
          return (
            <mesh key={i} position={[x, 4.75 - sag, -4.74]}>
              <sphereGeometry args={[0.055, 10, 10]} />
              <meshBasicMaterial color="#ffd97d" />
            </mesh>
          );
        })}
      </group>

      {/* Bingkai Lukisan Tapak Kaki & Rak Buku */}
      <WallFrame zPos={-1.35} yPos={3.15} bgColor="#fff5eb" iconColor="#f07b8e" />
      <WallFrame zPos={0.15} yPos={3.45} bgColor="#eef7f2" iconColor="#56ab78" />

      <group position={[-1.8, 3.35, -4.62]}>
        <mesh castShadow>
          <boxGeometry args={[1.7, 0.09, 0.36]} />
          <meshStandardMaterial color="#c58b56" roughness={0.55} />
        </mesh>
        {["#f28482", "#84a59d", "#f6bd60", "#9b89b3"].map((col, b) => (
          <mesh key={b} position={[-0.5 + b * 0.11, 0.2, 0]} castShadow>
            <boxGeometry args={[0.09, 0.32 - (b % 2) * 0.04, 0.24]} />
            <meshStandardMaterial color={col} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Karpet Rajut Bundar di Tengah (Center Braided Plush Rug) */}
      <group position={[0.1, 0.01, 0.4]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[2.42, 2.46, 0.045, 64]} />
          <meshStandardMaterial color="#f7e1e6" roughness={0.88} />
        </mesh>
        <mesh receiveShadow>
          <cylinderGeometry args={[2.24, 2.24, 0.065, 64]} />
          <meshStandardMaterial
            map={textures?.rug ?? null}
            color={textures ? "#ffffff" : "#e8a5b8"}
            roughness={0.85}
          />
        </mesh>
      </group>

      {/* 1. Tiang Garukan Kucing (Scratching Post) */}
      <Usable spot="scratchPost" onUse={onUse} onHoverSpot={onHoverSpot}>
        <ContactShadowPlane texture={textures?.shadow ?? null} radiusX={0.95} radiusZ={0.95} />
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.38, 0.16, 1.38]} />
          <meshStandardMaterial color="#bf8750" roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.18, 0]} receiveShadow>
          <boxGeometry args={[1.18, 0.06, 1.18]} />
          <meshStandardMaterial color="#fff3e6" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.06, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.23, 0.23, 1.88, 28]} />
          <meshStandardMaterial
            map={textures?.rope ?? null}
            bumpMap={textures?.rope ?? null}
            bumpScale={0.02}
            color={textures ? "#ffffff" : "#c99658"}
            roughness={0.82}
          />
        </mesh>
        <mesh position={[0, 2.02, 0]} castShadow>
          <boxGeometry args={[1.18, 0.16, 1.18]} />
          <meshStandardMaterial color="#bf8750" roughness={0.55} />
        </mesh>
        <mesh position={[0, 2.12, 0]} castShadow>
          <boxGeometry args={[1.06, 0.1, 1.06]} />
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

      {/* 2. Kasur Kucing Empuk (Cozy Bolster Cat Bed) */}
      <Usable spot="bed" rotationY={0.25} onUse={onUse} onHoverSpot={onHoverSpot}>
        <ContactShadowPlane texture={textures?.shadow ?? null} radiusX={1.15} radiusZ={0.95} />
        <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.82, 0.28, 1.42]} />
          <meshStandardMaterial color="#6ea8dc" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.32, -0.58]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 1.78, 16]} />
          <meshStandardMaterial color="#6ea8dc" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.24, 1.12]} />
          <meshStandardMaterial color="#fff8ef" roughness={0.8} />
        </mesh>
        <mesh position={[-0.35, 0.4, -0.2]} rotation={[0, 0, -0.1]} scale={[1.3, 0.45, 0.85]} castShadow>
          <sphereGeometry args={[0.24, 16, 16]} />
          <meshStandardMaterial color="#ff9270" roughness={0.65} />
        </mesh>
      </Usable>

      {/* 3. Kotak Pasir Mint dengan Sekop Mini (Litter Box) */}
      <Usable spot="litterBox" rotationY={-0.25} onUse={onUse} onHoverSpot={onHoverSpot}>
        <ContactShadowPlane texture={textures?.shadow ?? null} radiusX={0.9} radiusZ={0.72} />
        <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.38, 0.34, 1.05]} />
          <meshStandardMaterial color="#76b8a1" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.34, 0]} castShadow>
          <boxGeometry args={[1.44, 0.07, 1.11]} />
          <meshStandardMaterial color="#eaf6f1" roughness={0.42} />
        </mesh>
        <mesh position={[0, 0.35, 0]} receiveShadow>
          <boxGeometry args={[1.22, 0.06, 0.9]} />
          <meshStandardMaterial color={litterDirty ? "#d4c39c" : "#ebd9c0"} roughness={0.95} />
        </mesh>
        <mesh position={[0.74, 0.24, 0]}>
          <boxGeometry args={[0.08, 0.24, 0.14]} />
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

      {/* 4. Mangkuk Makan Keramik Merah dengan Biskuit Kibble */}
      <Usable spot="foodBowl" onUse={onUse} onHoverSpot={onHoverSpot}>
        <ContactShadowPlane texture={textures?.shadow ?? null} radiusX={0.52} radiusZ={0.52} />
        <mesh position={[0, 0.135, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.43, 0.34, 0.27, 32]} />
          <meshStandardMaterial color="#e25b52" roughness={0.32} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.14 + foodLevel * 0.1, 0]}>
          <cylinderGeometry args={[0.36, 0.36, 0.05, 24]} />
          <meshStandardMaterial color={foodBowlState?.fill ?? "#8a4b22"} roughness={0.65} />
        </mesh>
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const rad = (i % 3) * 0.095 + 0.04;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * rad, 0.17 + foodLevel * 0.1, Math.sin(angle) * rad]}
            >
              <sphereGeometry args={[0.048, 10, 10]} />
              <meshStandardMaterial color={foodBowlState?.fill ?? "#8a4b22"} roughness={0.65} />
            </mesh>
          );
        })}
      </Usable>

      {/* 5. Mangkuk Air Keramik Biru */}
      <Usable spot="waterBowl" onUse={onUse} onHoverSpot={onHoverSpot}>
        <ContactShadowPlane texture={textures?.shadow ?? null} radiusX={0.52} radiusZ={0.52} />
        <mesh position={[0, 0.135, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.43, 0.34, 0.27, 32]} />
          <meshStandardMaterial color="#4b87db" roughness={0.3} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.14 + waterLevel * 0.1, 0]}>
          <cylinderGeometry args={[0.37, 0.37, 0.04, 28]} />
          <meshStandardMaterial
            color={waterBowlState?.fill ?? "#82d6ff"}
            roughness={0.12}
            metalness={0.1}
            transparent
            opacity={0.88}
          />
        </mesh>
      </Usable>

      {/* 6. Bola Benang Emas (Golden Yarn Ball Toy) */}
      <Usable spot="toy" onUse={onUse} onHoverSpot={onHoverSpot}>
        <YarnBallToy color={toyColor} active={playingToy} />
      </Usable>
    </group>
  );
}
