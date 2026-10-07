'use client';

import { useEffect, useRef } from 'react';

import { Button } from '@/ts/ui/Button';

import { type Cell, type HexGrid, rectGridRange } from './hexgrid';
import { hexToPixel, type Layout } from './layout';
import { drawGrid } from './render';
import { type Biome, cleanupTerrain, generateTerrain } from './wfc';

// COLS sets the hex SIZE: size is derived so this many columns span the canvas
// width (left/right edges land on column centers). The height is snapped to a
// whole number of hex rows so the top/bottom edges land on hex centers too —
// making it near-square. Edge tiles are clipped by the canvas.
const COLS = 22;
const SQRT3 = Math.sqrt(3);

// Per-cell payload. WFC fills `biome` for every cell during generation; any
// cell still unset after generation falls back to EMPTY_COLOR (only happens if
// every retry hit a contradiction).
interface TerrainData {
    biome?: Biome;
}

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
    // Imperative regenerate handle: the effect publishes the current
    // "re-run WFC on the existing grid and redraw" function here, and the
    // button calls it. Keeps regeneration out of React's render path.
    const regenerateRef = useRef<() => void>(() => {});

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        let lastWidth = -1;
        let grid: HexGrid<TerrainData> | null = null;
        let layout: Layout | null = null;
        let canvasW = 0;
        let canvasH = 0;

        const draw = () => {
            if (!grid || !layout) return;
            drawGrid(ctx, grid, layout, {
                fillOf: (cell) => (cell.data.biome ? BIOME_COLORS[cell.data.biome] : EMPTY_COLOR),
                stroke: '#1a1a1a',
            });
        };

        // Flip a coin per edge, seed each "heads" edge with water, run WFC, clean
        // up, redraw. Used by both Regenerate clicks and resize-rebuilds.
        const runGeneration = () => {
            if (!grid || !layout) return;
            const preseed = buildEdgeSeeds(grid, layout, canvasW, canvasH);
            generateTerrain(grid, { preseed });
            cleanupTerrain(grid);
            draw();
        };
        regenerateRef.current = runGeneration;

        // Full path: size the canvas, build a fresh grid, generate, draw.
        // Called on mount and whenever the container width changes.
        const rebuild = () => {
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
            layout = { size, originX: 0, originY: 0 };
            canvasW = width;
            canvasH = height;
            grid = rectGridRange<TerrainData>(
                -1, COLS + 1,
                -1, rows + 1,
                () => ({}),
            );

            runGeneration();
        };

        rebuild();
        const observer = new ResizeObserver(rebuild);
        observer.observe(parent);
        return () => observer.disconnect();
    }, []);

    return (
        <div>
            <div style={{ marginBottom: '0.75rem' }}>
                <Button onClick={() => regenerateRef.current()}>Regenerate</Button>
            </div>
            <canvas
                ref={canvasRef}
                style={{ display: 'block', margin: 0 }}
            />
        </div>
    );
}

// Pick which canvas edges become ocean (independent coin flip per edge), then
// collect every cell whose center sits within one hex-step of a selected edge.
// "Within one step" catches both the visible edge cells (even-column row 0 at
// y=0, odd-column row 0 at y=½·rowStep, etc.) and the overdraw ring just past
// the canvas — seeding the overdraw too keeps the boundary unambiguous for
// WFC propagation. Returns an empty map when all four coins came up tails.
function buildEdgeSeeds(
    grid: HexGrid<TerrainData>,
    layout: Layout,
    canvasW: number,
    canvasH: number,
): Map<Cell<TerrainData>, Biome> {
    const seeds = new Map<Cell<TerrainData>, Biome>();
    const wet = {
        top: Math.random() < 0.5,
        bottom: Math.random() < 0.5,
        left: Math.random() < 0.5,
        right: Math.random() < 0.5,
    };
    if (!wet.top && !wet.bottom && !wet.left && !wet.right) return seeds;

    const rowStep = SQRT3 * layout.size;
    const colStep = 1.5 * layout.size;
    // 0.6 of a step: < 1 so we don't catch the second row in, > 0.5 so odd
    // columns' row 0 (at ½·rowStep) is included.
    const vBand = 0.6 * rowStep;
    const hBand = 0.6 * colStep;

    for (const cell of grid.cells()) {
        const { x, y } = hexToPixel(cell, layout);
        if (
            (wet.top && y < vBand) ||
            (wet.bottom && y > canvasH - vBand) ||
            (wet.left && x < hBand) ||
            (wet.right && x > canvasW - hBand)
        ) {
            seeds.set(cell, 'water');
        }
    }
    return seeds;
}
