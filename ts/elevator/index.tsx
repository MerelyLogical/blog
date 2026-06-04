'use client'

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

import { Button } from '@/ts/ui/Button';

const FLOORS = 6;
const TICK_MS = 700;
const SPAWN_MS = 1400;
const MAX_RIDERS = 18;
const TOP = FLOORS - 1;

type Dir = -1 | 1;
type Rider = {
    id: number;
    floor: number;
    dest: number;
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

export default function Elevator() {
    const [floor, setFloor] = useState(0);
    const [dir, setDir] = useState<Dir>(1);
    const [running, setRunning] = useState(true);
    const [riders, setRiders] = useState<Rider[]>([]);

    useEffect(() => {
        if (!running) {
            return;
        }

        const timer = window.setInterval(() => {
            setFloor((current) => {
                const moved = next(current, dir);
                setDir(moved.dir);
                return moved.floor;
            });
        }, TICK_MS);

        return () => window.clearInterval(timer);
    }, [dir, running]);

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
                        id: Date.now(),
                        floor: riderFloor,
                        dest,
                    },
                ];
            });
        }, SPAWN_MS);

        return () => window.clearInterval(timer);
    }, [running]);

    function reset() {
        setFloor(0);
        setDir(1);
        setRunning(false);
        setRiders([]);
    }

    return (
        <div style={styles.wrap}>
            <div style={styles.status}>
                <strong>Floor {floor}</strong>
                <span>{running ? `Moving ${dir === 1 ? 'up' : 'down'}` : 'Paused'}</span>
            </div>
            <div style={styles.sim}>
                <div style={styles.shaft}>
                    {Array.from({ length: FLOORS }, (_, index) => {
                        const shown = TOP - index;
                        const waiting = riders.filter((rider) => rider.floor === shown);

                        return (
                            <div key={shown} style={styles.row}>
                                <span style={styles.label}>{shown}</span>
                                <span style={styles.line} />
                                <span style={styles.riders}>
                                    {waiting.map((rider) => (
                                        <span key={rider.id} style={styles.rider}>
                                            {rider.dest}
                                        </span>
                                    ))}
                                </span>
                            </div>
                        );
                    })}
                    <div
                        style={{
                            ...styles.car,
                            bottom: `calc(24px + ${(floor / TOP) * 100}% - ${(floor / TOP) * 48}px)`,
                        }}
                    >
                        Lift
                    </div>
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
        maxWidth: 420,
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
        height: 360,
        border: '1px solid var(--app-card-border)',
        borderRadius: 5,
        background: 'var(--app-card-bg)',
        overflow: 'hidden',
    },
    row: {
        height: `${100 / FLOORS}%`,
        display: 'flex',
        alignItems: 'flex-end',
        gap: '0.6rem',
        padding: '0 0.75rem',
        boxSizing: 'border-box',
    },
    label: {
        width: '2ch',
        fontSize: '0.8rem',
        color: 'var(--app-text-muted)',
        transform: 'translateY(50%)',
    },
    line: {
        flex: 1,
        height: 1,
        background: 'var(--app-card-border)',
    },
    riders: {
        width: 92,
        minHeight: 24,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        alignContent: 'center',
        flexWrap: 'wrap',
        gap: 3,
        transform: 'translateY(50%)',
    },
    rider: {
        width: 20,
        height: 20,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: '#f59e0b',
        color: '#111827',
        fontSize: '0.7rem',
        fontWeight: 700,
        lineHeight: 1,
    },
    car: {
        position: 'absolute',
        left: '46%',
        width: 72,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        border: '1px solid #1d52c5',
        background: '#1d52c5',
        color: '#fff',
        fontWeight: 700,
        transform: 'translate(-50%, 50%)',
        transition: `bottom ${TICK_MS - 120}ms ease-in-out`,
    },
    controls: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'stretch',
    },
} satisfies Record<string, CSSProperties>;
