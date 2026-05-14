import type { RefObject } from 'react';

import {
    ATTACK_ANGLE,
    ATTACK_COOLDOWN,
    MELEE_ATTACK_RANGE,
    RANGER_ATTACK_RANGE,
    FIGHTER_COLOR,
    AGENT_HUE_VARIANCE,
    AGENT_LIGHTNESS_RANGE,
    AGENT_SATURATION_RANGE,
    FIGHT_RANGE,
    FLEE_RANGE,
    FLASH_DURATION,
    FIGHTER_STATS,
    HEAL_RATE,
    HEIGHT,
    NUM_FIGHTERS,
    NUM_RANGERS,
    NUM_TANK,
    PARTICLE_COUNT,
    PARTICLE_LIFESPAN,
    PROJECTILE_RADIUS,
    PROJECTILE_SPEED,
    RANGER_COLOR,
    RANGER_STATS,
    TANK_COLOR,
    TANK_STATS,
    WIDTH,
    WORLD_PADDING,
} from './constants';
import type { Agent, AgentBehavior, AgentState, HslColor, Particle, Perception, Projectile } from './types';

const randRange = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const SIM_STEP = 1 / 60;
const AI_STEP = 1 / 10;
const RENDER_STEP = 1 / 60;
const MAX_FRAME_TIME = 0.25;

const FIGHTER_BEHAVIOR: AgentBehavior = {
    decideState: (agent, perception) => decideState(agent, perception),
    chooseHeading: (agent, perception, dt) => chooseHeadingFighter(agent, perception, dt),
    pickTarget: (agent, perception) => pickTargetFighter(agent, perception),
    getSpeed: (agent) => getSpeed(agent),
    act: (agent, target, dt, particlesRef, projectiles) =>
        actFighter(agent, target, dt, particlesRef, projectiles),
    getColor: (agent) => getColor(agent),
};

const RANGER_BEHAVIOR: AgentBehavior = {
    decideState: (agent, perception) => decideState(agent, perception),
    chooseHeading: (agent, perception, dt) => chooseHeadingFighter(agent, perception, dt),
    pickTarget: (agent, perception) => pickTargetRanger(agent, perception),
    getSpeed: (agent) => getSpeed(agent),
    act: (agent, target, dt, particlesRef, projectiles) =>
        actFighter(agent, target, dt, particlesRef, projectiles),
    getColor: (agent) => getColor(agent),
};

const TANK_BEHAVIOR: AgentBehavior = {
    decideState: (agent, perception) => decideState(agent, perception),
    chooseHeading: (agent, perception, dt) => chooseHeadingTank(agent, perception, dt),
    pickTarget: (agent, perception) => pickTargetTank(agent, perception),
    getSpeed: (agent) => getSpeed(agent),
    act: (agent, target, dt, particlesRef, projectiles) =>
        actTank(agent, target, dt, particlesRef, projectiles),
    getColor: (agent) => getColor(agent),
};

export function runSimulation(canvas: HTMLCanvasElement, particlesRef: RefObject<Particle[]>) {
    const context = canvas.getContext('2d');
    if (!context) return () => {};
    const ctx = context;

    let agents = createAgents();
    let projectiles: Projectile[] = [];
    resolveCollisions(agents);

    let lastTimestamp = performance.now();
    let simAccumulator = 0;
    let aiAccumulator = AI_STEP;
    let renderAccumulator = RENDER_STEP;
    let rafId = requestAnimationFrame(step);

    function step(timestamp: number) {
        const frameTime = Math.min((timestamp - lastTimestamp) / 1000, MAX_FRAME_TIME);
        lastTimestamp = timestamp;

        simAccumulator += frameTime;
        aiAccumulator += frameTime;
        renderAccumulator += frameTime;

        while (aiAccumulator >= AI_STEP) {
            updateAgentBrains(agents, AI_STEP);
            aiAccumulator -= AI_STEP;
        }

        while (simAccumulator >= SIM_STEP) {
            agents = updateAgents(agents, SIM_STEP, particlesRef, projectiles);
            agents = updateProjectiles(agents, projectiles, SIM_STEP, particlesRef);
            updateParticles(SIM_STEP, particlesRef);
            resolveCollisions(agents);
            simAccumulator -= SIM_STEP;
        }

        if (renderAccumulator >= RENDER_STEP) {
            drawScene(ctx, agents, projectiles, particlesRef.current);
            renderAccumulator %= RENDER_STEP;
        }

        rafId = requestAnimationFrame(step);
    }

    return () => cancelAnimationFrame(rafId);
}

