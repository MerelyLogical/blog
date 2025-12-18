'use client';

import { useEffect, useRef } from 'react';

const HEIGHT = 1000;
const WIDTH = 1000;
const WORLD_PADDING = 10;
const NUM_AGENTS = 50;
const NUM_TANKS = 8;
const FIGHT_RANGE = 250;
const ATTACK_RANGE = 10;
const ATTACK_ANGLE = Math.PI / 12;
const ATTACK_COOLDOWN = 1;
const IDLE_COLOR: HslColor = { h: 180, s: 100, l: 60 };
const FIGHT_COLOR: HslColor = { h: 0, s: 100, l: 60 };
const HEAL_COLOR: HslColor = { h: 120, s: 100, l: 60 };
const HEAL_RATE = 10;
const FLASH_DURATION = 0.1;
const PARTICLE_LIFESPAN = 0.5;
const PARTICLE_COUNT = 12;

const FIGHTER_STATS = {
    radius: 10,
    maxHp: 100,
    attackDamage: 25,
    idleSpeed: 75,
    fightSpeed: 75,
    turnRate: 4 * Math.PI,
    fleeHpThreshold: 40,
};

const TANK_STATS = {
    radius: 20,
    maxHp: 500,
    attackDamage: 33,
    idleSpeed: 33,
    fightSpeed: 33,
    turnRate: Math.PI / 2,
};

type AgentState = 'idle' | 'fight' | 'heal';
type AgentKind = 'fighter' | 'tank';

type Health = {
    hp: number;
    maxHp: number;
    healRate: number;
    flashTimer: number;
    hasDied: boolean;
};

type Combat = {
    attackDamage: number;
    attackCooldown: number;
    attackRange: number;
    cooldownRemaining: number;
};

type Steering = {
    heading: number;
    targetHeading: number;
    directionTimer: number;
    idleSpeed: number;
    fightSpeed: number;
    turnRate: number;
};

type Agent = {
    id: number;
    x: number;
    y: number;
    radius: number;
    kind: AgentKind;
    state: AgentState;
    behavior: AgentBehavior;
    health: Health;
    combat: Combat;
    steering: Steering;
};

type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    h: number; // Storing HSL components separately for hsla()
    s: number;
    l: number;
};

type HslColor = { h: number; s: number; l: number };

type Perception = {
    nearest: Agent | null;
    distance: number;
    nearestInFightRange: Agent | null;
    nearestTankInFightRange: Agent | null;
    countInFightRange: number;
};

type AgentBehavior = {
    decideState: (agent: Agent, perception: Perception) => AgentState;
    chooseHeading: (agent: Agent, perception: Perception, dt: number) => number;
    getSpeed: (agent: Agent) => number;
    act: (agent: Agent, perception: Perception, dt: number, particlesRef: React.MutableRefObject<Particle[]>) => void;
    getColor: (agent: Agent) => HslColor;
};

const randRange = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function AiCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    // Move particles into a ref to avoid global pollution and fix lag
    const particlesRef = useRef<Particle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const teardown = runSimulation(canvas, particlesRef);
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

function runSimulation(canvas: HTMLCanvasElement, particlesRef: React.MutableRefObject<Particle[]>) {
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

        // Logic updates
        agents = updateAgents(agents, dt, particlesRef);
        updateParticles(dt, particlesRef);
        resolveCollisions(agents);

        // Render
        drawScene(ctx, agents, particlesRef.current);
        
        rafId = requestAnimationFrame(step);
    }

    return () => cancelAnimationFrame(rafId);
}

function createAgents(count: number): Agent[] {
    return Array.from({ length: count }, (_, id) => createAgent(id, id < NUM_TANKS));
}

function createAgent(id: number, isTank: boolean): Agent {
    const stats = isTank ? TANK_STATS : FIGHTER_STATS;
    const kind: AgentKind = isTank ? 'tank' : 'fighter';
    return {
        id,
        x: randRange(WORLD_PADDING, WIDTH - WORLD_PADDING),
        y: randRange(WORLD_PADDING, HEIGHT - WORLD_PADDING),
        radius: stats.radius,
        kind,
        state: 'idle',
        behavior: kind === 'tank' ? TANK_BEHAVIOR : FIGHTER_BEHAVIOR,
        health: createHealth(stats.maxHp),
        combat: createCombat(stats.attackDamage),
        steering: createSteering(
            stats.turnRate,
            stats.idleSpeed,
            stats.fightSpeed
        ),
    };
}

