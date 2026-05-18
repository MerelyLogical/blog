'use client';

import { useEffect, useRef } from 'react';

import { HEIGHT, WIDTH } from './constants';
import { runSimulation } from './simulation';

export default function AiCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // TODO: add debug panel: click an agent to inspect stats/details in a div outside the canvas.
        return runSimulation(canvas);
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
