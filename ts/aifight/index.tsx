'use client';

import { useEffect, useRef } from 'react';

import { HEIGHT, WIDTH } from './constants';
import { runSimulation } from './simulation';
import type { Particle } from './types';

export default function AiCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        return runSimulation(canvas, particlesRef);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            style={{ width: '100%', height: '100%', margin: 0 }}
        />
    );
}
