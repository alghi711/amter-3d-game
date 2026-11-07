"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { AdaptiveDpr, ContactShadows, OrbitControls, PerformanceMonitor, PerspectiveCamera } from "@react-three/drei";
import { QUALITY_PROFILES, detectQuality, stepQuality, type QualityLevel } from "@/lib/quality";
import CatHouse, { type HouseSpot } from "./CatHouse";
import { useEffect, useRef, useState } from "react";
import { TOUCH, type Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

/** Kucing sederhana dari primitif — placeholder sebelum model glTF tersedia. */
/** Hati melayang ke atas lalu hilang — umpan balik saat kucing dielus. */
function Heart({ onDone }: { onDone: () => void }) {
  const ref = useRef<Group>(null);
  const age = useRef(0);
  const [x] = useState(() => (Math.random() - 0.5) * 0.6);
  useFrame((_, delta) => {
    age.current += delta;
    if (!ref.current) return;
    ref.current.position.set(x, 1.6 + age.current * 0.8, 0.2);
    ref.current.scale.setScalar(Math.max(0, 1 - age.current / 1.2));
    if (age.current > 1.2) onDone();
  });
  return (
    <group ref={ref}>
      {/* hati dari dua bola + kerucut, tanpa font eksternal */}
      {[-0.06, 0.06].map((dx) => (
        <mesh key={dx} position={[dx, 0.04, 0]}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshStandardMaterial color="#ff5c8a" emissive="#ff5c8a" emissiveIntensity={0.3} />
        </mesh>
      ))}
      <mesh position={[0, -0.06, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.13, 0.17, 16]} />
        <meshStandardMaterial color="#ff5c8a" emissive="#ff5c8a" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

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
  const head = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  // reaksi aktif: jenis + waktu mulai (detik jam three)
  // intensity 0..1 mengikuti kecepatan usapan; lean = arah usapan (-1 kiri .. 1 kanan)
  const reaction = useRef<{ kind: CatTouch["kind"]; part: CatPart; start: number; intensity: number; lean: number } | null>(
    null,
  );
  const [hearts, setHearts] = useState<number[]>([]);
  const react = (kind: CatTouch["kind"], part: CatPart, now: number) => {
    reaction.current = { kind, part, start: now, intensity: kind === "elus" ? 0.5 : 1, lean: 0 };
    if (kind === "elus" && part !== "ekor") setHearts((h) => [...h.slice(-4), now]);
    onTouch?.({ kind, part });
  };
  const stroke = useRef<{ x: number; y: number; dist: number; part: CatPart; pet: boolean; nextHeart: number } | null>(
    null,
  );

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    stroke.current = { x: e.clientX, y: e.clientY, dist: 0, part: partOf(e.object.name), pet: false, nextHeart: 300 };
    onPettingChange?.(true); // matikan kamera selama menyentuh kucing
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const st = stroke.current;
    if (!st) return;
    e.stopPropagation();
    const dx = e.clientX - st.x;
    const moved = Math.hypot(dx, e.clientY - st.y);
    st.dist += moved;
    st.x = e.clientX;
    st.y = e.clientY;
    st.part = partOf(e.object.name);
    if (!st.pet && st.dist > 40) {
      st.pet = true;
      react("elus", st.part, performance.now() / 1000);
    } else if (st.pet && reaction.current?.kind === "elus") {
      // usapan berlanjut: perpanjang reaksi, sesuaikan intensitas & arah condong badan
      const r = reaction.current;
      r.start = performance.now() / 1000;
      r.part = st.part;
      r.intensity += (Math.min(1, moved / 25) - r.intensity) * 0.3;
      r.lean += (Math.sign(dx) * Math.min(1, Math.abs(dx) / 20) - r.lean) * 0.2;
      if (st.dist > st.nextHeart && st.part !== "ekor") {
        st.nextHeart += 300;
        const now = r.start;
        setHearts((h) => [...h.slice(-4), now]);
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
    const r = reaction.current;
    const age = r ? performance.now() / 1000 - r.start : Infinity;
    if (r && age > 1.6) reaction.current = null;
    const annoyed = r?.kind === "elus" && r.part === "ekor"; // ekor dielus = kesal
    const petting = r?.kind === "elus" && !annoyed;
    const touched = r?.kind === "sentuh";
    const k = r?.intensity ?? 0;
    // ekor: makin cepat sesuai intensitas elusan; menyabet keras saat kesal
    if (tail.current) {
      const speed = annoyed ? 14 : petting ? 4 + k * 8 : 3;
      const amp = annoyed ? 0.9 : petting ? 0.4 + k * 0.3 : 0.4;
      tail.current.rotation.z = Math.sin(t * speed) * amp;
    }
    // badan: condong mengikuti arah usapan
    if (body.current) {
      const lean = petting ? -(r?.lean ?? 0) * 0.15 : 0;
      body.current.rotation.z += (lean - body.current.rotation.z) * 0.15;
    }
    // kepala: miring penasaran saat disentuh, menyundul pelan saat dielus
    if (head.current) {
      const tilt = touched ? Math.sin(Math.min(age, 1) * Math.PI) * 0.35 : 0;
      const shake = annoyed ? Math.sin(t * 20) * 0.12 : 0;
      const nuzzle = petting ? Math.sin(t * 6) * (0.04 + k * 0.08) : 0;
      head.current.rotation.y += (shake - head.current.rotation.y) * 0.3;
      head.current.rotation.z += (tilt - head.current.rotation.z) * 0.2;
      head.current.rotation.x += (nuzzle - head.current.rotation.x) * 0.2;
    }
    // mata: merem keenakan saat dielus
    if (eyes.current) {
      const want = petting ? 0.15 : 1;
      eyes.current.scale.y += (want - eyes.current.scale.y) * 0.25;
    }
    // badan: lompat kecil kaget saat disentuh
    if (body.current) body.current.position.y = touched && age < 0.4 ? Math.sin((age / 0.4) * Math.PI) * 0.15 : 0;
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
        <group ref={head} position={[0, 0.8, 0.1]}>
        <group position={[0, -0.8, -0.1]}>
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
        <group ref={eyes} position={[0, 1.1, 0]}>
          {[-0.13, 0.13].map((x) => (
            <mesh key={x} position={[x, 0, 0.49]}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshStandardMaterial color="#222" />
            </mesh>
          ))}
        </group>
        {/* hidung */}
        <mesh position={[0, 1.0, 0.52]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color="#e88a9a" />
        </mesh>
        </group>
        </group>
      </group>
      {hearts.map((h) => (
        <Heart key={h} onDone={() => setHearts((all) => all.filter((x) => x !== h))} />
      ))}
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
  return <PerspectiveCamera makeDefault position={CAMERA_HOME} fov={fov} />;
}

/**
 * Kamera bebas: putar (1 jari / drag), zoom (cubit / scroll), dengan redaman halus.
 * Sudut dibatasi agar kamera tidak menembus dinding/lantai. `resetSignal` berubah → kembali ke sudut awal.
 */
const CAMERA_HOME: [number, number, number] = [3.5, 3, 5];

function CameraRig({ enabled, resetSignal }: { enabled: boolean; resetSignal: number }) {
  const controls = useRef<OrbitControlsImpl>(null);
  useEffect(() => {
    const c = controls.current;
    if (resetSignal === 0 || !c) return;
    c.object.position.set(...CAMERA_HOME);
    c.target.set(0, 0.8, 0);
    c.update();
  }, [resetSignal]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={enabled}
      target={[0, 0.8, 0]}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.7}
      zoomSpeed={0.8}
      enablePan={false}
      minDistance={2.5}
      maxDistance={9}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2.1}
      minAzimuthAngle={-0.35}
      maxAzimuthAngle={Math.PI / 2 + 0.35}
      touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_ROTATE }}
      regress
    />
  );
}

export default function CatRoomScene({
  furColor,
  catTarget,
  onUseObject,
  onCatTouch,
  cameraReset = 0,
}: {
  furColor: string;
  catTarget: readonly [number, number];
  onUseObject: (spot: HouseSpot) => void;
  onCatTouch?: (t: CatTouch) => void;
  /** Naikkan angkanya untuk mengembalikan kamera ke posisi awal. */
  cameraReset?: number;
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
      <CameraRig enabled={!petting} resetSignal={cameraReset} />
    </Canvas>
  );
}