function createAgents(): Agent[] {
    const agents: Agent[] = [];
    let id = 0;
    for (let i = 0; i < NUM_TANK; i += 1) {
        agents.push(createAgent(id, 'tank'));
        id += 1;
    }
    for (let i = 0; i < NUM_FIGHTERS; i += 1) {
        agents.push(createAgent(id, 'fighter'));
        id += 1;
    }
    for (let i = 0; i < NUM_RANGERS; i += 1) {
        agents.push(createAgent(id, 'ranger'));
        id += 1;
    }
    return agents;
}

function createAgent(id: number, kind: Agent['kind']): Agent {
    const stats = kind === 'tank' ? TANK_STATS : kind === 'ranger' ? RANGER_STATS : FIGHTER_STATS;
    const baseColor = kind === 'tank' ? TANK_COLOR : kind === 'ranger' ? RANGER_COLOR : FIGHTER_COLOR;
    const attackRange = kind === 'ranger' ? RANGER_ATTACK_RANGE : MELEE_ATTACK_RANGE;
    const hue = (baseColor.h + randRange(AGENT_HUE_VARIANCE.min, AGENT_HUE_VARIANCE.max) + 360) % 360;
    return {
        id,
        x: randRange(WORLD_PADDING, WIDTH - WORLD_PADDING),
        y: randRange(WORLD_PADDING, HEIGHT - WORLD_PADDING),
        radius: stats.radius,
        kind,
        color: {
            h: hue,
            s: randRange(AGENT_SATURATION_RANGE.min, AGENT_SATURATION_RANGE.max),
            l: randRange(AGENT_LIGHTNESS_RANGE.min, AGENT_LIGHTNESS_RANGE.max),
        },
        state: 'idle',
        behavior: kind === 'tank' ? TANK_BEHAVIOR : kind === 'ranger' ? RANGER_BEHAVIOR : FIGHTER_BEHAVIOR,
        health: createHealth(stats.maxHp),
        combat: createCombat(stats.attackDamage, attackRange),
        steering: createSteering(stats.turnRate, stats.speed),
        fleeHpThreshold: stats.fleeHpThreshold,
        kills: 0,
    };
}

function createHealth(maxHp: number) {
    return {
        hp: maxHp,
        maxHp,
        healRate: HEAL_RATE,
        flashTimer: 0,
        hasDied: false,
    };
}

function createCombat(attackDamage: number, attackRange: number) {
    return {
        attackDamage,
        attackCooldown: ATTACK_COOLDOWN,
        attackRange,
        cooldownRemaining: 0,
        targetId: null,
    };
}

function createSteering(turnRate: number, speed: number) {
    const heading = randRange(0, Math.PI * 2);
    return {
        heading,
        targetHeading: heading,
        directionTimer: randRange(0.5, 2),
        speed,
        turnRate,
        holdRange: false,
    };
}

function updateAgentBrains(agents: Agent[], dt: number) {
    const perceptions = senseAgents(agents);
    for (let i = 0; i < agents.length; i += 1) {
        const agent = agents[i];
        if (agent.health.hp <= 0) continue;
        const perception = perceptions[i];
        agent.state = agent.behavior.decideState(agent, perception);
        agent.steering.targetHeading = agent.behavior.chooseHeading(agent, perception, dt);
        const target = agent.behavior.pickTarget(agent, perception);
        agent.combat.targetId = target ? target.id : null;
        if (agent.kind === 'ranger' && agent.state === 'fight' && target) {
            const distance = Math.hypot(target.x - agent.x, target.y - agent.y);
            const holdDistance = agent.combat.attackRange * 0.7;
            const chaseDistance = agent.combat.attackRange * 0.9;
            if (distance <= holdDistance) {
                agent.steering.holdRange = true;
            } else if (distance >= chaseDistance) {
                agent.steering.holdRange = false;
            }
        } else {
            agent.steering.holdRange = false;
        }
    }
}

