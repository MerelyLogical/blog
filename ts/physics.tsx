'use client';

import { useEffect, useRef, useState } from 'react';

const HEIGHT = 1000;
const WIDTH  = 1000;

const ARROW_ACC       = 0.0002;
const FRICTION_FACTOR = 1.015;
const BALL_RADIUS     = 0.006;
const EPSILON         = 0.08;
const COR             = 0.80;
const GRAVITY         = 0.00004;
const BROWNIAN_V      = 0.0002;
const TARGET_V        = 0.00005;

const HEART_WIDTH  = 31;
const HEART_HEIGHT = 30;

const heart = `\
...............................\
...............................\
...............................\
...............................\
........***.........***........\
.......*****.......*****.......\
......*******.....*******......\
.....*********...*********.....\
....***********.***********....\
...*************************...\
...*************************...\
...*************************...\
...*************************...\
...*************************...\
...*************************...\
...*************************...\
....***********************....\
.....*********************.....\
......*******************......\
.......*****************.......\
........***************........\
.........*************.........\
..........***********..........\
...........*********...........\
............*******............\
.............*****.............\
..............***..............\
...............*...............\
...............................\
...............................\
...............................`;

class Point {
    x: number; y: number; u: number; v: number; c: string; tx: number; ty: number;
    constructor(x: number, y: number, u: number, v: number, c: string, tx: number, ty: number) {
        this.x = x; this.y = y; this.u = u; this.v = v; this.c = c; this.tx = tx; this.ty = ty;
    }
}

type SimFlags = {
    heater: boolean;
    freezer: boolean;
    wrap: boolean;
    elasticwall: boolean;
    gravity: boolean;
};

type InputState = {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
};

type Accums = {
    sdv: number;
    sdvs: number[];
};

function movePoint(
    pt: Point,
    flags: SimFlags,
    input: InputState,
    accums: Accums,
    ctx: CanvasRenderingContext2D,
) {
    const { heater, freezer, wrap, elasticwall, gravity } = flags;

    if (heater) {
        pt.u += (Math.random()-0.5) * BROWNIAN_V;
        pt.v += (Math.random()-0.5) * BROWNIAN_V;
    }

    if (input.left)  { pt.u -= ARROW_ACC; }
    if (input.right) { pt.u += ARROW_ACC; }
    if (input.up)    { pt.v -= ARROW_ACC; }
    if (input.down)  { pt.v += ARROW_ACC; }

    const tempdist = Math.sqrt((pt.tx-pt.x)**2 + (pt.ty-pt.y)**2);
    pt.u += (pt.tx - pt.x) * tempdist * TARGET_V;
    pt.v += (pt.ty - pt.y) * tempdist * TARGET_V;

    pt.x += pt.u;
    pt.y += pt.v;

    if (freezer) {
        pt.u = pt.u / FRICTION_FACTOR;
        pt.v = pt.v / FRICTION_FACTOR;
    }

    if (gravity) { pt.v += GRAVITY; }

    if (wrap){
        if (pt.x <   BALL_RADIUS) { pt.x += 1; }
        if (pt.x > 1-BALL_RADIUS) { pt.x -= 1; }
        if (pt.y <   BALL_RADIUS) { pt.y += 1; }
        if (pt.y > 1-BALL_RADIUS) { pt.y -= 1; }
    } else if (elasticwall) {
        if (pt.x <   BALL_RADIUS) { accums.sdv -= 2 * pt.u; pt.u = -pt.u; pt.x =   BALL_RADIUS; }
        if (pt.x > 1-BALL_RADIUS) { accums.sdv += 2 * pt.u; pt.u = -pt.u; pt.x = 1-BALL_RADIUS; }
        if (pt.y <   BALL_RADIUS) { accums.sdv -= 2 * pt.v; pt.v = -pt.v; pt.y =   BALL_RADIUS; }
        if (pt.y > 1-BALL_RADIUS) { accums.sdv += 2 * pt.v; pt.v = -pt.v; pt.y = 1-BALL_RADIUS; }
    } else {
        if (pt.x <   BALL_RADIUS) { accums.sdv -= (1+COR) * pt.u; pt.u = -pt.u * COR; pt.x =   BALL_RADIUS; }
        if (pt.x > 1-BALL_RADIUS) { accums.sdv += (1+COR) * pt.u; pt.u = -pt.u * COR; pt.x = 1-BALL_RADIUS; }
        if (pt.y <   BALL_RADIUS) { accums.sdv -= (1+COR) * pt.v; pt.v = -pt.v * COR; pt.y =   BALL_RADIUS; }
        if (pt.y > 1-BALL_RADIUS) { accums.sdv += (1+COR) * pt.v; pt.v = -pt.v * COR; pt.y = 1-BALL_RADIUS; }
    }

    ctx.beginPath();
    ctx.arc(pt.x*WIDTH, pt.y*HEIGHT, BALL_RADIUS*WIDTH, 0, 2 * Math.PI);
    ctx.fillStyle = pt.c;
    ctx.fill();
}

