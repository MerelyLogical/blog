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
type Step = { riders: Rider[]; acted: boolean; action: Action };
type Rider = {
    id: number;
    floor: number;
    dest: number;
    place: Place;
    slot?: number;
    walkUntil?: number;
    fadeAt?: number;
    removeAt?: number;
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
    const riders = current.map((rider) => {
        if (acted || rider.place !== 'waiting' || rider.floor !== floor) {
            return rider;
        }

        const slot = SLOTS.findIndex((_, index) => !used.has(index));

        if (slot === -1) {
            return rider;
        }

        acted = true;
        used.add(slot);
        return { ...rider, place: 'boarding', slot, walkUntil: now + WALK_MS };
    });

    return { riders, acted, action: 'board' };
}

function alightStep(current: Rider[], floor: number, now: number): Step {
    let acted = false;
    const riders = current.map((rider) => {
        if (acted || rider.place !== 'riding' || rider.dest !== floor) {
            return rider;
        }

        acted = true;
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

    return { riders, acted, action: 'alight' };
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
    return `calc(${y(floor)} + ${row * (RIDER + GAP)}px)`;
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

export default function Lift() {
    const [floor, setFloor] = useState(0);
    const [dir, setDir] = useState<Dir>(1);
    const [running, setRunning] = useState(true);
    const [phase, setPhase] = useState<Phase>('moving');
    const [riders, setRiders] = useState<Rider[]>([]);
    const ridersRef = useRef<Rider[]>([]);

    useEffect(() => {
        ridersRef.current = riders;
    }, [riders]);

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

    return (
        <div style={styles.wrap}>
            <div style={styles.status}>
                <strong>Floor {floor}</strong>
                <span>
                    {running
                        ? phase === 'moving'
                            ? `Moving ${dir === 1 ? 'up' : 'down'}`
                            : 'Boarding'
                        : 'Paused'}
                </span>
            </div>
            <div style={styles.sim}>
                <div style={styles.shaft}>
                    {Array.from({ length: FLOORS }, (_, index) => {
                        const shown = TOP - index;

                        return (
                            <div
                                key={shown}
                                style={{
                                    ...styles.row,
                                    bottom: y(shown),
                                }}
                            >
                                <span style={styles.label}>{shown}</span>
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
                <div style={styles.controls}>
                    <Button onClick={() => setRunning((value) => !value)}>
                        {running ? 'Pause' : 'Run'}
                    </Button>
                    <Button onClick={reset}>Reset</Button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    wrap: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: 520,
        marginTop: '1.5rem',
    },
    status: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        color: 'var(--app-text-color)',
    },
    sim: {
        display: 'grid',
        gridTemplateColumns: 'minmax(160px, 1fr) auto',
        alignItems: 'center',
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
        fontSize: '0.8rem',
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
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'stretch',
    },
} satisfies Record<string, CSSProperties>;
