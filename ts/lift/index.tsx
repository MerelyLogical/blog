'use client'

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

import { Button } from '@/ts/ui/Button';

const FLOORS = 6;
const MOVE_MS = 700;
const STOP_MS = 450;
const WALK_MS = 520;
const LINGER_MS = 3000;
const FADE_MS = 450;
const SPAWN_MS = 1400;
const MAX_RIDERS = 18;
const TOP = FLOORS - 1;
const CAR_H = 60;
const CAR_W = 112;
const EDGE = 36;
const RIDER = 22;
const GAP = 3;
const CAR_X = '50%';
const WAIT_X = 42;
const EXIT_GAP = 16;
const EXIT_RIGHT = 42;
const SLOT_COLS = 3;
const SLOT_ROWS = 2;
const SLOT_GAP_X = 8;
const SLOT_GAP_Y = 6;
const SLOT_W = SLOT_COLS * RIDER + (SLOT_COLS - 1) * SLOT_GAP_X;
const SLOT_H = SLOT_ROWS * RIDER + (SLOT_ROWS - 1) * SLOT_GAP_Y;
const SLOT_LEFT = (CAR_W - SLOT_W) / 2;
const SLOT_BOTTOM = (CAR_H - SLOT_H) / 2;
const SLOTS = Array.from({ length: SLOT_ROWS }, (_, row) => (
    Array.from({ length: SLOT_COLS }, (_, col) => ({
        x: SLOT_LEFT + col * (RIDER + SLOT_GAP_X),
        y: SLOT_BOTTOM + (SLOT_ROWS - 1 - row) * (RIDER + SLOT_GAP_Y),
    }))
)).flat();

type Dir = -1 | 1;
type Phase = 'moving' | 'stopped';
type Place = 'waiting' | 'boarding' | 'riding' | 'leaving' | 'fading';
type Rider = {
    id: number;
    floor: number;
    dest: number;
    place: Place;
    slot?: number;
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

function stopRiders(current: Rider[], floor: number, now: number): Rider[] {
    const used = new Set(current
        .filter((rider) => (
            (rider.place === 'riding' || rider.place === 'boarding') &&
            rider.dest !== floor &&
            rider.slot !== undefined
        ))
        .map((rider) => rider.slot));

    return current.map((rider) => {
        if (rider.place === 'riding' && rider.dest === floor) {
            const fadeAt = now + LINGER_MS;

            return {
                ...rider,
                floor,
                place: 'leaving',
                slot: undefined,
                fadeAt,
                removeAt: fadeAt + FADE_MS,
            };
        }

        if (rider.place === 'waiting' && rider.floor === floor) {
            const slot = SLOTS.findIndex((_, index) => !used.has(index));

            if (slot === -1) {
                return rider;
            }

            used.add(slot);
            return { ...rider, place: 'boarding', slot };
        }

        return rider;
    });
}

function boardRiders(current: Rider[], floor: number): Rider[] {
    return current.map((rider) => {
        if (rider.place === 'boarding') {
            return { ...rider, floor, place: 'riding' };
        }

        return rider;
    });
}

function riderDue(rider: Rider) {
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
    return `calc(${y(floor)} - ${RIDER / 2}px + ${row * (RIDER + GAP)}px)`;
}

function carLeft(space: { x: number }) {
    return `calc(50% - ${CAR_W / 2}px + ${space.x}px)`;
}

function carBottom(floor: number, space: { y: number }) {
    return `calc(${y(floor)} - ${CAR_H / 2}px + ${space.y}px)`;
}

function exitLeft(col: number) {
    return `calc(100% - ${EXIT_RIGHT + RIDER + col * (RIDER + GAP)}px)`;
}

export default function Lift() {
    const [floor, setFloor] = useState(0);
    const [dir, setDir] = useState<Dir>(1);
    const [running, setRunning] = useState(true);
    const [phase, setPhase] = useState<Phase>('moving');
    const [riders, setRiders] = useState<Rider[]>([]);

    useEffect(() => {
        if (!running) {
            return;
        }

        let done: number | undefined;
        const timer = window.setTimeout(() => {
            if (phase === 'stopped') {
                setRiders((current) => stopRiders(current, floor, Date.now()));

                done = window.setTimeout(() => {
                    setRiders((current) => boardRiders(current, floor));
                    setPhase('moving');
                }, WALK_MS);
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
            setRiders(spawn);
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
            setRiders((current) => ageRiders(current, Date.now()));
        }, wait);

        return () => window.clearTimeout(timer);
    }, [riders]);

    function reset() {
        setFloor(0);
        setDir(1);
        setRunning(false);
        setPhase('moving');
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
        const perRow = 10;
        const pos = slot(rider, index);
        const col = pos % perRow;
        const row = Math.floor(pos / perRow);
        let left: string | number = WAIT_X + col * (RIDER + GAP);

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
                    >
                        {SLOTS.map((space, index) => (
                            <span
                                key={index}
                                style={{
                                    ...styles.space,
                                    left: space.x,
                                    bottom: space.y,
                                }}
                            />
                        ))}
                    </div>
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
        width: RIDER,
        height: RIDER,
        border: '1px dotted rgba(255, 255, 255, 0.72)',
        borderRadius: '50%',
        boxSizing: 'border-box',
    },
    controls: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'stretch',
    },
} satisfies Record<string, CSSProperties>;
