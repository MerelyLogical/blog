import { NAMES, PLANTS } from './data';
import type { Plant } from './data';

export type Level = 'clade' | 'ord' | 'fam' | 'gen' | 'plant';
type Dir = 'up' | 'down' | 'right';

export type Node = {
    id: string;
    lines: string[];
    level: Level;
    wiki?: string;
    ja?: string;
    zh?: string;
    kana?: string;
    jaWiki?: string;
    zhWiki?: string;
    rank: number;
    dir: Dir;
    w: number;
    h: number;
    x: number;
    y: number;
    kids: Node[];
};

// Tooltips sit to the left of the box, level with its last name line.
export function tip(n: Node) {
    const w = Array.from(n.kana ?? '').length * 12 + 16;
    const lines = n.lines.length + Number(!!n.zh) + Number(!!n.ja);
    return { x: n.x - n.w / 2 - 8 - w, y: n.y + (lines - 1) * LINE / 2, w };
}

const RANKS = [
    { key: 'cl1', level: 'clade' },
    { key: 'cl2', level: 'clade' },
    { key: 'cl3', level: 'clade' },
    { key: 'cl4', level: 'clade' },
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
    'Allium cepa':   'Scallion',
};

// Plants sit around the top, right and bottom edges, clockwise from the top left
// corner: branches listed here go along the top, then down the right, and the
// rest come back along the bottom.
const DIRS: Record<string, Dir> = {
    Monocots: 'up',
    Rosids:   'right',
};

export const LINE = 18;

// The plants line a frame with the root at the middle of its left edge. Its
// edge is ROOM times as long as the plants need side by side, and it is SHAPE
// times as tall as it is wide.
const ROOM = 1.8;
const SHAPE = 1;
// Neighbouring plants sit closer the more ranks they share. Their gap grows with
// the ranks they don't share raised to this power, so siblings huddle, cousins
// sit a little apart, and distant branches get the most room.
const KIN = 2;
const TRIES = 20;
const STEPS = 100;
const ROUNDS = 100;
const MIN_GAP = 12;
const PAD = 48;

function bySpecies(a: Plant, b: Plant) {
    return a.sp.localeCompare(b.sp) || a.name.localeCompare(b.name);
}

function wikiUrl(name: string) {
    const page = name in WIKI ? WIKI[name] : name;
    return page ? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.replaceAll(' ', '_'))}` : undefined;
}

function node(id: string, lines: string[], level: Level, rank: number, kids: Node[]): Node {
    const name = level === 'plant' ? lines[1] : lines[0];
    const label = NAMES[name];
    const ja = label?.kanji ?? label?.ja;
    const zh = label?.zh;
    const names = [...lines, ...[zh, ja].filter((s): s is string => !!s)];
    const width = (s: string) => Array.from(s).reduce((sum, c) => sum + (c.charCodeAt(0) > 255 ? 12 : 7), 0) + 20;
    const zhPage = label?.zhPage === null ? undefined : label?.zhPage ?? label?.zh;
    const { w, h } = SIZES[level];
    return {
        id,
        lines,
        level,
        wiki: wikiUrl(name),
        ja,
        zh,
        kana: label?.kanji ? label.ja : undefined,
        jaWiki: label?.page ? `https://ja.wikipedia.org/wiki/${encodeURIComponent(label.page)}` : undefined,
        zhWiki: zhPage ? `https://zh.wikipedia.org/wiki/${encodeURIComponent(zhPage)}` : undefined,
        rank,
        dir: 'down',
        w: Math.max(w, ...names.map(width)),
        h: Math.max(h, (names.length - 1) * LINE + 28),
        x: 0,
        y: 0,
        kids,
    };
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

// Shorter branches go first, so along the top and bottom edges their plants sit
// nearest the root, and the longer branches reach further right.
function arrange(n: Node) {
    n.kids.forEach(arrange);
    n.kids.sort((a, b) => height(a) - height(b) || a.id.localeCompare(b.id));
}

function assign(n: Node, dir: Dir) {
    n.dir = DIRS[n.lines[0]] ?? dir;
    for (const k of n.kids) assign(k, n.dir);
}

function parents(nodes: Node[]) {
    const ups = new Map<Node, Node>();
    for (const a of nodes) for (const b of a.kids) ups.set(b, a);
    return ups;
}

function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
}

type Frame = { w: number; h: number };

// Sizes the frame from the plants, so it grows with the garden.
function frame(nodes: Node[]): Frame {
    const need = nodes.filter(n => !n.kids.length).reduce((sum, n) => sum + n.w + MIN_GAP, -MIN_GAP);
    const w = need * ROOM / (2 + SHAPE);
    return { w, h: w * SHAPE };
}

// Keeps a box inside the frame.
function keep(n: Node, f: Frame) {
    n.x = clamp(n.x, n.w / 2, f.w - n.w / 2);
    n.y = clamp(n.y, (n.h - f.h) / 2, (f.h - n.h) / 2);
}

// How far a box can travel round the inside of the frame, against its edge.
function track(n: Node, f: Frame) {
    return 2 * (f.w - n.w) + f.h - n.h;
}

// Puts a box a distance `s` along its track, clockwise from the top left corner.
// The track is inset by half the box, so the box turns each corner without
// stopping, and every step moves it.
function place(n: Node, s: number, f: Frame) {
    const w = f.w - n.w;
    const h = f.h - n.h;
    const t = clamp(s, 0, track(n, f));
    if (t < w) [n.x, n.y] = [t, 0];
    else if (t < w + h) [n.x, n.y] = [w, t - w];
    else [n.x, n.y] = [2 * w + h - t, h];
    n.x += n.w / 2;
    n.y += (n.h - f.h) / 2;
}

