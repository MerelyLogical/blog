'use client';

import { PLANTS } from './data';
import type { Plant } from './data';
import './style.css';

const RANKS = ['cl1', 'cl2', 'cl3', 'ord', 'fam'] as const;
const HEADS = ['Clade', 'Clade', 'Clade', 'Order', 'Family', 'Plant'];

const BOX_W = 104;
const BOX_H = 32;
const LEAF_W = 128;
const LEAF_H = 44;
const GAP = 24;
const ROW = 56;
const TOP = 28;

const WIDTH = colX(RANKS.length) + LEAF_W;
const HEIGHT = TOP + PLANTS.length * ROW;

type Node = {
    id: string;
    label: string;
    sp?: string;
    x: number;
    y: number;
    kids: Node[];
};

function colX(depth: number) {
    return depth * (BOX_W + GAP);
}

function bySpecies(a: Plant, b: Plant) {
    return a.sp.localeCompare(b.sp) || a.name.localeCompare(b.name);
}

// Plants without a value at a rank skip it, so their node attaches directly to
// the rank above, as Ericales does with no lower clades.
function build(plants: Plant[], depth: number): Node[] {
    if (depth === RANKS.length) {
        return [...plants].sort(bySpecies).map(p => ({
            id: p.name,
            label: p.name,
            sp: p.sp,
            x: colX(depth),
            y: 0,
            kids: [],
        }));
    }
    const groups = new Map<string | undefined, Plant[]>();
    for (const p of plants) {
        const key = p[RANKS[depth]];
        groups.set(key, [...(groups.get(key) ?? []), p]);
    }
    return [...groups]
        .flatMap(([label, members]) => {
            const kids = build(members, depth + 1);
            if (!label) return kids;
            return [{ id: `${RANKS[depth]}-${label}`, label, x: colX(depth), y: 0, kids }];
        })
        .sort((a, b) => a.label.localeCompare(b.label));
}

// Leaves take the next free row, and each parent sits midway between its first
// and last child.
function place(nodes: Node[], rows: { next: number }) {
    for (const n of nodes) {
        if (n.kids.length) {
            place(n.kids, rows);
            n.y = (n.kids[0].y + n.kids[n.kids.length - 1].y) / 2;
        } else {
            n.y = TOP + ROW * (rows.next++ + 0.5);
        }
    }
}

function flat(nodes: Node[]): Node[] {
    return nodes.flatMap(n => [n, ...flat(n.kids)]);
}

const ROOTS = build(PLANTS, 0);
place(ROOTS, { next: 0 });
const NODES = flat(ROOTS);

function Box({ node }: { node: Node }) {
    const w = node.sp ? LEAF_W : BOX_W;
    const h = node.sp ? LEAF_H : BOX_H;
    const mid = node.x + w / 2;
    return (
        <g>
            <rect
                className="garden-box"
                x={node.x}
                y={node.y - h / 2}
                width={w}
                height={h}
                rx={5}
            />
            {node.sp ? (
                <>
                    <text className="garden-name" x={mid} y={node.y - 9}>{node.label}</text>
                    <text className="garden-species" x={mid} y={node.y + 9}>{node.sp}</text>
                </>
            ) : (
                <text className="garden-name" x={mid} y={node.y}>{node.label}</text>
            )}
        </g>
    );
}

export default function Garden() {
    return (
        <div className="garden">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ maxWidth: WIDTH }}>
                <defs>
                    <marker
                        id="garden-arrow"
                        viewBox="0 0 8 8"
                        refX={8}
                        refY={4}
                        markerWidth={8}
                        markerHeight={8}
                        markerUnits="userSpaceOnUse"
                        orient="auto"
                    >
                        <path className="garden-tip" d="M0 0 L8 4 L0 8 Z" />
                    </marker>
                </defs>
                {HEADS.map((head, i) => (
                    <text
                        key={i}
                        className="garden-head"
                        x={colX(i) + (i === RANKS.length ? LEAF_W : BOX_W) / 2}
                        y={10}
                    >
                        {head}
                    </text>
                ))}
                {NODES.flatMap(n => n.kids.map(k => {
                    const x1 = n.x + BOX_W;
                    const midX = (x1 + k.x) / 2;
                    return (
                        <path
                            key={k.id}
                            className="garden-link"
                            d={`M${x1} ${n.y} C${midX} ${n.y} ${midX} ${k.y} ${k.x} ${k.y}`}
                            markerEnd="url(#garden-arrow)"
                        />
                    );
                }))}
                {NODES.map(n => <Box key={n.id} node={n} />)}
            </svg>
        </div>
    );
}
