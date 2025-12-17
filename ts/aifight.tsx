'use client';

import { useEffect, useRef } from 'react';

const HEIGHT = 1000;
const WIDTH = 1000;
const WORLD_PADDING = 10;
const AGENT_RADIUS = 10;
const NUM_AGENTS = 20;
const IDLE_SPEED = 30; // units / second
const FIGHT_SPEED = 45;
const IDLE_TO_FIGHT_RANGE = 100;
const FIGHT_TO_IDLE_RANGE = 200;
const MIN_DISTANCE = AGENT_RADIUS * 2;
const ATTACK_RANGE = 32;
const MAX_HP = 100;
const ATTACK_DAMAGE = 25;
const ATTACK_COOLDOWN = 1; // seconds
const IDLE_COLOR: HslColor = { h: 180, s: 100, l: 60 };
const FIGHT_COLOR: HslColor = { h: 0, s: 100, l: 60 };

type AgentState = 'idle' | 'fight';

type Agent = {
    id: number;
    x: number;
    y: number;
    heading: number;
    state: AgentState;
    directionTimer: number;
    blackboard: Blackboard;
};

type Blackboard = {
    hp: number;
    attackDamage: number;
    attackCooldown: number;
    cooldownRemaining: number;
};

type HslColor = {
    h: number;
    s: number;
    l: number;
};

const randRange = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function AiCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const teardown = runSimulation(canvas);
        return teardown;
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            style={{ width: '100%', height: '100%', margin: 0 }}
        />
    );
}

function runSimulation(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => {};

    let agents = createAgents(NUM_AGENTS);
    resolveCollisions(agents);

    let lastTimestamp = performance.now();
    let rafId = requestAnimationFrame(step);

    function step(timestamp: number) {
        const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
        lastTimestamp = timestamp;
        agents = updateAgents(agents, dt);
        resolveCollisions(agents);
        drawAgents(ctx, agents);
        rafId = requestAnimationFrame(step);
    }

    return () => cancelAnimationFrame(rafId);
}

function createAgents(count: number): Agent[] {
    return Array.from({ length: count }, (_, id) => ({
        id,
        x: randRange(WORLD_PADDING, WIDTH - WORLD_PADDING),
        y: randRange(WORLD_PADDING, HEIGHT - WORLD_PADDING),
        heading: randRange(0, Math.PI * 2),
        state: 'idle',
        directionTimer: randRange(0.5, 2),
        blackboard: createBlackboard(),
    }));
}

function createBlackboard(): Blackboard {
    return {
        hp: MAX_HP,
        attackDamage: ATTACK_DAMAGE,
        attackCooldown: ATTACK_COOLDOWN,
        cooldownRemaining: 0,
    };
}

function updateAgents(agents: Agent[], dt: number) {
    for (const agent of agents) {
        if (agent.blackboard.hp <= 0) continue;
        const { nearest, distance } = findNearest(agent, agents);
        if (agent.state === 'idle') {
            if (nearest && distance <= IDLE_TO_FIGHT_RANGE) {
                agent.state = 'fight';
            }
        } else if (agent.state === 'fight') {
            if (!nearest || distance > FIGHT_TO_IDLE_RANGE) {
                agent.state = 'idle';
                agent.directionTimer = 0;
            }
        }

        let heading = agent.heading;
        if (agent.state === 'fight' && nearest) {
            heading = Math.atan2(nearest.y - agent.y, nearest.x - agent.x);
        } else {
            agent.directionTimer -= dt;
            if (agent.directionTimer <= 0) {
                heading = randRange(0, Math.PI * 2);
                agent.directionTimer = randRange(0.75, 2.5);
            }
        }

        const speed = agent.state === 'fight' ? FIGHT_SPEED : IDLE_SPEED;
        agent.x += Math.cos(heading) * speed * dt;
        agent.y += Math.sin(heading) * speed * dt;

        if (agent.x < AGENT_RADIUS || agent.x > WIDTH - AGENT_RADIUS) {
            heading = Math.PI - heading;
        }
        if (agent.y < AGENT_RADIUS || agent.y > HEIGHT - AGENT_RADIUS) {
            heading = -heading;
        }

        agent.x = clamp(agent.x, AGENT_RADIUS, WIDTH - AGENT_RADIUS);
        agent.y = clamp(agent.y, AGENT_RADIUS, HEIGHT - AGENT_RADIUS);
        agent.heading = heading;

        handleAttacks(agent, nearest, distance, dt);
    }

    return agents.filter((agent) => agent.blackboard.hp > 0);
}

function drawAgents(ctx: CanvasRenderingContext2D, agents: Agent[]) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#202020';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const agent of agents) {
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, AGENT_RADIUS, 0, Math.PI * 2);
        const hpRatio = Math.max(0, Math.min(1, agent.blackboard.hp / MAX_HP));
        const baseColor = agent.state === 'fight' ? FIGHT_COLOR : IDLE_COLOR;
        ctx.fillStyle = applySaturation(baseColor, hpRatio);
        ctx.fill();
    }
}

function findNearest(agent: Agent, agents: Agent[]) {
    let nearest: Agent | null = null;
    let distance = Infinity;
    for (const other of agents) {
        if (other.id === agent.id || other.blackboard.hp <= 0) continue;
        const dx = other.x - agent.x;
        const dy = other.y - agent.y;
        const d = Math.hypot(dx, dy);
        if (d < distance) {
            distance = d;
            nearest = other;
        }
    }
    return { nearest, distance };
}

function resolveCollisions(agents: Agent[]) {
    for (let i = 0; i < agents.length; i += 1) {
        for (let j = i + 1; j < agents.length; j += 1) {
            const a = agents[i];
            const b = agents[j];
            if (a.blackboard.hp <= 0 || b.blackboard.hp <= 0) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            let distance = Math.hypot(dx, dy);
            if (distance === 0) {
                // jitter apart if completely overlapping
                distance = 0.01;
            }
            if (distance < MIN_DISTANCE) {
                const overlap = (MIN_DISTANCE - distance) / 2;
                const nx = dx / distance;
                const ny = dy / distance;
                a.x -= nx * overlap;
                a.y -= ny * overlap;
                b.x += nx * overlap;
                b.y += ny * overlap;
                a.x = clamp(a.x, AGENT_RADIUS, WIDTH - AGENT_RADIUS);
                a.y = clamp(a.y, AGENT_RADIUS, HEIGHT - AGENT_RADIUS);
                b.x = clamp(b.x, AGENT_RADIUS, WIDTH - AGENT_RADIUS);
                b.y = clamp(b.y, AGENT_RADIUS, HEIGHT - AGENT_RADIUS);
            }
        }
    }
}

function handleAttacks(agent: Agent, target: Agent | null, distance: number, dt: number) {
    const board = agent.blackboard;
    board.cooldownRemaining = Math.max(0, board.cooldownRemaining - dt);
    if (!target || agent.state !== 'fight' || distance > ATTACK_RANGE) return;
    if (board.cooldownRemaining > 0) return;

    target.blackboard.hp -= board.attackDamage;
    board.cooldownRemaining = board.attackCooldown;
}

function applySaturation(color: HslColor, ratio: number) {
    const saturation = Math.max(0, Math.min(1, ratio)) * color.s;
    return `hsl(${color.h}, ${saturation}%, ${color.l}%)`;
}
