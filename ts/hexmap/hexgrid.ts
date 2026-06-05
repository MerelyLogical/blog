// Flat-top hexagonal grid core — axial coordinates (q, r).
//
// Deliberately dependency-free: no DOM, no React, no module-level state.
// Everything here is pure data + geometry so the same core can back a terrain
// sandbox today and (later) feed other simulations. Generation algorithms
// (noise, wave function collapse, …) live OUTSIDE this file and operate on the
// `data` attached to each cell.

export interface Axial {
    q: number;
    r: number;
}

// The six neighbor directions of a flat-top hex, indexed 0..5 going clockwise
// from due-east. Indexing matters: adjacency rules (e.g. WFC) are stated
// per-direction, and the opposite of direction `d` is always `(d + 3) % 6`.
// That symmetry is what makes "A allows B to its east" imply "B allows A to
// its west" for free.
export const DIRECTIONS: readonly Axial[] = [
    { q: +1, r: 0 },  // 0: E
    { q: +1, r: -1 }, // 1: NE
    { q: 0, r: -1 },  // 2: NW
    { q: -1, r: 0 },  // 3: W
    { q: -1, r: +1 }, // 4: SW
    { q: 0, r: +1 },  // 5: SE
] as const;

export const opposite = (dir: number): number => (dir + 3) % 6;

export interface Cell<T> extends Axial {
    data: T;
}

const keyOf = (q: number, r: number): string => `${q},${r}`;

export class HexGrid<T> {
    private readonly map = new Map<string, Cell<T>>();

    set(q: number, r: number, data: T): Cell<T> {
        const cell: Cell<T> = { q, r, data };
        this.map.set(keyOf(q, r), cell);
        return cell;
    }

    get(q: number, r: number): Cell<T> | undefined {
        return this.map.get(keyOf(q, r));
    }

    has(q: number, r: number): boolean {
        return this.map.has(keyOf(q, r));
    }

    get size(): number {
        return this.map.size;
    }

    cells(): IterableIterator<Cell<T>> {
        return this.map.values();
    }

    // Neighbor in a single direction (0..5), or undefined if off the grid.
    neighbor(cell: Axial, dir: number): Cell<T> | undefined {
        const d = DIRECTIONS[dir];
        return this.get(cell.q + d.q, cell.r + d.r);
    }

    // All six neighbors, indexed by direction; entries are undefined off-grid.
    neighbors(cell: Axial): (Cell<T> | undefined)[] {
        return DIRECTIONS.map((_, dir) => this.neighbor(cell, dir));
    }
}

// Axial hex distance (number of steps between two cells). Not needed for
// generation, but cheap to keep around for anything spatial later.
export function hexDistance(a: Axial, b: Axial): number {
    const dq = a.q - b.q;
    const dr = a.r - b.r;
    return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

// Build hexes over an inclusive range of "odd-q" offset columns/rows, stored by
// their axial coords. Passing a range that overshoots the visible canvas yields
// partial (clipped) hexes along the edges instead of a padded margin.
export function rectGridRange<T>(
    colMin: number,
    colMax: number,
    rowMin: number,
    rowMax: number,
    makeData: (q: number, r: number) => T,
): HexGrid<T> {
    const grid = new HexGrid<T>();
    for (let col = colMin; col <= colMax; col++) {
        for (let row = rowMin; row <= rowMax; row++) {
            const q = col;
            const r = row - (col - (col & 1)) / 2; // odd-q offset → axial
            grid.set(q, r, makeData(q, r));
        }
    }
    return grid;
}

// Convenience: a `cols` × `rows` rectangle anchored at offset (0, 0).
export function rectGrid<T>(
    cols: number,
    rows: number,
    makeData: (q: number, r: number) => T,
): HexGrid<T> {
    return rectGridRange(0, cols - 1, 0, rows - 1, makeData);
}
