import type { AgentStats, HslColor } from './types';

export const HEIGHT = 1000;
export const WIDTH = 1000;
export const WORLD_PADDING = 10;
export const NUM_AGENTS = 50;
export const NUM_TANKS = 8;
export const FIGHT_RANGE = 250;
export const FLEE_RANGE = 150;
export const ATTACK_RANGE = 10;
export const ATTACK_ANGLE = Math.PI / 12;
export const ATTACK_COOLDOWN = 1;
export const HEAL_RATE = 10;
export const FLASH_DURATION = 0.1;
export const PARTICLE_LIFESPAN = 0.5;
export const PARTICLE_COUNT = 12;

export const IDLE_COLOR: HslColor = { h: 180, s: 100, l: 60 };
export const FIGHT_COLOR: HslColor = { h: 0, s: 100, l: 60 };
export const HEAL_COLOR: HslColor = { h: 120, s: 100, l: 60 };
export const FLEE_COLOR: HslColor = { h: 270, s: 100, l: 60 };

export const FIGHTER_STATS: AgentStats = {
    radius: 10,
    maxHp: 100,
    attackDamage: 25,
    idleSpeed: 75,
    fightSpeed: 75,
    turnRate: 4 * Math.PI,
    fleeHpThreshold: 40,
};

export const TANK_STATS: AgentStats = {
    radius: 20,
    maxHp: 500,
    attackDamage: 33,
    idleSpeed: 33,
    fightSpeed: 33,
    turnRate: Math.PI / 2,
    fleeHpThreshold: -1,
};
