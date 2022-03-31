var canvas = document.getElementById("screen");
var ctx = canvas.getContext("2d");
// ctx.imageSmoothingEnabled = false;

var sd = [];
// use 135x240 grid for 1/8x portrait of 1920x1080
var sw = 135;   // screen width
var sh = 240;   // screen height
var ps = 3;     // pixel size
var ww = 5;     // font width
var wh = 5;     // font height

function itoxy(i) {
    var x = i % sw;
    var y = Math.floor(i / sw);
    return [x, y];
}

function clearscreen(sd) {
    for (var i = 0; i < sh * sw; i++) {
        sd[i] = 0;
    }
}

function writeletter(sd, x, y, letter) {
    for (var i = 0; i < wh; i++) {
        for (var j = 0; j < ww; j++) {
            var wd; // word data
            switch (letter) {
                case '.':
                    wd = ddot;
                    break;
                case 'flag':
                    wd = dflag;
                    break;
                case '0':
                    wd = d0;
                    break;
                case '1':
                    wd = d1;
                    break;
                case '2':
                    wd = d2;
                    break;
                case '3':
                    wd = d3;
                    break;
                case '4':
                    wd = d4;
                    break;
                case '5':
                    wd = d5;
                    break;
                case '6':
                    wd = d6;
                    break;
                case '7':
                    wd = d7;
                    break;
                case '8':
                    wd = d8;
                    break;
                case '9':
                    wd = d9;
                    break;
                default:
                    wd = dempty;
            }
            sd[(x + i) * sw + (y + j)] = wd[i * ww + j];
        }
    }
}

function drawscreen(s_data) {
    for (var i = 0; i < sh * sw; i++) {
        var [x, y] = itoxy(i);
        if (s_data[i] === 0) {
            ctx.fillStyle = "#000000"        // black
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 1) {
            ctx.fillStyle = "#FFFFFF"        // white
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 2) {
            ctx.fillStyle = "#FF0000"        // red
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 3) {
            ctx.fillStyle = "#00FF00"        // green
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 4) {
            ctx.fillStyle = "#0000FF"        // blue
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 5) {
            ctx.fillStyle = "#FFFF00"        // yellow
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 6) {
            ctx.fillStyle = "#FF00FF"        // magenta
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 7) {
            ctx.fillStyle = "#00FFFF"        // cyan
            ctx.fillRect(x * ps, y * ps, ps, ps);
        }
    }
}

clearscreen(sd);

// pi
str = String(Math.PI).split('');
for (var i = 0; i < 11; i++) {
    writeletter(sd, 5, 5 + 6 * i, str[i]);
}

// flag
writeletter(sd, 5, 75, 'flag');

// test rainbow
for (var i = 0; i < 100; i++) {
    for (var j = 0; j < 8; j++) {
        sd[(20+(2*j))*sw+(5+i)] = j;
        sd[(20+(2*j+1))*sw+(5+i)] = j;
    }
}

writeletter(sd, 29, 10, 'flag');
writeletter(sd, 29, 20, 'flag');
writeletter(sd, 29, 30, 'flag');

drawscreen(sd);