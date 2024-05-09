const canvas = document.getElementById("cscreen");
const ctx = canvas.getContext("2d");
const HEIGHT = 1000;
const WIDTH = 1000;

const ARROW_ACC = 0.0002;
const FRICTION_FACTOR = 1.015;
const BALL_RADIUS = 0.006;
const EPSILON = 0.08;
const COR = 0.80;
const GRAVITY = 0.00004;
const BROWNIAN_V = 0.0002;

var input = { left: false, right: false, up: false, down: false };
var pts = [];
// very hacky way of calculating sdv
var sdv = 0;
var cnt = 0;

// TODO:
// really laggy, find optimisations
// add timers to different functions and see their cumulative times?
// maybe use parallelisation(?), use GPU(???)
// what does requestAnimationFrame do?

class Point {
    constructor(x, y, u, v, c) {
        this.x = x;
        this.y = y;
        this.u = u; // velocity x component
        this.v = v; // velocity y component
        this.c = c; // colour
    };
}

// Keyboard input handling
document.addEventListener('keydown', (e) => {
    if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    switch (e.key) {
        case "ArrowLeft":  input.left  = true; break;
        case "ArrowRight": input.right = true; break;
        case "ArrowUp":    input.up    = true; break;
        case "ArrowDown":  input.down  = true; break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case "ArrowLeft":  input.left  = false; break;
        case "ArrowRight": input.right = false; break;
        case "ArrowUp":    input.up    = false; break;
        case "ArrowDown":  input.down  = false; break;
    }
});

// Physics
function movePoint(pt) {

    let en_heater   = document.getElementById("heater");
    let en_friction = document.getElementById("freezer");
    let en_wrap     = document.getElementById("wrap");
    let en_ewall    = document.getElementById("elasticwall");
    let en_gravity  = document.getElementById("gravity");

    // inject random speed change for heating
    if (en_heater.checked) {
        pt.u += (Math.random()-0.5) * BROWNIAN_V;
        pt.v += (Math.random()-0.5) * BROWNIAN_V;
    }

    // velocity change from player input
    // note this is injecting more speed if pressing two directions at once
    if (input.left)  { pt.u -= ARROW_ACC; }
    if (input.right) { pt.u += ARROW_ACC; }
    if (input.up)    { pt.v -= ARROW_ACC; }
    if (input.down)  { pt.v += ARROW_ACC; }

    // move point
    pt.x += pt.u;
    pt.y += pt.v;

    // friction
    if (en_friction.checked) {
        pt.u = pt.u / FRICTION_FACTOR;
        pt.v = pt.v / FRICTION_FACTOR;
    }

    // gravity
    if (en_gravity.checked) {pt.v += GRAVITY};

    if (en_wrap.checked){
        // walls wrap
        if (pt.x <   BALL_RADIUS) { pt.x += 1; }
        if (pt.x > 1-BALL_RADIUS) { pt.x -= 1; }
        if (pt.y <   BALL_RADIUS) { pt.y += 1; }
        if (pt.y > 1-BALL_RADIUS) { pt.y -= 1; }
    } else if (en_ewall.checked) {
        // walls are perfectly elastic
        // consider just set COR = 1
        if (pt.x <   BALL_RADIUS) { sdv -= 2 * pt.u; pt.u = -pt.u; pt.x =   BALL_RADIUS; }
        if (pt.x > 1-BALL_RADIUS) { sdv += 2 * pt.u; pt.u = -pt.u; pt.x = 1-BALL_RADIUS; }
        if (pt.y <   BALL_RADIUS) { sdv -= 2 * pt.v; pt.v = -pt.v; pt.y =   BALL_RADIUS; }
        if (pt.y > 1-BALL_RADIUS) { sdv += 2 * pt.v; pt.v = -pt.v; pt.y = 1-BALL_RADIUS; }
    } else {
        // walls reflect
        // buggy? sometimes balls get stuck on ceilling?
        if (pt.x <   BALL_RADIUS) { sdv -= (1+COR) * pt.u; pt.u = -pt.u * COR; pt.x =   BALL_RADIUS; }
        if (pt.x > 1-BALL_RADIUS) { sdv += (1+COR) * pt.u; pt.u = -pt.u * COR; pt.x = 1-BALL_RADIUS; }
        if (pt.y <   BALL_RADIUS) { sdv -= (1+COR) * pt.v; pt.v = -pt.v * COR; pt.y =   BALL_RADIUS; }
        if (pt.y > 1-BALL_RADIUS) { sdv += (1+COR) * pt.v; pt.v = -pt.v * COR; pt.y = 1-BALL_RADIUS; }
    }

    // draw circle at new position
    ctx.beginPath();
    ctx.arc(pt.x*WIDTH, pt.y*HEIGHT, BALL_RADIUS*WIDTH, 0, 2 * Math.PI);
    ctx.fillStyle = pt.c;
    ctx.fill();
}

// collision velocity calculator
// v1 = v1 - ((dot(v1-v2, x1-x2) / |x1-x2|*2) * (x1-x2))
// v2 = v2 - ((dot(v2-v1, x2-x1) / |x2-x1|*2) * (x2-x1))
function colvcalc(p1, p2) {
    let num   = ((p1.u-p2.u) * (p1.x-p2.x)) + ((p1.v-p2.v) * (p1.y-p2.y));
    let denom = (p1.x-p2.x)**2 + (p1.y-p2.y)**2;
    let xfact = p1.x-p2.x;
    let yfact = p1.y-p2.y;
    return [xfact*num/denom, yfact*num/denom];
}

function collision(points) {
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

function calcKE(points) {
    return points.reduce((acc, pt) => acc + pt.u**2 + pt.v**2, 0.0);
}

// clean canvas -> do math -> draw new frame
// consider decoupling draw circles and maths for the circles
// then we can do maths -> clean -> redraw
function step() {
    let ke = calcKE(pts);
    // make this into a rolling average, remove last entry and add new entry to get smooth average
    if (cnt > 9) {
        document.getElementById("sdv").innerHTML = (sdv/10).toFixed(5);
        if (sdv < 0.00001) { sdv = 0; } // hacky clip
        document.getElementById("ratio").innerHTML = (sdv/ke).toFixed(5);
        sdv = 0;
        cnt = 0;
    } else {
        cnt++;
    }
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    collision(pts);
    pts.forEach(movePoint);
    ctx.beginPath();
    ctx.lineWidth = "5";
    ctx.strokeStyle = "#DDDDDD";
    ctx.rect(0, 0, WIDTH, HEIGHT);
    ctx.stroke();
    document.getElementById("sv2").innerHTML = ke.toFixed(5);
}


// main function
for (let i = 0; i < 750; i++) {
    pts[i] = new Point(Math.random(), Math.random(), 0, 0, 'hsla(' + (Math.random() * 360) + ', 50%, 50%, 1)');
}
setInterval(step, 10);
