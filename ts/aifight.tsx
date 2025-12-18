'use client';

import { useEffect, useRef } from 'react';

const HEIGHT = 1000;
const WIDTH = 1000;
const WORLD_PADDING = 10;
const AGENT_RADIUS = 10;
const NUM_AGENTS = 50;
const IDLE_SPEED = 50;
const FIGHT_SPEED = 50;
const IDLE_TO_FIGHT_RANGE = 250;
const FIGHT_TO_IDLE_RANGE = 250;
const MIN_DISTANCE = AGENT_RADIUS * 2;
const ATTACK_RANGE = 32;
const MAX_HP = 100;
const ATTACK_DAMAGE = 25;
const ATTACK_COOLDOWN = 1;
const IDLE_COLOR: HslColor = { h: 180, s: 100, l: 60 };
const FIGHT_COLOR: HslColor = { h: 0, s: 100, l: 60 };
const HEAL_COLOR: HslColor = { h: 120, s: 100, l: 60 };
const HEAL_RATE = 10;
const FLASH_DURATION = 0.1;
const PARTICLE_LIFESPAN = 0.5;
const PARTICLE_COUNT = 8;

type AgentState = 'idle' | 'fight' | 'heal';

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
    flashTimer: number; // New: tracking hit reaction
    hasDied: boolean;   // New: preventing duplicate particle spawns
};

type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number; // 1.0 down to 0.0
    color: string;
};

type HslColor = { h: number; s: number; l: number };

const randRange = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Global particle storage
let particles: Particle[] = [];

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
    const context = canvas.getContext('2d');
    if (!context) return () => {};
    const ctx = context;

    let agents = createAgents(NUM_AGENTS);
    resolveCollisions(agents);

    let lastTimestamp = performance.now();
    let rafId = requestAnimationFrame(step);

    function step(timestamp: number) {
        const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
        lastTimestamp = timestamp;

        // 1. Detect death to trigger particles before agents are filtered out
        agents.forEach(agent => {
            if (agent.blackboard.hp <= 0 && !agent.blackboard.hasDied) {
                const color = getColorForState(agent.state);
                spawnDeathParticles(agent.x, agent.y, `hsl(${color.h}, ${color.s}%, ${color.l}%)`);
                agent.blackboard.hasDied = true;
            }
        });

        // 2. Logic updates
        agents = updateAgents(agents, dt);
        updateParticles(dt);
        resolveCollisions(agents);

        // 3. Render
        drawScene(ctx, agents, particles);
        
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
        flashTimer: 0,
        hasDied: false,
    };
}

function updateAgents(agents: Agent[], dt: number) {
    for (const agent of agents) {
        if (agent.blackboard.hp <= 0) continue;
        const { nearest, distance } = findNearest(agent, agents);
        updateState(agent, nearest, distance);

        let heading = agent.heading;
        if (agent.state === 'fight' && nearest) {
            heading = Math.atan2(nearest.y - agent.y, nearest.x - agent.x);
        } else if (agent.state === 'idle') {
            agent.directionTimer -= dt;
            if (agent.directionTimer <= 0) {
                heading = randRange(0, Math.PI * 2);
                agent.directionTimer = randRange(0.75, 2.5);
            }
        }

        const speed = getSpeedForState(agent.state);
        agent.x += Math.cos(heading) * speed * dt;
        agent.y += Math.sin(heading) * speed * dt;

        if (agent.x < AGENT_RADIUS || agent.x > WIDTH - AGENT_RADIUS) heading = Math.PI - heading;
        if (agent.y < AGENT_RADIUS || agent.y > HEIGHT - AGENT_RADIUS) heading = -heading;

        agent.x = clamp(agent.x, AGENT_RADIUS, WIDTH - AGENT_RADIUS);
        agent.y = clamp(agent.y, AGENT_RADIUS, HEIGHT - AGENT_RADIUS);
        agent.heading = heading;

        handleStateActions(agent, nearest, distance, dt);
    }

    return agents.filter((agent) => agent.blackboard.hp > 0);
}

