import {
    ACCEL_FPS2,
    MAX_SPEED_FPS,
} from './constants';
import type { Motion } from './types';

const SEC = 1000;

function profile(dist: number) {
    const accelTime = MAX_SPEED_FPS / ACCEL_FPS2;
    const accelDist = 0.5 * ACCEL_FPS2 * accelTime * accelTime;
    const total = dist <= accelDist * 2
        ? 2 * Math.sqrt(dist / ACCEL_FPS2)
        : accelTime * 2 + (dist - accelDist * 2) / MAX_SPEED_FPS;

    return {
        accelTime,
        accelDist,
        decelAt: total - accelTime,
        half: total / 2,
        total,
        triangular: dist <= accelDist * 2,
    };
}

function elapsed(motion: Motion, total: number, now: number) {
    return Math.min(total, Math.max(0, (now - motion.startedAt) / SEC));
}

export function travelMs(floors: number) {
    const dist = Math.abs(floors);

    if (dist === 0) {
        return 0;
    }

    return Math.round(profile(dist).total * SEC);
}

export function posAt(motion: Motion, now: number) {
    const dist = Math.abs(motion.to - motion.from);

    if (dist === 0) {
        return motion.to;
    }

    const prof = profile(dist);
    const dir = motion.to > motion.from ? 1 : -1;
    const t = elapsed(motion, prof.total, now);
    let covered: number;

    if (prof.triangular) {
        covered = t <= prof.half
            ? 0.5 * ACCEL_FPS2 * t * t
            : dist - 0.5 * ACCEL_FPS2 * (prof.total - t) * (prof.total - t);
    } else if (t < prof.accelTime) {
        covered = 0.5 * ACCEL_FPS2 * t * t;
    } else if (t < prof.decelAt) {
        covered = prof.accelDist + MAX_SPEED_FPS * (t - prof.accelTime);
    } else {
        covered = dist - 0.5 * ACCEL_FPS2 * (prof.total - t) * (prof.total - t);
    }

    return motion.from + dir * Math.min(dist, Math.max(0, covered));
}

export function velAt(motion: Motion, now: number) {
    const dist = Math.abs(motion.to - motion.from);

    if (dist === 0) {
        return 0;
    }

    const prof = profile(dist);
    const dir = motion.to > motion.from ? 1 : -1;
    const t = elapsed(motion, prof.total, now);
    let speed: number;

    if (prof.triangular) {
        speed = t <= prof.half
            ? ACCEL_FPS2 * t
            : ACCEL_FPS2 * (prof.total - t);
    } else if (t < prof.accelTime) {
        speed = ACCEL_FPS2 * t;
    } else if (t < prof.decelAt) {
        speed = MAX_SPEED_FPS;
    } else {
        speed = ACCEL_FPS2 * (prof.total - t);
    }

    return dir * Math.max(0, speed);
}
