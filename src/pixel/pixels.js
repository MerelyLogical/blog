var canvas = document.getElementById("screen");
var ctx = canvas.getContext("2d");

// raw pixels index with (m,n)
var ps = 3; // pixel scaling (only used in final drawing)
var pd = []; // pixel data, index with (i,j)

var bw = 7; // block width in scaled pixels
var bh = 7; // block height in scaled pixels
var bd = []; // block data, index with (x,y)
bd.assign = function (x, y, value) {
    this[y * xb + x] = value;
}
// TODO, add another array that is item per block for easier programming
var xb = 20;
var yb = 20;
var sw = xb * bw; // screen width
var sh = yb * bh; // screen height

// initial positions
var fx = 3;
var fy = 3;
var rx = 10;
var ry = 10;
// -----------------------------------------------------------------
// pixel level stuff
// -----------------------------------------------------------------

// convert linear index of scaled pixels to 2d
function itomn(i) {
    var m = i % sw;
    var n = Math.floor(i / sw);
    return [m, n];
}

function drawpixel(pd) {
    for (var i = 0; i < sh * sw; i++) {
        var [m, n] = itomn(i);
        if (pd[i] === '.') {
            ctx.fillStyle = "#000000" // black
            ctx.fillRect(m * ps, n * ps, ps, ps);
        } else if (pd[i] === 'w') {
            ctx.fillStyle = "#FFFFFF" // white
            ctx.fillRect(m * ps, n * ps, ps, ps);
        } else if (pd[i] === 'r') {
            ctx.fillStyle = "#FF0000" // red
            ctx.fillRect(m * ps, n * ps, ps, ps);
        } else if (pd[i] === 'g') {
            ctx.fillStyle = "#00FF00" // green
            ctx.fillRect(m * ps, n * ps, ps, ps);
        } else if (pd[i] === 'b') {
            ctx.fillStyle = "#0000FF" // blue
            ctx.fillRect(m * ps, n * ps, ps, ps);
        } else if (pd[i] === 'y') {
            ctx.fillStyle = "#FFFF00" // yellow
            ctx.fillRect(m * ps, n * ps, ps, ps);
        } else if (pd[i] === 'm') {
            ctx.fillStyle = "#FF00FF" // magenta
            ctx.fillRect(m * ps, n * ps, ps, ps);
        } else if (pd[i] === 'c') {
            ctx.fillStyle = "#00FFFF" // cyan
            ctx.fillRect(m * ps, n * ps, ps, ps);
        } else if (pd[i] === 'o') {
            ctx.fillStyle = "#FFA500" // orange
            ctx.fillRect(m * ps, n * ps, ps, ps);
        } else if (pd[i] === 'v') {
            ctx.fillStyle = "#7F00FF" // violet
            ctx.fillRect(m * ps, n * ps, ps, ps);
        }
    }
}

function clearpixels(pd) {
    for (var i = 0; i < sh * sw; i++) {
        pd[i] = '.';
    }
}

// -----------------------------------------------------------------
// block level stuff
// -----------------------------------------------------------------

function writeblock(pd, x, y, block) {
    for (var j = 0; j < bh; j++) {
        for (var i = 0; i < bw; i++) {
            var temp; // block data from font.js
            switch (block) {
                case '.':
                    temp = ddot;
                    break;
                case 'flag':
                    temp = dflag;
                    break;
                case 'rainbow':
                    temp = drainbow;
                    break;
                case '0':
                    temp = d0;
                    break;
                case '1':
                    temp = d1;
                    break;
                case '2':
                    temp = d2;
                    break;
                case '3':
                    temp = d3;
                    break;
                case '4':
                    temp = d4;
                    break;
                case '5':
                    temp = d5;
                    break;
                case '6':
                    temp = d6;
                    break;
                case '7':
                    temp = d7;
                    break;
                case '8':
                    temp = d8;
                    break;
                case '9':
                    temp = d9;
                    break;
                default:
                    temp = dempty;
            }
            pd[((y * bh) + j) * sw + ((x * bw) + i)] = temp[j * bw + i];
        }
    }
}

