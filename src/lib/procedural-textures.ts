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
    pointIntensity: number;
    skyHex: number;
    beamHex: number;
    beamOpacity: number;
  }
> = {
  day: {
    label: "Sore Hangat",
    icon: "☀️",
    bgHex: 0xeadaca,
    sunHex: 0xffe4bc,
    sunIntensity: 0.85,
    hemiIntensity: 0.68,
    pointIntensity: 0.48,
    skyHex: 0xaedcff,
    beamHex: 0xffe9b5,
    beamOpacity: 0.08,
  },
  sunset: {
    label: "Senja Keemasan",
    icon: "🌇",
    bgHex: 0xdca788,
    sunHex: 0xff9b54,
    sunIntensity: 0.95,
    hemiIntensity: 0.58,
    pointIntensity: 0.72,
    skyHex: 0xffad75,
    beamHex: 0xffb870,
    beamOpacity: 0.11,
  },
  night: {
    label: "Malam Nyaman",
    icon: "🌙",
    bgHex: 0x232136,
    sunHex: 0x7c98ff,
    sunIntensity: 0.35,
    hemiIntensity: 0.38,
    pointIntensity: 0.95,
    skyHex: 0x25335c,
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

  ctx.fillStyle = "#c58e5e";
  ctx.fillRect(0, 0, 1024, 1024);
  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, 1024, 1024);

  const planks = 10;
  const plankH = 1024 / planks;
  const tones = ["#c89161", "#bc8352", "#cfa070", "#b57b4a", "#c38c5c"];

  for (let i = 0; i < planks; i++) {
    const y = i * plankH;
    const grad = ctx.createLinearGradient(0, y, 0, y + plankH);
    const baseColor = tones[i % tones.length];
    grad.addColorStop(0, baseColor);
    grad.addColorStop(0.5, "#d19e70");
    grad.addColorStop(1, baseColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, 1024, plankH);

    ctx.strokeStyle = "rgba(98, 52, 18, 0.18)";
    bCtx.strokeStyle = "#686868";
    for (let g = 0; g < 16; g++) {
      ctx.lineWidth = 1 + (g % 3);
      bCtx.lineWidth = 1.5;
      const gy = y + (g / 16) * plankH;
      ctx.beginPath();
      bCtx.beginPath();
      ctx.moveTo(0, gy);
      bCtx.moveTo(0, gy);
      ctx.bezierCurveTo(340, gy + Math.sin(i + g) * 8, 680, gy - Math.cos(i + g) * 8, 1024, gy);
      bCtx.bezierCurveTo(340, gy + Math.sin(i + g) * 8, 680, gy - Math.cos(i + g) * 8, 1024, gy);
      ctx.stroke();
      bCtx.stroke();
    }

    ctx.strokeStyle = "#7c4820";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();

    bCtx.strokeStyle = "#202020";
    bCtx.lineWidth = 6;
    ctx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(1024, y);
    bCtx.stroke();

    const jointX = ((i * 293) % 720) + 140;
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
  map.repeat.set(2.5, 2.5);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2.5, 2.5);

  return { map, bumpMap };
}

export function createWallWallpaperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#f5ebe1");
  grad.addColorStop(0.66, "#ead9c7");
  grad.addColorStop(0.68, "#c89d7c");
  grad.addColorStop(0.71, "#e6d5c3");
  grad.addColorStop(1, "#d8c2ab");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
  for (let x = 0; x < 512; x += 32) {
    ctx.fillRect(x, 0, 12, 340);
  }

  ctx.strokeStyle = "rgba(138, 98, 64, 0.42)";
  ctx.lineWidth = 4;
  for (let x = 16; x < 512; x += 64) {
    ctx.strokeRect(x, 376, 44, 118);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(2, 1);
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

  ctx.fillStyle = "#e8a5b8";
  ctx.fillRect(0, 0, 512, 512);

  const ringColors = ["#f7dde5", "#e895ad", "#dc7996", "#f2c5d3", "#d46b89", "#edb1c2"];
  for (let r = 248; r > 12; r -= 10) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = ringColors[Math.floor(r / 10) % ringColors.length];
    ctx.fill();

    ctx.strokeStyle = "rgba(130, 45, 70, 0.2)";
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
  ctx.fillStyle = "#c99658";
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) {
    ctx.fillStyle = y % 16 === 0 ? "#dfb074" : "#a87539";
    ctx.fillRect(0, y, 256, 5);
    ctx.strokeStyle = "rgba(90, 52, 15, 0.28)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y + 8);
    ctx.stroke();
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
  grad.addColorStop(0, "#e07a2a");
  grad.addColorStop(0.45, "#f29b4b");
  grad.addColorStop(0.85, "#f6ad62");
  grad.addColorStop(1, "#df8235");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = "rgba(255, 235, 205, 0.18)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 6, y + 12);
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
  grad.addColorStop(0, "rgba(62, 34, 14, 0.48)");
  grad.addColorStop(0.55, "rgba(62, 34, 14, 0.20)");
  grad.addColorStop(1, "rgba(62, 34, 14, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}
