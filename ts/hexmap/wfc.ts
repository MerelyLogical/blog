// Wave function collapse on a hex grid. Pure algorithm — no DOM, no rendering.
// Operates on any HexGrid whose cell data has a `biome` field, and stores its
// own per-cell option sets in a Map keyed by Cell identity so the grid type
// stays clean.

import { type Cell, type HexGrid } from './hexgrid';

export const BIOMES = ['water', 'sand', 'grass', 'forest', 'rock'] as const;
export type Biome = (typeof BIOMES)[number];

// Symmetric adjacency table. ALLOWED[a].has(b) iff biome `a` may sit next to
// biome `b`. Must be its own transpose — every "a allows b" needs a matching
// "b allows a", or constraint propagation produces nonsense.
export const ALLOWED: Record<Biome, ReadonlySet<Biome>> = {
    water: new Set(['water', 'sand', 'rock']),
    sand: new Set(['water', 'sand', 'grass', 'rock']),
    grass: new Set(['sand', 'grass', 'forest', 'rock']),
    forest: new Set(['grass', 'forest', 'rock']),
    rock: new Set(['water', 'sand', 'grass', 'forest', 'rock']),
};

// Per-biome bias for the random collapse pick. Higher → more likely to be
// chosen when a cell's options are equal in other respects. Rock is the
// universal connector (allowed next to every biome), so it gets picked
// whenever options narrow to a small set — halving its relative weight pushes
// back against that without changing the adjacency rules.
export const BIOME_WEIGHTS: Record<Biome, number> = {
    water: 2,
    sand: 2,
    grass: 4,
    forest: 2,
    rock: 1,
};

// Mulberry32: a tiny seedable PRNG. Lets a successful run be reproduced from
// its seed, and lets `generateTerrain` walk a sequence of seeds on retry.
function makeRng(seed: number): () => number {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export interface GenerateOptions<T> {
    initialSeed?: number;
    maxAttempts?: number;
    // Cells to force to a specific biome before the main loop starts.
    // WFC then propagates from each seed, so any rule that holds elsewhere
    // (water needs sand/rock to meet grass, etc.) shapes the interior fill.
    preseed?: ReadonlyMap<Cell<T>, Biome>;
}

// Run WFC on the grid, writing the chosen biome into each cell's `.data.biome`.
// Retries with a fresh seed if a contradiction makes a run unsalvageable. The
// returned seed is the one that succeeded (useful for reproducing a nice map).
export function generateTerrain<T extends { biome?: Biome }>(
    grid: HexGrid<T>,
    opts: GenerateOptions<T> = {},
): { ok: boolean; seed: number } {
    const initialSeed = opts.initialSeed ?? Math.floor(Math.random() * 0x7fffffff);
    const maxAttempts = opts.maxAttempts ?? 8;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const seed = (initialSeed + attempt) | 0;
        if (runOnce(grid, seed, opts.preseed)) return { ok: true, seed };
    }
    return { ok: false, seed: initialSeed };
}

function runOnce<T extends { biome?: Biome }>(
    grid: HexGrid<T>,
    seed: number,
    preseed: ReadonlyMap<Cell<T>, Biome> | undefined,
): boolean {
    const rand = makeRng(seed);

    // Each cell starts in superposition over every biome; biome is unset until
    // collapse forces it (directly or via propagation).
    const options = new Map<Cell<T>, Set<Biome>>();
    for (const cell of grid.cells()) {
        options.set(cell, new Set(BIOMES));
        cell.data.biome = undefined;
    }

    // Apply preseeds: force chosen biomes and propagate each constraint outward
    // so the rest of the grid starts from a partially-collapsed state. If any
    // seed contradicts another via propagation, this run fails (and retries
    // won't help since seeds are deterministic — caller should reconsider).
    if (preseed) {
        for (const [cell, biome] of preseed) {
            const cellOpts = options.get(cell);
            if (!cellOpts) continue; // seed cell isn't in this grid; ignore
            cellOpts.clear();
            cellOpts.add(biome);
            cell.data.biome = biome;
            if (!propagate(grid, options, cell)) return false;
        }
    }

    while (true) {
        const target = pickMinEntropy(options, rand);
        if (!target) return true; // every cell collapsed

        // Collapse: pick one biome from the cell's remaining options, biased by
        // BIOME_WEIGHTS so grass (etc.) can be pushed past the permissive tiles.
        const cellOpts = [...options.get(target)!];
        const chosen = pickWeighted(cellOpts, rand);
        options.set(target, new Set([chosen]));
        target.data.biome = chosen;

        if (!propagate(grid, options, target)) return false; // contradiction
    }
}

function pickWeighted(opts: Biome[], rand: () => number): Biome {
    let total = 0;
    for (const b of opts) total += BIOME_WEIGHTS[b];
    let r = rand() * total;
    for (const b of opts) {
        r -= BIOME_WEIGHTS[b];
        if (r <= 0) return b;
    }
    return opts[opts.length - 1]; // floating-point safety net
}

