import type { AgentStats, HslColor } from './types';

export const HEIGHT = 1000;
export const WIDTH = 1000;
export const WORLD_PADDING = 10;
export const NUM_FIGHTERS = 15;
export const NUM_TANK = 10;
export const NUM_RANGERS = 5;
export const FIGHT_RANGE = 250;
export const FLEE_RANGE = 150;
export const MELEE_ATTACK_RANGE = 5;
export const RANGER_ATTACK_RANGE = 150;
export const ATTACK_ANGLE = Math.PI / 12;
export const ATTACK_COOLDOWN = 1;
export const HEAL_RATE = 10;
export const FLASH_DURATION = 0.1;
export const PARTICLE_LIFESPAN = 0.5;
export const PARTICLE_COUNT = 6;
export const PROJECTILE_SPEED = 220;
export const PROJECTILE_RADIUS = 3;

export const FIGHTER_COLOR: HslColor = { h: 210, s: 100, l: 60 };
export const TANK_COLOR: HslColor = { h: 0, s: 100, l: 60 };
export const RANGER_COLOR: HslColor = { h: 120, s: 100, l: 60 };
export const AGENT_HUE_VARIANCE = { min: -10, max: 10 };
export const AGENT_SATURATION_RANGE = { min: 50, max: 70 };
export const AGENT_LIGHTNESS_RANGE = { min: 40, max: 60 };

export const FIGHTER_STATS: AgentStats = {
    radius: 15,
    maxHp: 100,
    attackDamage: 25,
    speed: 75,
    turnRate: 2 * Math.PI,
    fleeHpThreshold: 40,
};

export const RANGER_STATS: AgentStats = {
    radius: 15,
    maxHp: 100,
    attackDamage: 25,
    speed: 75,
    turnRate: 2 * Math.PI,
    fleeHpThreshold: 40,
};

export const TANK_STATS: AgentStats = {
    radius: 25,
    maxHp: 500,
    attackDamage: 33,
    speed: 50,
    turnRate: Math.PI / 2,
    fleeHpThreshold: -1,
};
