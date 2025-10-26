'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/ts/ui/Button';

const INF = 999;

class Node {
    constructor(
        public x: number,
        public y: number,
        public visited = false,
        public search_dist = INF,
        public search_last = INF
    ) {}
}

type Edge = [number, number];

type Graph = {
    nodes: Node[];
    edges: Edge[];
    dist: number[][];
    start: number;
    goal: number;
};

// 1. generate random nodes
// 2. calculate distance between all nodes
// 3. randomly add edges between the nodes, prioritising ones with shorter distance and with fewer connections

// TODO:
// make start and goal more interesting -> force 2 points at far edges of the map?
// make maps more interesting?
// visualise pathfinding process?
// error message to user + allow user config parameters

function generateGraph(size: number): Graph {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const dist: number[][] = [];

    // generate nodes
    for (let i = 0; i < size; i++) {
        const x = Math.random();
        const y = Math.random();
        nodes.push(new Node(x, y));
        const row = Array(size).fill(INF);
        for (let j = 0; j < i; j++) {
            const d = Math.hypot(x - nodes[j].x, y - nodes[j].y);
            row[j] = d;
        }
        row[i] = 0;
        dist.push(row);
    }

    // generate edges
    for (let i = 0; i < size; i++) {
        let connections = 0;
        for (let j = 0; j < i; j++) {
            // probability linear against distance and number of existing connections. consider using Sigmoid?
            const roll = Math.random() / 2.5;
            const threshold = dist[i][j] / Math.SQRT2 + connections / size;
            if (roll > threshold) {
                edges.push([i, j]);
                dist[j][i] = dist[i][j];
                connections++;
            } else {
                // disconnect the nodes
                dist[i][j] = INF;
            }
        }
    }

    // for (let i = 0; i < size; i++) {
    //     // if a point ends up isolated, randomly picking a point to connect it to the network
    //     if (dist_matrix[i].reduce((a, b) => a + b) == (1-size)) {
    //         console.log(i, "i'm disconnected!");
    //         let friend = Math.floor(Math.random() * (size-1));
    //         if (friend >= i) { friend++ };
    //         let dist = Math.sqrt(((nodes[i].x - nodes[friend].x) ** 2) + (nodes[i].y - nodes[friend].y) ** 2);
    //         edges.push([i, friend]);
    //         dist_matrix[i][friend] = dist;
    //         dist_matrix[friend][i] = dist;
    //     }
    // }

    // pick start and end points
    const start = Math.floor(Math.random() * size);
    nodes[start].search_dist = 0;
    nodes[start].search_last = start;

    const goalRaw = Math.floor(Math.random() * (size - 1));
    const goal = goalRaw >= start ? goalRaw + 1 : goalRaw;

    return { nodes, edges, dist, start, goal };
}

function findPath(g: Graph): Edge[] {
    const { nodes, dist, start, goal } = g;
    const size = nodes.length;
    const search_prios = Array(size).fill(INF);
    search_prios[start] = 0;

    for (let step = 0; step < size; step++) {
        // visit closest point to start that has not been visited
        let min = INF;
        let visiting = -1;
        for (let i = 0; i < size; i++) {
            if (!nodes[i].visited && search_prios[i] < min) {
                min = search_prios[i];
                visiting = i;
            }
        }
        // stop if we have no where to search
        if (visiting === -1 || min === INF) break;
        // stop if we have reached the goal node
        if (visiting === goal) break;

        // visit all neighbours and update if a shorter path is found
        const base = nodes[visiting].search_dist;
        for (let i = 0; i < size; i++) {
            if (!nodes[i].visited) {
                const nd = base + dist[visiting][i];
                if (nd < nodes[i].search_dist) {
                    nodes[i].search_dist = nd;
                    nodes[i].search_last = visiting;
                    search_prios[i] = nd;
                }
            }
        }
        // mark node as visited
        nodes[visiting].visited = true;
        search_prios[visiting] = INF;
    }

    // reconstruct (guard against no path)
    const path: Edge[] = [];
    if (nodes[goal].search_dist === INF) return path; // unreachable
    let cur = goal;
    while (cur !== start) {
        const prev = nodes[cur].search_last;
        if (prev === INF) break; // safety
        path.push([cur, prev]);
        cur = prev;
    }
    return path;
}

type CircElem = {
    id: string;
    cx: number;
    cy: number;
    r: number;
    fill: string;
};

type LineElem = {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    stroke: string;
    strokeWidth: number;
};

function DrawGraph({ size = 25 }: { size?: number }) {
    // compute once per (size, seed)
    const { circles, lines } = useMemo(() => {
        const g = generateGraph(size);
        const solution = findPath(g);

        const circles: CircElem[] = g.nodes.map((n, i) => ({
            id: `c-${i}`,
            cx: n.x,
            cy: n.y,
            r: i === g.start || i === g.goal ? 0.010 : 0.005,
            fill: i === g.start ? '#AA00AA' :
                  i === g.goal  ? '#00AA00' :
                                  '#AAAAAA'
        }));

        const lines: LineElem[] = [
            ...g.edges.map(([a, b]) => ({
                id: `e-${a}-${b}`,
                x1: g.nodes[a].x,
                y1: g.nodes[a].y,
                x2: g.nodes[b].x,
                y2: g.nodes[b].y,
                stroke: '#AAAAAA',
                strokeWidth: 0.003,
            })),
            // just draw thicker line over old edges cause i'm lazy
            ...solution.map(([a, b], idx) => ({
                id: `p-${a}-${b}-${idx}`,
                x1: g.nodes[a].x,
                y1: g.nodes[a].y,
                x2: g.nodes[b].x,
                y2: g.nodes[b].y,
                stroke: '#00AAAA',
                strokeWidth: 0.005,
            })),
        ];

        return { circles, lines };
    }, [size]);

    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"
        style={{ display: 'block', maxWidth: '100%', pointerEvents: 'none' }} >
        {circles.map((e) => (
            <circle key={e.id} id={e.id} cx={e.cx} cy={e.cy} r={e.r} fill={e.fill} />
        ))}
        {lines.map((e) => (
            <line key={e.id} id={e.id} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={e.stroke} strokeWidth={e.strokeWidth} />
        ))}
        </svg>
    );
}

export function RefreshGraph() {
  const [version, setVersion] = useState(0);

  return (
    <div>
      <Button onClick={() => setVersion(v => v + 1)}>New graph</Button>
      <DrawGraph key={version} size={25} />
    </div>
  );
}
