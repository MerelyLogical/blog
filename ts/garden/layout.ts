import { PLANTS } from './data';
import type { Plant } from './data';

export type Level = 'clade' | 'ord' | 'fam' | 'gen' | 'plant';

export type Node = {
    id: string;
    lines: string[];
    level: Level;
    wiki?: string;
    depth: number;
    up: boolean;
    w: number;
    h: number;
    x: number;
    y: number;
    kids: Node[];
};

const RANKS = [
    { key: 'cl1', level: 'clade' },
    { key: 'cl2', level: 'clade' },
    { key: 'cl3', level: 'clade' },
    { key: 'cl4', level: 'clade' },
    { key: 'cl5', level: 'clade' },
    { key: 'ord', level: 'ord'   },
    { key: 'fam', level: 'fam'   },
    { key: 'gen', level: 'gen'   },
] as const;

const SIZES: Record<Level, { w: number; h: number }> = {
    clade: { w: 104, h: 32 },
    ord:   { w:  92, h: 32 },
    fam:   { w: 112, h: 32 },
    gen:   { w:  92, h: 32 },
    plant: { w: 128, h: 44 },
};

// Boxes link to the Wikipedia page of their name, or their species for plants.
// These are the exceptions, with null for names that have no page.
const WIKI: Record<string, string | null> = {
    'Erica':         'Erica (plant)',
    'Brassica rapa': 'Pak choi',
};

// These branches grow upwards from the root. The rest grow down.
const UP = new Set(['Monocots', 'Rosids']);

// Clades have no formal rank, so they float. Only real ranks get a row.
const ROWS: Partial<Record<Level, { up: number; down: number }>> = {
    ord:   { up: -174, down: 232 },
    fam:   { up: -232, down: 290 },
    gen:   { up: -290, down: 348 },
    plant: { up: -352, down: 410 },
};

const STEPS = 1500;
const LINK_LEN = 58;
const MIN_GAP = 12;
const PUSH = 7000;
const PULL = 0.12;
const GRAVITY = 0.006;
const LAYER = 0.25;
const MIN_STEP = 48;
const X_STEP = 60;
const SPREAD = 136;
const CLADE_STEP = 58;
const DAMP = 0.6;
const PAD = 4;

function bySpecies(a: Plant, b: Plant) {
    return a.sp.localeCompare(b.sp) || a.name.localeCompare(b.name);
}

