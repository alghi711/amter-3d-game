"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { AdaptiveDpr, OrbitControls, PerformanceMonitor, PerspectiveCamera } from "@react-three/drei";
import { QUALITY_PROFILES, detectQuality, stepQuality, type QualityLevel, type QualityProfile } from "@/lib/quality";
import CatHouse, { HOUSE_SPOTS, type BowlState, type HouseSpot } from "./CatHouse";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { MathUtils, MOUSE, TOUCH, type Group, type Mesh } from "three";
import { resolveAnimState, type CatAnimState } from "@/lib/cat-animation";
import type { GrowthStage } from "@/lib/mock-growth";
import type { CatMood } from "@/lib/mock-mood";
import { CAMERA_CONTROL_PRESETS, useInputKind } from "@/lib/use-input-kind";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  createCatFurGradientTexture,
  createContactShadowTexture,
  LIGHTING_PRESETS,
  type LightingMode,
} from "@/lib/procedural-textures";

/** Efek visual rutinitas: gelembung tidur (tidur), remah makanan (makan/minum), atau kilau bintang (main/garuk). */
function RoutineEffect({ state }: { state: CatAnimState }) {
  const group = useRef<Group>(null);
  const mode =
    state === "tidur"
      ? "sleep"
      : state === "makan" || state === "minum"
        ? "eat"
        : state === "main" || state === "garuk"
          ? "play"
          : null;

  useFrame(({ clock }) => {
    if (!group.current || !mode) return;
    const t = clock.getElapsedTime();
    group.current.children.forEach((c, i) => {
      if (mode === "sleep") {
        const phase = (t * 0.45 + i * 0.33) % 1;
        c.position.set(0.2 + phase * 0.35, 1.85 + phase * 0.75, 0.2);
        c.scale.setScalar((0.4 + phase * 0.7) * (1 - phase * 0.5));
      } else if (mode === "eat") {
        const phase = (t * 2.2 + i * 0.25) % 1;
        const angle = (i - 1) * 0.65;
        c.position.set(Math.sin(angle) * (0.15 + phase * 0.25), 0.75 + Math.sin(phase * Math.PI) * 0.28, 0.65 + phase * 0.2);
        c.scale.setScalar(1 - phase * 0.7);
      } else {
        const angle = t * 3.5 + i * ((Math.PI * 2) / 3);
        c.position.set(Math.cos(angle) * 0.65, 1.35 + Math.sin(t * 5 + i) * 0.18, Math.sin(angle) * 0.65);
        c.scale.setScalar(0.75 + Math.sin(t * 8 + i) * 0.25);
      }
    });
  });

  if (!mode) return null;
  const color = mode === "sleep" ? "#a5b4fc" : mode === "eat" ? "#f59e0b" : "#fbbf24";
  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <octahedronGeometry args={[0.085, mode === "sleep" ? 2 : 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function SoapBubbles() {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!group.current) return;
    group.current.children.forEach((c, i) => {
      const phase = (t * 0.9 + i * 0.35) % 1.4;
      const angle = i * 1.3 + t * 1.2;
      const radius = 0.42 + (i % 2) * 0.22;
      c.position.set(Math.cos(angle) * radius, 0.5 + phase * 1.35, Math.sin(angle) * radius);
      c.scale.setScalar(Math.sin((phase / 1.4) * Math.PI) * 1.05);
    });
  });
  return (
    <group ref={group}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.11, 14, 14]} />
          <meshStandardMaterial
            color="#d8f3ff"
            emissive="#bae6fd"
            emissiveIntensity={0.35}
            roughness={0.1}
            metalness={0.1}
            transparent
            opacity={0.78}
          />
        </mesh>
      ))}
    </group>
  );
}

