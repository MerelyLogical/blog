'use client';

import { useEffect, useRef, useState } from 'react';

const HEIGHT = 1000;
const WIDTH  = 1000;

export default function AiCanvas() {

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    return (
            <canvas
                ref={canvasRef}
                width={WIDTH}
                height={HEIGHT}
                style={{ width: '100%', height: '100%', margin: 0 }}
            />
    )
}
