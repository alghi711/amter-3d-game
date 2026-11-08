"use client";

import * as THREE from "three";

export type LightingMode = "day" | "sunset" | "night";

export const LIGHTING_PRESETS: Record<
  LightingMode,
  {
    label: string;
    icon: string;
    bgHex: number;
    sunHex: number;
    sunIntensity: number;
    hemiIntensity: number;
    ceilingIntensity: number;
    cornerIntensity: number;
    pointIntensity: number;
    skyHex: number;
    beamHex: number;
    beamOpacity: number;
  }
> = {
  day: {
    label: "Sore Hangat",
    icon: "☀️",
    bgHex: 0x2a1f1a,
    sunHex: 0xffdfad,
    sunIntensity: 0.82,
    hemiIntensity: 0.62,
    ceilingIntensity: 0.55,
    cornerIntensity: 0.45,
    pointIntensity: 0.55,
    skyHex: 0x99d5ff,
    beamHex: 0xffe9b5,
    beamOpacity: 0.07,
  },
  sunset: {
    label: "Senja Keemasan",
    icon: "🌇",
    bgHex: 0x2a1f1a,
    sunHex: 0xff9b54,
    sunIntensity: 0.88,
    hemiIntensity: 0.52,
    ceilingIntensity: 0.72,
    cornerIntensity: 0.65,
    pointIntensity: 0.72,
    skyHex: 0xff9e6d,
    beamHex: 0xffb870,
    beamOpacity: 0.1,
  },
  night: {
    label: "Malam Nyaman",
    icon: "🌙",
    bgHex: 0x2a1f1a,
    sunHex: 0x6e8cff,
    sunIntensity: 0.28,
    hemiIntensity: 0.34,
    ceilingIntensity: 0.92,
    cornerIntensity: 0.85,
    pointIntensity: 0.92,
    skyHex: 0x1f2d5a,
    beamHex: 0x8aa8ff,
    beamOpacity: 0.04,
  },
};

export function createWoodFloorTextures(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = 1024;
  colorCanvas.height = 1024;
  const ctx = colorCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = 1024;
  bumpCanvas.height = 1024;
  const bCtx = bumpCanvas.getContext("2d")!;

  ctx.fillStyle = "#b67c4c";
  ctx.fillRect(0, 0, 1024, 1024);
  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, 1024, 1024);

  const planks = 12;
  const plankH = 1024 / planks;
  const tones = ["#ba8050", "#ad7242", "#c48b5a", "#a3683a", "#b67c4c"];

  for (let i = 0; i < planks; i++) {
    const y = i * plankH;
    const grad = ctx.createLinearGradient(0, y, 0, y + plankH);
    const baseColor = tones[i % tones.length];
    grad.addColorStop(0, baseColor);
    grad.addColorStop(0.5, "#c99364");
    grad.addColorStop(1, baseColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, 1024, plankH);

    ctx.strokeStyle = "rgba(78, 40, 12, 0.22)";
    bCtx.strokeStyle = "#606060";
    for (let g = 0; g < 14; g++) {
      ctx.lineWidth = 1 + (g % 3);
      bCtx.lineWidth = 1.5;
      const gy = y + (g / 14) * plankH;
      ctx.beginPath();
      bCtx.beginPath();
      ctx.moveTo(0, gy);
      bCtx.moveTo(0, gy);
      ctx.bezierCurveTo(340, gy + Math.sin(i + g) * 7, 680, gy - Math.cos(i + g) * 7, 1024, gy);
      bCtx.bezierCurveTo(340, gy + Math.sin(i + g) * 7, 680, gy - Math.cos(i + g) * 7, 1024, gy);
      ctx.stroke();
      bCtx.stroke();
    }

    ctx.strokeStyle = "#6e3d18";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();

    bCtx.strokeStyle = "#222222";
    bCtx.lineWidth = 5;
    ctx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(1024, y);
    ctx.stroke();

    const jointX = ((i * 317) % 760) + 120;
    ctx.beginPath();
    ctx.moveTo(jointX, y);
    ctx.lineTo(jointX, y + plankH);
    ctx.stroke();

    bCtx.beginPath();
    bCtx.moveTo(jointX, y);
    bCtx.lineTo(jointX, y + plankH);
    bCtx.stroke();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3.5, 3.5);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3.5, 3.5);

  return { map, bumpMap };
}

export function createWallWallpaperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#e5d4c0");
  grad.addColorStop(0.64, "#dcc7b0");
  grad.addColorStop(0.66, "#a6764e");
  grad.addColorStop(0.69, "#c89b72");
  grad.addColorStop(1, "#b6855b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = "rgba(255, 248, 238, 0.26)";
  for (let x = 0; x < 512; x += 32) {
    ctx.fillRect(x, 0, 12, 328);
  }

  ctx.strokeStyle = "rgba(105, 64, 32, 0.55)";
  ctx.lineWidth = 5;
  for (let x = 14; x < 512; x += 64) {
    ctx.strokeRect(x, 368, 42, 122);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(3, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBraidedRugTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const cx = 256;
  const cy = 256;

  ctx.fillStyle = "#e091a9";
  ctx.fillRect(0, 0, 512, 512);

  const ringColors = ["#f6dce4", "#e58da8", "#d46b8b", "#f2c2d1", "#c75b7c", "#eba6bc"];
  for (let r = 248; r > 10; r -= 9) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = ringColors[Math.floor(r / 9) % ringColors.length];
    ctx.fill();

    ctx.strokeStyle = "rgba(115, 38, 62, 0.22)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 6]);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRopeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#c48e4f";
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) {
    ctx.fillStyle = y % 16 === 0 ? "#dba86c" : "#a16e32";
    ctx.fillRect(0, y, 256, 5);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCatFurGradientTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#dd7222");
  grad.addColorStop(0.45, "#f29544");
  grad.addColorStop(0.85, "#f7ab5e");
  grad.addColorStop(1, "#d97a2b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = "rgba(255, 235, 205, 0.22)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 450; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 5, y + 12);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, "rgba(52, 28, 10, 0.52)");
  grad.addColorStop(0.55, "rgba(52, 28, 10, 0.22)");
  grad.addColorStop(1, "rgba(52, 28, 10, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}