function clear(a: Node, b: Node) {
    return Math.abs(a.x - b.x) >= (a.w + b.w) / 2 + MIN_GAP || Math.abs(a.y - b.y) >= (a.h + b.h) / 2 + MIN_GAP;
}

// Lays the plants round the edge in order. Each one moves on from the last until
// it is clear of it, then on by its share of `unit`. Returns how much of the last
// plant's track is left over, which is negative if they didn't all fit.
function lay(order: Node[], gaps: number[], unit: number, f: Frame) {
    let s = 0;
    order.forEach((n, i) => {
        place(n, s, f);
        while (i && s < track(n, f) && !clear(order[i - 1], n)) place(n, ++s, f);
        s += gaps[i] * unit;
        place(n, s, f);
    });
    const last = order.at(-1)!;
    return clear(order.at(-2)!, last) ? track(last, f) - s : -1;
}

// Spaces the plants round the edge clockwise from the top left corner, so the
// bottom row runs back towards the root. Neighbours share out the spare room,
// with close relatives getting a smaller share. How much room the boxes take up
// depends on where they land, so the share is found by halving the range it
// could be in until it is the largest that fits.
function ring(nodes: Node[], f: Frame) {
    const ups = parents(nodes);
    const leaves = nodes.filter(n => !n.kids.length);
    const side = (dir: Dir) => leaves.filter(n => n.dir === dir);
    const order = [...side('up'), ...side('right'), ...side('down').reverse()];
    const line = (n: Node): Node[] => {
        const p = ups.get(n);
        return p ? [p, ...line(p)] : [];
    };
    const shared = (a: Node, b: Node) => line(a).find(n => line(b).includes(n))!;
    const gaps = order.map((n, i) => i ? (RANKS.length - shared(n, order[i - 1]).rank) ** KIN : 0);
    const total = gaps.reduce((sum, g) => sum + g, 0);
    let [lo, hi] = [0, (2 * f.w + f.h) / total];
    for (let i = 0; i < TRIES; i++) {
        const mid = (lo + hi) / 2;
        if (lay(order, gaps, mid, f) >= 0) lo = mid;
        else hi = mid;
    }
    lay(order, gaps, lo, f);
    // A box walking round a corner can jump, so the largest share that fits may
    // still leave room at the end. The last plant takes it, to fill the corner.
    const last = order.at(-1)!;
    place(last, track(last, f), f);
}

// Pushes overlapping boxes apart along whichever axis needs the smaller move.
// The root and plants stay put, so the other box makes the whole move.
function separate(nodes: Node[], fixed: (n: Node) => boolean) {
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            if (fixed(a) && fixed(b)) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const ox = (a.w + b.w) / 2 + MIN_GAP - Math.abs(dx);
            const oy = (a.h + b.h) / 2 + MIN_GAP - Math.abs(dy);
            if (ox <= 0 || oy <= 0) continue;
            const [k, s] = ox < oy ? ['x', dx < 0 ? -ox : ox] as const : ['y', dy < 0 ? -oy : oy] as const;
            if (fixed(a)) b[k] += s;
            else if (fixed(b)) a[k] -= s;
            else {
                a[k] -= s / 2;
                b[k] += s / 2;
            }
        }
    }
}

// Each box moves to halfway between its parent and the average of its children,
// over and over until they all come to rest. With the plants fixed around the edge in tree order, that spreads
// every branch out between the root and its plants without links crossing.
// Overlaps are only pushed apart once that has settled, since pushing earlier
// folds up branches that are short of room.
function settle(root: Node, nodes: Node[], f: Frame) {
    const ups = parents(nodes);
    const fixed = (n: Node) => n === root || !n.kids.length;
    const free = nodes.filter(n => !fixed(n));
    const mean = (ns: Node[], f: (n: Node) => number) => ns.reduce((sum, n) => sum + f(n), 0) / ns.length;
    for (let step = 0; step < STEPS; step++) {
        for (const n of free) {
            const p = ups.get(n)!;
            n.x = (p.x + mean(n.kids, c => c.x)) / 2;
            n.y = (p.y + mean(n.kids, c => c.y)) / 2;
        }
    }
    for (let i = 0; i < ROUNDS; i++) {
        separate(nodes, fixed);
        for (const n of free) keep(n, f);
    }
}

function layout() {
    const root = build(PLANTS, 0)[0];
    arrange(root);
    const nodes = flat(root);
    assign(root, 'down');
    root.x = root.w / 2;
    root.y = 0;
    const f = frame(nodes);
    ring(nodes, f);
    settle(root, nodes, f);
    // Whole pixels, so the server and browser agree despite small differences
    // in how each engine rounds its maths.
    for (const n of nodes) {
        n.x = Math.round(n.x);
        n.y = Math.round(n.y);
    }
    const x0 = Math.min(...nodes.map(n => n.kana ? tip(n).x : n.x - n.w / 2)) - PAD;
    const y0 = Math.min(...nodes.map(n => n.y - n.h / 2)) - PAD;
    const x1 = Math.max(...nodes.map(n => n.x + n.w / 2)) + PAD;
    const y1 = Math.max(...nodes.map(n => n.y + n.h / 2)) + PAD;
    return { root, nodes, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export const LAYOUT = layout();