function Heart({ onDone }: { onDone: () => void }) {
  const ref = useRef<Group>(null);
  const age = useRef(0);
  const [x] = useState(() => (Math.random() - 0.5) * 0.75);
  useFrame((_, delta) => {
    age.current += delta;
    if (!ref.current) return;
    ref.current.position.set(x, 2.0 + age.current * 0.85, 0.25);
    ref.current.scale.setScalar(Math.max(0, 1 - age.current / 1.25));
    if (age.current > 1.25) onDone();
  });
  return (
    <group ref={ref}>
      {[-0.06, 0.06].map((dx) => (
        <mesh key={dx} position={[dx, 0.04, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#ff5e7e" emissive="#ff5e7e" emissiveIntensity={0.35} />
        </mesh>
      ))}
      <mesh position={[0, -0.06, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.14, 0.18, 16]} />
        <meshStandardMaterial color="#ff5e7e" emissive="#ff5e7e" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

export type CatPart = "kepala" | "badan" | "ekor";
export type CatTouch = { kind: "sentuh" | "elus"; part: CatPart };

/** Posisi santai Mochi di atas karpet rajut bundar. */
const HOME_SPOT: readonly [number, number] = [0.2, 0.25];

/** Posisi berdiri Mochi di depan tiap furnitur saat beraktivitas. */
const SPOT_STAND_POS: Record<HouseSpot, readonly [number, number, number]> = {
  bed: [-1.45, 0.22, -3.25],
  foodBowl: [0.95, 0, 1.05],
  waterBowl: [1.7, 0, 1.3],
  toy: [-0.95, 0, 0.5],
  litterBox: [2.35, 0, -0.45],
  scratchPost: [-1.95, 0, -0.35],
};

/** Titik jalan-jalan otonom saat kucing santai (Autonomous Wandering). */
const WANDER_POINTS: readonly (readonly [number, number, number])[] = [
  [0.2, 0, 0.25],
  [-0.7, 0, 0.8],
  [0.8, 0, -0.4],
  [-1.2, 0, -0.8],
  [0.1, 0, 1.1],
];

const partOf = (name: string): CatPart => (name === "ekor" ? "ekor" : name === "badan" ? "badan" : "kepala");

function Cat({
  color,
  spot,
  onTouch,
  onPettingChange,
  onAnimState,
  onHoverSpot,
  anim,
  bathing = false,
  mood = "senang",
  growthScale = 1,
  stage = "dewasa",
  vocalizing = false,
  headScreenElementId = "cat-voice-bubble",
}: {
  anim: QualityProfile["anim"];
  bathing?: boolean;
  mood?: CatMood;
  growthScale?: number;
  stage?: GrowthStage;
  color: string;
  spot: HouseSpot | null;
  onAnimState?: (s: CatAnimState) => void;
  onTouch?: (t: CatTouch) => void;
  onPettingChange?: (petting: boolean) => void;
  onHoverSpot?: (label: string | null, clientX?: number, clientY?: number) => void;
  vocalizing?: boolean;
  headScreenElementId?: string;
}) {
  const root = useRef<Group>(null);
  const bodyGroup = useRef<Group>(null);
  const torsoMesh = useRef<Mesh>(null);
  const headGroup = useRef<Group>(null);
  const leftEar = useRef<Group>(null);
  const rightEar = useRef<Group>(null);
  const leftEyeGroup = useRef<Group>(null);
  const rightEyeGroup = useRef<Group>(null);
  const openMouthMesh = useRef<Mesh>(null);
  const tailPivot = useRef<Group>(null);
  const scaleGroup = useRef<Group>(null);

  // Kaki depan & belakang untuk siklus berjalan 4 kaki
  const leftFrontPawRef = useRef<Mesh>(null);
  const rightFrontPawRef = useRef<Mesh>(null);
  const leftHindFootRef = useRef<Group>(null);
  const rightHindFootRef = useRef<Group>(null);

  const textures = useMemo(() => {
    if (typeof document === "undefined") return null;
    return {
      fur: createCatFurGradientTexture(),
      shadow: createContactShadowTexture(),
    };
  }, []);

  const headWorldRef = useRef(new THREE.Vector3());
  const wanderRef = useRef({ timer: 6.0, ptIndex: 0 });

  const animState = useRef<CatAnimState>("diam");

  const reaction = useRef<{ kind: CatTouch["kind"]; part: CatPart; start: number; intensity: number; lean: number } | null>(
    null,
  );
  const [hearts, setHearts] = useState<number[]>([]);
  const [activeRoutineAnim, setActiveRoutineAnim] = useState<CatAnimState>("diam");

  const react = (kind: CatTouch["kind"], part: CatPart, now: number) => {
    reaction.current = { kind, part, start: now, intensity: kind === "elus" ? 0.6 : 1, lean: 0 };
    if (part !== "ekor") setHearts((h) => [...h.slice(-(anim.maxHearts - 1)), now]);
    onTouch?.({ kind, part });
  };

  const stroke = useRef<{ x: number; y: number; dist: number; part: CatPart; pet: boolean; nextHeart: number } | null>(
    null,
  );

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    stroke.current = { x: e.clientX, y: e.clientY, dist: 0, part: partOf(e.object.name), pet: false, nextHeart: 260 };
    onPettingChange?.(true);
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    onHoverSpot?.("Mochi 🐱 · Klik / Usap untuk Mengelus & Bersuara", e.clientX, e.clientY);
    const st = stroke.current;
    if (!st) return;
    e.stopPropagation();
    const dx = e.clientX - st.x;
    const moved = Math.hypot(dx, e.clientY - st.y);
    st.dist += moved;
    st.x = e.clientX;
    st.y = e.clientY;
    st.part = partOf(e.object.name);
    if (!st.pet && st.dist > 32) {
      st.pet = true;
      react("elus", st.part, performance.now() / 1000);
    } else if (st.pet && reaction.current?.kind === "elus") {
      const r = reaction.current;
      r.start = performance.now() / 1000;
      r.part = st.part;
      r.intensity += (Math.min(1, moved / 25) - r.intensity) * 0.3;
      r.lean += (Math.sign(dx) * Math.min(1, Math.abs(dx) / 20) - r.lean) * 0.2;
      if (st.dist > st.nextHeart && st.part !== "ekor") {
        st.nextHeart += 260;
        const now = r.start;
        setHearts((h) => [...h.slice(-(anim.maxHearts - 1)), now]);
      }
    }
  };
  const end = () => {
    const st = stroke.current;
    if (!st) return;
    if (!st.pet) react("sentuh", st.part, performance.now() / 1000);
    stroke.current = null;
    onPettingChange?.(false);
  };

  useFrame(({ clock, camera, size }, delta) => {
    const dt = Math.min(delta, 0.1);
    const elapsed = clock.getElapsedTime();

    // Jalankan wandering otonom saat kucing sedang santai di karpet
    if (!spot && !bathing && !reaction.current) {
      wanderRef.current.timer -= dt;
      if (wanderRef.current.timer <= 0) {
        wanderRef.current.timer = 6.5 + Math.random() * 5.5;
        wanderRef.current.ptIndex = (wanderRef.current.ptIndex + 1) % WANDER_POINTS.length;
      }
    }

    const currentWander = WANDER_POINTS[wanderRef.current.ptIndex];
    const targetPos: readonly [number, number, number] = spot
      ? SPOT_STAND_POS[spot]
      : bathing
        ? [0.1, 0, 0.35]
        : currentWander;

    const lookTarget: readonly [number, number] = spot
      ? spot === "bed"
        ? [0, 2]
        : [HOUSE_SPOTS[spot][0], HOUSE_SPOTS[spot][2]]
      : [currentWander[0] + 0.2, currentWander[2] + 2.5];

    let moving = false;
    if (root.current && bodyGroup.current) {
      const p = root.current.position;
      const dx = targetPos[0] - p.x;
      const dz = targetPos[2] - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.06) {
        moving = true;
        p.x = MathUtils.lerp(p.x, targetPos[0], dt * 3.8);
        p.z = MathUtils.lerp(p.z, targetPos[2], dt * 3.8);
        p.y = MathUtils.lerp(p.y, targetPos[1], dt * 6);
        bodyGroup.current.position.y = Math.abs(Math.sin(elapsed * 14)) * 0.13;
      } else {
        p.y = MathUtils.lerp(p.y, targetPos[1], dt * 6);
        bodyGroup.current.position.y = MathUtils.lerp(bodyGroup.current.position.y, 0, dt * 8);
      }

      // Animasi ayunan 4 kaki Mochi (Front paws & hind feet)
      if (moving) {
        if (leftFrontPawRef.current) leftFrontPawRef.current.rotation.x = 0.3 + Math.sin(elapsed * 14) * 0.45;
        if (rightFrontPawRef.current) rightFrontPawRef.current.rotation.x = 0.3 - Math.sin(elapsed * 14) * 0.45;
        if (leftHindFootRef.current) leftHindFootRef.current.position.y = 0.12 + Math.max(0, -Math.sin(elapsed * 14)) * 0.08;
        if (rightHindFootRef.current) rightHindFootRef.current.position.y = 0.12 + Math.max(0, Math.sin(elapsed * 14)) * 0.08;
      } else if (animState.current === "main") {
        if (leftFrontPawRef.current) leftFrontPawRef.current.rotation.x = -0.6 + Math.sin(elapsed * 16) * 0.5;
        if (rightFrontPawRef.current) rightFrontPawRef.current.rotation.x = -0.6 - Math.sin(elapsed * 16) * 0.5;
      } else {
        if (leftFrontPawRef.current) leftFrontPawRef.current.rotation.x = MathUtils.lerp(leftFrontPawRef.current.rotation.x, 0.3, dt * 8);
        if (rightFrontPawRef.current) rightFrontPawRef.current.rotation.x = MathUtils.lerp(rightFrontPawRef.current.rotation.x, 0.3, dt * 8);
        if (leftHindFootRef.current) leftHindFootRef.current.position.y = 0.12;
        if (rightHindFootRef.current) rightHindFootRef.current.position.y = 0.12;
      }

      const lookX = moving ? targetPos[0] : lookTarget[0];
      const lookZ = moving ? targetPos[2] : lookTarget[1];
      const wantAngle = Math.atan2(lookX - p.x, lookZ - p.z);
      const diff = Math.atan2(Math.sin(wantAngle - root.current.rotation.y), Math.cos(wantAngle - root.current.rotation.y));
      root.current.rotation.y += diff * Math.min(1, dt * 5.5);
    }

    const r = reaction.current;
    const age = r ? performance.now() / 1000 - r.start : Infinity;
    if (r && age > 1.8) reaction.current = null;
    const annoyed = r?.kind === "elus" && r.part === "ekor";

    const next = resolveAnimState({
      moving,
      spot: bathing ? null : spot,
      reaction: annoyed ? "kesal" : (r?.kind ?? null),
      bathing,
    });

    if (next !== animState.current) {
      const prev = animState.current;
      animState.current = next;
      if (next === "makan" || next === "minum" || next === "main" || (prev === "mandi" && next === "diam")) {
        setHearts((h) => [...h.slice(-(anim.maxHearts - 1)), performance.now() / 1000]);
      }
      setActiveRoutineAnim(next);
      onAnimState?.(next);
    }

    // Napas dada & perut gembil Mochi
    const breath = 1 + Math.sin(elapsed * 3.2) * 0.022;
    if (torsoMesh.current) {
      torsoMesh.current.scale.set(1.04 * breath, 0.94 / breath, 0.98 * breath);
    }

    // Ekor belang bergoyang anggun
    const moodTailMul = mood === "senang" ? 1.2 : mood === "bosan" ? 0.65 : mood === "ngantuk" ? 0.5 : 1;
    if (tailPivot.current) {
      const speed = (next === "kesal" ? 12 : next === "main" ? 7 : 4.5) * moodTailMul;
      tailPivot.current.rotation.z = Math.sin(elapsed * speed) * 0.35;
      tailPivot.current.rotation.x = Math.cos(elapsed * 2.5) * 0.12;
    }

    // Gerak telinga kucing
    const earDroop = mood === "bosan" || mood === "ngantuk" ? 0.16 : 0;
    if (leftEar.current && rightEar.current) {
      leftEar.current.rotation.z = 0.38 + earDroop + Math.sin(elapsed * 2.8) * 0.06;
      rightEar.current.rotation.z = -0.38 - earDroop - Math.sin(elapsed * 3.1) * 0.06;
    }

    // Kedipan mata & ekspresi mood
    const blinkCycle = elapsed % 4.2;
    const isBlinking =
      (blinkCycle > 3.95 && blinkCycle < 4.1) || next === "tidur" || next === "dielus";
    const openEyeY = mood === "ngantuk" ? 0.45 : mood === "bosan" ? 0.72 : mood === "lapar" ? 1.12 : 1.0;
    if (leftEyeGroup.current && rightEyeGroup.current) {
      leftEyeGroup.current.scale.y = isBlinking ? 0.14 : openEyeY;
      rightEyeGroup.current.scale.y = isBlinking ? 0.14 : openEyeY;
    }

    // Mulut pink terbuka saat mengeong / makan / bersuara
    const mouthActive =
      vocalizing || next === "makan" || next === "minum" || next === "dielus" || next === "kaget";
    if (openMouthMesh.current) {
      if (mouthActive) {
        openMouthMesh.current.scale.y = 0.55 + Math.abs(Math.sin(elapsed * 18)) * 0.85;
      } else {
        openMouthMesh.current.scale.y = MathUtils.lerp(openMouthMesh.current.scale.y, 0.2, dt * 10);
      }
    }

    // Animasi kepala & badan aktif
    if (headGroup.current && bodyGroup.current) {
      if (next === "dielus" || next === "kaget" || next === "mandi") {
        headGroup.current.rotation.z = Math.sin(elapsed * 10) * 0.13;
        if (!moving) bodyGroup.current.position.y = Math.abs(Math.sin(elapsed * 9)) * 0.12;
      } else if (next === "makan" || next === "minum") {
        headGroup.current.rotation.x = 0.28 + Math.sin(elapsed * 15) * 0.14;
        headGroup.current.rotation.z = 0;
      } else if (next === "main" || next === "garuk") {
        if (!moving) bodyGroup.current.position.y = Math.abs(Math.sin(elapsed * 11)) * 0.2;
        headGroup.current.rotation.z = Math.sin(elapsed * 7) * 0.08;
      } else if (next === "tidur") {
        headGroup.current.rotation.x = MathUtils.lerp(headGroup.current.rotation.x, 0.22, dt * 6);
        headGroup.current.rotation.z = MathUtils.lerp(headGroup.current.rotation.z, 0.12, dt * 6);
      } else {
        headGroup.current.rotation.z = Math.sin(elapsed * 1.6) * 0.04;
        headGroup.current.rotation.x = Math.sin(elapsed * 1.2) * 0.03;
      }
    }

    // Skala pertumbuhan kucing (Anak 0.68x -> Dewasa 1.0x)
    if (scaleGroup.current) {
      const targetScale = stage === "anak" ? 0.68 : growthScale;
      const nextScale = MathUtils.damp(scaleGroup.current.scale.x, targetScale, 5, dt);
      scaleGroup.current.scale.setScalar(nextScale);
    }

    // Update proyeksi koordinat 3D kepala Mochi ke layar untuk Speech Bubble
    if (headGroup.current && typeof document !== "undefined") {
      const bubbleEl = document.getElementById(headScreenElementId);
      if (bubbleEl) {
        const vec = headWorldRef.current;
        headGroup.current.getWorldPosition(vec);
        vec.y += stage === "anak" ? 0.65 : 0.85;
        vec.project(camera);
        const screenX = (vec.x * 0.5 + 0.5) * size.width;
        const screenY = (-(vec.y * 0.5) + 0.5) * size.height;
        bubbleEl.style.left = `${screenX}px`;
        bubbleEl.style.top = `${screenY}px`;
      }
    }
  });

  const orangeColor = color || "#f29b4b";

  return (
    <group
      ref={root}
      position={[HOME_SPOT[0], 0, HOME_SPOT[1]]}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={end}
      onPointerLeave={end}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onHoverSpot?.("Mochi 🐱 · Klik / Usap untuk Mengelus & Bersuara", e.clientX, e.clientY);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
        onHoverSpot?.(null);
      }}
    >
      {/* Bayangan kontak halus di bawah Mochi */}
      {textures?.shadow && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <planeGeometry args={[1.7, 1.7]} />
          <meshBasicMaterial map={textures.shadow} transparent depthWrite={false} />
        </mesh>
      )}

      <group ref={scaleGroup} scale={growthScale}>
        <group ref={bodyGroup}>
          {/* Torso Chubby */}
          <mesh
            ref={torsoMesh}
            name="badan"
            position={[0, 0.62, 0]}
            scale={[1.05, 0.95, 0.98]}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[0.68, 36, 36]} />
            <meshStandardMaterial
              map={textures?.fur ?? null}
              color={orangeColor}
              roughness={0.5}
            />
          </mesh>

          {/* Bulu Dada / Perut Krem Putih */}
          <mesh name="badan" position={[0, 0.59, 0.44]} scale={[0.86, 0.88, 0.56]}>
            <sphereGeometry args={[0.53, 32, 32]} />
            <meshStandardMaterial color="#fff5e6" roughness={0.55} />
          </mesh>

          {/* 3 Garis Belang di Punggung */}
          {[0, 1, 2].map((s) => (
            <mesh key={s} position={[0, 0.82 - s * 0.18, -0.58]}>
              <boxGeometry args={[0.45 - s * 0.06, 0.06, 0.12]} />
              <meshStandardMaterial color="#d46a1e" roughness={0.58} />
            </mesh>
          ))}

          {/* Kaki Depan Kiri & Kanan */}
          <mesh
            ref={leftFrontPawRef}
            name="badan"
            position={[-0.28, 0.36, 0.58]}
            rotation={[0.3, 0, 0]}
            scale={[0.88, 1.35, 0.92]}
            castShadow
          >
            <sphereGeometry args={[0.175, 20, 20]} />
            <meshStandardMaterial color="#fff5e6" roughness={0.55} />
          </mesh>
          <mesh
            ref={rightFrontPawRef}
            name="badan"
            position={[0.28, 0.36, 0.58]}
            rotation={[0.3, 0, 0]}
            scale={[0.88, 1.35, 0.92]}
            castShadow
          >
            <sphereGeometry args={[0.175, 20, 20]} />
            <meshStandardMaterial color="#fff5e6" roughness={0.55} />
          </mesh>

          {/* Kaki Belakang Duduk dengan Bantalan Pink (Toe Beans) */}
          <group ref={leftHindFootRef} position={[-0.44, 0.12, 0.39]}>
            <mesh name="badan" scale={[0.95, 0.65, 1.35]} castShadow>
              <sphereGeometry args={[0.195, 20, 20]} />
              <meshStandardMaterial color="#fff5e6" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.02, 0.17]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial color="#f47c7c" roughness={0.48} />
            </mesh>
          </group>
          <group ref={rightHindFootRef} position={[0.44, 0.12, 0.39]}>
            <mesh name="badan" scale={[0.95, 0.65, 1.35]} castShadow>
              <sphereGeometry args={[0.195, 20, 20]} />
              <meshStandardMaterial color="#fff5e6" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.02, 0.17]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial color="#f47c7c" roughness={0.48} />
            </mesh>
          </group>

          {/* Kalung Merah & Lonceng Emas Metalik */}
          <mesh position={[0, 1.08, 0.04]} rotation={[Math.PI / 2 + 0.12, 0, 0]}>
            <torusGeometry args={[0.495, 0.068, 18, 40]} />
            <meshStandardMaterial color="#e02832" roughness={0.35} />
          </mesh>
          <mesh position={[0, 1.0, 0.56]} castShadow>
            <sphereGeometry args={[0.12, 24, 24]} />
            <meshStandardMaterial color="#ffcb3d" metalness={0.85} roughness={0.18} />
          </mesh>

          {/* Ekor Belang 6 Segmen */}
          <group ref={tailPivot} position={[0, 0.38, -0.58]}>
            {[0, 1, 2, 3, 4, 5].map((t) => (
              <mesh
                key={t}
                name="ekor"
                position={[0, t * 0.11, -t * 0.09]}
                castShadow
              >
                <sphereGeometry args={[0.135 - t * 0.008, 16, 16]} />
                <meshStandardMaterial
                  map={t % 2 === 0 ? (textures?.fur ?? null) : null}
                  color={t % 2 === 1 ? "#d46a1e" : orangeColor}
                  roughness={0.55}
                />
              </mesh>
            ))}
          </group>

          {/* Kepala Chibi Mochi */}
          <group ref={headGroup} position={[0, 1.52, 0.05]}>
            <mesh name="kepala" scale={[1.15, 0.96, 1.03]} castShadow receiveShadow>
              <sphereGeometry args={[0.63, 36, 36]} />
              <meshStandardMaterial
                map={textures?.fur ?? null}
                color={orangeColor}
                roughness={0.5}
              />
            </mesh>

            {/* Pipi Gembil Kiri & Kanan */}
            {[-0.43, 0.43].map((cx) => (
              <mesh key={cx} name="kepala" position={[cx, -0.1, 0.19]}>
                <sphereGeometry args={[0.33, 24, 24]} />
                <meshStandardMaterial
                  map={textures?.fur ?? null}
                  color={orangeColor}
                  roughness={0.5}
                />
              </mesh>
            ))}

            {/* Moncong Krem 3D (Bentuk ω) & Mulut Pink Animasi */}
            {[-0.082, 0.082].map((mx) => (
              <mesh key={mx} name="kepala" position={[mx, -0.125, 0.59]} scale={[1.2, 0.88, 0.72]}>
                <sphereGeometry args={[0.105, 18, 18]} />
                <meshStandardMaterial color="#fff5e6" roughness={0.55} />
              </mesh>
            ))}
            <mesh ref={openMouthMesh} position={[0, -0.18, 0.59]} scale={[1.1, 0.2, 0.5]}>
              <sphereGeometry args={[0.065, 14, 14]} />
              <meshStandardMaterial color="#f47c7c" roughness={0.48} />
            </mesh>

            {/* Garis Belang Tabby di Dahi */}
            <mesh position={[0, 0.25, 0.6]} rotation={[-0.35, 0, 0]}>
              <boxGeometry args={[0.17, 0.048, 0.05]} />
              <meshStandardMaterial color="#d46a1e" roughness={0.58} />
            </mesh>
            <mesh position={[0, 0.34, 0.56]} rotation={[-0.5, 0, 0]}>
              <boxGeometry args={[0.12, 0.042, 0.05]} />
              <meshStandardMaterial color="#d46a1e" roughness={0.58} />
            </mesh>

            {/* Telinga Kiri & Kanan */}
            <group ref={leftEar} position={[-0.43, 0.47, 0.02]} rotation={[-0.1, 0, 0.38]}>
              <mesh name="kepala" position={[0, 0.15, 0]} scale={[1, 1, 0.68]} castShadow>
                <coneGeometry args={[0.25, 0.44, 28]} />
                <meshStandardMaterial map={textures?.fur ?? null} color={orangeColor} roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.13, 0.065]} scale={[1, 1, 0.45]}>
                <coneGeometry args={[0.155, 0.3, 24]} />
                <meshStandardMaterial color="#f47c7c" roughness={0.48} />
              </mesh>
            </group>
            <group ref={rightEar} position={[0.43, 0.47, 0.02]} rotation={[-0.1, 0, -0.38]}>
              <mesh name="kepala" position={[0, 0.15, 0]} scale={[1, 1, 0.68]} castShadow>
                <coneGeometry args={[0.25, 0.44, 28]} />
                <meshStandardMaterial map={textures?.fur ?? null} color={orangeColor} roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.13, 0.065]} scale={[1, 1, 0.45]}>
                <coneGeometry args={[0.155, 0.3, 24]} />
                <meshStandardMaterial color="#f47c7c" roughness={0.48} />
              </mesh>
            </group>

            {/* Mata Berkilau dengan Highlight Anime */}
            <group ref={leftEyeGroup} position={[-0.24, 0.025, 0.59]}>
              <mesh scale={[1, 1.08, 0.55]}>
                <sphereGeometry args={[0.1, 24, 24]} />
                <meshStandardMaterial color="#160f0c" roughness={0.08} />
              </mesh>
              <mesh position={[-0.028, 0.034, 0.052]}>
                <sphereGeometry args={[0.034, 14, 14]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0.026, -0.026, 0.052]}>
                <sphereGeometry args={[0.017, 10, 10]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
            <group ref={rightEyeGroup} position={[0.24, 0.025, 0.59]}>
              <mesh scale={[1, 1.08, 0.55]}>
                <sphereGeometry args={[0.1, 24, 24]} />
                <meshStandardMaterial color="#160f0c" roughness={0.08} />
              </mesh>
              <mesh position={[-0.028, 0.034, 0.052]}>
                <sphereGeometry args={[0.034, 14, 14]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0.026, -0.026, 0.052]}>
                <sphereGeometry args={[0.017, 10, 10]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>

            {/* Hidung Pink Mungil */}
            <mesh position={[0, -0.075, 0.65]} scale={[1.28, 0.85, 0.75]}>
              <sphereGeometry args={[0.058, 16, 16]} />
              <meshStandardMaterial color="#f47c7c" roughness={0.48} />
            </mesh>

            {/* Rona Pipi Merah Muda (Rosy Blush Ovals) */}
            <mesh position={[-0.39, -0.1, 0.54]} rotation={[0, -0.35, 0]} scale={[1.35, 0.65, 0.3]}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial color="#f47c7c" roughness={0.48} />
            </mesh>
            <mesh position={[0.39, -0.1, 0.54]} rotation={[0, 0.35, 0]} scale={[1.35, 0.65, 0.3]}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial color="#f47c7c" roughness={0.48} />
            </mesh>

            {/* Kumis Kucing (Whiskers) */}
            {[-1, 1].map((side) =>
              [-1, 1].map((w) => (
                <mesh
                  key={`${side}-${w}`}
                  position={[side * 0.53, -0.09 + w * 0.036, 0.47]}
                  rotation={[0, -side * 0.35, Math.PI / 2 + side * w * 0.14]}
                >
                  <cylinderGeometry args={[0.009, 0.009, 0.28, 8]} />
                  <meshBasicMaterial color="#fffaf2" />
                </mesh>
              )),
            )}
          </group>
        </group>

        {bathing && <SoapBubbles />}
        <RoutineEffect state={activeRoutineAnim} />
        {hearts.map((h) => (
          <Heart key={h} onDone={() => setHearts((all) => all.filter((x) => x !== h))} />
        ))}
      </group>
    </group>
  );
}

