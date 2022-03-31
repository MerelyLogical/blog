var canvas = document.getElementById("screen");
var ctx = canvas.getContext("2d");


var ps = 3; // pixel scaling (only used in final drawing)
var sd = []; // screen data per scaled pixel

var bw = 7; // block width in scaled pixels
var bh = 7; // block height in scaled pixels

// TODO, add another array that is item per block for easier programming
var sw = 20 * bw; // screen width
var sh = 30 * bh; // screen height


function clearscreen(sd) {
    for (var i = 0; i < sh * sw; i++) {
        sd[i] = 0;
    }
}

function writeletter(sd, x, y, letter) {
    for (var i = 0; i < bw; i++) {
        for (var j = 0; j < bh; j++) {
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
            sd[(y + j) * sw + (x + i)] = wd[j * bw + i];
        }
    }
}

// debug function, draw grids of blocks
function showblockgrids() {
    for (var i = 0; i < sw / bw; i++) {
        ctx.beginPath();
        ctx.moveTo(i * ps * bw - 0.5, 0);
        ctx.lineTo(i * ps * bw - 0.5, ps * sh);
        ctx.strokeStyle = '#555555';
        ctx.stroke();
    }
    for (var j = 0; j < sh / bh; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * ps * bw - 0.5);
        ctx.lineTo(ps * sw, j * ps * bw - 0.5);
        ctx.strokeStyle = '#555555';
        ctx.stroke();
    }

}

// convert linear index of scaled pixels to 2d
function itoxy(i) {
    var x = i % sw;
    var y = Math.floor(i / sw);
    return [x, y];
}

function drawscreen(s_data) {
    for (var i = 0; i < sh * sw; i++) {
        var [x, y] = itoxy(i);
        if (s_data[i] === 0) {
            ctx.fillStyle = "#000000" // black
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 1) {
            ctx.fillStyle = "#FFFFFF" // white
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 2) {
            ctx.fillStyle = "#FF0000" // red
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 3) {
            ctx.fillStyle = "#00FF00" // green
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 4) {
            ctx.fillStyle = "#0000FF" // blue
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 5) {
            ctx.fillStyle = "#FFFF00" // yellow
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 6) {
            ctx.fillStyle = "#FF00FF" // magenta
            ctx.fillRect(x * ps, y * ps, ps, ps);
        } else if (s_data[i] === 7) {
            ctx.fillStyle = "#00FFFF" // cyan
            ctx.fillRect(x * ps, y * ps, ps, ps);
        }
    }
}

clearscreen(sd);

// pi
str = String(Math.PI).split('');
for (var i = 0; i < 11; i++) {
    writeletter(sd, bw * (i + 1), bh, str[i]);
}

// flag
writeletter(sd, 13 * bw, 1 * bh, 'flag');

// test rainbow
for (var i = 0; i < 100; i++) {
    for (var j = 0; j < 8; j++) {
        sd[(50 + (2 * j)) * sw + (bw + i)] = j;
        sd[(50 + (2 * j + 1)) * sw + (bw + i)] = j;
    }
}

writeletter(sd, 5 * bw, 8 * bh, 'flag');
writeletter(sd, 7 * bw, 8 * bh, 'flag');
writeletter(sd, 9 * bw, 8 * bh, 'flag');
// showblockgrids();
drawscreen(sd);