function wikiUrl(name: string) {
    const page = name in WIKI ? WIKI[name] : name;
    return page ? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.replaceAll(' ', '_'))}` : undefined;
}

function node(id: string, lines: string[], level: Level, depth: number, kids: Node[]): Node {
    const wiki = wikiUrl(level === 'plant' ? lines[1] : lines[0]);
    return { id, lines, level, wiki, depth, up: false, ...SIZES[level], x: 0, y: 0, kids };
}

// Plants without a value at a rank skip it, so their box attaches directly to
// the rank above, as Ericales does with no lower clades.
function build(plants: Plant[], depth: number): Node[] {
    if (depth === RANKS.length) {
        return [...plants].sort(bySpecies).map(p => node(p.name, [p.name, p.sp], 'plant', depth, []));
    }
    const { key, level } = RANKS[depth];
    const groups = new Map<string | undefined, Plant[]>();
    for (const p of plants) {
        groups.set(p[key], [...(groups.get(p[key]) ?? []), p]);
    }
    return [...groups]
        .flatMap(([label, members]) => {
            const kids = build(members, depth + 1);
            return label ? [node(`${key}-${label}`, [label], level, depth, kids)] : kids;
        })
        .sort((a, b) => a.id.localeCompare(b.id));
}

function flat(n: Node): Node[] {
    return [n, ...n.kids.flatMap(flat)];
}

function height(n: Node): number {
    return n.kids.length ? 1 + Math.max(...n.kids.map(height)) : 0;
}

// Shorter branches go first, nearest the root, so arrows heading to the longer
// branches further right don't have to cut across them.
function arrange(n: Node) {
    n.kids.forEach(arrange);
    n.kids.sort((a, b) => height(a) - height(b) || a.id.localeCompare(b.id));
}

function assign(n: Node, up: boolean) {
    n.up = up || n.lines.some(l => UP.has(l));
    for (const k of n.kids) assign(k, n.up);
}

function rowY(n: Node) {
    const row = ROWS[n.level];
    return row && (n.up ? row.up : row.down);
}

// Start the plants above and below the root in their own centred rows, with each
// parent over its children, so the same plants always settle into the same
// picture and branches don't have to untangle themselves.
function seed(root: Node, nodes: Node[]) {
    const leaves = nodes.filter(n => !n.kids.length);
    for (const up of [true, false]) {
        const row = leaves.filter(n => n.up === up);
        row.forEach((n, i) => {
            n.x = (i - (row.length - 1) / 2) * SPREAD;
        });
    }
    const centre = (n: Node) => {
        if (!n.kids.length) return;
        n.kids.forEach(centre);
        n.x = n.kids.reduce((sum, k) => sum + k.x, 0) / n.kids.length;
    };
    centre(root);
    for (const n of nodes) {
        n.y = rowY(n) ?? (n.up ? -1 : 1) * n.depth * CLADE_STEP;
    }
}

// Pushes overlapping boxes apart along whichever axis needs the smaller move,
// though boxes on the same row always move sideways so they can't stack.
function separate(nodes: Node[]) {
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const ox = (a.w + b.w) / 2 + MIN_GAP - Math.abs(dx);
            const oy = (a.h + b.h) / 2 + MIN_GAP - Math.abs(dy);
            if (ox <= 0 || oy <= 0) continue;
            const sameRow = a.level === b.level && a.level !== 'clade' && a.up === b.up;
            if (ox < oy || sameRow) {
                const s = (dx < 0 ? -ox : ox) / 2;
                a.x -= s;
                b.x += s;
            } else {
                const s = (dy < 0 ? -oy : oy) / 2;
                a.y -= s;
                b.y += s;
            }
        }
    }
}

// A box with branches going both ways, like Eudicots, sits level with the root.
function splits(n: Node) {
    return n.kids.some(k => k.up !== n.up);
}

// Keeps each child further from the root than its parent, so a branch never doubles
// back, and each clade to the right of its parent, so the graph flows away from
// the root at the left edge.
function order(root: Node, nodes: Node[]) {
    for (const a of nodes) {
        for (const k of a.kids) {
            if (k.level === 'clade') {
                const behind = a.x + X_STEP - k.x;
                if (behind > 0) {
                    a.x -= behind / 2;
                    k.x += behind / 2;
                }
            }
            if (splits(k)) continue;
            const over = k.up ? k.y - (a.y - MIN_STEP) : a.y + MIN_STEP - k.y;
            if (over <= 0) continue;
            const s = (k.up ? -over : over) / 2;
            k.y += s;
            a.y -= s;
        }
    }
    const edge = root.x - root.w / 2;
    for (const n of nodes) n.x = Math.max(n.x, edge + n.w / 2);
}

// Boxes push each other apart, links pull parents and children together, and
// each ranked box drifts towards its row. The push fades over time so the layout
// comes to rest, with the root held at the left edge.
function settle(root: Node, nodes: Node[], left: number) {
    const vel = new Map(nodes.map(n => [n, { x: 0, y: 0 }]));
    const shove = (n: Node, x: number, y: number) => {
        const v = vel.get(n)!;
        v.x += x;
        v.y += y;
    };
    for (let step = 0; step < STEPS; step++) {
        const fade = 1 - step / STEPS;
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].x - nodes[i].x;
                const dy = nodes[j].y - nodes[i].y;
                const d = Math.hypot(dx, dy) || 1;
                const f = PUSH * fade / (d * d);
                shove(nodes[i], -dx / d * f, -dy / d * f);
                shove(nodes[j], dx / d * f, dy / d * f);
            }
        }
        for (const a of nodes) {
            for (const b of a.kids) {
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const d = Math.hypot(dx, dy) || 1;
                const f = (d - LINK_LEN) * PULL;
                shove(a, dx / d * f, dy / d * f);
                shove(b, -dx / d * f, -dy / d * f);
            }
        }
        for (const n of nodes) {
            const v = vel.get(n)!;
            const row = rowY(n);
            v.x -= n.x * GRAVITY;
            if (row !== undefined) v.y += (row - n.y) * LAYER;
            if (splits(n)) v.y -= n.y * LAYER;
            n.x += v.x * 0.5;
            n.y += v.y * 0.5;
            v.x *= DAMP;
            v.y *= DAMP;
        }
        separate(nodes);
        root.x = left;
        root.y = 0;
        order(root, nodes);
        root.x = left;
        root.y = 0;
    }
    for (let i = 0; i < 50; i++) separate(nodes);
}

function layout() {
    const root = build(PLANTS, 0)[0];
    arrange(root);
    const nodes = flat(root);
    assign(root, false);
    seed(root, nodes);
    const left = Math.min(...nodes.filter(n => !n.kids.length).map(n => n.x)) - SPREAD;
    settle(root, nodes, left);
    // Whole pixels, so the server and browser agree despite small differences
    // in how each engine rounds its maths.
    for (const n of nodes) {
        n.x = Math.round(n.x);
        n.y = Math.round(n.y);
    }
    const x0 = Math.min(...nodes.map(n => n.x - n.w / 2)) - PAD;
    const y0 = Math.min(...nodes.map(n => n.y - n.h / 2)) - PAD;
    const x1 = Math.max(...nodes.map(n => n.x + n.w / 2)) + PAD;
    const y1 = Math.max(...nodes.map(n => n.y + n.h / 2)) + PAD;
    return { root, nodes, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export const LAYOUT = layout();