function spawnDeathParticles(x: number, y: number, color: string) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 100 + 50;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color
        });
    }
}

function updateParticles(dt: number) {
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt / PARTICLE_LIFESPAN;
    }
}

function drawScene(ctx: CanvasRenderingContext2D, agents: Agent[], particles: Particle[]) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#202020';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 1. Draw Particles (Behind agents)
    for (const p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 2. Draw Agents
    for (const agent of agents) {
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, AGENT_RADIUS, 0, Math.PI * 2);
        
        // Handle Damage Flash
        if (agent.blackboard.flashTimer > 0) {
            ctx.fillStyle = 'white';
            agent.blackboard.flashTimer -= 0.016; // Decay per frame
        } else {
            const hpRatio = Math.max(0, Math.min(1, agent.blackboard.hp / MAX_HP));
            const baseColor = getColorForState(agent.state);
            ctx.fillStyle = applySaturation(baseColor, hpRatio);
        }
        ctx.fill();

        // 3. Draw Heading Line
        const lineLength = AGENT_RADIUS + 5;
        const targetX = agent.x + Math.cos(agent.heading) * lineLength;
        const targetY = agent.y + Math.sin(agent.heading) * lineLength;
        ctx.beginPath();
        ctx.moveTo(agent.x, agent.y);
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function findNearest(agent: Agent, agents: Agent[]) {
    let nearest: Agent | null = null;
    let distance = Infinity;
    for (const other of agents) {
        if (other.id === agent.id || other.blackboard.hp <= 0) continue;
        const d = Math.hypot(other.x - agent.x, other.y - agent.y);
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
            const a = agents[i], b = agents[j];
            if (a.blackboard.hp <= 0 || b.blackboard.hp <= 0) continue;
            const dx = b.x - a.x, dy = b.y - a.y;
            let distance = Math.hypot(dx, dy) || 0.01;
            if (distance < MIN_DISTANCE) {
                const overlap = (MIN_DISTANCE - distance) / 2;
                const nx = dx / distance, ny = dy / distance;
                a.x -= nx * overlap; a.y -= ny * overlap;
                b.x += nx * overlap; b.y += ny * overlap;
            }
        }
    }
}

function updateState(agent: Agent, nearest: Agent | null, distance: number) {
    if (agent.state === 'heal') {
        if (agent.blackboard.hp >= MAX_HP) agent.state = 'idle';
        return;
    }
    if (agent.state === 'idle') {
        if (nearest && distance <= IDLE_TO_FIGHT_RANGE) {
            agent.state = 'fight';
        } else if (agent.blackboard.hp < MAX_HP) {
            agent.state = 'heal';
        }
    } else if (agent.state === 'fight') {
        if (!nearest || distance > FIGHT_TO_IDLE_RANGE) {
            agent.state = 'idle';
            agent.directionTimer = 0;
        }
    }
}

function handleStateActions(agent: Agent, target: Agent | null, distance: number, dt: number) {
    if (agent.state === 'fight') {
        const board = agent.blackboard;
        board.cooldownRemaining = Math.max(0, board.cooldownRemaining - dt);
        if (target && distance <= ATTACK_RANGE && board.cooldownRemaining <= 0) {
            target.blackboard.hp -= board.attackDamage;
            target.blackboard.flashTimer = FLASH_DURATION; // Trigger Flash
            board.cooldownRemaining = board.attackCooldown;
        }
    } else if (agent.state === 'heal') {
        agent.blackboard.hp = Math.min(MAX_HP, agent.blackboard.hp + HEAL_RATE * dt);
    }
}

function getSpeedForState(state: AgentState) {
    return state === 'fight' ? FIGHT_SPEED : state === 'heal' ? 0 : IDLE_SPEED;
}

function getColorForState(state: AgentState) {
    return state === 'fight' ? FIGHT_COLOR : state === 'heal' ? HEAL_COLOR : IDLE_COLOR;
}

function applySaturation(color: HslColor, ratio: number) {
    return `hsl(${color.h}, ${Math.max(0, ratio * color.s)}%, ${color.l}%)`;
}