const CAMERA_HOME: [number, number, number] = [5.6, 4.4, 6.8];
const CAMERA_TARGET: [number, number, number] = [0, 1.15, 0];

function ResponsiveCamera() {
  const size = useThree((state) => state.size);
  const aspect = size.width / size.height;
  const fov = aspect < 0.8 ? 52 : aspect < 1.2 ? 44 : 40;
  return <PerspectiveCamera makeDefault position={CAMERA_HOME} fov={fov} />;
}

const ROOM_BOUNDS = { minX: -6.0, minZ: -6.0, maxX: 6.0, maxZ: 6.0, minY: 0.5, maxY: 6.2 };
const OBSTACLES: { x: number; z: number; r: number; h: number }[] = (
  [
    ["bed", 1.2, 0.65],
    ["foodBowl", 0.55, 0.4],
    ["waterBowl", 0.55, 0.4],
    ["litterBox", 0.9, 0.5],
    ["scratchPost", 0.8, 2.2],
  ] as const
).map(([spot, r, h]) => ({ x: HOUSE_SPOTS[spot][0], z: HOUSE_SPOTS[spot][2], r, h }));

function CameraCollision() {
  useFrame(({ camera }) => {
    const p = camera.position;
    p.x = Math.min(ROOM_BOUNDS.maxX, Math.max(ROOM_BOUNDS.minX, p.x));
    p.z = Math.min(ROOM_BOUNDS.maxZ, Math.max(ROOM_BOUNDS.minZ, p.z));
    p.y = Math.min(ROOM_BOUNDS.maxY, Math.max(ROOM_BOUNDS.minY, p.y));
    for (const o of OBSTACLES) {
      if (p.y > o.h) continue;
      const dx = p.x - o.x;
      const dz = p.z - o.z;
      const d = Math.hypot(dx, dz);
      if (d < o.r) {
        const k = d === 0 ? 1 : o.r / d;
        p.x = o.x + (d === 0 ? o.r : dx * k);
        p.z = o.z + (d === 0 ? 0 : dz * k);
      }
    }
  });
  return null;
}

