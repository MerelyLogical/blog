import { next, stopWork } from './sim.ts';
import type { Algo, Dir, Empty, Move, Occupied, Rider } from './types.ts';

export const EMPTY: { id: Empty; label: string }[] = [
    { id: 'patrol',  label: 'Patrol' },
    { id: 'nearest', label: 'Nearest call' },
    { id: 'oldest',  label: 'Oldest call' },
];

export const OCCUPIED: { id: Occupied; label: string }[] = [
    { id: 'every',    label: 'Every floor' },
    { id: 'nearest',  label: 'Nearest destination' },
    { id: 'popular',  label: 'Popular direction' },
    { id: 'continue', label: 'Continue direction' },
];

export function pair(empty: Empty, occupied: Occupied): Algo {
    return `${empty}:${occupied}`;
}

export const ALGOS = EMPTY.flatMap((empty) => OCCUPIED.map((occupied) => ({
    id: pair(empty.id, occupied.id), empty: empty.id, occupied: occupied.id,
    label: `${empty.label} / ${occupied.label}`,
})));

export function policies(algo: Algo) {
    const [empty, occupied] = algo.split(':') as [Empty, Occupied];
    return { empty, occupied };
}

function requestedFloor(riders: Rider[], floor: number) {
    const riding = riders.filter((rider) => rider.place === 'riding')
        .sort((a, b) => (a.boardedAt ?? 0) - (b.boardedAt ?? 0));

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

function nextRequested(floor: number, dir: Dir, dest: number) {
    if (dest === floor) {
        return { floor, dir };
    }

    const nextDir = dest > floor ? 1 : -1;

    return { floor: dest, dir: nextDir as Dir };
}

function hasDrop(riders: Rider[], floor: number) {
    return riders.some((rider) => rider.place === 'riding' && rider.dest === floor);
}

function popularFloor(riders: Rider[], floor: number) {
    const riding = riders.filter((rider) => rider.place === 'riding' && rider.dest !== floor)
        .sort((a, b) => (a.boardedAt ?? 0) - (b.boardedAt ?? 0));

    if (riding.length === 0) {
        return undefined;
    }

    const up = riding.filter((rider) => rider.dest > floor).length;
    const down = riding.length - up;
    const dir = up === down
        ? riding[0].dest > floor ? 1 : -1
        : up > down ? 1 : -1;
    const side = riding.filter((rider) => dir === 1 ? rider.dest > floor : rider.dest < floor);
    const request = side.reduce((best, rider) => {
        if (Math.abs(rider.dest - floor) < Math.abs(best.dest - floor)) {
            return rider;
        }

        return best;
    }, side[0]);

    return request?.dest;
}

function requested(algo: Occupied, riders: Rider[], floor: number, dir: Dir) {
    if (algo === 'popular') {
        return popularFloor(riders, floor);
    }

    if (algo === 'continue') {
        const ahead = riders.filter((rider) => (rider.dest - floor) * dir >= 0);
        return requestedFloor(ahead, floor) ?? requestedFloor(riders, floor);
    }

    return requestedFloor(riders, floor);
}

function call(empty: Empty, riders: Rider[], floor: number) {
    const waiting = riders.filter((rider) => rider.place === 'waiting');
    if (!waiting.length) return undefined;
    return waiting.reduce((best, rider) => {
        const dist = Math.abs(rider.floor - floor);
        const bestDist = Math.abs(best.floor - floor);
        if (empty === 'oldest' || dist === bestDist) {
            return rider.spawnedAt < best.spawnedAt ? rider : best;
        }
        return dist < bestDist ? rider : best;
    }, waiting[0]).floor;
}

export function targetFloor(algo: Algo, floor: number, dir: Dir, riders: Rider[]) {
    return move(algo, floor, dir, riders, 0).floor;
}

export function move(algo: Algo, floor: number, dir: Dir, riders: Rider[], now: number): Move {
    const { empty, occupied } = policies(algo);
    const onboard = riders.some((rider) => rider.place === 'riding' || rider.place === 'boarding');

    if (!onboard && empty !== 'patrol') {
        const dest = call(empty, riders, floor);
        if (dest === undefined) return { floor, dir, stop: false };
        return { ...nextRequested(floor, dir, dest), stop: true };
    }

    if (occupied === 'every') {
        return { ...next(floor, dir), stop: true };
    }

    const dest = requested(occupied, riders, floor, dir);
    if (dest === undefined) {
        const moved = next(floor, dir);
        return { ...moved, stop: stopWork(riders, moved.floor, now) };
    }
    const moved = nextRequested(floor, dir, dest);
    return { ...moved, stop: hasDrop(riders, moved.floor) };
}
