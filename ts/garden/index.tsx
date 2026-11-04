'use client';

import { LAYOUT } from './layout';
import type { Level, Node } from './layout';
import './style.css';

const { root, nodes, x, y, w, h } = LAYOUT;

const KEY: [Level, string][] = [
    ['clade', 'Clade'],
    ['ord',   'Order'],
    ['fam',   'Family'],
    ['gen',   'Genus'],
    ['plant', 'Plant'],
];

const LINE = 18;

// How far along a line from the box's centre, in direction (ux, uy), its edge is.
function edge(n: Node, ux: number, uy: number) {
    return Math.min(
        ux ? n.w / 2 / Math.abs(ux) : Infinity,
        uy ? n.h / 2 / Math.abs(uy) : Infinity,
    );
}

// Server and browser maths can differ in the last few decimal places, which React
// reports as a hydration mismatch.
function tidy(v: number) {
    return Math.round(v * 10) / 10;
}

function Link({ from, to }: { from: Node; to: Node }) {
    const d = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    const ux = (to.x - from.x) / d;
    const uy = (to.y - from.y) / d;
    const start = edge(from, ux, uy);
    const end = edge(to, ux, uy);
    return (
        <line
            className="garden-link"
            x1={tidy(from.x + ux * start)}
            y1={tidy(from.y + uy * start)}
            x2={tidy(to.x - ux * end)}
            y2={tidy(to.y - uy * end)}
            markerEnd="url(#garden-arrow)"
        />
    );
}

function textClass(node: Node, i: number) {
    if (node.level === 'plant') return i === 0 ? 'garden-name' : 'garden-species';
    return node.level === 'gen' ? 'garden-name garden-genus' : 'garden-name';
}

function Box({ node }: { node: Node }) {
    const fill = node === root ? 'root' : node.level;
    const box = (
        <g>
            <rect
                className="garden-box"
                x={node.x - node.w / 2}
                y={node.y - node.h / 2}
                width={node.w}
                height={node.h}
                rx={10}
                style={{ fill: `var(--garden-${fill})` }}
            />
            {node.lines.map((line, i) => (
                <text
                    key={i}
                    className={textClass(node, i)}
                    x={node.x}
                    y={node.y + (i - (node.lines.length - 1) / 2) * LINE}
                >
                    {line}
                </text>
            ))}
        </g>
    );
    if (!node.wiki) return box;
    return (
        <a
            className="garden-wiki"
            href={node.wiki}
            target="_blank"
            rel="noreferrer"
            aria-label={`${node.lines.join(', ')} on Wikipedia`}
        >
            {box}
        </a>
    );
}

export default function Garden() {
    return (
        <div className="garden">
            <div className="garden-key">
                {KEY.map(([level, label]) => (
                    <span key={level} className="garden-key-item">
                        <span
                            className="garden-swatch"
                            style={{ background: `var(--garden-${level})` }}
                        />
                        {label}
                    </span>
                ))}
            </div>
            <div className="garden-scroll">
                <svg
                    viewBox={`${x} ${y} ${w} ${h}`}
                    style={{ maxWidth: `min(${w}px, calc((100dvh - var(--nextra-navbar-height) - 2rem) * ${w / h}))` }}
                >
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
                    {nodes.flatMap(n => n.kids.map(k => <Link key={k.id} from={n} to={k} />))}
                    {nodes.map(n => <Box key={n.id} node={n} />)}
                </svg>
            </div>
        </div>
    );
}