function colvcalc(p1: Point, p2: Point) {
    let num   = ((p1.u-p2.u) * (p1.x-p2.x)) + ((p1.v-p2.v) * (p1.y-p2.y));
    let denom = (p1.x-p2.x)**2 + (p1.y-p2.y)**2;
    let xfact = p1.x-p2.x;
    let yfact = p1.y-p2.y;
    return [xfact*num/denom, yfact*num/denom];
}

function collision(points:Point[]) {
    for (let i = 0; i < points.length - 1; i++) {
        let current = points[i];
        let others = points.slice(i+1);
        others.forEach((other) => {
            let dist = Math.sqrt((current.x-other.x)**2 + (current.y-other.y)**2);
            let overlap = 2*BALL_RADIUS - dist;
            if (overlap > 0) {
                if (current.x > other.x) {
                    current.x += overlap*EPSILON; other.x -= overlap*EPSILON;
                } else {
                    current.x -= overlap*EPSILON; other.x += overlap*EPSILON;
                }

                if (current.y > other.y) {
                    current.y += overlap*EPSILON; other.y -= overlap*EPSILON;
                } else {
                    current.y -= overlap*EPSILON; other.y += overlap*EPSILON;
                }

                let tempcurrent = colvcalc(current, other);
                let tempother = colvcalc(other, current);

                current.u -= tempcurrent[0];
                current.v -= tempcurrent[1];
                other.u -= tempother[0];
                other.v -= tempother[1];
            }
        })
    }
}

function calcKE(pts: Point[]) {
    return pts.reduce((acc, pt) => acc + pt.u**2 + pt.v**2, 0.0);
}

function initHeartPoints(): Point[] {
    const pts: Point[] = [];
    for (let i = 0; i < heart.length; i++) {
        let tempcolour;
        if (heart[i] === '*') {
            tempcolour = `hsla(${Math.random() * 360}, 50%, 50%, 1)`;
        } else {
            tempcolour = 'hsla(180, 10%, 20%, 1)';
        }

        const temptx = ((i % HEART_WIDTH) + 0.5) / HEART_WIDTH;
        const tempty = (Math.floor(i / HEART_WIDTH) + 0.5) / HEART_HEIGHT;

        pts[i] = new Point(
            Math.random(),
            Math.random(),
            0,
            0,
            tempcolour,
            temptx,
            tempty,
        );
    }
    return pts;
}

function drawBorder(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#DDDDDD';
    ctx.rect(0, 0, WIDTH, HEIGHT);
    ctx.stroke();
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
    const flagsRef = useRef<SimFlags>(flags);
    const inputRef = useRef<InputState>({ left: false, right: false, up: false, down: false });
    const ctxRef   = useRef<CanvasRenderingContext2D | null>(null);

    // visible metrics
    const [aveSdv, setAveSdv] = useState(0);
    const [keDisp, setKeDisp] = useState(0);
    const [ratio,  setRatio ] = useState(0);

    useEffect(() => {
        flagsRef.current = flags;
    }, [flags]);

    // Keyboard input handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].indexOf(e.code) > -1) {
                e.preventDefault();
            }
            switch (e.key) {
                case "ArrowLeft":  inputRef.current.left  = true; break;
                case "ArrowRight": inputRef.current.right = true; break;
                case "ArrowUp":    inputRef.current.up    = true; break;
                case "ArrowDown":  inputRef.current.down  = true; break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowLeft":  inputRef.current.left  = false; break;
                case "ArrowRight": inputRef.current.right = false; break;
                case "ArrowUp":    inputRef.current.up    = false; break;
                case "ArrowDown":  inputRef.current.down  = false; break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        ctxRef.current = ctx;
        if (ptsRef.current.length === 0) {
            ptsRef.current = initHeartPoints();
        }

        const step = () => {
            const pts = ptsRef.current;
            const acc = accRef.current;
            const context = ctxRef.current;
            if (!context) {
                return;
            }

            const ke = calcKE(pts) / 2.0;

            // rolling average of sdv
            acc.sdvs.push(acc.sdv);
            if (acc.sdvs.length > 100) { acc.sdvs.shift(); }
            const ave_sdv = acc.sdvs.length
                ? acc.sdvs.reduce((sum, v) => sum + v, 0.0) / acc.sdvs.length
                : 0;

            setAveSdv(ave_sdv);
            setRatio(ke ? ave_sdv / ke : 0);
            setKeDisp(ke);

            acc.sdv = 0;
            context.clearRect(0, 0, WIDTH, HEIGHT);
            collision(pts);
            for (let i = 0; i < pts.length; i++) {
                movePoint(pts[i], flagsRef.current, inputRef.current, acc, context);
            }
            drawBorder(context);
        };

        // draw first frame immediately so the canvas isn't empty
        step();
        const interval = window.setInterval(step, 10);
        return () => {
            window.clearInterval(interval);
            ctxRef.current = null;
        };
    }, []);

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
