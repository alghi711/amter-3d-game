"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { AdaptiveDpr, ContactShadows, OrbitControls, PerformanceMonitor, PerspectiveCamera } from "@react-three/drei";
import { QUALITY_PROFILES, detectQuality, stepQuality, type QualityLevel } from "@/lib/quality";
import CatHouse, { type HouseSpot } from "./CatHouse";
import { useRef, useState } from "react";
import type { Group } from "three";

/** Kucing sederhana dari primitif — placeholder sebelum model glTF tersedia. */
export type CatPart = "kepala" | "badan" | "ekor";
export type CatTouch = { kind: "sentuh" | "elus"; part: CatPart };

/** Nama mesh → bagian tubuh; dipakai untuk tahu bagian mana yang disentuh. */
const partOf = (name: string): CatPart => (name === "ekor" ? "ekor" : name === "badan" ? "badan" : "kepala");

function Cat({
  color,
  target,
  onTouch,
  onPettingChange,
}: {
  color: string;
  target: readonly [number, number];
  onTouch?: (t: CatTouch) => void;
  onPettingChange?: (petting: boolean) => void;
}) {
  const root = useRef<Group>(null);
  // jejak gesekan: jarak geser (px) selama jari/mouse ditekan di atas kucing
  const stroke = useRef<{ x: number; y: number; dist: number; part: CatPart; pet: boolean } | null>(null);

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    stroke.current = { x: e.clientX, y: e.clientY, dist: 0, part: partOf(e.object.name), pet: false };
    onPettingChange?.(true); // matikan kamera selama menyentuh kucing
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const st = stroke.current;
    if (!st) return;
    e.stopPropagation();
    st.dist += Math.hypot(e.clientX - st.x, e.clientY - st.y);
    st.x = e.clientX;
    st.y = e.clientY;
    st.part = partOf(e.object.name);
    if (!st.pet && st.dist > 40) {
      st.pet = true;
      onTouch?.({ kind: "elus", part: st.part });
    }
  };
  const end = () => {
    const st = stroke.current;
    if (!st) return;
    if (!st.pet) onTouch?.({ kind: "sentuh", part: st.part });
    stroke.current = null;
    onPettingChange?.(false);
  };
  const body = useRef<Group>(null);
  const tail = useRef<Group>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    // berjalan menuju objek yang dipilih, berhenti sedikit di depannya
    if (root.current) {
      const p = root.current.position;
      const dx = target[0] - p.x;
      const dz = target[1] - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.75) {
        const step = Math.min(dist - 0.75, delta * 1.6);
        p.x += (dx / dist) * step;
        p.z += (dz / dist) * step;
        p.y = Math.abs(Math.sin(t * 10)) * 0.05; // langkah memantul
        const want = Math.atan2(dx, dz);
        root.current.rotation.y += (want - root.current.rotation.y) * Math.min(1, delta * 8);
      } else {
        p.y = 0;
      }
    }
    if (body.current) body.current.scale.y = 1 + Math.sin(t * 2) * 0.02; // napas
    if (tail.current) tail.current.rotation.z = Math.sin(t * 3) * 0.4; // ekor bergoyang
  });

  return (
    <group
      ref={root}
      position={[0, 0, 0.6]}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={end}
      onPointerLeave={end}
      onPointerOver={() => (document.body.style.cursor = "grab")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <group ref={body}>
        <mesh name="badan" position={[0, 0.45, 0]} castShadow>
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
        <mesh name="ekor" position={[0, 0.3, -0.05]} rotation={[-0.4, 0, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.6, 8, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
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

export default function CatRoomScene({
  furColor,
  catTarget,
  onUseObject,
  onCatTouch,
}: {
  furColor: string;
  catTarget: readonly [number, number];
  onUseObject: (spot: HouseSpot) => void;
  onCatTouch?: (t: CatTouch) => void;
}) {
  const [petting, setPetting] = useState(false);
  // kualitas awal ditebak dari perangkat, lalu diturunkan otomatis bila FPS anjlok
  const [quality, setQuality] = useState<QualityLevel>(() => detectQuality());
  const q = QUALITY_PROFILES[quality];
  return (
    <Canvas
      shadows={q.shadows}
      dpr={q.dpr}
      gl={{ antialias: q.antialias, powerPreference: "high-performance" }}
      performance={{ min: 0.5 }}
      className="!touch-none"
      style={{ width: "100%", height: "100%" }}
    >
      <PerformanceMonitor
        onDecline={() => setQuality((cur) => stepQuality(cur, -1))}
        flipflops={3}
        onFallback={() => setQuality("rendah")}
      />
      <AdaptiveDpr pixelated />
      <ResponsiveCamera />
      <color attach="background" args={["#fff6ef"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 3]} intensity={1.2} castShadow={q.shadows} shadow-mapSize={[q.shadowMapSize, q.shadowMapSize]} />
      <CatHouse onUse={onUseObject} />
      <Cat color={furColor} target={catTarget} onTouch={onCatTouch} onPettingChange={setPetting} />
      {q.contactShadows && (
        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} blur={2} far={3} resolution={256} />
      )}
      <OrbitControls
        target={[0, 0.8, 0]}
        enabled={!petting}
        enablePan={false}
        minDistance={3}
        maxDistance={9}
        maxPolarAngle={Math.PI / 2.1}
        regress
      />
    </Canvas>
  );
}
