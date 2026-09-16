import { move } from './algo.ts';
import { SAMPLE_MS, STEP_MS, STOP_MS } from './constants.ts';
import { currentMaxWait, since, waitingCount, loadCount } from './metrics.ts';
import { travelMs } from './motion.ts';
import { ageRiders, stepRiders, stopWork } from './sim.ts';
import type { Action, ActiveMotion, Algo, Dir, Event, Rider, Sample } from './types.ts';

export function run(algo: Algo) {
    return {
        algo, floor: 0, dir: 1 as Dir, riders: [] as Rider[],
        motion: undefined as ActiveMotion | undefined,
        due: 0, action: 'alight' as Action, stopped: false,
        samples: [] as Sample[], floorWaits: [] as Event[], liftWaits: [] as Event[],
        trips: [] as Event[], total: 0, waitTotal: 0, boarded: 0,
        maxFloorWait: 0, maxLiftWait: 0, sampledAt: -SAMPLE_MS,
    };
}

export type Run = ReturnType<typeof run>;

// Process transitions at their scheduled time, independent of rendering speed.
export function advance(state: Run, now: number) {
    while (state.due <= now) {
        const time = state.due;
        state.riders = ageRiders(state.riders, time);
        if (state.motion) {
            state.floor = state.motion.to;
            state.dir = state.motion.dir;
            state.stopped = state.motion.stop;
            state.motion = undefined;
            state.action = 'alight';
            state.due = time + (state.stopped ? STOP_MS : 0);
        } else if (state.stopped) {
            const step = stepRiders(state.riders, state.floor, time, state.action);
            state.riders = step.riders;
            if (step.floorWait !== undefined) {
                state.floorWaits.push({ time, value: step.floorWait });
                state.waitTotal += step.floorWait;
                state.boarded += 1;
                state.maxFloorWait = Math.max(state.maxFloorWait, step.floorWait);
            }
            if (step.liftWait !== undefined) {
                state.liftWaits.push({ time, value: step.liftWait });
                state.maxLiftWait = Math.max(state.maxLiftWait, step.liftWait);
            }
            if (step.trip) {
                state.total += 1;
                state.trips.push({ time, value: 1 });
            }
            state.action = state.action === 'alight' ? 'board' : 'alight';
            state.due = time + STEP_MS;
            state.stopped = stopWork(state.riders, state.floor, state.due);
        } else {
            const moved = move(state.algo, state.floor, state.dir, state.riders, time);
            const ms = travelMs(Math.abs(moved.floor - state.floor));
            state.dir = moved.dir;
            if (ms === 0) {
                state.stopped = moved.stop;
                state.due = time + STOP_MS;
            } else {
                state.motion = {
                    from: state.floor, to: moved.floor, startedAt: time,
                    arriveAt: time + ms, dir: moved.dir, stop: moved.stop,
                };
                state.due = time + ms;
            }
        }
    }
    state.riders = ageRiders(state.riders, now);
    if (now - state.sampledAt >= SAMPLE_MS) {
        state.samples = [...since(state.samples, now, 60000), {
            time: now, waiting: waitingCount(state.riders), load: loadCount(state.riders),
        }];
        state.floorWaits = since(state.floorWaits, now, 60000);
        state.liftWaits = since(state.liftWaits, now, 60000);
        state.trips = since(state.trips, now, 60000);
        state.sampledAt = now;
    }
}

export function result(state: Run, now: number) {
    return {
        wait: state.boarded ? state.waitTotal / state.boarded : undefined,
        longest: currentMaxWait(state.riders, now),
        waiting: waitingCount(state.riders), trips: state.total,
    };
}
