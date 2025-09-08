var canvas = document.getElementById("grid");
var ctx = canvas.getContext("2d");
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;
// default styles
ctx.strokeStyle = "#DDDDDD";
ctx.fillStyle = "#225544";
ctx.lineWidth = 3;

// shortcuts for easier to read formulas

var PI = Math.PI,
    sin = Math.sin,
    cos = Math.cos;
var a = 2 * PI / 6; // 60°
var r = 50; // radius

// x, y is the centre of the hexagon
function drawHexagon(x, y) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
        ctx.lineTo(x + r * cos(a * i), y + r * sin(a * i));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// draws a grid of u * v hexgons (row * col)
// x, y is the center of the top-left hexagon
function drawGrid(u, v, x = r + 5, y = r + 5) {
    for (var i = 0; i < v; i++) {
        for (var j = 0; j < u; j++) {
            drawHexagon(i * (r + r * cos(a)) + x, (((-1) ** (i + 1) + 1) / 2 + 2 * j) * r * sin(a) + y);
        }
    }
}

function refresh() {
    var x = document.getElementById('h').value;
    var y = document.getElementById('w').value;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(x, y);
}

drawGrid(5, 7);