function updateAgents(
    agents: Agent[],
    dt: number,
    particlesRef: RefObject<Particle[]>,
    projectiles: Projectile[]
) {
    const targetsById = new Map<number, Agent>();
    for (const agent of agents) {
        if (agent.health.hp > 0) targetsById.set(agent.id, agent);
    }

    for (let i = 0; i < agents.length; i += 1) {
        const agent = agents[i];
        if (agent.health.hp <= 0) continue;
        const speed = agent.behavior.getSpeed(agent);
        const heading = turnTowards(
            agent.steering.heading,
            agent.steering.targetHeading,
            agent.steering.turnRate * dt
        );

        // TODO: track velocity/acceleration to support impulses (e.g., knockback) instead of direct position nudges.
        agent.x += Math.cos(heading) * speed * dt;
        agent.y += Math.sin(heading) * speed * dt;

        let nextHeading = heading;
        if (agent.x < agent.radius || agent.x > WIDTH - agent.radius) nextHeading = Math.PI - nextHeading;
        if (agent.y < agent.radius || agent.y > HEIGHT - agent.radius) nextHeading = -nextHeading;

        agent.x = clamp(agent.x, agent.radius, WIDTH - agent.radius);
        agent.y = clamp(agent.y, agent.radius, HEIGHT - agent.radius);
        agent.steering.heading = nextHeading;

        if (agent.health.flashTimer > 0) {
            agent.health.flashTimer = Math.max(0, agent.health.flashTimer - dt);
        }
    }

    for (let i = 0; i < agents.length; i += 1) {
        const agent = agents[i];
        if (agent.health.hp <= 0) continue;
        const targetId = agent.combat.targetId;
        let target = targetId === null ? null : targetsById.get(targetId) ?? null;
        if (target && target.health.hp <= 0) target = null;
        agent.behavior.act(agent, target, dt, particlesRef, projectiles);
    }

    return agents.filter((agent) => agent.health.hp > 0);
}

function updateProjectiles(
    agents: Agent[],
    projectiles: Projectile[],
    dt: number,
    particlesRef: RefObject<Particle[]>
) {
    let writeIndex = 0;

    for (let i = 0; i < projectiles.length; i += 1) {
        const projectile = projectiles[i];
        const nextX = projectile.x + projectile.vx * dt;
        const nextY = projectile.y + projectile.vy * dt;
        const hit = findProjectileHit(agents, projectile, nextX, nextY);

        if (hit) {
            applyDamage(hit, projectile.damage, particlesRef, projectile.owner);
            continue;
        }

        projectile.x = nextX;
        projectile.y = nextY;

        if (
            projectile.x >= -projectile.radius &&
            projectile.x <= WIDTH + projectile.radius &&
            projectile.y >= -projectile.radius &&
            projectile.y <= HEIGHT + projectile.radius
        ) {
            projectiles[writeIndex] = projectile;
            writeIndex += 1;
        }
    }

    projectiles.length = writeIndex;

    return agents.filter((agent) => agent.health.hp > 0);
}

function findProjectileHit(agents: Agent[], projectile: Projectile, nextX: number, nextY: number) {
    const startX = projectile.x;
    const startY = projectile.y;
    const dx = nextX - startX;
    const dy = nextY - startY;
    const segmentLengthSquared = dx * dx + dy * dy || 1;
    let hit: Agent | null = null;
    let earliestT = 2;

    for (let i = 0; i < agents.length; i += 1) {
        const agent = agents[i];
        if (agent.id === projectile.owner.id || agent.health.hp <= 0) continue;

        const combinedRadius = agent.radius + projectile.radius;
        const toAgentX = agent.x - startX;
        const toAgentY = agent.y - startY;
        const projection = clamp(
            (toAgentX * dx + toAgentY * dy) / segmentLengthSquared,
            0,
            1
        );
        const closestX = startX + dx * projection;
        const closestY = startY + dy * projection;
        const distX = agent.x - closestX;
        const distY = agent.y - closestY;

        if (distX * distX + distY * distY <= combinedRadius * combinedRadius && projection < earliestT) {
            earliestT = projection;
            hit = agent;
        }
    }

    return hit;
}

function spawnDeathParticles(x: number, y: number, color: HslColor, particlesRef: RefObject<Particle[]>) {
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

function updateParticles(dt: number, particlesRef: RefObject<Particle[]>) {
    particlesRef.current = particlesRef.current.filter((p) => p.life > 0.05);
    for (const p of particlesRef.current) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt / PARTICLE_LIFESPAN;
    }
}

