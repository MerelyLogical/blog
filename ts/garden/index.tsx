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
const SHEET = 14;

// A little page of notes, centred on (x, y).
function Sheet({ x, y }: { x: number; y: number }) {
    const h = SHEET / 2;
    return (
        <g className="garden-sheet">
            <rect x={x - h} y={y - h} width={SHEET} height={SHEET} rx={2} />
            {[-3, 0, 3].map(d => <line key={d} x1={x - 4} y1={y + d} x2={x + 4} y2={y + d} />)}
        </g>
    );
}

// Links run centre to centre, and the boxes drawn over them hide the ends.
function Link({ from, to }: { from: Node; to: Node }) {
    return <line className="garden-link" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
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
            {node.notes && (
                <a className="garden-notes" href={node.notes} aria-label={`My notes on ${node.lines[0]}`}>
                    <Sheet x={node.x + node.w / 2 - 2} y={node.y - node.h / 2 + 2} />
                </a>
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
                <span className="garden-key-item">
                    <svg className="garden-key-sheet" viewBox={`0 0 ${SHEET + 2} ${SHEET + 2}`}>
                        <Sheet x={SHEET / 2 + 1} y={SHEET / 2 + 1} />
                    </svg>
                    Notes
                </span>
            </div>
            <div className="garden-scroll">
                <svg
                    viewBox={`${x} ${y} ${w} ${h}`}
                    style={{ maxWidth: `min(${w}px, calc((100dvh - var(--nextra-navbar-height) - 2rem) * ${w / h}))` }}
                >
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