function createHealth(maxHp: number): Health {
    return {
        hp: maxHp,
        maxHp,
        healRate: HEAL_RATE,
        flashTimer: 0,
        hasDied: false,
    };
}

function createCombat(attackDamage: number): Combat {
    return {
        attackDamage,
        attackCooldown: ATTACK_COOLDOWN,
        attackRange: ATTACK_RANGE,
        cooldownRemaining: 0,
    };
}

function createSteering(turnRate: number, idleSpeed: number, fightSpeed: number): Steering {
    const heading = randRange(0, Math.PI * 2);
    return {
        heading,
        targetHeading: heading,
        directionTimer: randRange(0.5, 2),
        idleSpeed,
        fightSpeed,
        turnRate,
    };
}

function updateAgents(agents: Agent[], dt: number, particlesRef: React.MutableRefObject<Particle[]>) {
    const preMovePerceptions = senseAgents(agents);
    for (let i = 0; i < agents.length; i += 1) {
        const agent = agents[i];
        if (agent.health.hp <= 0) continue;
        agent.state = agent.behavior.decideState(agent, preMovePerceptions[i]);
    }

    for (let i = 0; i < agents.length; i += 1) {
        const agent = agents[i];
        if (agent.health.hp <= 0) continue;
        const targetHeading = agent.behavior.chooseHeading(agent, preMovePerceptions[i], dt);
        const speed = agent.behavior.getSpeed(agent);
        const heading = turnTowards(agent.steering.heading, targetHeading, agent.steering.turnRate * dt);

        agent.x += Math.cos(heading) * speed * dt;
        agent.y += Math.sin(heading) * speed * dt;

        let nextHeading = heading;
        if (agent.x < agent.radius || agent.x > WIDTH - agent.radius) nextHeading = Math.PI - nextHeading;
        if (agent.y < agent.radius || agent.y > HEIGHT - agent.radius) nextHeading = -nextHeading;

        agent.x = clamp(agent.x, agent.radius, WIDTH - agent.radius);
        agent.y = clamp(agent.y, agent.radius, HEIGHT - agent.radius);
        agent.steering.heading = nextHeading;
        agent.steering.targetHeading = targetHeading;

        if (agent.health.flashTimer > 0) {
            agent.health.flashTimer = Math.max(0, agent.health.flashTimer - dt);
        }
    }

    const postMovePerceptions = senseAgents(agents);
    for (let i = 0; i < agents.length; i += 1) {
        const agent = agents[i];
        if (agent.health.hp <= 0) continue;
        agent.behavior.act(agent, postMovePerceptions[i], dt, particlesRef);
    }

    return agents.filter((agent) => agent.health.hp > 0);
}

function spawnDeathParticles(x: number, y: number, color: HslColor, particlesRef: React.MutableRefObject<Particle[]>) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 120 + 40;
        particlesRef.current.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            h: color.h, s: color.s, l: color.l
        });
    }
}

function updateParticles(dt: number, particlesRef: React.MutableRefObject<Particle[]>) {
    // Prune earlier (0.05 instead of 0) to avoid processing invisible pixels
    particlesRef.current = particlesRef.current.filter(p => p.life > 0.05);
    for (const p of particlesRef.current) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt / PARTICLE_LIFESPAN;
    }
}