function drawScene(
    ctx: CanvasRenderingContext2D,
    agents: Agent[],
    projectiles: Projectile[],
    particles: Particle[]
) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#202020';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const projectile of projectiles) {
        ctx.fillStyle = `hsl(${projectile.color.h}, ${projectile.color.s}%, ${projectile.color.l}%)`;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    for (const p of particles) {
        ctx.fillStyle = `hsla(${p.h}, ${p.s}%, ${p.l}%, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    for (const agent of agents) {
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, agent.radius, 0, Math.PI * 2);

        const hpRatio = Math.max(0, Math.min(1, agent.health.hp / getMaxHp(agent)));

        if (agent.health.flashTimer > 0) {
            ctx.fillStyle = 'white';
        } else {
            const baseColor = agent.behavior.getColor(agent);
            ctx.fillStyle = `hsl(${baseColor.h}, ${baseColor.s}%, ${baseColor.l}%)`;
        }
        ctx.fill();

        drawStateGlyph(ctx, agent);
        drawHealthRing(ctx, agent, hpRatio);
        drawKillTicks(ctx, agent);

        const markerDist = agent.radius * 0.8;
        ctx.beginPath();
        ctx.arc(
            agent.x + Math.cos(agent.steering.heading) * markerDist,
            agent.y + Math.sin(agent.steering.heading) * markerDist,
            2,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = 'black';
        ctx.fill();
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

function decideState(agent: Agent, perception: Perception): AgentState {
    const nearestEnemy = perception.nearest;
    const lowHealth = agent.fleeHpThreshold >= 0 && agent.health.hp < agent.fleeHpThreshold;
    const enemyInFleeRange = !!nearestEnemy && perception.distance <= FLEE_RANGE;
    const shouldFlee = lowHealth && enemyInFleeRange;

    if (agent.state === 'flee') {
        if (!nearestEnemy || perception.distance > FLEE_RANGE) {
            agent.steering.directionTimer = 0;
            return 'idle';
        }
        return 'flee';
    }

    if (agent.state === 'heal') {
        if (shouldFlee) return 'flee';
        if (agent.health.hp >= getMaxHp(agent)) return 'idle';
        return 'heal';
    }

    if (agent.state === 'idle') {
        if (agent.health.hp < getMaxHp(agent)) {
            return 'heal';
        }
        if (nearestEnemy && perception.distance <= FIGHT_RANGE) {
            return 'fight';
        }
        return 'idle';
    }

    if (shouldFlee) return 'flee';
    if (!nearestEnemy || perception.distance > FIGHT_RANGE) {
        agent.steering.directionTimer = 0;
        return 'idle';
    }
    return 'fight';
}

function chooseHeadingFighter(agent: Agent, perception: Perception, dt: number) {
    let heading = agent.steering.targetHeading;
    if (agent.state === 'flee') {
        if (perception.nearest) {
            heading = Math.atan2(agent.y - perception.nearest.y, agent.x - perception.nearest.x);
        }
    } else if (agent.state === 'fight') {
        const target = selectFightTarget(agent, perception);
        if (target) {
            heading = Math.atan2(target.y - agent.y, target.x - agent.x);
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
    if (agent.state === 'flee') {
        if (perception.nearest) {
            heading = Math.atan2(agent.y - perception.nearest.y, agent.x - perception.nearest.x);
        }
    } else if (agent.state === 'fight') {
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

function actFighter(
    agent: Agent,
    target: Agent | null,
    dt: number,
    particlesRef: RefObject<Particle[]>,
    projectiles: Projectile[]
) {
    actCombat(agent, target, dt, particlesRef, projectiles);
    actHeal(agent, dt);
}

function actTank(
    agent: Agent,
    target: Agent | null,
    dt: number,
    particlesRef: RefObject<Particle[]>,
    projectiles: Projectile[]
) {
    actCombat(agent, target, dt, particlesRef, projectiles);
    actHeal(agent, dt);
}

function actCombat(
    agent: Agent,
    target: Agent | null,
    dt: number,
    particlesRef: RefObject<Particle[]>,
    projectiles: Projectile[]
) {
    if (agent.state === 'fight') {
        const combat = agent.combat;
        combat.cooldownRemaining = Math.max(0, combat.cooldownRemaining - dt);
        const reach = target ? combat.attackRange + agent.radius + target.radius : 0;
        const directionToTarget = target ? Math.atan2(target.y - agent.y, target.x - agent.x) : 0;
        const headingDelta = Math.abs(wrapAngle(directionToTarget - agent.steering.heading));
        const facingTarget = headingDelta <= ATTACK_ANGLE;
        const distanceToTarget = target ? Math.hypot(target.x - agent.x, target.y - agent.y) : Infinity;
        const attackDamage = getAttackDamage(agent);
        if (target && distanceToTarget <= reach && facingTarget && combat.cooldownRemaining <= 0) {
            if (agent.kind === 'ranger') {
                spawnProjectile(agent, target, projectiles, attackDamage);
            } else {
                applyDamage(target, attackDamage, particlesRef, agent);
            }

            combat.cooldownRemaining = combat.attackCooldown;
        }
    }
}

function spawnProjectile(agent: Agent, target: Agent, projectiles: Projectile[], damage: number) {
    const angle = Math.atan2(target.y - agent.y, target.x - agent.x);
    const spawnOffset = agent.radius + PROJECTILE_RADIUS;
    projectiles.push({
        owner: agent,
        x: agent.x + Math.cos(angle) * spawnOffset,
        y: agent.y + Math.sin(angle) * spawnOffset,
        vx: Math.cos(angle) * PROJECTILE_SPEED,
        vy: Math.sin(angle) * PROJECTILE_SPEED,
        radius: PROJECTILE_RADIUS,
        damage,
        color: agent.color,
    });
}

function applyDamage(target: Agent, damage: number, particlesRef: RefObject<Particle[]>, source: Agent | null) {
    target.health.hp -= damage;

    if (target.health.hp <= 0 && !target.health.hasDied) {
        spawnDeathParticles(target.x, target.y, getColor(target), particlesRef);
        target.health.hasDied = true;
        if (source) {
            const hpRatio = Math.max(0, source.health.hp / getMaxHp(source));
            source.kills += 1 + Math.floor(target.kills / 3);
            source.health.hp = getMaxHp(source) * hpRatio;
        }
    } else {
        target.health.flashTimer = FLASH_DURATION;
    }
}

function actHeal(agent: Agent, dt: number) {
    if (agent.state === 'heal') {
        agent.health.hp = Math.min(getMaxHp(agent), agent.health.hp + agent.health.healRate * dt);
    }
}

function getSpeed(agent: Agent) {
    const speed = agent.steering.speed * getSpeedMultiplier(agent);
    if (agent.state === 'flee') {
        return speed * 1.2;
    }
    if (agent.state === 'heal') {
        return 0;
    }
    if (agent.kind === 'ranger' && agent.state === 'fight' && agent.steering.holdRange) {
        return 0;
    }
    return speed;
}

function getColor(agent: Agent) {
    return agent.color;
}

function getSpeedMultiplier(agent: Agent) {
    return 1 + agent.kills * 0.05;
}

function getAttackDamage(agent: Agent) {
    return agent.combat.attackDamage * (1 + agent.kills * 0.1);
}

function getMaxHp(agent: Agent) {
    return agent.health.maxHp * (1 + agent.kills * 0.08);
}

function pickTargetFighter(agent: Agent, perception: Perception) {
    if (agent.state !== 'fight') return null;
    return perception.nearest;
}

function pickTargetRanger(agent: Agent, perception: Perception) {
    if (agent.state !== 'fight') return null;
    return perception.nearest;
}

function pickTargetTank(agent: Agent, perception: Perception) {
    if (agent.state !== 'fight') return null;
    return perception.nearest;
}

function selectFightTarget(_: Agent, perception: Perception) {
    // TODO: refactor targeting into a proper behavior tree.
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

function drawHealthRing(ctx: CanvasRenderingContext2D, agent: Agent, hpRatio: number) {
    const ringRadius = agent.radius + 2;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.arc(agent.x, agent.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = `hsl(${hpRatio * 120}, 90%, 50%)`;
    ctx.arc(
        agent.x,
        agent.y,
        ringRadius,
        -Math.PI / 2,
        -Math.PI / 2 - Math.PI * 2 * hpRatio,
        true
    );
    ctx.stroke();
}

function drawKillTicks(ctx: CanvasRenderingContext2D, agent: Agent) {
    if (agent.kills <= 0) return;

    const innerRadius = agent.radius + 5;
    const outerRadius = innerRadius + 4;
    const step = Math.PI / 12;

    ctx.strokeStyle = '#f3c64d';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < agent.kills; i += 1) {
        const angle = -Math.PI / 2 + i * step;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(agent.x + cos * innerRadius, agent.y + sin * innerRadius);
        ctx.lineTo(agent.x + cos * outerRadius, agent.y + sin * outerRadius);
        ctx.stroke();
    }
}

function drawStateGlyph(ctx: CanvasRenderingContext2D, agent: Agent) {
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    const size = agent.radius * 0.8;

    if (agent.state === 'heal') {
        ctx.beginPath();
        ctx.moveTo(agent.x - size / 2, agent.y);
        ctx.lineTo(agent.x + size / 2, agent.y);
        ctx.moveTo(agent.x, agent.y - size / 2);
        ctx.lineTo(agent.x, agent.y + size / 2);
        ctx.stroke();
    } else if (agent.state === 'flee') {
        const barHeight = size * 0.9;
        const dotOffset = size * 0.6;
        ctx.beginPath();
        ctx.moveTo(agent.x, agent.y - barHeight / 2);
        ctx.lineTo(agent.x, agent.y + barHeight / 4);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(agent.x, agent.y + dotOffset, 1.75, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();
    }
}
