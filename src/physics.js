const s = document.getElementById("screen");
const ARROW_ACC = 0.0003;
const FRICTION_FACTOR = 1.012;
const BALL_RADIUS = 0.006;
const EPSILON = 0.05;
const COR = 0.75;

class Point {
    constructor(x, y, vx, vy, c) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.el = this.drawCircle(x, y, c);
    };

    drawCircle(x, y, c) {
        let node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        node.setAttribute("cx", x);
        node.setAttribute("cy", y);
        node.setAttribute("r", BALL_RADIUS);
        node.style.fill = c;
        s.appendChild(node);
        return node;
    }
}

// Keyboard input handling
var input = { left: false, right: false, up: false, down: false };

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case "ArrowLeft": input.left = true; break;
        case "ArrowRight": input.right = true; break;
        case "ArrowUp": input.up = true; break;
        case "ArrowDown": input.down = true; break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case "ArrowLeft": input.left = false; break;
        case "ArrowRight": input.right = false; break;
        case "ArrowUp": input.up = false; break;
        case "ArrowDown": input.down = false; break;
    }
});

// Physics
function movePoint(pt) {

    // random nudge for brownian motion?
    // pt.vx += (Math.random()-0.5) * EPSILON;
    // pt.vy += (Math.random()-0.5) * EPSILON;
    
    // velocity
    if (input.left) { pt.vx -= ARROW_ACC; }
    if (input.right) { pt.vx += ARROW_ACC; }
    if (input.up) { pt.vy -= ARROW_ACC; }
    if (input.down) { pt.vy += ARROW_ACC; }
    pt.x += pt.vx;
    pt.y += pt.vy;
    // friction
    pt.vx = pt.vx / FRICTION_FACTOR;
    pt.vy = pt.vy / FRICTION_FACTOR;

    // walls reflect
    if (pt.x < BALL_RADIUS) { pt.vx = -pt.vx * COR; pt.x = BALL_RADIUS; };
    if (pt.x > 1-BALL_RADIUS) { pt.vx = -pt.vx * COR; pt.x = 1-BALL_RADIUS; };
    if (pt.y < BALL_RADIUS) { pt.vy = -pt.vy * COR; pt.y = BALL_RADIUS; };
    if (pt.y > 1-BALL_RADIUS) { pt.vy = -pt.vy * COR; pt.y = 1-BALL_RADIUS; };

    pt.el.setAttribute("cx", pt.x);
    pt.el.setAttribute("cy", pt.y);
}

function collision(current, others) {
    others.forEach((other) => {
        let dist = Math.sqrt((current.x-other.x)**2 + (current.y-other.y)**2);
        let overlap = 2*BALL_RADIUS - dist;
        if (overlap > 0) {
            // very coarse way of nudging the balls away from each other first
            if (current.x > other.x) {
                current.x += overlap*EPSILON;
                other.x -= overlap*EPSILON;
            } else {
                current.x -= overlap*EPSILON;
                other.x += overlap*EPSILON;
            }

            if (current.y > other.y) {
                current.y += overlap*EPSILON;
                other.y -= overlap*EPSILON;
            } else {
                current.y -= overlap*EPSILON;
                other.y += overlap*EPSILON;
            }

            // swap v in perfect elastic collisions, but direction change needs more calculations
            let tempx = current.vx;
            let tempy = current.vy;
            current.vx = other.vx;
            current.vy = other.vy;
            other.vx = tempx;
            other.vy = tempy;
        }
    })
}

function init() {
    let border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    border.setAttribute("width", 1);
    border.setAttribute("height", 1);
    border.setAttribute("x", 0);
    border.setAttribute("y", 0);
    border.style.fill = "none";
    border.style.strokeWidth = "0.005";
    border.style.stroke = "#DDDDDD"
    s.appendChild(border);
}

var pts = [];

for (let i = 0; i < 250; i++) {
    
    pts[i] = new Point(Math.random(), Math.random(), 0, 0, 'hsla(' + (Math.random() * 360) + ', 50%, 50%, 1)');
}

function step() {
    for (let i = 0; i < pts.length - 1; i++) {
        collision(pts[i], pts.slice(i+1));
    }
    pts.forEach(movePoint);
}

init();
setInterval(step, 10);
