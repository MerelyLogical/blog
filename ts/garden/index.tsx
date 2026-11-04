'use client';

import { PLANTS } from './data';
import type { Plant } from './data';
import './style.css';

const RANKS = ['cl1', 'cl2', 'cl3', 'cl4', 'cl5', 'ord', 'fam', 'gen'] as const;
const HEADS = ['Clade', 'Clade', 'Clade', 'Clade', 'Clade', 'Order', 'Family', 'Genus', 'Plant'];

const BOX_W = 104;
const BOX_H = 32;
const LEAF_W = 124;
const LEAF_H = 44;
const COL = 132;
const ROW = 56;
const LEFT = 52;
const TOP = 20;

const WIDTH = LEFT + PLANTS.length * COL;
const HEIGHT = rowY(RANKS.length) + LEAF_H / 2 + 2;

type Node = {
    id: string;
    label: string;
    sp?: string;
    x: number;
    y: number;
    kids: Node[];
};

function rowY(depth: number) {
    return TOP + depth * ROW;
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
            x: 0,
            y: rowY(depth),
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
            return [{ id: `${RANKS[depth]}-${label}`, label, x: 0, y: rowY(depth), kids }];
        })
        .sort((a, b) => a.label.localeCompare(b.label));
}

// Leaves take the next free column, and each parent sits midway between its
// first and last child.
function place(nodes: Node[], cols: { next: number }) {
    for (const n of nodes) {
        if (n.kids.length) {
            place(n.kids, cols);
            n.x = (n.kids[0].x + n.kids[n.kids.length - 1].x) / 2;
        } else {
            n.x = LEFT + COL * (cols.next++ + 0.5);
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
    return (
        <g>
            <rect
                className="garden-box"
                x={node.x - w / 2}
                y={node.y - h / 2}
                width={w}
                height={h}
                rx={5}
            />
            {node.sp ? (
                <>
                    <text className="garden-name" x={node.x} y={node.y - 9}>{node.label}</text>
                    <text className="garden-species" x={node.x} y={node.y + 9}>{node.sp}</text>
                </>
            ) : (
                <text
                    className={node.id.startsWith('gen-') ? 'garden-name garden-genus' : 'garden-name'}
                    x={node.x}
                    y={node.y}
                >
                    {node.label}
                </text>
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
                    <text key={i} className="garden-head" x={0} y={rowY(i)}>
                        {head}
                    </text>
                ))}
                {NODES.flatMap(n => n.kids.map(k => {
                    const y1 = n.y + BOX_H / 2;
                    const y2 = k.y - (k.sp ? LEAF_H : BOX_H) / 2;
                    const midY = (y1 + y2) / 2;
                    return (
                        <path
                            key={k.id}
                            className="garden-link"
                            d={`M${n.x} ${y1} C${n.x} ${midY} ${k.x} ${midY} ${k.x} ${y2}`}
                            markerEnd="url(#garden-arrow)"
                        />
                    );
                }))}
                {NODES.map(n => <Box key={n.id} node={n} />)}
            </svg>
        </div>
    );
}
