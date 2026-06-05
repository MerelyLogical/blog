import { next, stopWork } from './sim';
import type { Algo, Dir, Move, Rider } from './types';

export const ALGOS: { id: Algo; label: string }[] = [
    { id: 'nearest', label: 'Nearest request' },
    { id: 'bounce',  label: 'Bounce' },
];

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

function nextRequested(floor: number, dir: Dir, dest: number) {
    if (dest === floor) {
        return { floor, dir };
    }

    const nextDir = dest > floor ? 1 : -1;

    return { floor: floor + nextDir, dir: nextDir as Dir };
}

function hasDrop(riders: Rider[], floor: number) {
    return riders.some((rider) => rider.place === 'riding' && rider.dest === floor);
}

export function targetFloor(algo: Algo, floor: number, dir: Dir, riders: Rider[]) {
    if (algo === 'nearest') {
        return requestedFloor(riders, floor) ?? next(floor, dir).floor;
    }

    return next(floor, dir).floor;
}

export function move(algo: Algo, floor: number, dir: Dir, riders: Rider[], now: number): Move {
    const requested = requestedFloor(riders, floor);

    if (algo === 'bounce' || requested === undefined) {
        const moved = next(floor, dir);

        return {
            ...moved,
            stop: algo === 'bounce' || stopWork(riders, moved.floor, now),
        };
    }

    const moved = nextRequested(floor, dir, requested);

    return {
        ...moved,
        stop: hasDrop(riders, moved.floor),
    };
}
