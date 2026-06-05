import {
    FADE_MS,
    FLOORS,
    LINGER_MS,
    MAX_RIDERS,
    TOP,
    WALK_MS,
} from './constants';
import { SLOTS } from './layout';
import type { Action, Dir, Rider, Step } from './types';

export function next(floor: number, dir: Dir) {
    if (floor === TOP && dir === 1) {
        return { floor: floor - 1, dir: -1 as Dir };
    }

    if (floor === 0 && dir === -1) {
        return { floor: floor + 1, dir: 1 as Dir };
    }

    return { floor: floor + dir, dir };
}

export function requestedFloor(riders: Rider[], floor: number) {
    const riding = riders.filter((rider) => rider.place === 'riding');

    if (riding.length === 0) {
        return undefined;
    }

    return riding.reduce((best, rider) => {
        if (Math.abs(rider.dest - floor) < Math.abs(best - floor)) {
            return rider.dest;
        }

        return best;
    }, riding[0].dest);
}

export function nextRequested(floor: number, dir: Dir, riders: Rider[]) {
    const dest = requestedFloor(riders, floor);

    if (dest === undefined) {
        return next(floor, dir);
    }

    if (dest === floor) {
        return { floor, dir };
    }

    const nextDir = dest > floor ? 1 : -1;

    return { floor: floor + nextDir, dir: nextDir as Dir };
}

export function hasDrop(current: Rider[], floor: number) {
    return current.some((rider) => rider.place === 'riding' && rider.dest === floor);
}

function randFloor() {
    return Math.floor(Math.random() * FLOORS);
}

export function spawn(current: Rider[], now = Date.now()): Rider[] {
    if (current.length >= MAX_RIDERS) {
        return current;
    }

    const floor = randFloor();
    let dest = randFloor();

    while (dest === floor) {
        dest = randFloor();
    }

    return [
        ...current,
        {
            id: now + Math.random(),
            floor,
            dest,
            place: 'waiting',
            spawnedAt: now,
        },
    ];
}

export function canBoard(current: Rider[], floor: number) {
    const used = new Set(current
        .filter((rider) => (
            (rider.place === 'riding' || rider.place === 'boarding') &&
            rider.slot !== undefined
        ))
        .map((rider) => rider.slot));
    const waiting = current.some((rider) => rider.place === 'waiting' && rider.floor === floor);
    const slot = SLOTS.findIndex((_, index) => !used.has(index));

    return waiting && slot !== -1;
}

export function stopWork(current: Rider[], floor: number, now: number) {
    return current.some((rider) => (
        (rider.place === 'riding' && rider.dest === floor) ||
        (rider.walkUntil !== undefined && rider.walkUntil > now)
    )) || canBoard(current, floor);
}

function boardStep(current: Rider[], floor: number, now: number): Step {
    const used = new Set(current
        .filter((rider) => (
            (rider.place === 'riding' || rider.place === 'boarding') &&
            rider.slot !== undefined
        ))
        .map((rider) => rider.slot));

    let acted = false;
    let floorWait: number | undefined;
    const riders = current.map((rider) => {
        if (acted || rider.place !== 'waiting' || rider.floor !== floor) {
            return rider;
        }

        const slot = SLOTS.findIndex((_, index) => !used.has(index));

        if (slot === -1) {
            return rider;
        }

        acted = true;
        floorWait = now - rider.spawnedAt;
        used.add(slot);
        return { ...rider, place: 'boarding' as const, slot, boardedAt: now, walkUntil: now + WALK_MS };
    });

    return {
        riders,
        acted,
        action: 'board',
        floorWait,
    };
}

function alightStep(current: Rider[], floor: number, now: number): Step {
    let acted = false;
    let liftWait: number | undefined;
    const riders = current.map((rider) => {
        if (acted || rider.place !== 'riding' || rider.dest !== floor) {
            return rider;
        }

        acted = true;
        liftWait = now - (rider.boardedAt ?? now);
        const fadeAt = now + LINGER_MS;

        return {
            ...rider,
            floor,
            place: 'leaving' as const,
            slot: undefined,
            walkUntil: now + WALK_MS,
            fadeAt,
            removeAt: fadeAt + FADE_MS,
        };
    });

    return { riders, acted, action: 'alight', trip: acted, liftWait };
}

export function stepRiders(current: Rider[], floor: number, now: number, action: Action): Step {
    if (action === 'alight') {
        return alightStep(current, floor, now);
    }

    return boardStep(current, floor, now);
}

function riderDue(rider: Rider) {
    if (rider.walkUntil !== undefined) {
        return rider.walkUntil;
    }

    if (rider.place === 'leaving') {
        return rider.fadeAt;
    }

    if (rider.place === 'fading') {
        return rider.removeAt;
    }

    return undefined;
}

export function nextRiderDue(riders: Rider[]) {
    const due = riders
        .map(riderDue)
        .filter((time): time is number => time !== undefined);

    if (due.length === 0) {
        return undefined;
    }

    return Math.min(...due);
}

export function ageRiders(current: Rider[], now: number): Rider[] {
    return current
        .map((rider) => {
            if (rider.place === 'boarding' && rider.walkUntil !== undefined && rider.walkUntil <= now) {
                return { ...rider, place: 'riding' as const, walkUntil: undefined };
            }

            if (rider.place === 'leaving' && rider.walkUntil !== undefined && rider.walkUntil <= now) {
                return { ...rider, walkUntil: undefined };
            }

            if (rider.place === 'leaving' && rider.fadeAt !== undefined && rider.fadeAt <= now) {
                return { ...rider, place: 'fading' as const };
            }

            return rider;
        })
        .filter((rider) => !(
            rider.place === 'fading' &&
            rider.removeAt !== undefined &&
            rider.removeAt <= now
        ));
}
