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

            if (wd[i * ww + j] === 1) {
                sd[(x + i) * sw + (y + j)] = 1;
            } else {
                // can remove this for overlapping words
                // sd[(x + i) * sw + (y + j)] = 0;
            }
        }
    }
}

function drawscreen(s_data) {
    for (var i = 0; i < sh * sw; i++) {
        var [x, y] = itoxy(i);
        if (s_data[i] === 0) {
            ctx.fillStyle = "#000000"
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 1) {
            ctx.fillStyle = "#FFFFFF"
            ctx.fillRect(x * ps, y * ps, ps, ps);
        }
    }
}

clearscreen(sd);
str = String(Math.PI).split('');
for (var i = 0; i < 20; i++) {
    writeletter(sd, 5, 5 + 6 * i, str[i]);
}
drawscreen(sd);