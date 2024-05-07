const s = document.getElementById("screen");
const ARROW_ACC = 0.0004;
const FRICTION_FACTOR = 1.01;

let border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
border.setAttribute("width", 1);
border.setAttribute("height", 1);
border.setAttribute("x", 0);
border.setAttribute("y", 0);
border.style.fill = "none";
border.style.strokeWidth = "0.005";
border.style.stroke = "#CCCCCC"
s.appendChild(border);

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
        node.setAttribute("r", 0.005);
        node.style.fill = c;
        s.appendChild(node);
        return node;
    }
}

function refreshCircle(p) {
    p.el.setAttribute("cx", p.x);
    p.el.setAttribute("cy", p.y);
}

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


var pt1 = new Point(0.5, 0.5, 0, 0, "#AAAAAA");
var pt2 = new Point(0.5, 0.3, 0, 0, "#33AA33");

pts = [pt1, pt2];

function movePoint(pt) {
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
    if (pt.x < 0) { pt.vx = -pt.vx; pt.x = 0; };
    if (pt.x > 1) { pt.vx = -pt.vx; pt.x = 1; };
    if (pt.y < 0) { pt.vy = -pt.vy; pt.y = 0; };
    if (pt.y > 1) { pt.vy = -pt.vy; pt.y = 1; };

    refreshCircle(pt);
}

function step() {
    pts.forEach(movePoint);
}

setInterval(step, 10);
