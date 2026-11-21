"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { ChallengeRound } from "../../lib/challenge/rounds";

type GuessMark = {
  x: number;
  y: number;
  hit: boolean;
};

interface SarCanvasProps {
  round: ChallengeRound;
  disabled: boolean;
  onGuess: (hit: boolean, distance: number) => void;
}

const WIDTH = 640;
const HEIGHT = 400;

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function drawSmudge(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  random: () => number,
) {
  context.save();
  context.translate(x, y);
  context.rotate((random() - 0.5) * 0.8);
  context.filter = "blur(10px)";
  context.fillStyle = "rgba(190, 202, 210, 0.12)";
  context.beginPath();
  context.moveTo(-38, 3);
  context.bezierCurveTo(-35, -20, -12, -24, 1, -12);
  context.bezierCurveTo(15, -27, 35, -13, 31, 1);
  context.bezierCurveTo(45, 13, 22, 26, 5, 18);
  context.bezierCurveTo(-13, 28, -37, 19, -38, 3);
  context.fill();
  context.filter = "none";
  context.fillStyle = "rgba(174, 190, 201, 0.08)";
  for (let index = 0; index < 9; index += 1) {
    const offsetX = (random() - 0.5) * 48;
    const offsetY = (random() - 0.5) * 26;
    context.beginPath();
    context.ellipse(offsetX, offsetY, 3 + random() * 8, 2 + random() * 5, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawVessel(context: CanvasRenderingContext2D, x: number, y: number) {
  context.save();
  context.lineCap = "round";
  context.shadowColor = "#d7fbff";
  context.shadowBlur = 18;
  context.strokeStyle = "rgba(160, 245, 255, 0.72)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(x - 2, y + 3);
  context.lineTo(x - 18, y + 24);
  context.moveTo(x + 2, y + 3);
  context.lineTo(x + 18, y + 24);
  context.stroke();

  context.strokeStyle = "rgba(211, 251, 255, 0.48)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x - 5, y + 10);
  context.lineTo(x - 27, y + 30);
  context.moveTo(x + 5, y + 10);
  context.lineTo(x + 27, y + 30);
  context.stroke();

  context.shadowColor = "#ffffff";
  context.shadowBlur = 22;
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(x, y, 3, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  context.strokeStyle = "rgba(240, 255, 255, 0.9)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x - 9, y);
  context.lineTo(x + 9, y);
  context.moveTo(x, y - 9);
  context.lineTo(x, y + 9);
  context.stroke();
  context.restore();
}

function drawOilSlick(context: CanvasRenderingContext2D, x: number, y: number) {
  context.save();
  context.translate(x, y);
  context.rotate(-0.28);

  context.filter = "blur(8px)";
  context.fillStyle = "rgba(8, 12, 20, 0.78)";
  context.beginPath();
  context.ellipse(0, 0, 48, 15, 0, 0, Math.PI * 2);
  context.fill();

  context.filter = "none";
  context.fillStyle = "rgba(8, 12, 20, 0.92)";
  context.beginPath();
  context.moveTo(-41, 1);
  context.bezierCurveTo(-35, -12, -16, -17, -1, -12);
  context.bezierCurveTo(14, -18, 37, -10, 42, -2);
  context.bezierCurveTo(35, 11, 17, 14, 2, 11);
  context.bezierCurveTo(-15, 17, -34, 11, -41, 1);
  context.fill();

  context.strokeStyle = "rgba(99, 143, 160, 0.22)";
  context.lineWidth = 1;
  context.beginPath();
  context.ellipse(0, 0, 44, 13, 0, Math.PI * 1.04, Math.PI * 1.92);
  context.stroke();
  context.restore();
}

function drawHud(context: CanvasRenderingContext2D, sensor: string) {
  context.save();
  context.strokeStyle = "rgba(134, 215, 226, 0.2)";
  context.lineWidth = 1;
  context.setLineDash([]);
  const inset = 18;
  const corner = 15;
  const corners = [
    [inset, inset, 1, 1],
    [WIDTH - inset, inset, -1, 1],
    [inset, HEIGHT - inset, 1, -1],
    [WIDTH - inset, HEIGHT - inset, -1, -1],
  ];
  for (const [x, y, horizontal, vertical] of corners) {
    context.beginPath();
    context.moveTo(x, y + vertical * corner);
    context.lineTo(x, y);
    context.lineTo(x + horizontal * corner, y);
    context.stroke();
  }

  context.fillStyle = "rgba(205, 230, 236, 0.72)";
  context.font = "600 9px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillText(`${sensor.toUpperCase()} / SAR SLICE`, 28, 33);
  context.fillStyle = "rgba(155, 191, 200, 0.55)";
  context.font = "8px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillText("INDIAN EEZ · SIMULATED X-BAND VIEW", 28, HEIGHT - 28);

  const scaleX = WIDTH - 112;
  const scaleY = HEIGHT - 30;
  context.strokeStyle = "rgba(206, 239, 242, 0.8)";
  context.beginPath();
  context.moveTo(scaleX, scaleY);
  context.lineTo(scaleX + 74, scaleY);
  context.moveTo(scaleX, scaleY - 4);
  context.lineTo(scaleX, scaleY + 4);
  context.moveTo(scaleX + 74, scaleY - 4);
  context.lineTo(scaleX + 74, scaleY + 4);
  context.stroke();
  context.fillStyle = "rgba(206, 239, 242, 0.72)";
  context.font = "8px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.textAlign = "center";
  context.fillText("10 NM", scaleX + 37, scaleY - 7);
  context.textAlign = "start";
  context.restore();
}

function drawScene(
  canvas: HTMLCanvasElement,
  round: ChallengeRound,
  mark: GuessMark | null,
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const random = seededRandom(hashSeed(round.id));
  context.clearRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = "#111822";
  context.fillRect(0, 0, WIDTH, HEIGHT);

  const image = context.createImageData(WIDTH, HEIGHT);
  for (let offset = 0; offset < image.data.length; offset += 4) {
    const value = 35 + Math.floor(random() * 61);
    image.data[offset] = value;
    image.data[offset + 1] = value;
    image.data[offset + 2] = value;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);

  const targetX = (round.target.x / 100) * WIDTH;
  const targetY = (round.target.y / 100) * HEIGHT;
  const decoys = [
    [0.17, 0.2],
    [0.84, 0.19],
    [0.86, 0.83],
    [0.15, 0.8],
    [0.48, 0.87],
    [0.92, 0.48],
    [0.4, 0.12],
    [0.08, 0.52],
  ].filter(([x, y]) => {
    const distance = Math.hypot(x * 100 - round.target.x, y * 100 - round.target.y);
    return distance > round.target.radius + 17;
  });
  for (const [x, y] of decoys.slice(0, 2)) {
    drawSmudge(context, x * WIDTH, y * HEIGHT, random);
  }

  const wash = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  wash.addColorStop(0, "rgba(26, 46, 57, 0.13)");
  wash.addColorStop(0.55, "rgba(5, 13, 20, 0)");
  wash.addColorStop(1, "rgba(13, 43, 48, 0.16)");
  context.fillStyle = wash;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  if (round.targetType === "GHOST_VESSEL") {
    drawVessel(context, targetX, targetY);
  } else {
    drawOilSlick(context, targetX, targetY);
  }

  if (mark) {
    context.save();
    const rx = (round.target.radius / 100) * WIDTH;
    const ry = (round.target.radius / 100) * HEIGHT;
    context.lineWidth = 2;
    if (mark.hit) {
      context.shadowColor = "#4df2b1";
      context.shadowBlur = 18;
      context.strokeStyle = "#58f0b6";
      context.beginPath();
      context.ellipse(targetX, targetY, rx, ry, 0, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([3, 4]);
      context.lineWidth = 1;
      context.beginPath();
      context.ellipse(targetX, targetY, rx + 8, ry + 6, 0, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
      context.shadowBlur = 0;
      context.fillStyle = "#82ffd0";
      context.font = "700 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.fillText("HIT · TARGET LOCK", 28, 55);
    } else {
      context.setLineDash([6, 5]);
      context.strokeStyle = "#ffc15e";
      context.beginPath();
      context.ellipse(targetX, targetY, rx, ry, 0, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);

      context.shadowColor = "#ff566a";
      context.shadowBlur = 11;
      context.strokeStyle = "#ff5b70";
      context.lineWidth = 2.5;
      context.beginPath();
      context.moveTo(mark.x - 7, mark.y - 7);
      context.lineTo(mark.x + 7, mark.y + 7);
      context.moveTo(mark.x + 7, mark.y - 7);
      context.lineTo(mark.x - 7, mark.y + 7);
      context.stroke();
      context.shadowBlur = 0;
      context.fillStyle = "#ff8290";
      context.font = "700 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.fillText("MISS · REVEAL", 28, 55);
    }
    context.restore();
  }

  drawHud(context, round.sensor);
}

export default function SarCanvas({ round, disabled, onGuess }: SarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mark, setMark] = useState<GuessMark | null>(null);

  useEffect(() => {
    setMark(null);
  }, [round.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawScene(canvas, round, mark);
  }, [round, mark]);

  function handleClick(event: MouseEvent<HTMLCanvasElement>) {
    if (disabled || mark) return;
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const clickX = ((event.clientX - rect.left) / rect.width) * 100;
    const clickY = ((event.clientY - rect.top) / rect.height) * 100;
    const distance = Math.hypot(clickX - round.target.x, clickY - round.target.y);
    const hit = distance <= round.target.radius;
    setMark({
      x: (clickX / 100) * WIDTH,
      y: (clickY / 100) * HEIGHT,
      hit,
    });
    onGuess(hit, distance);
  }

  return (
    <div className="sar-canvas-frame" aria-label="Synthetic aperture radar challenge image">
      <div className="sar-frame-glow" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onClick={handleClick}
        role="img"
        aria-label={`Synthetic aperture radar image for ${round.title}. Click to mark the suspected target.`}
        aria-disabled={disabled}
      />
      <style>{`
        .sar-canvas-frame {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(91, 225, 238, .55);
          border-radius: 15px;
          background: #08121b;
          box-shadow: 0 0 0 1px rgba(79, 197, 216, .08), 0 0 38px rgba(31, 202, 225, .11), inset 0 0 22px rgba(18, 131, 157, .08);
        }
        .sar-canvas-frame canvas {
          display: block;
          width: 100%;
          height: auto;
          aspect-ratio: 8 / 5;
          cursor: crosshair;
        }
        .sar-frame-glow {
          position: absolute;
          z-index: 1;
          inset: 0;
          pointer-events: none;
          box-shadow: inset 0 0 24px rgba(70, 213, 227, .06);
        }
      `}</style>
    </div>
  );
}
