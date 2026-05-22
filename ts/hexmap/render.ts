// Canvas render harness for a hex grid. The only file here that touches a
// drawing context. Generation code never calls this directly — it just mutates
// cell data and asks for a redraw via `drawGrid`.

import type { Cell, HexGrid } from './hexgrid';
import { hexCorners, hexToPixel, type Layout } from './layout';

export interface DrawOptions<T> {
    // Fill color for a cell — this is the seam where terrain/biome coloring
    // plugs in. Return any CSS color string.
    fillOf: (cell: Cell<T>) => string;
    stroke?: string;     // outline color; omit/empty for no outline
    lineWidth?: number;
    background?: string; // cleared-canvas color
}

export function drawGrid<T>(
    ctx: CanvasRenderingContext2D,
    grid: HexGrid<T>,
    layout: Layout,
    opts: DrawOptions<T>,
): void {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    if (opts.background) {
        ctx.fillStyle = opts.background;
        ctx.fillRect(0, 0, width, height);
    }

    ctx.lineWidth = opts.lineWidth ?? 1;

    for (const cell of grid.cells()) {
        const { x, y } = hexToPixel(cell, layout);
        const corners = hexCorners(x, y, layout.size);

        ctx.beginPath();
        ctx.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 6; i++) ctx.lineTo(corners[i][0], corners[i][1]);
        ctx.closePath();

        ctx.fillStyle = opts.fillOf(cell);
        ctx.fill();
        if (opts.stroke) {
            ctx.strokeStyle = opts.stroke;
            ctx.stroke();
        }
    }
}

// Map a pixel (e.g. a mouse position) back to the nearest cell, or undefined if
// the click landed outside every hex. Brute-force nearest-center — fine for the
// grid sizes a sandbox uses, and avoids cube-rounding subtleties for now.
export function pixelToCell<T>(
    px: number,
    py: number,
    grid: HexGrid<T>,
    layout: Layout,
): Cell<T> | undefined {
    let best: Cell<T> | undefined;
    let bestDist = layout.size * layout.size; // must be within one hex radius
    for (const cell of grid.cells()) {
        const { x, y } = hexToPixel(cell, layout);
        const d = (x - px) ** 2 + (y - py) ** 2;
        if (d < bestDist) {
            bestDist = d;
            best = cell;
        }
    }
    return best;
}
