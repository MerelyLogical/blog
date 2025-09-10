'use client';

// ported from physics.js with help from chatgpt,
// still have many bugs
// sdv and KE calculations are quite off vs original
// doesn't take user input and doesn't disable arrow key scrolling

import { useEffect, useRef, useState } from 'react';
import {
    WIDTH, HEIGHT, BALL_RADIUS,
    initHeartPoints, movePoint, collision, calcKE,
    type Point, type SimFlags, type Accums
} from '@/js/physics_lib';

function drawBorder(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#DDDDDD';
    ctx.rect(0, 0, WIDTH, HEIGHT);
    ctx.stroke();
}

function drawPoints(ctx: CanvasRenderingContext2D, pts: Point[]) {
    for (const pt of pts) {
        ctx.beginPath();
        ctx.arc(pt.x*WIDTH, pt.y*HEIGHT, BALL_RADIUS*WIDTH, 0, 2 * Math.PI);
        ctx.fillStyle = pt.c;
        ctx.fill();
    }
}

export default function PhysicsCanvas() {
    // controls
    const [flags, setFlags] = useState<SimFlags>({
        heater: false,
        freezer: false,
        wrap: false,
        elasticwall: true,
        gravity: false,
    });

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // long-lived sim data (don’t cause rerenders every frame)
    const ptsRef   = useRef<Point[]>([]);
    const accRef   = useRef<Accums>({ sdv: 0, sdvs: [] });

    // visible metrics
    const [aveSdv, setAveSdv] = useState(0);
    const [keDisp, setKeDisp] = useState(0);
    const [ratio,  setRatio ] = useState(0);

    // init points once
    useEffect(() => {
        if (ptsRef.current.length === 0) {
            ptsRef.current = initHeartPoints();
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        let raf = 0;

        const step = () => {
            const pts = ptsRef.current;
            const acc = accRef.current;

            const ke = calcKE(pts) / 2.0;

            // physics update
            collision(pts);
            for (let i = 0; i < pts.length; i++) {
                movePoint(pts[i], flags, acc);
            }

            // rolling average of sdv
            acc.sdvs.push(acc.sdv);
            if (acc.sdvs.length > 100) { acc.sdvs.shift(); }
            let ave_sdv = acc.sdvs.reduce((acc, v) => acc + v, 0.0) / acc.sdvs.length;

            setAveSdv(ave_sdv);
            setRatio(ke ? ave_sdv / ke : 0);
            setKeDisp(ke);

            // draw
            ctx.clearRect(0, 0, WIDTH, HEIGHT);
            drawBorder(ctx);
            drawPoints(ctx, pts);

            raf = requestAnimationFrame(step);
        };

        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [flags]);

    return (
        <div>
            <fieldset>
                <input type="checkbox" checked={flags.heater}
                    onChange={e => setFlags(f => ({ ...f, heater: e.target.checked }))}
                    /> Heater
                {' '}
                <input type="checkbox" checked={flags.freezer}
                    onChange={e => setFlags(f => ({ ...f, freezer: e.target.checked }))}
                    /> Freezer
                {' '}
                <input type="checkbox" checked={flags.wrap}
                    onChange={e => setFlags(f => ({ ...f, wrap: e.target.checked }))}
                    /> Wrap walls
                {' '}
                <input type="checkbox" checked={flags.elasticwall}
                    onChange={e => setFlags(f => ({ ...f, elasticwall: e.target.checked }))}
                    /> Perfectly elastic walls
                {' '}
                <input type="checkbox" checked={flags.gravity}
                    onChange={e => setFlags(f => ({ ...f, gravity: e.target.checked }))}
                    /> Gravity
            </fieldset>

            <div style={{ marginTop: 8, marginBottom: 8 }}>
                  ½Σv: <strong>{keDisp.toFixed(5)}</strong>
                | Σdv on walls: <strong>{aveSdv.toFixed(5)}</strong>
                | ratio: <strong>{ratio.toFixed(5)}</strong>
            </div>

            <canvas
                ref={canvasRef}
                width={WIDTH}
                height={HEIGHT}
                style={{ width: '100%', height: '100%', margin: 0 }}
            />
        </div>
    );
}
