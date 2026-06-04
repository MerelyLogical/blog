'use client'

import { useEffect, useRef, useState } from 'react';
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

type Dir = -1 | 1;
type Phase = 'moving' | 'stopped';
type Place = 'waiting' | 'boarding' | 'riding' | 'leaving' | 'fading';
type Rider = {
    id: number;
    floor: number;
    dest: number;
    place: Place;
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

function y(floor: number) {
    const progress = floor / TOP;
    return `calc(${EDGE}px + ${progress * 100}% - ${progress * EDGE * 2}px)`;
}

export default function Lift() {
    const [floor, setFloor] = useState(0);
    const [dir, setDir] = useState<Dir>(1);
    const [running, setRunning] = useState(true);
    const [phase, setPhase] = useState<Phase>('moving');
    const [riders, setRiders] = useState<Rider[]>([]);
    const timers = useRef<number[]>([]);

    function later(fn: () => void, ms: number) {
        const timer = window.setTimeout(fn, ms);
        timers.current.push(timer);
        return timer;
    }

    function clearTimers() {
        timers.current.forEach((timer) => window.clearTimeout(timer));
        timers.current = [];
    }

    useEffect(() => clearTimers, []);

    useEffect(() => {
        if (!running) {
            return;
        }

        let done: number | undefined;
        const timer = window.setTimeout(() => {
            if (phase === 'stopped') {
                setRiders((current) => current.map((rider) => {
                    if (rider.place === 'riding' && rider.dest === floor) {
                        return { ...rider, floor, place: 'leaving' };
                    }

                    if (rider.place === 'waiting' && rider.floor === floor) {
                        return { ...rider, place: 'boarding' };
                    }

                    return rider;
                }));

                done = later(() => {
                    setRiders((current) => current
                        .map((rider) => {
                            if (rider.place === 'boarding') {
                                return { ...rider, floor, place: 'riding' };
                            }

                            return rider;
                        }));
                    setPhase('moving');

                    later(() => {
                        setRiders((current) => current.map((rider) => {
                            if (rider.place === 'leaving' && rider.floor === floor) {
                                return { ...rider, place: 'fading' };
                            }

                            return rider;
                        }));

                        later(() => {
                            setRiders((current) => current.filter((rider) => !(
                                rider.place === 'fading' && rider.floor === floor
                            )));
                        }, FADE_MS);
                    }, LINGER_MS);
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
            setRiders((current) => {
                if (current.length >= MAX_RIDERS) {
                    return current;
                }

                const riderFloor = Math.floor(Math.random() * FLOORS);
                let dest = Math.floor(Math.random() * FLOORS);

                while (dest === riderFloor) {
                    dest = Math.floor(Math.random() * FLOORS);
                }

                return [
                    ...current,
                    {
                        id: Date.now() + Math.random(),
                        floor: riderFloor,
                        dest,
                        place: 'waiting',
                    },
                ];
            });
        }, SPAWN_MS);

        return () => window.clearInterval(timer);
    }, [running]);

    function reset() {
        clearTimers();
        setFloor(0);
        setDir(1);
        setRunning(false);
        setPhase('moving');
        setRiders([]);
    }

    function target(rider: Rider) {
        if (rider.place === 'boarding' || rider.place === 'riding') {
            return 'car';
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
        const perRow = car ? 4 : 10;
        const pos = slot(rider, index);
        const col = pos % perRow;
        const row = Math.floor(pos / perRow);
        let left: string | number = WAIT_X + col * (RIDER + GAP);

        if (car) {
            left = `calc(50% - ${(CAR_W / 2) - 12 - col * (RIDER + GAP)}px)`;
        } else if (rider.place === 'leaving' || rider.place === 'fading') {
            left = `calc(50% + ${(CAR_W / 2) + EXIT_GAP + col * (RIDER + GAP)}px)`;
        }

        const bottom = car
            ? `calc(${y(floor)} - 6px + ${row * (RIDER + GAP)}px)`
            : `calc(${y(rider.floor)} + ${row * (RIDER + GAP)}px)`;

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
        transform: 'translateY(50%)',
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
    controls: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'stretch',
    },
} satisfies Record<string, CSSProperties>;
