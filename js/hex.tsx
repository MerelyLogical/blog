"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

// shortcuts for easier to read formulas

var PI = Math.PI,
    sin = Math.sin,
    cos = Math.cos;
var a = 2 * PI / 6; // 60°
var r = 50; // radius

// x, y is the centre of the hexagon
function drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
        ctx.lineTo(x + r * cos(a * i), y + r * sin(a * i));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// draws a grid of u * v hexgons (row * col)
// x, y is the center of the top-left hexagon
function drawGrid(
  ctx: CanvasRenderingContext2D,
  u: number,
  v: number,
  x = r + 5,
  y = r + 5,
) {
    for (var i = 0; i < v; i++) {
        for (var j = 0; j < u; j++) {
            drawHexagon(ctx, i * (r + r * cos(a)) + x, (((-1) ** (i + 1) + 1) / 2 + 2 * j) * r * sin(a) + y);
        }
    }
}

export function RefreshHex() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [heightCount, setHeightCount] = useState(5);
  const [widthCount, setWidthCount] = useState(7);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const draw = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      ctx.strokeStyle = "#DDDDDD";
      ctx.fillStyle = "#225544";
      ctx.lineWidth = 3;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid(ctx, heightCount, widthCount);
    };

    draw();
    window.addEventListener("resize", draw);
    return () => {
      window.removeEventListener("resize", draw);
    };
  }, [heightCount, widthCount]);

  const handleHeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    setHeightCount(Math.max(0, Math.min(99, Number(event.target.value) || 0)));
  };

  const handleWidthChange = (event: ChangeEvent<HTMLInputElement>) => {
    setWidthCount(Math.max(0, Math.min(99, Number(event.target.value) || 0)));
  };

  return (
    <div>
      <form>
        <input
          id="h"
          type="number"
          style={{ width: "5ch" }}
          min={0}
          max={99}
          value={heightCount}
          onChange={handleHeightChange}
        />
        {" × "}
        <input
          id="w"
          type="number"
          style={{ width: "5ch" }}
          min={0}
          max={99}
          value={widthCount}
          onChange={handleWidthChange}
        />
      </form>
      <br />
      <canvas
        id="grid"
        ref={canvasRef}
        height={500}
        width={500}
        style={{ width: "100%", height: "100%", margin: 0 }}
      />
    </div>
  );
}