function CameraRig({ enabled, resetSignal }: { enabled: boolean; resetSignal: number }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const input = useInputKind();
  const preset = CAMERA_CONTROL_PRESETS[input];
  useEffect(() => {
    const c = controls.current;
    if (resetSignal === 0 || !c) return;
    c.object.position.set(...CAMERA_HOME);
    c.target.set(...CAMERA_TARGET);
    c.update();
  }, [resetSignal]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={enabled}
      target={CAMERA_TARGET}
      enableDamping
      dampingFactor={preset.dampingFactor}
      rotateSpeed={preset.rotateSpeed}
      zoomSpeed={preset.zoomSpeed}
      enablePan={false}
      minDistance={2.8}
      maxDistance={8.4}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI / 2 - 0.05}
      touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_ROTATE }}
      mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }}
      regress
    />
  );
}

/** Mengelola frame throttling 30/60fps dan sinkronisasi bayangan mesh ruangan. */
function LiveQualityManager({
  shadows,
  batterySaver = false,
  frameRateLimit = 60,
}: {
  shadows: boolean;
  batterySaver?: boolean;
  frameRateLimit?: 30 | 60;
}) {
  const { scene } = useThree();
  const lastRenderTime = useRef(0);

  useEffect(() => {
    // Perbarui mesh objek saat bayangan diaktifkan/dinonaktifkan
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = shadows;
        mesh.receiveShadow = shadows;
      }
    });
  }, [scene, shadows]);

  // Frame limiter jika 30 FPS atau Battery Saver aktif
  useFrame(({ clock }) => {
    if (frameRateLimit === 30 || batterySaver) {
      const now = clock.getElapsedTime();
      if (now - lastRenderTime.current < 1 / 32) {
        return;
      }
      lastRenderTime.current = now;
    }
  });

  return null;
}

