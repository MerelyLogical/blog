import type { Rider } from './types';

export function waitingCount(riders: Rider[]) {
    return riders.filter((rider) => rider.place === 'waiting').length;
}

export function loadCount(riders: Rider[]) {
    return riders.filter((rider) => (
        rider.place === 'boarding' || rider.place === 'riding'
    )).length;
}

function max(values: number[]) {
    return values.length === 0 ? 0 : Math.max(...values);
}

function waitTimes(riders: Rider[], now: number, field: 'spawnedAt' | 'boardedAt') {
    return riders
        .filter((rider) => {
            if (field === 'spawnedAt') {
                return rider.place === 'waiting';
            }

            return (
                (rider.place === 'boarding' || rider.place === 'riding') &&
                rider.boardedAt !== undefined
            );
        })
        .map((rider) => now - (rider[field] ?? now));
}

function currentAvg(riders: Rider[], now: number, field: 'spawnedAt' | 'boardedAt') {
    return avg(waitTimes(riders, now, field));
}

function currentMax(riders: Rider[], now: number, field: 'spawnedAt' | 'boardedAt') {
    return max(waitTimes(riders, now, field));
}

export function currentMaxWait(riders: Rider[], now: number) {
    return currentMax(riders, now, 'spawnedAt');
}

export function currentAvgWait(riders: Rider[], now: number) {
    return currentAvg(riders, now, 'spawnedAt');
}

export function currentAvgLiftWait(riders: Rider[], now: number) {
    return currentAvg(riders, now, 'boardedAt');
}

export function currentMaxLiftWait(riders: Rider[], now: number) {
    return currentMax(riders, now, 'boardedAt');
}

export function avg(values: number[]) {
    if (values.length === 0) {
        return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function since<T extends { time: number }>(items: T[], now: number, ms: number) {
    return items.filter((item) => item.time >= now - ms);
}

export function fmtNum(value: number) {
    return value.toFixed(1);
}

export function fmtTime(ms: number) {
    return `${(ms / 1000).toFixed(1)}s`;
}
