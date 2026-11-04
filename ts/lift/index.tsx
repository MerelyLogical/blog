'use client'

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { Button } from '@/ts/ui/Button';

import { ALGOS, EMPTY, OCCUPIED, pair, policies, targetFloor } from './algo';
import {
    CAR_H,
    CAR_W,
    CAR_X,
    FADE_MS,
    FLOORS,
    MAX_RIDERS,
    GAP,
    RIDER,
    SPACE,
    SPACE_BORDER,
    SPAWN_MAX_MS,
    SPAWN_MIN_MS,
    TOP,
    WAIT_LEFT,
    WAIT_ROWS,
    WAIT_SHOWN,
    WALK_MS,
} from './constants';
import {
    bandTop,
    carBottom,
    carLeft,
    exitLeft,
    floorPos,
    lanePos,
    SLOTS,
    spaceBottom,
    spaceLeft,
    y,
} from './layout';
import {
    avg,
    currentAvgLiftWait,
    currentAvgWait,
    currentMaxLiftWait,
    currentMaxWait,
    fmtNum,
    fmtTime,
    loadCount,
    since,
    waitingCount,
} from './metrics';
import {
    posAt,
    velAt,
} from './motion';
import {
    spawn,
} from './sim';
import type { Algo, Empty, Occupied, Rider } from './types';
import { advance, result, run } from './run';
import type { Run } from './run';
import './style.css';

type SeenRider = Rider & {
    hidden?: number;
};

function spawnDelay() {
    return SPAWN_MIN_MS + Math.random() * (SPAWN_MAX_MS - SPAWN_MIN_MS);
}

