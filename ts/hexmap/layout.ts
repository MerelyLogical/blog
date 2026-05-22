// Pixel layout for a flat-top hex grid. Pure math, no canvas — converts axial
// coordinates to screen positions and produces polygon corners for drawing.

import type { Axial } from './hexgrid';

export interface Layout {
    size: number;    // center-to-corner radius of a hex, in pixels
    originX: number; // pixel position of axial (0, 0)
    originY: number;
}

const SQRT3 = Math.sqrt(3);

// Axial → pixel center for a FLAT-TOP hex.
export function hexToPixel(cell: Axial, layout: Layout): { x: number; y: number } {
    const x = layout.size * (1.5 * cell.q);
    const y = layout.size * (SQRT3 * (cell.q / 2 + cell.r));
    return { x: x + layout.originX, y: y + layout.originY };
}

// The six polygon corners of a hex centered at (cx, cy). Flat-top → first
// corner points due east, matching DIRECTIONS index 0.
export function hexCorners(cx: number, cy: number, size: number): [number, number][] {
    const corners: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i; // 60° steps
        corners.push([cx + size * Math.cos(angle), cy + size * Math.sin(angle)]);
    }
    return corners;
}

// Canvas size + origin that snugly fit a `cols` × `rows` odd-q rectangle,
// with `pad` pixels of margin. The origin shifts so nothing clips at the edges.
export function fitRect(
    cols: number,
    rows: number,
    size: number,
    pad = 4,
): { width: number; height: number; layout: Layout } {
    // Flat-top: columns step 1.5*size apart; odd columns drop half a row.
    const width = size * (1.5 * (cols - 1) + 2) + pad * 2;
    const height = size * SQRT3 * (rows + 0.5) + pad * 2;
    return {
        width: Math.ceil(width),
        height: Math.ceil(height),
        layout: { size, originX: size + pad, originY: size * SQRT3 * 0.5 + pad },
    };
}
