import type { RefObject } from 'react';

export type AgentStats = {
    radius: number;
    maxHp: number;
    attackDamage: number;
    speed: number;
    turnRate: number;
    fleeHpThreshold: number;
};

export type AgentState = 'idle' | 'fight' | 'heal' | 'flee';
export type AgentKind = 'fighter' | 'tank';

export type Health = {
    hp: number;
    maxHp: number;
    healRate: number;
    flashTimer: number;
    hasDied: boolean;
};

export type Combat = {
    attackDamage: number;
    attackCooldown: number;
    attackRange: number;
    cooldownRemaining: number;
    targetId: number | null;
};

export type Steering = {
    heading: number;
    targetHeading: number;
    directionTimer: number;
    speed: number;
    turnRate: number;
};

export type Agent = {
    id: number;
    x: number;
    y: number;
    radius: number;
    kind: AgentKind;
    color: HslColor;
    state: AgentState;
    behavior: AgentBehavior;
    health: Health;
    combat: Combat;
    steering: Steering;
    fleeHpThreshold: number;
};

export type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    h: number;
    s: number;
    l: number;
};

export type HslColor = { h: number; s: number; l: number };

export type Perception = {
    nearest: Agent | null;
    distance: number;
    nearestInFightRange: Agent | null;
    nearestTankInFightRange: Agent | null;
    countInFightRange: number;
};

export type AgentBehavior = {
    decideState: (agent: Agent, perception: Perception) => AgentState;
    chooseHeading: (agent: Agent, perception: Perception, dt: number) => number;
    pickTarget: (agent: Agent, perception: Perception) => Agent | null;
    getSpeed: (agent: Agent) => number;
    act: (agent: Agent, target: Agent | null, dt: number, particlesRef: RefObject<Particle[]>) => void;
    getColor: (agent: Agent) => HslColor;
};
