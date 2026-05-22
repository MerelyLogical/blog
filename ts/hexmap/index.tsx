'use client';

import { useEffect, useRef } from 'react';

import { type HexGrid, rectGridRange } from './hexgrid';
import { drawGrid } from './render';

// COLS sets the hex SIZE: size is derived so this many columns span the canvas
// width (left/right edges land on column centers). The height is snapped to a
// whole number of hex rows so the top/bottom edges land on hex centers too —
// making it near-square. Edge tiles are clipped by the canvas.
const COLS = 22;
const SQRT3 = Math.sqrt(3);

// Whatever your generator chooses to attach to each hex. Start empty and fill
// it in from your noise / wave-function-collapse pass.
interface TerrainData {
    biome?: Biome;
}

type Biome = 'water' | 'sand' | 'grass' | 'forest' | 'rock';

const BIOME_COLORS: Record<Biome, string> = {
    water: '#3a6ea5',
    sand: '#d8c98f',
    grass: '#6a9a4f',
    forest: '#3f6b3a',
    rock: '#8a8a8a',
};
const EMPTY_COLOR = '#2a2a2a';

export default function HexMapCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        let lastWidth = -1;

        const render = () => {
            const width = parent.clientWidth;
            if (width === lastWidth) return; // height-only changes can't loop us
            lastWidth = width;

            // Tiling periods: columns step 1.5*size apart, rows √3*size apart.
            // Size is derived so COLS full columns span the width — width is an
            // exact multiple of the column step, so the left/right edges fall on
            // column centers. Snap the height to a whole number of rows so the
            // top/bottom edges fall on hex centers too; otherwise height/rowStep
            // (≈19.05 here) leaves a partial sliver row at the bottom.
            const size = width / (1.5 * COLS);
            const rowStep = SQRT3 * size;
            const rows = Math.max(1, Math.round(width / rowStep));
            const height = rows * rowStep;

            // Render at device-pixel resolution so hexes stay crisp on HiDPI/
            // retina screens, then scale the context back to logical pixels so
            // all the layout math keeps working in plain pixels. setTransform
            // (not scale) resets first, so repeated renders don't compound.
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // Origin at (0,0) and an extra ring of hexes past every edge, so the
            // canvas clips partial tiles instead of showing a margin.
            const layout = { size, originX: 0, originY: 0 };
            const grid = rectGridRange<TerrainData>(
                -1, COLS + 1,
                -1, rows + 1,
                () => ({}),
            );

            // ── GENERATION HOOK ────────────────────────────────────────────
            // Replace this placeholder with your real generator. It only needs
            // the grid (cells, neighbors, directions) and to set cell.data.biome.
            placeholderGenerate(grid);
            // ───────────────────────────────────────────────────────────────

            drawGrid(ctx, grid, layout, {
                fillOf: (cell) => (cell.data.biome ? BIOME_COLORS[cell.data.biome] : EMPTY_COLOR),
                stroke: '#1a1a1a',
            });
        };

        render();
        const observer = new ResizeObserver(render);
        observer.observe(parent);
        return () => observer.disconnect();
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{ display: 'block', margin: 0 }}
        />
    );
}

// Throwaway stand-in so the grid renders something terrain-shaped on first
// load. A few summed sinusoids fake an elevation field, then thresholds split
// it into biomes. Delete this once your real generator exists.
function placeholderGenerate(grid: HexGrid<TerrainData>): void {
    for (const cell of grid.cells()) {
        const e =
            (Math.sin(cell.q * 0.45) +
                Math.cos(cell.r * 0.5) +
                Math.sin((cell.q + cell.r) * 0.3)) /
            3; // ~[-1, 1]
        const n = (e + 1) / 2; // [0, 1]
        cell.data.biome =
            n < 0.35 ? 'water' : n < 0.45 ? 'sand' : n < 0.7 ? 'grass' : n < 0.85 ? 'forest' : 'rock';
    }
}