export default function Lift() {
    const [running, setRunning] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [views, setViews] = useState<Algo[]>(['patrol:nearest', 'nearest:nearest']);
    const [tab, setTab] = useState(0);
    const [clock, setClock] = useState(0);
    const [initial] = useState(() => ({ now: 0, next: spawnDelay(), runs: views.map(run) }));
    const world = useRef(initial);

    useEffect(() => {
        if (!running) return;
        let frame: number;
        let last = performance.now();
        function tick(time: number) {
            const state = world.current;
            // Limit background-tab catch-up work; every algorithm still shares this clock.
            const now = state.now + Math.min(time - last, 100) * speed;
            last = time;
            while (state.next <= now) {
                for (const sim of state.runs) advance(sim, state.next);
                if (state.runs.every((sim) => sim.riders.length < MAX_RIDERS)) {
                    const rider = spawn([], state.next)[0];
                    for (const sim of state.runs) sim.riders.push({ ...rider });
                }
                state.next += spawnDelay();
            }
            for (const sim of state.runs) advance(sim, now);
            state.now = now;
            setClock(now);
            frame = requestAnimationFrame(tick);
        }
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [running, speed]);

    function restart(selected: Algo[]) {
        world.current = { now: 0, next: spawnDelay(), runs: selected.map(run) };
        setClock(0);
    }

    function reset() {
        restart(views);
        setRunning(false);
    }

    function choose(slot: number, algo: Algo) {
        if (views[slot] === algo) return;
        const selected = views.map((value, index) => index === slot ? algo : value);
        restart(selected);
        setViews(selected);
    }

    return (
        <div className="lift-compare">
            <p>Only the two selected combinations run, with identical passengers. Changing a policy restarts both views.</p>
            <div className="lift-toolbar">
                <Button className="lift-action" onClick={() => setRunning((value) => !value)}>{running ? 'Pause' : 'Run'}</Button>
                <Button className="lift-action" onClick={reset}>Reset</Button>
                <label>Speed <select className="app-input app-input--compact app-select" value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
                    {[1, 2, 4].map((value) => <option key={value} value={value}>{value}×</option>)}
                </select></label>
                <span>{fmtTime(clock)}</span>
            </div>
            <div className="lift-tabs" role="tablist" aria-label="Comparison views">
                {views.map((algo, index) => <button key={index} id={`lift-tab-${index}`} role="tab" aria-selected={tab === index} aria-controls={`lift-view-${index}`} tabIndex={tab === index ? 0 : -1}
                    onClick={() => setTab(index)} onKeyDown={(event) => {
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                            event.preventDefault();
                            const next = 1 - index;
                            setTab(next);
                            document.getElementById(`lift-tab-${next}`)?.focus();
                        }
                    }} title={ALGOS.find(({ id }) => id === algo)?.label}>View {index + 1}</button>)}
            </div>
            <div className="lift-views">
                {views.map((algo, index) => <section key={index} id={`lift-view-${index}`} className={`lift-view ${tab === index ? 'is-active' : ''}`} aria-label={`View ${index + 1}`}>
                    <h3 className="lift-view-title">View {index + 1}</h3>
                    <div className="lift-pickers">
                        <label className="lift-picker">When empty
                            <select aria-label={`When empty for view ${index + 1}`} className="app-input app-input--compact app-select" value={policies(algo).empty} onChange={(event) => choose(index, pair(event.target.value as Empty, policies(algo).occupied))}>
                                {EMPTY.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                            </select>
                        </label>
                        <label className="lift-picker">When occupied
                            <select aria-label={`When occupied for view ${index + 1}`} className="app-input app-input--compact app-select" value={policies(algo).occupied} onChange={(event) => choose(index, pair(policies(algo).empty, event.target.value as Occupied))}>
                                {OCCUPIED.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                            </select>
                        </label>
                    </div>
                    <View key={algo} state={world.current.runs[index]} clock={clock} running={running} />
                </section>)}
            </div>
            <div className="lift-results">
                <table>
                    <caption>Selected combinations · average wait measures passengers who have boarded</caption>
                    <thead><tr><th scope="col">View</th><th scope="col">When empty</th><th scope="col">When occupied</th><th scope="col">Average floor wait</th><th scope="col">Longest current wait</th><th scope="col">Waiting</th><th scope="col">Trips</th></tr></thead>
                    <tbody>{world.current.runs.map((sim, index) => {
                        const stats = result(sim, clock);
                        return <tr key={index}>
                            <th scope="row">View {index + 1}</th>
                            <td>{EMPTY.find(({ id }) => id === policies(sim.algo).empty)?.label}</td>
                            <td>{OCCUPIED.find(({ id }) => id === policies(sim.algo).occupied)?.label}</td>
                            <td>{stats.wait === undefined ? '—' : fmtTime(stats.wait)}</td><td>{fmtTime(stats.longest)}</td><td>{stats.waiting}</td><td>{stats.trips}</td>
                        </tr>;
                    })}</tbody>
                </table>
            </div>
        </div>
    );
}

function View({ state, clock, running }: { state: Run; clock: number; running: boolean }) {
    const { floor, dir, riders, motion, algo } = state;
    const animClock = clock;
    function target(rider: Rider) {
        if (rider.place === 'boarding' || rider.place === 'riding') {
            return `car-${rider.slot ?? 0}`;
        }

        if (rider.place === 'leaving' || rider.place === 'fading') {
            return `exit-${rider.floor}`;
        }

        return `floor-${rider.floor}`;
    }

    function shown(riders: Rider[]): SeenRider[] {
        const waiting = new Map<number, number>();
        const seen = new Map<number, number>();

        for (const rider of riders) {
            if (rider.place === 'waiting') {
                waiting.set(rider.floor, (waiting.get(rider.floor) ?? 0) + 1);
            }
        }

        return riders.flatMap((rider) => {
            if (rider.place !== 'waiting') {
                return [rider];
            }

            const total = waiting.get(rider.floor) ?? 0;
            const index = seen.get(rider.floor) ?? 0;
            seen.set(rider.floor, index + 1);

            if (total > WAIT_SHOWN && index >= WAIT_SHOWN) {
                return [];
            }

            if (total > WAIT_SHOWN && index === WAIT_SHOWN - 1) {
                return [{ ...rider, hidden: total - WAIT_SHOWN }];
            }

            return [rider];
        });
    }

    function slot(shown: SeenRider[], rider: SeenRider, index: number) {
        return shown.slice(0, index).filter((other) => (
            target(other) === target(rider)
        )).length;
    }

    const pos = motion === undefined ? floor : posAt(motion, animClock);
    function between(from: string | number, to: string | number, progress: number) {
        const css = (value: string | number) => typeof value === 'number' ? `${value}px` : value;
        return `calc(${css(from)} * ${1 - progress} + ${css(to)} * ${progress})`;
    }

    function riderStyle(shown: SeenRider[], rider: SeenRider, index: number) {
        const car = rider.place === 'boarding' || rider.place === 'riding';
        const riderPos = car ? pos : rider.floor;
        const spot = slot(shown, rider, index);
        const lane = lanePos(spot);
        const row = lane.row;
        let col = lane.col;
        let left: string | number = WAIT_LEFT + RIDER / 2 + col * (RIDER + GAP);

        if (car) {
            const space = SLOTS[rider.slot ?? 0];
            left = carLeft(space);
        } else if (rider.place === 'leaving' || rider.place === 'fading') {
            left = exitLeft(col);
        } else {
            col = Math.ceil(WAIT_SHOWN / WAIT_ROWS) - 1 - col;
            left = WAIT_LEFT + RIDER / 2 + col * (RIDER + GAP);
        }

        let bottom = car
            ? carBottom(riderPos, SLOTS[rider.slot ?? 0])
            : floorPos(rider.floor, row);

        if (rider.walkUntil !== undefined) {
            const progress = Math.min(1, Math.max(0, 1 - (rider.walkUntil - clock) / WALK_MS));
            const space = SLOTS[rider.slot ?? 0];
            if (rider.place === 'boarding') {
                left = between(WAIT_LEFT + RIDER / 2 + (Math.ceil(WAIT_SHOWN / WAIT_ROWS) - 1) * (RIDER + GAP), left, progress);
                bottom = between(floorPos(rider.floor, 0), bottom, progress);
            } else if (rider.place === 'leaving') {
                left = between(carLeft(space), left, progress);
                bottom = between(carBottom(rider.floor, space), bottom, progress);
            }
        }

        return {
            left,
            bottom,
            opacity: rider.place === 'fading' ? Math.max(0, 1 - (clock - (rider.fadeAt ?? clock)) / FADE_MS) : 1,
        };
    }

    const samples10 = since(state.samples, clock, 10000);
    const samples60 = since(state.samples, clock, 60000);
    const floorWaits10 = since(state.floorWaits, clock, 10000).map((event) => event.value);
    const floorWaits60 = since(state.floorWaits, clock, 60000).map((event) => event.value);
    const liftWaits10 = since(state.liftWaits, clock, 10000).map((event) => event.value);
    const liftWaits60 = since(state.liftWaits, clock, 60000).map((event) => event.value);
    const trips10 = since(state.trips, clock, 10000).length;
    const trips60 = since(state.trips, clock, 60000).length;
    const maxFloorRider = riders
        .filter((rider) => rider.place === 'waiting')
        .reduce<Rider | undefined>((best, rider) => {
            if (best === undefined || rider.spawnedAt < best.spawnedAt) {
                return rider;
            }

            return best;
        }, undefined);
    const maxLiftRider = riders
        .filter((rider) => (
            (rider.place === 'boarding' || rider.place === 'riding') &&
            rider.boardedAt !== undefined
        ))
        .reduce<Rider | undefined>((best, rider) => {
            if (
                best === undefined ||
                (rider.boardedAt ?? Number.POSITIVE_INFINITY) < (best.boardedAt ?? Number.POSITIVE_INFINITY)
            ) {
                return rider;
            }

            return best;
        }, undefined);
    const visibleRiders = shown(riders);
    const goal = motion?.to ?? targetFloor(algo, floor, dir, riders);
    const current = motion === undefined ? `Floor ${floor}` : `Floor ${motion.from} → Floor ${motion.to}`;
    const vel = running && motion !== undefined ? velAt(motion, animClock) : 0;
    const velText = `${vel > 0 ? '+' : ''}${vel.toFixed(1)} f/s`;
    const metrics = [
        {
            name: 'Waiting',
            now: String(waitingCount(riders)),
            ten: fmtNum(avg(samples10.map((sample) => sample.waiting))),
            sixty: fmtNum(avg(samples60.map((sample) => sample.waiting))),
        },
        {
            name: 'Load',
            now: String(loadCount(riders)),
            ten: fmtNum(avg(samples10.map((sample) => sample.load))),
            sixty: fmtNum(avg(samples60.map((sample) => sample.load))),
        },
        {
            name: 'Floor wait',
            now: fmtTime(currentAvgWait(riders, clock)),
            ten: fmtTime(avg(floorWaits10)),
            sixty: fmtTime(avg(floorWaits60)),
        },
        {
            name: 'Lift wait',
            now: fmtTime(currentAvgLiftWait(riders, clock)),
            ten: fmtTime(avg(liftWaits10)),
            sixty: fmtTime(avg(liftWaits60)),
        },
        {
            name: 'Trips',
            now: String(state.total),
            ten: String(trips10),
            sixty: String(trips60),
        },
    ];

    return (
        <div className="lift-sim">
            <div className="lift-status">
                <span>{current}</span>
                {motion === undefined && <span>Target {goal}</span>}
                <span className="lift-vel">{velText}</span>
            </div>
            <div className="lift-stage">
                <div className="lift-shaft" style={dims}>
                    {Array.from({ length: FLOORS }, (_, index) => {
                        const shown = TOP - index;

                        return (
                            <div key={shown}>
                                <div
                                    className={`lift-band ${shown % 2 === 0 ? '' : 'is-odd'}`}
                                    style={{ top: bandTop(index) }}
                                />
                                <div className="lift-row" style={{ bottom: y(shown) }}>
                                    <span className="lift-label">{shown}</span>
                                </div>
                            </div>
                        );
                    })}
                    <div className="lift-car" style={{ bottom: y(pos) }} />
                    {SLOTS.map((space, index) => (
                        <span
                            key={index}
                            className="lift-space"
                            style={{
                                left: spaceLeft(space),
                                bottom: spaceBottom(pos, space),
                            }}
                        />
                    ))}
                    {visibleRiders.map((rider, index) => (
                        <span
                            key={rider.id}
                            className={[
                                'lift-rider',
                                rider.hidden !== undefined ? 'is-queue' : '',
                                rider.id === maxFloorRider?.id || rider.id === maxLiftRider?.id ? 'is-max' : '',
                            ].join(' ')}
                            style={riderStyle(visibleRiders, rider, index)}
                        >
                            {rider.hidden === undefined ? rider.dest : `+${rider.hidden}`}
                        </span>
                    ))}
                </div>
                <aside className="lift-metrics">
                    <div className="lift-metrics-title">Metrics</div>
                    <div className="lift-metric-row lift-metric-head">
                        <span />
                        <span>Now</span>
                        <span>10s</span>
                        <span>60s</span>
                    </div>
                    {metrics.map((metric) => (
                        <div key={metric.name} className="lift-metric-row">
                            <span>{metric.name}</span>
                            <span>{metric.now}</span>
                            <span>{metric.ten}</span>
                            <span>{metric.sixty}</span>
                        </div>
                    ))}
                    <div className="lift-metric-max">
                        <span>Max floor wait</span>
                        <strong>{fmtTime(Math.max(state.maxFloorWait, currentMaxWait(riders, clock)))}</strong>
                    </div>
                    <div className="lift-metric-max">
                        <span>Max lift wait</span>
                        <strong>{fmtTime(Math.max(state.maxLiftWait, currentMaxLiftWait(riders, clock)))}</strong>
                    </div>
                </aside>
            </div>
        </div>
    );
}

// Sizes come from the layout constants, so pass them to the stylesheet.
const dims = {
    '--band': `${100 / FLOORS}%`,
    '--rider': `${RIDER}px`,
    '--space': `${SPACE}px`,
    '--space-border': `${SPACE_BORDER}px`,
    '--car-x': CAR_X,
    '--car-w': `${CAR_W}px`,
    '--car-h': `${CAR_H}px`,
} as CSSProperties;