export default function CatRoomScene({
  furColor,
  catSpot,
  onAnimState,
  onUseObject,
  onCatTouch,
  onHoverSpot,
  cameraReset = 0,
  foodBowlState,
  waterBowlState,
  bathing = false,
  litterDirty = false,
  toyColor = "#f4b928",
  playingToy = false,
  mood = "senang",
  growthScale = 1,
  stage = "dewasa",
  lightingMode = "day",
  vocalizing = false,
  qualityLevel = "auto",
  shadowsEnabled = true,
  batterySaver = false,
  frameRateLimit = 60,
}: {
  furColor: string;
  catSpot: HouseSpot | null;
  onAnimState?: (s: CatAnimState) => void;
  onUseObject: (spot: HouseSpot) => void;
  onCatTouch?: (t: CatTouch) => void;
  onHoverSpot?: (label: string | null, clientX?: number, clientY?: number) => void;
  cameraReset?: number;
  foodBowlState?: BowlState;
  waterBowlState?: BowlState;
  bathing?: boolean;
  litterDirty?: boolean;
  toyColor?: string;
  playingToy?: boolean;
  mood?: CatMood;
  growthScale?: number;
  stage?: GrowthStage;
  lightingMode?: LightingMode;
  vocalizing?: boolean;
  qualityLevel?: QualityLevel | "auto";
  shadowsEnabled?: boolean;
  batterySaver?: boolean;
  frameRateLimit?: 30 | 60;
}) {
  const [petting, setPetting] = useState(false);
  const [quality, setQuality] = useState<QualityLevel>(() => detectQuality());
  const effectiveQuality: QualityLevel =
    qualityLevel && qualityLevel !== "auto" ? qualityLevel : quality;
  const q = QUALITY_PROFILES[effectiveQuality];
  const useShadows = shadowsEnabled && q.shadows;
  const lightPreset = LIGHTING_PRESETS[lightingMode];

  const effectiveDpr: [number, number] = batterySaver ? [0.75, 1.0] : q.dpr;

  return (
    <Canvas
      shadows={useShadows}
      dpr={effectiveDpr}
      gl={{
        antialias: q.antialias,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.95,
      }}
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
      <LiveQualityManager
        shadows={useShadows}
        batterySaver={batterySaver}
        frameRateLimit={frameRateLimit}
      />
      <ResponsiveCamera />
      {/* Warna luar ruangan kayu hangat, tanpa kabut putih! */}
      <color attach="background" args={[lightPreset.bgHex]} />

      {/* Pencahayaan Ruangan Hangat: Lampu Gantung, Lampu Sudut, Matahari, & Hemisphere */}
      <hemisphereLight args={[0xffe9ce, 0x9c6d49, lightPreset.hemiIntensity]} position={[0, 7.5, 0]} />
      <directionalLight
        position={[4.5, 6.8, 4.0]}
        color={lightPreset.sunHex}
        intensity={lightPreset.sunIntensity}
        castShadow={useShadows}
        shadow-mapSize={[q.shadowMapSize, q.shadowMapSize]}
        shadow-bias={-0.0005}
        shadow-camera-near={0.5}
        shadow-camera-far={22}
        shadow-camera-left={-6.8}
        shadow-camera-right={6.8}
        shadow-camera-top={6.8}
        shadow-camera-bottom={-6.8}
      />
      {/* Lampu Gantung Rotan di Tengah Plafon */}
      <pointLight position={[0, 5.8, 0]} color={0xffb46b} intensity={lightPreset.ceilingIntensity} distance={18} decay={1.4} />
      {/* Lampu Meja Sudut Rak Buku */}
      <pointLight position={[-5.8, 2.8, 2.2]} color={0xff9e44} intensity={lightPreset.cornerIntensity} distance={9} decay={1.6} />

      <CatHouse
        onUse={onUseObject}
        onHoverSpot={onHoverSpot}
        foodBowlState={foodBowlState}
        waterBowlState={waterBowlState}
        litterDirty={litterDirty}
        toyColor={toyColor}
        playingToy={playingToy}
        lightingMode={lightingMode}
      />
      <Cat
        color={furColor}
        spot={catSpot}
        onAnimState={onAnimState}
        onTouch={onCatTouch}
        onPettingChange={setPetting}
        onHoverSpot={onHoverSpot}
        anim={q.anim}
        bathing={bathing}
        mood={mood}
        growthScale={growthScale}
        stage={stage}
        vocalizing={vocalizing}
      />
      <CameraRig enabled={!petting} resetSignal={cameraReset} />
      <CameraCollision />
    </Canvas>
  );
}
