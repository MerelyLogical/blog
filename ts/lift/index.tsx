'use client'

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { Button } from '@/ts/ui/Button';

const FLOORS = 6;
const MOVE_MS = 700;
const STOP_MS = 450;
const WALK_MS = 800;
const STEP_MS = WALK_MS / 2;
const LINGER_MS = 3000;
const FADE_MS = 450;
const SPAWN_MS = 1400;
const SAMPLE_MS = 100;
const MAX_RIDERS = 18;
const TOP = FLOORS - 1;
const CAR_H = 72;
const CAR_W = 126;
const EDGE = 36;
const RIDER = 22;
const SPACE_BORDER = 2;
const SPACE = RIDER + SPACE_BORDER * 2;
const GAP = 3;
const CAR_X = '50%';
const WAIT_X = 42;
const WAIT_ROWS = 2;
const EXIT_GAP = 16;
const EXIT_RIGHT = 42;
const SLOT_COLS = 3;
const SLOT_ROWS = 2;
const SLOT_STEP_X = 30;
const SLOT_STEP_Y = 30;
const SLOTS = Array.from({ length: SLOT_ROWS }, (_, row) => (
    Array.from({ length: SLOT_COLS }, (_, col) => ({
        x: (col - (SLOT_COLS - 1) / 2) * SLOT_STEP_X,
        y: ((SLOT_ROWS - 1) / 2 - row) * SLOT_STEP_Y,
    }))
)).flat();

type Dir = -1 | 1;
type Phase = 'moving' | 'stopped';
type Place = 'waiting' | 'boarding' | 'riding' | 'leaving' | 'fading';
type Action = 'alight' | 'board';
type Step = {
    riders: Rider[];
    acted: boolean;
    action: Action;
    floorWait?: number;
    liftWait?: number;
    trip?: boolean;
};
type Rider = {
    id: number;
    floor: number;
    dest: number;
    place: Place;
    spawnedAt: number;
    boardedAt?: number;
    slot?: number;
    walkUntil?: number;
    fadeAt?: number;
    removeAt?: number;
};
type Sample = {
    time: number;
    waiting: number;
    load: number;
};
type Event = {
    time: number;
    value: number;
};

function next(floor: number, dir: Dir) {
    if (floor === TOP && dir === 1) {
        return { floor: floor - 1, dir: -1 as Dir };
    }

    if (floor === 0 && dir === -1) {
        return { floor: floor + 1, dir: 1 as Dir };
    }

    return { floor: floor + dir, dir };
}

function randFloor() {
    return Math.floor(Math.random() * FLOORS);
}

function spawn(current: Rider[]): Rider[] {
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
            id: Date.now() + Math.random(),
            floor,
            dest,
            place: 'waiting',
            spawnedAt: Date.now(),
        },
    ];
}

function canBoard(current: Rider[], floor: number) {
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

function stopWork(current: Rider[], floor: number, now: number) {
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
        return { ...rider, place: 'boarding', slot, boardedAt: now, walkUntil: now + WALK_MS };
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
            place: 'leaving',
            slot: undefined,
            walkUntil: now + WALK_MS,
            fadeAt,
            removeAt: fadeAt + FADE_MS,
        };
    });

    return { riders, acted, action: 'alight', trip: acted, liftWait };
}

