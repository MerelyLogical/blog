import { next, stopWork } from './sim';
import type { Algo, Dir, Move, Rider } from './types';

export const ALGOS: { id: Algo; label: string }[] = [
    { id: 'nearest', label: 'Nearest request' },
    { id: 'popular', label: 'Most requests' },
    { id: 'bounce',  label: 'Bounce' },
];

function requestedFloor(riders: Rider[], floor: number) {
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

    return { floor: dest, dir: nextDir as Dir };
}

function hasDrop(riders: Rider[], floor: number) {
    return riders.some((rider) => rider.place === 'riding' && rider.dest === floor);
}

function popularFloor(riders: Rider[], floor: number) {
    const riding = riders.filter((rider) => rider.place === 'riding' && rider.dest !== floor);

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

function requested(algo: Algo, riders: Rider[], floor: number) {
    if (algo === 'popular') {
        return popularFloor(riders, floor);
    }

    return requestedFloor(riders, floor);
}

export function targetFloor(algo: Algo, floor: number, dir: Dir, riders: Rider[]) {
    if (algo !== 'bounce') {
        return requested(algo, riders, floor) ?? next(floor, dir).floor;
    }

    return next(floor, dir).floor;
}

export function move(algo: Algo, floor: number, dir: Dir, riders: Rider[], now: number): Move {
    const dest = requested(algo, riders, floor);

    if (algo === 'bounce' || dest === undefined) {
        const moved = next(floor, dir);

        return {
            ...moved,
            stop: algo === 'bounce' || stopWork(riders, moved.floor, now),
        };
    }

    const moved = nextRequested(floor, dir, dest);

    return {
        ...moved,
        stop: hasDrop(riders, moved.floor),
    };
}
