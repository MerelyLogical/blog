import assert from 'node:assert/strict';
import { ALGOS, move } from '../ts/lift/algo.ts';
import { advance, result, run } from '../ts/lift/run.ts';
import { SLOTS } from '../ts/lift/layout.ts';
import type { Rider } from '../ts/lift/types.ts';

const arrivals: Rider[] = Array.from({ length: 36 }, (_, id) => ({
    id, floor: id % 6, dest: (id % 6 + 1 + id % 5) % 6,
    spawnedAt: 1500 * (id + 1), place: 'waiting',
}));

for (const { id } of ALGOS) {
    function simulate(chunk: number) {
        const state = run(id);
        let index = 0;
        for (let now = 0; now <= 180000; now += chunk) {
            while (index < arrivals.length && arrivals[index].spawnedAt <= now) {
                const rider = arrivals[index++];
                advance(state, rider.spawnedAt);
                state.riders.push({ ...rider });
            }
            advance(state, now);
            const onboard = state.riders.filter((rider) => rider.place === 'riding' || rider.place === 'boarding');
            assert.ok(onboard.length <= SLOTS.length, `${id}: capacity`);
            assert.equal(new Set(onboard.map((rider) => rider.slot)).size, onboard.length, `${id}: unique slots`);
            assert.ok(state.riders.every((rider) => rider.place !== 'riding' || rider.boardedAt !== undefined));
        }
        return state;
    }
    const fine = simulate(20);
    const coarse = simulate(400);
    assert.deepEqual(fine.riders, coarse.riders, `${id}: speed-independent rider state`);
    assert.deepEqual(fine.motion, coarse.motion, `${id}: speed-independent motion`);
    assert.equal(fine.waitTotal, coarse.waitTotal);
    assert.equal(fine.total, arrivals.length, `${id}: all passengers delivered`);
    assert.deepEqual(result(fine, 180000), result(coarse, 180000));
    const frozen = structuredClone(fine);
    advance(fine, 180000);
    assert.deepEqual(fine, frozen, `${id}: no change when simulation time is frozen`);
}
assert.ok(arrivals.every((rider) => rider.place === 'waiting' && rider.slot === undefined), 'shared arrivals stay immutable');
console.log('Lift checks passed: identical demand, timing, capacity, delivery and frozen clock.');

// Empty dispatch responds to hall calls; occupied dispatch remains independent.
function waiting(id: number, floor: number, spawnedAt: number): Rider {
    return { id, floor, dest: 5, spawnedAt, place: 'waiting' };
}
const calls = [waiting(1, 5, 0), waiting(2, 1, 100)];
assert.deepEqual(move('nearest:nearest', 0, 1, calls, 200), { floor: 1, dir: 1, stop: true });
assert.deepEqual(move('oldest:nearest', 0, 1, calls, 200), { floor: 5, dir: 1, stop: true });
assert.deepEqual(move('patrol:nearest', 0, 1, calls, 200), { floor: 1, dir: 1, stop: true });
assert.equal(move('nearest:popular', 2, 1, [waiting(1, 1, 100), waiting(2, 3, 0)], 200).floor, 3, 'nearest call ties favour oldest');
for (const occupied of ['every', 'nearest', 'popular', 'continue'] as const) {
    assert.deepEqual(move(`nearest:${occupied}`, 2, -1, [], 0), { floor: 2, dir: -1, stop: false }, 'call policy idles without demand');
    assert.deepEqual(move(`oldest:${occupied}`, 2, -1, [waiting(1, 2, 0)], 0), { floor: 2, dir: -1, stop: true }, 'serve a call on the current floor');
}
const onboard: Rider[] = [
    { ...waiting(1, 0, 0), dest: 1, place: 'riding', boardedAt: 20 },
    { ...waiting(2, 0, 0), dest: 4, place: 'riding', boardedAt: 10 },
    { ...waiting(3, 0, 0), dest: 5, place: 'riding', boardedAt: 30 },
    waiting(4, 3, 0),
];
for (const empty of ['patrol', 'nearest', 'oldest'] as const) {
    assert.equal(move(`${empty}:nearest`, 2, 1, onboard, 100).floor, 1);
    assert.equal(move(`${empty}:popular`, 2, 1, onboard, 100).floor, 4);
    assert.deepEqual(move(`${empty}:continue`, 2, 1, onboard, 100), { floor: 4, dir: 1, stop: true }, 'continue up despite nearer destination behind');
    assert.deepEqual(move(`${empty}:continue`, 2, -1, onboard, 100), { floor: 1, dir: -1, stop: true }, 'continue down despite majority going up');
    assert.deepEqual(move(`${empty}:continue`, 1, -1, onboard.filter((rider) => rider.dest !== 1), 100), { floor: 4, dir: 1, stop: true }, 'reverse when no onboard destinations remain ahead');
    assert.deepEqual(move(`${empty}:every`, 2, 1, onboard, 100), { floor: 3, dir: 1, stop: true });
}
const tie = onboard.slice(0, 2).map((rider, index) => ({ ...rider, dest: index === 0 ? 1 : 3 }));
assert.equal(move('nearest:nearest', 2, 1, tie, 100).floor, 3, 'nearest destination ties favour first to board');
assert.equal(move('oldest:popular', 2, 1, tie, 100).floor, 3, 'popular direction ties favour first to board');
assert.deepEqual(move('nearest:continue', 3, 1, tie, 100), { floor: 3, dir: 1, stop: true }, 'alight at the current floor before reversing');
console.log('Policy checks passed: nearest/oldest calls, idle, current-floor calls, independent onboard rules and ties.');