function stepRiders(current: Rider[], floor: number, now: number, action: Action): Step {
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

function nextRiderDue(riders: Rider[]) {
    const due = riders
        .map(riderDue)
        .filter((time): time is number => time !== undefined);

    if (due.length === 0) {
        return undefined;
    }

    return Math.min(...due);
}

function ageRiders(current: Rider[], now: number): Rider[] {
    return current
        .map((rider) => {
            if (rider.place === 'boarding' && rider.walkUntil !== undefined && rider.walkUntil <= now) {
                return { ...rider, place: 'riding', walkUntil: undefined };
            }

            if (rider.place === 'leaving' && rider.walkUntil !== undefined && rider.walkUntil <= now) {
                return { ...rider, walkUntil: undefined };
            }

            if (rider.place === 'leaving' && rider.fadeAt !== undefined && rider.fadeAt <= now) {
                return { ...rider, place: 'fading' };
            }

            return rider;
        })
        .filter((rider) => !(
            rider.place === 'fading' &&
            rider.removeAt !== undefined &&
            rider.removeAt <= now
        ));
}

function y(floor: number) {
    const progress = floor / TOP;
    return `calc(${EDGE}px + ${progress * 100}% - ${progress * EDGE * 2}px)`;
}

function floorPos(floor: number, row: number) {
    return `calc(${y(floor)} + ${(row - (WAIT_ROWS - 1) / 2) * (RIDER + GAP)}px)`;
}

function carLeft(space: { x: number }) {
    return `calc(50% + ${space.x}px)`;
}

function carBottom(floor: number, space: { y: number }) {
    return `calc(${y(floor)} + ${space.y}px)`;
}

function spaceLeft(space: { x: number }) {
    return carLeft(space);
}

function spaceBottom(floor: number, space: { y: number }) {
    return carBottom(floor, space);
}

function exitLeft(col: number) {
    return `calc(100% - ${EXIT_RIGHT + RIDER / 2 + col * (RIDER + GAP)}px)`;
}

function lanePos(pos: number) {
    const row = pos % WAIT_ROWS;
    const col = Math.floor(pos / WAIT_ROWS);

    return { col, row };
}

function waitingCount(riders: Rider[]) {
    return riders.filter((rider) => rider.place === 'waiting').length;
}

function loadCount(riders: Rider[]) {
    return riders.filter((rider) => (
        rider.place === 'boarding' || rider.place === 'riding'
    )).length;
}

function currentMaxWait(riders: Rider[], now: number) {
    const waits = riders
        .filter((rider) => rider.place === 'waiting')
        .map((rider) => now - rider.spawnedAt);

    return waits.length === 0 ? 0 : Math.max(...waits);
}

function currentAvgWait(riders: Rider[], now: number) {
    return avg(riders
        .filter((rider) => rider.place === 'waiting')
        .map((rider) => now - rider.spawnedAt));
}

function avg(values: number[]) {
    if (values.length === 0) {
        return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function since<T extends { time: number }>(items: T[], now: number, ms: number) {
    return items.filter((item) => item.time >= now - ms);
}

function fmtNum(value: number) {
    return value.toFixed(1);
}

function fmtTime(ms: number) {
    return `${(ms / 1000).toFixed(1)}s`;
}

export default function Lift() {
    const [floor, setFloor] = useState(0);
    const [dir, setDir] = useState<Dir>(1);
    const [running, setRunning] = useState(true);
    const [phase, setPhase] = useState<Phase>('moving');
    const [riders, setRiders] = useState<Rider[]>([]);
    const [clock, setClock] = useState(Date.now());
    const ridersRef = useRef<Rider[]>([]);
    const samplesRef = useRef<Sample[]>([]);
    const floorWaitsRef = useRef<Event[]>([]);
    const liftWaitsRef = useRef<Event[]>([]);
    const tripsRef = useRef<Event[]>([]);
    const tripsTotalRef = useRef(0);
    const maxFloorWaitRef = useRef(0);
    const maxLiftWaitRef = useRef(0);

    useEffect(() => {
        ridersRef.current = riders;
    }, [riders]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            const now = Date.now();
            setClock(now);

            samplesRef.current = [
                ...since(samplesRef.current, now, 60000),
                {
                    time: now,
                    waiting: waitingCount(ridersRef.current),
                    load: loadCount(ridersRef.current),
                },
            ];
            floorWaitsRef.current = since(floorWaitsRef.current, now, 60000);
            liftWaitsRef.current = since(liftWaitsRef.current, now, 60000);
            tripsRef.current = since(tripsRef.current, now, 60000);
        }, SAMPLE_MS);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!running) {
            return;
        }

        let done: number | undefined;
        let action: Action = 'alight';

        function stopCycle() {
            const now = Date.now();
            const aged = ageRiders(ridersRef.current, now);
            const stepped = stepRiders(aged, floor, now, action);

            if (stepped.floorWait !== undefined) {
                maxFloorWaitRef.current = Math.max(maxFloorWaitRef.current, stepped.floorWait);
                floorWaitsRef.current = [
                    ...floorWaitsRef.current,
                    { time: now, value: stepped.floorWait },
                ];
            }

            if (stepped.liftWait !== undefined) {
                maxLiftWaitRef.current = Math.max(maxLiftWaitRef.current, stepped.liftWait);
                liftWaitsRef.current = [
                    ...liftWaitsRef.current,
                    { time: now, value: stepped.liftWait },
                ];
            }

            if (stepped.trip) {
                tripsTotalRef.current += 1;
                tripsRef.current = [
                    ...tripsRef.current,
                    { time: now, value: 1 },
                ];
            }

            ridersRef.current = stepped.riders;
            setRiders(stepped.riders);

            done = window.setTimeout(() => {
                action = stepped.action === 'alight' ? 'board' : 'alight';

                if (stopWork(ridersRef.current, floor, Date.now())) {
                    stopCycle();
                } else {
                    setPhase('moving');
                }
            }, STEP_MS);
        }

        const timer = window.setTimeout(() => {
            if (phase === 'stopped') {
                stopCycle();
                return;
            }

            setFloor((current) => {
                const moved = next(current, dir);
                setDir(moved.dir);
                return moved.floor;
            });
            setPhase('stopped');
        }, phase === 'moving' ? MOVE_MS : STOP_MS);

        return () => {
            window.clearTimeout(timer);
            if (done !== undefined) {
                window.clearTimeout(done);
            }
        };
    }, [dir, floor, phase, running]);

    useEffect(() => {
        if (!running) {
            return;
        }

        const timer = window.setInterval(() => {
            setRiders((current) => {
                const spawned = spawn(current);
                ridersRef.current = spawned;
                return spawned;
            });
        }, SPAWN_MS);

        return () => window.clearInterval(timer);
    }, [running]);

    useEffect(() => {
        const due = nextRiderDue(riders);

        if (due === undefined) {
            return;
        }

        const wait = Math.max(0, due - Date.now());
        const timer = window.setTimeout(() => {
            setRiders((current) => {
                const aged = ageRiders(current, Date.now());
                ridersRef.current = aged;
                return aged;
            });
        }, wait);

        return () => window.clearTimeout(timer);
    }, [riders]);

    function reset() {
        setFloor(0);
        setDir(1);
        setRunning(false);
        setPhase('moving');
        ridersRef.current = [];
        samplesRef.current = [];
        floorWaitsRef.current = [];
        liftWaitsRef.current = [];
        tripsRef.current = [];
        tripsTotalRef.current = 0;
        maxFloorWaitRef.current = 0;
        maxLiftWaitRef.current = 0;
        setClock(Date.now());
        setRiders([]);
    }

    function target(rider: Rider) {
        if (rider.place === 'boarding' || rider.place === 'riding') {
            return `car-${rider.slot ?? 0}`;
        }

        if (rider.place === 'leaving' || rider.place === 'fading') {
            return `exit-${rider.floor}`;
        }

        return `floor-${rider.floor}`;
    }

    function slot(rider: Rider, index: number) {
        return riders.slice(0, index).filter((other) => (
            target(other) === target(rider)
        )).length;
    }

    function riderStyle(rider: Rider, index: number) {
        const car = rider.place === 'boarding' || rider.place === 'riding';
        const pos = slot(rider, index);
        const { col, row } = lanePos(pos);
        let left: string | number = WAIT_X + RIDER / 2 + col * (RIDER + GAP);

        if (car) {
            const space = SLOTS[rider.slot ?? 0];
            left = carLeft(space);
        } else if (rider.place === 'leaving' || rider.place === 'fading') {
            left = exitLeft(col);
        }

        const bottom = car
            ? carBottom(floor, SLOTS[rider.slot ?? 0])
            : floorPos(rider.floor, row);

        return {
            ...styles.rider,
            left,
            bottom,
            opacity: rider.place === 'fading' ? 0 : 1,
        };
    }

    const samples10 = since(samplesRef.current, clock, 10000);
    const samples60 = since(samplesRef.current, clock, 60000);
    const floorWaits10 = since(floorWaitsRef.current, clock, 10000).map((event) => event.value);
    const floorWaits60 = since(floorWaitsRef.current, clock, 60000).map((event) => event.value);
    const liftWaits10 = since(liftWaitsRef.current, clock, 10000).map((event) => event.value);
    const liftWaits60 = since(liftWaitsRef.current, clock, 60000).map((event) => event.value);
    const trips10 = since(tripsRef.current, clock, 10000).length;
    const trips60 = since(tripsRef.current, clock, 60000).length;
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
            now: '-',
            ten: fmtTime(avg(liftWaits10)),
            sixty: fmtTime(avg(liftWaits60)),
        },
        {
            name: 'Trips',
            now: String(tripsTotalRef.current),
            ten: String(trips10),
            sixty: String(trips60),
        },
    ];

    return (
        <div style={styles.wrap}>
            <div style={styles.status}>
                <div style={styles.statusText}>
                    <strong>Floor {floor}</strong>
                    <span>
                        {running
                            ? phase === 'moving'
                                ? `Moving ${dir === 1 ? 'up' : 'down'}`
                                : 'Boarding'
                            : 'Paused'}
                    </span>
                </div>
                <div style={styles.controls}>
                    <Button style={styles.action} onClick={() => setRunning((value) => !value)}>
                        {running ? 'Pause' : 'Run'}
                    </Button>
                    <Button style={styles.action} onClick={reset}>Reset</Button>
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
                                        top: `${index * (100 / FLOORS)}%`,
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
                            bottom: y(floor),
                        }}
                    />
                    {SLOTS.map((space, index) => (
                        <span
                            key={index}
                            style={{
                                ...styles.space,
                                left: spaceLeft(space),
                                bottom: spaceBottom(floor, space),
                            }}
                        />
                    ))}
                    {riders.map((rider, index) => (
                        <span key={rider.id} style={riderStyle(rider, index)}>
                            {rider.dest}
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
                        <strong>{fmtTime(Math.max(maxFloorWaitRef.current, currentMaxWait(riders, clock)))}</strong>
                    </div>
                    <div style={styles.metricMax}>
                        <span>Max lift wait</span>
                        <strong>{fmtTime(maxLiftWaitRef.current)}</strong>
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
        maxWidth: 760,
        marginTop: '1.5rem',
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
    sim: {
        display: 'grid',
        gridTemplateColumns: 'minmax(360px, 1fr) minmax(260px, 300px)',
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
        transition: [
            `left ${WALK_MS}ms ease-in-out`,
            `bottom ${MOVE_MS - 120}ms ease-in-out`,
            `opacity ${FADE_MS}ms ease-in-out`,
        ].join(', '),
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
        transition: `bottom ${MOVE_MS - 120}ms ease-in-out`,
    },
    space: {
        position: 'absolute',
        width: SPACE,
        height: SPACE,
        border: `${SPACE_BORDER}px solid rgba(255, 255, 255, 0.86)`,
        borderRadius: '50%',
        boxSizing: 'border-box',
        transform: 'translate(-50%, 50%)',
        transition: `bottom ${MOVE_MS - 120}ms ease-in-out`,
    },
    controls: {
        display: 'flex',
        flexDirection: 'row',
        gap: '0.5rem',
        alignItems: 'stretch',
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
