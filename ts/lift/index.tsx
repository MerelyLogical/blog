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
import './compare.css';

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
                <Button style={styles.action} onClick={() => setRunning((value) => !value)}>{running ? 'Pause' : 'Run'}</Button>
                <Button style={styles.action} onClick={reset}>Reset</Button>
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
            ...styles.rider,
            left,
            bottom,
            transition: 'background 160ms ease',
            opacity: rider.place === 'fading' ? Math.max(0, 1 - (clock - (rider.fadeAt ?? clock)) / FADE_MS) : 1,
            ...(rider.hidden !== undefined ? styles.riderQueue : {}),
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
        <div style={styles.wrap}>
            <div style={styles.status}>
                <div style={styles.statusText}>
                    <div style={styles.statusLine}>
                        <span>{current}</span>
                        {motion === undefined && <span>Target {goal}</span>}
                        <span style={styles.velocity}>{velText}</span>
                    </div>
                </div>
            </div>
            <div style={styles.sim}>
                <div style={styles.shaft}>
                    {Array.from({ length: FLOORS }, (_, index) => {
                        const shown = TOP - index;

                        return (
                            <div key={shown}>
                                <div
                                    style={{
                                        ...styles.band,
                                        top: bandTop(index),
                                        background: shown % 2 === 0
                                            ? 'rgba(148, 163, 184, 0.08)'
                                            : 'rgba(29, 82, 197, 0.06)',
                                    }}
                                />
                                <div
                                    style={{
                                        ...styles.row,
                                        bottom: y(shown),
                                    }}
                                >
                                    <span style={styles.label}>{shown}</span>
                                </div>
                            </div>
                        );
                    })}
                    <div
                        style={{
                            ...styles.car,
                            bottom: y(pos),
                        }}
                    />
                    {SLOTS.map((space, index) => (
                        <span
                            key={index}
                            style={{
                                ...styles.space,
                                left: spaceLeft(space),
                                bottom: spaceBottom(pos, space),
                            }}
                        />
                    ))}
                    {visibleRiders.map((rider, index) => (
                        <span
                            key={rider.id}
                            style={{
                                ...riderStyle(visibleRiders, rider, index),
                                ...(rider.id === maxFloorRider?.id || rider.id === maxLiftRider?.id
                                    ? styles.riderMax
                                    : {}),
                            }}
                        >
                            {rider.hidden === undefined ? rider.dest : `+${rider.hidden}`}
                        </span>
                    ))}
                </div>
                <aside style={styles.metrics}>
                    <div style={styles.metricsTitle}>Metrics</div>
                    <div style={styles.metricHeader}>
                        <span />
                        <span style={styles.metricCell}>Now</span>
                        <span style={styles.metricCell}>10s</span>
                        <span style={styles.metricCell}>60s</span>
                    </div>
                    {metrics.map((metric) => (
                        <div key={metric.name} style={styles.metricRow}>
                            <span style={styles.metricName}>{metric.name}</span>
                            <span style={styles.metricCell}>{metric.now}</span>
                            <span style={styles.metricCell}>{metric.ten}</span>
                            <span style={styles.metricCell}>{metric.sixty}</span>
                        </div>
                    ))}
                    <div style={styles.metricMax}>
                        <span>Max floor wait</span>
                        <strong>{fmtTime(Math.max(state.maxFloorWait, currentMaxWait(riders, clock)))}</strong>
                    </div>
                    <div style={styles.metricMax}>
                        <span>Max lift wait</span>
                        <strong>{fmtTime(Math.max(state.maxLiftWait, currentMaxLiftWait(riders, clock)))}</strong>
                    </div>
                </aside>
            </div>
        </div>
    );
}

const styles = {
    wrap: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        minWidth: 0,
    },
    status: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        color: 'var(--app-text-color)',
    },
    statusText: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.15rem',
    },
    statusLine: {
        display: 'flex',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: '0.75rem',
    },
    velocity: {
        color: 'var(--app-text-muted)',
        fontVariantNumeric: 'tabular-nums',
    },
    sim: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        alignItems: 'start',
        gap: '1rem',
    },
    shaft: {
        position: 'relative',
        height: 430,
        border: '1px solid var(--app-card-border)',
        borderRadius: 5,
        background: 'var(--app-card-bg)',
        overflow: 'hidden',
    },
    band: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: `${100 / FLOORS}%`,
    },
    row: {
        position: 'absolute',
        left: 0,
        right: 0,
        minHeight: 32,
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0 0.75rem',
        boxSizing: 'border-box',
        transform: 'translateY(50%)',
    },
    label: {
        position: 'absolute',
        left: 12,
        width: '2ch',
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--app-text-muted)',
    },
    rider: {
        position: 'absolute',
        zIndex: 2,
        width: RIDER,
        height: RIDER,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: '#f59e0b',
        color: '#111827',
        fontSize: '0.7rem',
        fontWeight: 700,
        lineHeight: 1,
        transform: 'translate(-50%, 50%)',
    },
    riderMax: {
        background: '#dc2626',
        color: '#fff',
    },
    riderQueue: {
        background: '#111827',
        color: '#fff',
        fontSize: '0.62rem',
    },
    car: {
        position: 'absolute',
        left: CAR_X,
        width: CAR_W,
        height: CAR_H,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderRadius: 5,
        border: '1px solid #1d52c5',
        background: '#1d52c5',
        color: '#fff',
        fontWeight: 700,
        transform: 'translate(-50%, 50%)',
    },
    space: {
        position: 'absolute',
        width: SPACE,
        height: SPACE,
        border: `${SPACE_BORDER}px solid rgba(255, 255, 255, 0.86)`,
        borderRadius: '50%',
        boxSizing: 'border-box',
        transform: 'translate(-50%, 50%)',
    },
    action: {
        margin: 0,
    },
    metrics: {
        border: '1px solid var(--app-card-border)',
        borderRadius: 5,
        background: 'var(--app-card-bg)',
        color: 'var(--app-text-color)',
        padding: '0.8rem',
    },
    metricsTitle: {
        fontWeight: 700,
        marginBottom: '0.55rem',
    },
    metricHeader: {
        display: 'grid',
        gridTemplateColumns: 'minmax(4.7rem, 1fr) repeat(3, minmax(3.2rem, 1fr))',
        gap: '0.25rem',
        paddingBottom: '0.35rem',
        color: 'var(--app-text-muted)',
        fontSize: '0.72rem',
        fontWeight: 700,
        textAlign: 'right',
    },
    metricRow: {
        display: 'grid',
        gridTemplateColumns: 'minmax(4.7rem, 1fr) repeat(3, minmax(3.2rem, 1fr))',
        gap: '0.25rem',
        padding: '0.34rem 0',
        borderTop: '1px solid var(--app-card-border)',
        fontSize: '0.78rem',
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
    },
    metricCell: {
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    metricName: {
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: 'var(--app-text-muted)',
        fontWeight: 700,
        textAlign: 'left',
    },
    metricMax: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '0.5rem',
        borderTop: '1px solid var(--app-card-border)',
        paddingTop: '0.45rem',
        marginTop: '0.35rem',
        color: 'var(--app-text-muted)',
        fontSize: '0.8rem',
        fontVariantNumeric: 'tabular-nums',
    },
} satisfies Record<string, CSSProperties>;
