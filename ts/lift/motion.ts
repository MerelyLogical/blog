import {
    ACCEL_FPS2,
    MAX_SPEED_FPS,
} from './constants';
import type { Motion } from './types';

const SEC = 1000;

export function travelMs(floors: number) {
    const dist = Math.abs(floors);

    if (dist === 0) {
        return 0;
    }

    const accelTime = MAX_SPEED_FPS / ACCEL_FPS2;
    const accelDist = 0.5 * ACCEL_FPS2 * accelTime * accelTime;
    const seconds = dist <= accelDist * 2
        ? 2 * Math.sqrt(dist / ACCEL_FPS2)
        : accelTime * 2 + (dist - accelDist * 2) / MAX_SPEED_FPS;

    return Math.round(seconds * SEC);
}

export function posAt(motion: Motion, now: number) {
    const dist = Math.abs(motion.to - motion.from);

    if (dist === 0) {
        return motion.to;
    }

    const dir = motion.to > motion.from ? 1 : -1;
    const rawElapsed = Math.max(0, (now - motion.startedAt) / SEC);
    const accelTime = MAX_SPEED_FPS / ACCEL_FPS2;
    const accelDist = 0.5 * ACCEL_FPS2 * accelTime * accelTime;
    const total = travelMs(dist) / SEC;
    const elapsed = Math.min(total, rawElapsed);
    const decelAt = total - accelTime;
    let covered: number;

    if (dist <= accelDist * 2) {
        const half = total / 2;

        covered = elapsed <= half
            ? 0.5 * ACCEL_FPS2 * elapsed * elapsed
            : dist - 0.5 * ACCEL_FPS2 * (total - elapsed) * (total - elapsed);
    } else if (elapsed < accelTime) {
        covered = 0.5 * ACCEL_FPS2 * elapsed * elapsed;
    } else if (elapsed < decelAt) {
        covered = accelDist + MAX_SPEED_FPS * (elapsed - accelTime);
    } else {
        covered = dist - 0.5 * ACCEL_FPS2 * (total - elapsed) * (total - elapsed);
    }

    return motion.from + dir * Math.min(dist, Math.max(0, covered));
}

export function velAt(motion: Motion, now: number) {
    const dist = Math.abs(motion.to - motion.from);

    if (dist === 0) {
        return 0;
    }

    const dir = motion.to > motion.from ? 1 : -1;
    const rawElapsed = Math.max(0, (now - motion.startedAt) / SEC);
    const accelTime = MAX_SPEED_FPS / ACCEL_FPS2;
    const accelDist = 0.5 * ACCEL_FPS2 * accelTime * accelTime;
    const total = travelMs(dist) / SEC;
    const elapsed = Math.min(total, rawElapsed);
    const decelAt = total - accelTime;
    let speed: number;

    if (dist <= accelDist * 2) {
        const half = total / 2;

        speed = elapsed <= half
            ? ACCEL_FPS2 * elapsed
            : ACCEL_FPS2 * (total - elapsed);
    } else if (elapsed < accelTime) {
        speed = ACCEL_FPS2 * elapsed;
    } else if (elapsed < decelAt) {
        speed = MAX_SPEED_FPS;
    } else {
        speed = ACCEL_FPS2 * (total - elapsed);
    }

    return dir * Math.max(0, speed);
}