function drawScene(ctx: CanvasRenderingContext2D, agents: Agent[], particles: Particle[]) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#202020';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Optimized Particle Rendering: No globalAlpha state changes
    for (const p of particles) {
        ctx.fillStyle = `hsla(${p.h}, ${p.s}%, ${p.l}%, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    for (const agent of agents) {
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, agent.radius, 0, Math.PI * 2);
        
        if (agent.health.flashTimer > 0) {
            ctx.fillStyle = 'white';
        } else {
            const hpRatio = Math.max(0, Math.min(1, agent.health.hp / agent.health.maxHp));
            const baseColor = agent.behavior.getColor(agent);
            ctx.fillStyle = applySaturation(baseColor, hpRatio);
        }
        ctx.fill();

        const lineLength = agent.radius + 5;
        ctx.beginPath();
        ctx.moveTo(agent.x, agent.y);
        ctx.lineTo(
            agent.x + Math.cos(agent.steering.heading) * lineLength,
            agent.y + Math.sin(agent.steering.heading) * lineLength
        );
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function senseAgents(agents: Agent[]): Perception[] {
    return agents.map((agent) => {
        let nearest: Agent | null = null;
        let distance = Infinity;
        let nearestInFightRange: Agent | null = null;
        let nearestTankInFightRange: Agent | null = null;
        let distanceInFightRange = Infinity;
        let distanceTankInFightRange = Infinity;
        let countInFightRange = 0;

        for (const other of agents) {
            if (other.id === agent.id || other.health.hp <= 0) continue;
            const d = Math.hypot(other.x - agent.x, other.y - agent.y);
            if (d < distance) {
                distance = d;
                nearest = other;
            }
            if (d <= FIGHT_RANGE) {
                countInFightRange += 1;
                if (d < distanceInFightRange) {
                    distanceInFightRange = d;
                    nearestInFightRange = other;
                }
                if (other.kind === 'tank' && d < distanceTankInFightRange) {
                    distanceTankInFightRange = d;
                    nearestTankInFightRange = other;
                }
            }
        }

        return { nearest, distance, nearestInFightRange, nearestTankInFightRange, countInFightRange };
    });
}

function resolveCollisions(agents: Agent[]) {
    for (let i = 0; i < agents.length; i += 1) {
        for (let j = i + 1; j < agents.length; j += 1) {
            const a = agents[i], b = agents[j];
            if (a.health.hp <= 0 || b.health.hp <= 0) continue;
            const dx = b.x - a.x, dy = b.y - a.y;
            let distance = Math.hypot(dx, dy) || 0.01;
            const minDistance = a.radius + b.radius;
            if (distance < minDistance) {
                const overlap = (minDistance - distance) / 2;
                const nx = dx / distance, ny = dy / distance;
                a.x -= nx * overlap; a.y -= ny * overlap;
                b.x += nx * overlap; b.y += ny * overlap;
            }
        }
    }
}

const FIGHTER_BEHAVIOR: AgentBehavior = {
    decideState: (agent, perception) => decideState(agent, perception),
    chooseHeading: (agent, perception, dt) => chooseHeadingFighter(agent, perception, dt),
    getSpeed: (agent) => getSpeed(agent),
    act: (agent, perception, dt, particlesRef) => actFighter(agent, perception, dt, particlesRef),
    getColor: (agent) => getColor(agent),
};

const TANK_BEHAVIOR: AgentBehavior = {
    decideState: (agent, perception) => decideState(agent, perception),
    chooseHeading: (agent, perception, dt) => chooseHeadingTank(agent, perception, dt),
    getSpeed: (agent) => getSpeed(agent),
    act: (agent, perception, dt, particlesRef) => actTank(agent, perception, dt, particlesRef),
    getColor: (agent) => getColor(agent),
};

function decideState(agent: Agent, perception: Perception): AgentState {
    if (agent.state === 'heal') {
        if (agent.health.hp >= agent.health.maxHp) return 'idle';
        return 'heal';
    }
    if (agent.state === 'idle') {
        if (perception.nearest && perception.distance <= FIGHT_RANGE) {
            return 'fight';
        }
        if (agent.health.hp < agent.health.maxHp) {
            return 'heal';
        }
        return 'idle';
    }
    if (!perception.nearest || perception.distance > FIGHT_RANGE) {
        agent.steering.directionTimer = 0;
        return 'idle';
    }
    return 'fight';
}

function chooseHeadingFighter(agent: Agent, perception: Perception, dt: number) {
    let heading = agent.steering.targetHeading;
    if (agent.state === 'fight') {
        if (agent.health.hp < FIGHTER_STATS.fleeHpThreshold && perception.nearest) {
            heading = Math.atan2(agent.y - perception.nearest.y, agent.x - perception.nearest.x);
        } else {
            const target = selectFightTarget(agent, perception);
            if (target) {
                heading = Math.atan2(target.y - agent.y, target.x - agent.x);
            }
        }
    } else if (agent.state === 'idle') {
        agent.steering.directionTimer -= dt;
        if (agent.steering.directionTimer <= 0) {
            heading = randRange(0, Math.PI * 2);
            agent.steering.directionTimer = randRange(0.75, 2.5);
        }
    }
    return heading;
}

function chooseHeadingTank(agent: Agent, perception: Perception, dt: number) {
    let heading = agent.steering.targetHeading;
    if (agent.state === 'fight') {
        if (perception.nearest) {
            heading = Math.atan2(perception.nearest.y - agent.y, perception.nearest.x - agent.x);
        }
    } else if (agent.state === 'idle') {
        agent.steering.directionTimer -= dt;
        if (agent.steering.directionTimer <= 0) {
            heading = randRange(0, Math.PI * 2);
            agent.steering.directionTimer = randRange(0.75, 2.5);
        }
    }
    return heading;
}

function actFighter(agent: Agent, perception: Perception, dt: number, particlesRef: React.MutableRefObject<Particle[]>) {
    const target = selectFightTarget(agent, perception);
    actCombat(agent, target, dt, particlesRef);
    actHeal(agent, dt);
}

function actTank(agent: Agent, perception: Perception, dt: number, particlesRef: React.MutableRefObject<Particle[]>) {
    actCombat(agent, perception.nearest, dt, particlesRef);
    actHeal(agent, dt);
}

function actCombat(agent: Agent, target: Agent | null, dt: number, particlesRef: React.MutableRefObject<Particle[]>) {
    if (agent.state === 'fight') {
        const combat = agent.combat;
        combat.cooldownRemaining = Math.max(0, combat.cooldownRemaining - dt);
        const reach = target ? combat.attackRange + agent.radius + target.radius : 0;
        const directionToTarget = target ? Math.atan2(target.y - agent.y, target.x - agent.x) : 0;
        const headingDelta = Math.abs(wrapAngle(directionToTarget - agent.steering.heading));
        const facingTarget = headingDelta <= ATTACK_ANGLE;
        const distanceToTarget = target ? Math.hypot(target.x - agent.x, target.y - agent.y) : Infinity;
        if (target && distanceToTarget <= reach && facingTarget && combat.cooldownRemaining <= 0) {
            target.health.hp -= combat.attackDamage;
            
            if (target.health.hp <= 0 && !target.health.hasDied) {
                spawnDeathParticles(target.x, target.y, getColor(target), particlesRef);
                target.health.hasDied = true;
            } else {
                target.health.flashTimer = FLASH_DURATION;
            }
            
            combat.cooldownRemaining = combat.attackCooldown;
        }
    }
}

function actHeal(agent: Agent, dt: number) {
    if (agent.state === 'heal') {
        agent.health.hp = Math.min(agent.health.maxHp, agent.health.hp + agent.health.healRate * dt);
    }
}

function getSpeed(agent: Agent) {
    return agent.state === 'fight' ? agent.steering.fightSpeed : agent.state === 'heal' ? 0 : agent.steering.idleSpeed;
}

function getColor(agent: Agent) {
    return agent.state === 'fight' ? FIGHT_COLOR : agent.state === 'heal' ? HEAL_COLOR : IDLE_COLOR;
}

function applySaturation(color: HslColor, ratio: number) {
    return `hsl(${color.h}, ${Math.max(0, ratio * color.s)}%, ${color.l}%)`;
}

function selectFightTarget(agent: Agent, perception: Perception) {
    if (agent.kind === 'fighter' && perception.countInFightRange > 1 && perception.nearestTankInFightRange) {
        return perception.nearestTankInFightRange;
    }
    return perception.nearestInFightRange ?? perception.nearest;
}

function turnTowards(current: number, target: number, maxDelta: number) {
    const delta = wrapAngle(target - current);
    if (Math.abs(delta) <= maxDelta) return target;
    return current + Math.sign(delta) * maxDelta;
}

function wrapAngle(angle: number) {
    let wrapped = angle;
    while (wrapped > Math.PI) wrapped -= Math.PI * 2;
    while (wrapped < -Math.PI) wrapped += Math.PI * 2;
    return wrapped;
}
