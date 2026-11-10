'use client';

import { useState } from 'react';
import { LAYOUT, LINE, tip } from './layout';
import type { Level, Node } from './layout';
import './style.css';

const KEY: [Level, string][] = [
    ['clade', 'Clade'],
    ['ord',   'Order'],
    ['fam',   'Family'],
    ['gen',   'Genus'],
    ['plant', 'Plant'],
];

const RADIUS = 10;

// How far along a line from the box's centre, in direction (ux, uy), its edge is.
// Where the line meets a rounded corner, it runs on to the corner's arc instead.
function edge(n: Node, ux: number, uy: number) {
    const t = Math.min(
        ux ? n.w / 2 / Math.abs(ux) : Infinity,
        uy ? n.h / 2 / Math.abs(uy) : Infinity,
    );
    const cx = Math.sign(ux) * (n.w / 2 - RADIUS);
    const cy = Math.sign(uy) * (n.h / 2 - RADIUS);
    if (Math.abs(ux * t) <= Math.abs(cx) || Math.abs(uy * t) <= Math.abs(cy)) return t;
    const b = ux * cx + uy * cy;
    return b + Math.sqrt(b * b - cx * cx - cy * cy + RADIUS * RADIUS);
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

type Tips = { onHover: (node?: Node) => void; onFocus: (node?: Node) => void };

// Unlinked labels still catch pointer events so clicks do not reach the English
// box underneath them.
function Label({ node, text, y, lang, href, title, onHover, onFocus }: {
    node: Node; text: string; y: number; lang: 'ja' | 'zh'; href?: string; title?: string;
} & Partial<Tips>) {
    const Tag = href ? 'a' : 'g';
    return (
        <Tag
            className={`garden-label${href ? ' garden-name-link' : ''}`}
            href={href}
            onPointerEnter={title ? () => onHover?.(node) : undefined}
            onPointerLeave={title ? () => onHover?.() : undefined}
            onFocus={title ? () => onFocus?.(node) : undefined}
            onBlur={title ? () => onFocus?.() : undefined}
            tabIndex={title && !href ? 0 : undefined}
            target={href ? '_blank' : undefined}
            rel={href ? 'noreferrer' : undefined}
            lang={lang}
            aria-label={href
                ? `${text}${title ? ` (${title})` : ''} on ${lang === 'ja' ? 'Japanese' : 'Chinese'} Wikipedia`
                : title ? `${text} (${title})` : undefined}
        >
            <rect
                className="garden-name-hit"
                x={node.x - node.w / 2 + 4}
                y={y - LINE / 2}
                width={node.w - 8}
                height={LINE}
            />
            <text className={lang === 'ja' ? 'garden-ja' : 'garden-zh'} x={node.x} y={y}>{text}</text>
        </Tag>
    );
}

// Each name line links to its own language edition of Wikipedia.
function Box({ node, isRoot, onHover, onFocus }: { node: Node; isRoot: boolean } & Tips) {
    const fill = isRoot ? 'root' : node.level;
    const nameH = ((node.zh ? 1 : 0) + (node.ja ? 1 : 0)) * LINE;
    const top = node.y - ((node.lines.length - 1) * LINE + nameH) / 2;
    const zhY = top + node.lines.length * LINE;
    const jaY = zhY + (node.zh ? LINE : 0);
    const box = (
        <>
            <rect
                className="garden-box"
                x={node.x - node.w / 2}
                y={node.y - node.h / 2}
                width={node.w}
                height={node.h}
                rx={RADIUS}
                style={{ fill: `var(--garden-${fill})` }}
            />
            {node.lines.map((line, i) => (
                <text key={i} className={textClass(node, i)} x={node.x} y={top + i * LINE}>
                    {line}
                </text>
            ))}
        </>
    );
    return (
        <g>
            {node.wiki ? (
                <a
                    className="garden-wiki"
                    href={node.wiki}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${node.lines.join(', ')} on Wikipedia`}
                >
                    {box}
                </a>
            ) : box}
            {node.zh && (
                <Label node={node} text={node.zh} y={zhY} lang="zh" href={node.zhWiki} />
            )}
            {node.ja && (
                <Label node={node} text={node.ja} y={jaY} lang="ja" href={node.jaWiki} title={node.kana} onHover={onHover} onFocus={onFocus} />
            )}
        </g>
    );
}

export default function Garden() {
    const { root, nodes, x, y, w, h } = LAYOUT;
    const [hover, setHover] = useState<Node>();
    const [focus, setFocus] = useState<Node>();
    const active = hover ?? focus;
    const t = active && tip(active);
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
                    {nodes.map(n => <Box key={n.id} node={n} isRoot={n === root} onHover={setHover} onFocus={setFocus} />)}
                    {active && t && (
                        <g className="garden-kana" lang="ja" aria-hidden="true">
                            <rect x={t.x} y={t.y - 11} width={t.w} height={22} rx={4} />
                            <text x={t.x + t.w / 2} y={t.y}>{active.kana}</text>
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
}