function bd2pd(pd, bd) {
    for (var y = 0; y < yb; y++) {
        for (var x = 0; x < xb; x++) {
            writeblock(pd, x, y, bd[y * yb + x]);
        }
    }
}

// debug function, draw grids of blocks
// function showblockgrids() {
//     for (var i = 0; i < sw / bw; i++) {
//         ctx.beginPath();
//         ctx.moveTo(i * ps * bw - 0.5, 0);
//         ctx.lineTo(i * ps * bw - 0.5, ps * sh);
//         ctx.strokeStyle = '#555555';
//         ctx.stroke();
//     }
//     for (var j = 0; j < sh / bh; j++) {
//         ctx.beginPath();
//         ctx.moveTo(0, j * ps * bw - 0.5);
//         ctx.lineTo(ps * sw, j * ps * bw - 0.5);
//         ctx.strokeStyle = '#555555';
//         ctx.stroke();
//     }
// 
// }

// -----------------------------------------------------------------
// screen level stuff
// -----------------------------------------------------------------

function refresh() {
    bd2pd(pd, bd);
    drawpixel(pd);
    // showblockgrids();
}

function initialise() {
    clearpixels(pd);
    document.addEventListener('keydown', keyhandler);
    // initial text
    str = '3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141273724587006606315588174881520920962829254091715364367892590360011330530548820466521384146951941511609433057270365759591953092186117381932611793105118548074462379962749567351885752724891227938183011949129833673362440656643086021394946395224737190702179860943702770539217176293176752384674818467669405132000568127145263560827785771342757789609173637178721468440901224953430146549585371050792279689258923542019956112129021960864034418159813629774771309960518707211349999998372978049951059731'
    for (var i = 0; i < xb * yb; i++) {
        bd[i] = str[i];
    }
    // starting flag position
    bd.assign(fx, fy, 'flag');
    bd.assign(rx, ry, 'rainbow');

    refresh();

}

function keyhandler(e) {
    switch (e.key) {
        case 'w':
            fy--;
            ry++;
            break;
        case 'a':
            fx--;
            rx++;
            break;
        case 's':
            fy++;
            ry--;
            break;
        case 'd':
            fx++;
            rx--;
            break;
    }
    bd.assign(fx, fy, 'flag');
    bd.assign(rx, ry, 'rainbow');
    refresh();
    // beep();
}

// -----------------------------------------------------------------
// sound related stuff
// -----------------------------------------------------------------

var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();

document.getElementById('sound').addEventListener('click', () => {
    audioCtx.resume();
});

// TODO use one oscillator but disconnect and re-connect nodes for mute
// freqencies can be changed smoothly between notes if only one osc used
// sine waves produces a glitch on start, try smooth attack with compressor maybe?

function beep(freq = 440) {
    var oscNode = audioCtx.createOscillator();
    var gainNode = audioCtx.createGain();
    oscNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 0.1;
    oscNode.frequency.value = freq;
    oscNode.type = 'square';
    oscNode.start();
    setTimeout(() => {
        oscNode.stop();
    }, 250);
};

function timer(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function TET(n) {
    return Math.pow(2, (n - 49) / 12) * 440;
}

var freqlut = {
    '0': TET(22),
    '1': TET(24),
    '2': TET(26),
    '3': TET(29),
    '4': TET(31),
    '5': TET(34),
    '6': TET(36),
    '7': TET(38),
    '8': TET(41),
    '9': TET(43),
    'flag': TET(58),
    '.': TET(60),
    'rainbow': TET(62)
}

async function playmap() {
    for (var i = 0; i < bd.length; i++) {
        beep(freqlut[bd[i]]);
        await timer(300);
    }
}

function soundinit() {
    playmap();
}

// -----------------------------------------------------------------
// main stuff i guess
// -----------------------------------------------------------------


initialise();