// Lowest-entropy heuristic: pick among cells with the smallest >1 option count,
// breaking ties randomly. Cells already at size 1 are skipped (collapsed).
function pickMinEntropy<T>(
    options: Map<Cell<T>, Set<Biome>>,
    rand: () => number,
): Cell<T> | undefined {
    let best: Cell<T>[] = [];
    let bestSize = Infinity;
    for (const [cell, opts] of options) {
        const n = opts.size;
        if (n <= 1) continue;
        if (n < bestSize) {
            bestSize = n;
            best = [cell];
        } else if (n === bestSize) {
            best.push(cell);
        }
    }
    if (best.length === 0) return undefined;
    return best[Math.floor(rand() * best.length)];
}

// Spread the constraint outwards: a neighbor option survives only if at least
// one of the current cell's options permits it. Whenever a neighbor's option
// set shrinks, re-queue it so the change ripples on. Returns false on
// contradiction (a neighbor's options drained to zero).
function propagate<T extends { biome?: Biome }>(
    grid: HexGrid<T>,
    options: Map<Cell<T>, Set<Biome>>,
    start: Cell<T>,
): boolean {
    const queue: Cell<T>[] = [start];
    while (queue.length > 0) {
        const cell = queue.shift()!;
        const allowedByCell = unionAllowed(options.get(cell)!);

        for (const neighbor of grid.neighbors(cell)) {
            if (!neighbor) continue;
            const nOpts = options.get(neighbor);
            if (!nOpts) continue;

            let changed = false;
            for (const opt of [...nOpts]) {
                if (!allowedByCell.has(opt)) {
                    nOpts.delete(opt);
                    changed = true;
                }
            }
            if (nOpts.size === 0) return false;
            if (changed) {
                if (nOpts.size === 1) neighbor.data.biome = [...nOpts][0];
                queue.push(neighbor);
            }
        }
    }
    return true;
}

// Union of biomes that may neighbor a cell whose options are `opts`.
function unionAllowed(opts: Set<Biome>): Set<Biome> {
    const u = new Set<Biome>();
    for (const o of opts) for (const a of ALLOWED[o]) u.add(a);
    return u;
}

// Post-pass: WFC's pairwise rules can't express count constraints, so we apply
// them here as an explicit pipeline of named passes running A → B → C. Each
// pass takes its own snapshot at the start, so it sees the state left by the
// previous pass — chains are possible if a future rule depends on an earlier
// one's output, but within a single pass the order of iteration doesn't matter.
export function cleanupTerrain<T extends { biome?: Biome }>(grid: HexGrid<T>): void {
    pruneIsolatedForest(grid); // Rule A
    demoteInlandSand(grid);    // Rule B
    floodEngulfedLand(grid);   // Rule C
}

function snapshot<T extends { biome?: Biome }>(grid: HexGrid<T>): Map<Cell<T>, Biome | undefined> {
    const m = new Map<Cell<T>, Biome | undefined>();
    for (const cell of grid.cells()) m.set(cell, cell.data.biome);
    return m;
}

// Rule A — forest with fewer than 2 grass neighbors → grass.
// "Lonely trees didn't take root."
function pruneIsolatedForest<T extends { biome?: Biome }>(grid: HexGrid<T>): void {
    const before = snapshot(grid);
    for (const cell of grid.cells()) {
        if (before.get(cell) !== 'forest') continue;
        let grassNeighbors = 0;
        for (const n of grid.neighbors(cell)) {
            if (n && before.get(n) === 'grass') grassNeighbors++;
        }
        if (grassNeighbors < 2) cell.data.biome = 'grass';
    }
}

// Rule B — sand with no water neighbor → grass.
// Pins sand to coastlines instead of letting it appear as inland deserts.
function demoteInlandSand<T extends { biome?: Biome }>(grid: HexGrid<T>): void {
    const before = snapshot(grid);
    for (const cell of grid.cells()) {
        if (before.get(cell) !== 'sand') continue;
        let hasWater = false;
        for (const n of grid.neighbors(cell)) {
            if (n && before.get(n) === 'water') {
                hasWater = true;
                break;
            }
        }
        if (!hasWater) cell.data.biome = 'grass';
    }
}

// Rule C — any non-water cell with ≥4 water neighbors → water.
// Smooths sharp peninsulas and closes off small coves into water bodies.
function floodEngulfedLand<T extends { biome?: Biome }>(grid: HexGrid<T>): void {
    const before = snapshot(grid);
    for (const cell of grid.cells()) {
        if (before.get(cell) === 'water') continue;
        let waterNeighbors = 0;
        for (const n of grid.neighbors(cell)) {
            if (n && before.get(n) === 'water') waterNeighbors++;
        }
        if (waterNeighbors >= 4) cell.data.biome = 'water';
    }
}
