export const HEIGHT = 1000;
export const WIDTH  = 1000;

export const ARROW_ACC       = 0.0002;
export const FRICTION_FACTOR = 1.015;
export const BALL_RADIUS     = 0.005;
export const EPSILON         = 0.08;
export const COR             = 0.80;
export const GRAVITY         = 0.00004;
export const BROWNIAN_V      = 0.0002;
export const TARGET_V        = 0.00005;

export const HEART_WIDTH  = 31;
export const HEART_HEIGHT = 30;

export const heart = `\
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

export class Point {
    x: number; y: number; u: number; v: number; c: string; tx: number; ty: number;
    constructor(x: number, y: number, u: number, v: number, c: string, tx: number, ty: number) {
        this.x = x; this.y = y; this.u = u; this.v = v; this.c = c; this.tx = tx; this.ty = ty;
    }
}

// Bundle the toggles we used to read via getElementById:
export type SimFlags = {
    heater: boolean;
    freezer: boolean;       // friction-on, etc. (matches your old semantics)
    wrap: boolean;          // wrap-around walls
    elasticwall: boolean;   // perfectly elastic walls
    gravity: boolean;
};

// Accumulators that used to be file-scoped:
export type Accums = {
    sdv: number;            // current frame’s sdv
    sdvs: number[];         // rolling window
};

// Physics
export function movePoint(pt: Point, flags: SimFlags, accums: Accums) {
    const { heater, freezer, wrap, elasticwall, gravity } = flags;
    let sdv = 0;

    // inject random speed change for heating
    if (heater) {
        pt.u += (Math.random() - 0.5) * BROWNIAN_V;
        pt.v += (Math.random() - 0.5) * BROWNIAN_V;
    }

    // gravity
    if (gravity) {
        pt.v += GRAVITY;
    }

    // nudge towards target direction
    const dx = pt.tx - pt.x;
    const dy = pt.ty - pt.y;
    const d = Math.hypot(dx, dy) || 0.1; // set to 0.1 if is 0
    pt.u += (dx / d) * TARGET_V;
    pt.v += (dy / d) * TARGET_V;

    // freezer/friction
    if (freezer) {
        pt.u /= FRICTION_FACTOR;
        pt.v /= FRICTION_FACTOR;
    }

    if (wrap){
        // walls wrap
        if (pt.x <   BALL_RADIUS) { pt.x += 1; }
        if (pt.x > 1-BALL_RADIUS) { pt.x -= 1; }
        if (pt.y <   BALL_RADIUS) { pt.y += 1; }
        if (pt.y > 1-BALL_RADIUS) { pt.y -= 1; }
    } else if (elasticwall) {
        // walls are perfectly elastic
        // consider just set COR = 1
        if (pt.x <   BALL_RADIUS) { sdv -= 2 * pt.u; pt.u = -pt.u; pt.x =   BALL_RADIUS; }
        if (pt.x > 1-BALL_RADIUS) { sdv += 2 * pt.u; pt.u = -pt.u; pt.x = 1-BALL_RADIUS; }
        if (pt.y <   BALL_RADIUS) { sdv -= 2 * pt.v; pt.v = -pt.v; pt.y =   BALL_RADIUS; }
        if (pt.y > 1-BALL_RADIUS) { sdv += 2 * pt.v; pt.v = -pt.v; pt.y = 1-BALL_RADIUS; }
    } else {
        // walls reflect
        if (pt.x <   BALL_RADIUS) { sdv -= (1+COR) * pt.u; pt.u = -pt.u * COR; pt.x =   BALL_RADIUS; }
        if (pt.x > 1-BALL_RADIUS) { sdv += (1+COR) * pt.u; pt.u = -pt.u * COR; pt.x = 1-BALL_RADIUS; }
        if (pt.y <   BALL_RADIUS) { sdv -= (1+COR) * pt.v; pt.v = -pt.v * COR; pt.y =   BALL_RADIUS; }
        if (pt.y > 1-BALL_RADIUS) { sdv += (1+COR) * pt.v; pt.v = -pt.v * COR; pt.y = 1-BALL_RADIUS; }
    }

    // move point
    pt.x += pt.u; pt.y += pt.v;

    accums.sdv = sdv;
}

// collision velocity calculator
// v1 = v1 - ((dot(v1-v2, x1-x2) / |x1-x2|*2) * (x1-x2))
// v2 = v2 - ((dot(v2-v1, x2-x1) / |x2-x1|*2) * (x2-x1))
function colvcalc(p1: Point, p2: Point) {
    let num   = ((p1.u-p2.u) * (p1.x-p2.x)) + ((p1.v-p2.v) * (p1.y-p2.y));
    let denom = (p1.x-p2.x)**2 + (p1.y-p2.y)**2;
    let xfact = p1.x-p2.x;
    let yfact = p1.y-p2.y;
    return [xfact*num/denom, yfact*num/denom];
}

export function collision(points:Point[]) {
    // check collision of point i against all points with index > i
    // potentially more savings if we ignore far points?
    // how to do this without calculating distance?
    for (let i = 0; i < points.length - 1; i++) {
        let current = points[i];
        let others = points.slice(i+1);
        others.forEach((other) => {
            let dist = Math.sqrt((current.x-other.x)**2 + (current.y-other.y)**2);
            let overlap = 2*BALL_RADIUS - dist;
            if (overlap > 0) {
                // very coarse way of nudging the balls away from each other first
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

                // calculate velocity after collision
                let tempcurrent = colvcalc(current, other);
                let tempother = colvcalc(other, current);

                // update velocity
                current.u -= tempcurrent[0];
                current.v -= tempcurrent[1];
                other.u -= tempother[0];
                other.v -= tempother[1];
            }
        })
    }
}

export function calcKE(pts: Point[]) {
    return pts.reduce((acc, pt) => acc + pt.u**2 + pt.v**2, 0.0);
}

// Initialize points from heart mask
export function initHeartPoints(): Point[] {
    const pts: Point[] = [];
    for (let i = 0; i < heart.length; i++) {
        const ch = heart[i];
        if (ch === '\\') continue; // line continuation
        const color = ch === '*' ? `hsla(${Math.random() * 360}, 50%, 50%, 1)`
                                 : 'hsla(180, 10%, 20%, 1)';

        const tx = (          (i % HEART_WIDTH) + 0.5) / HEART_WIDTH;
        const ty = (Math.floor(i / HEART_WIDTH) + 0.5) / HEART_HEIGHT;
        pts.push(new Point(Math.random(), Math.random(), 0, 0, color, tx, ty));
    }
    return pts;
}
