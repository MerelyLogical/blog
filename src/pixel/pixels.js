const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

// raw pixels index with (m,n)
const ps = 3;  // pixel scaling (only used in final drawing)

const bw = 7;  // block width in scaled pixels
const bh = 7;  // block height in scaled pixels
const xb = 20; // number of blocks horizontally
const yb = 20; // number of blocks vertically

const sw = xb * bw; // screen width
const sh = yb * bh; // screen height

// initial positions
let fx = 3;
let fy = 3;
let rx = xb - fx - 1;
let ry = yb - fy - 1;

// -----------------------------------------------------------------
// pixel level stuff
// -----------------------------------------------------------------
// pixel data, index with (i,j)
let pd = [];

function drawpixel(i, color) {
    const m = i % sw;
    const n = Math.floor(i / sw);
    ctx.fillStyle = pixelcolorlut[color] // black
    ctx.fillRect(m * ps, n * ps, ps, ps);
}

function drawscreen() {
    for (var i = 0; i < sh * sw; i++) {
        drawpixel(i, pd[i]);
    }
}

function clearpixels() {
    for (var i = 0; i < sh * sw; i++) {
        pd[i] = '.';
    }
}

// -----------------------------------------------------------------
// block level stuff
// -----------------------------------------------------------------
// block data, index with (x,y)
class Block {
    constructor(tile = '.', playing = false) {
        this.tile = tile;
        this.playing = playing;
    }
}

class BlockData {
    constructor() {
        this.list = Array.from({length: xb * yb}, () => ( new Block ));
    }

    iassign(i, value) {
        this.list[i].tile = value;
    }

    assign(x, y, value) {
        this.list[y * xb + x].tile = value;
    }

    get length() {
        return this.list.length;
    }

    writeblock(x, y, block) {
        for (var j = 0; j < bh; j++) {
            for (var i = 0; i < bw; i++) {
                var temp; // block data from font.js
                switch (block.tile) {
                    case '.':
                        temp = ddot; break;
                    case 'flag':
                        temp = dflag; break;
                    case 'rainbow':
                        temp = drainbow; break;
                    case '0':
                        temp = d0; break;
                    case '1':
                        temp = d1; break;
                    case '2':
                        temp = d2; break;
                    case '3':
                        temp = d3; break;
                    case '4':
                        temp = d4; break;
                    case '5':
                        temp = d5; break;
                    case '6':
                        temp = d6; break;
                    case '7':
                        temp = d7; break;
                    case '8':
                        temp = d8; break;
                    case '9':
                        temp = d9; break;
                    default:
                        temp = dempty;
                }
                if (block.playing) {
                    pd[((y * bh) + j) * sw + ((x * bw) + i)] = invcolorlut[temp[j * bw + i]];
                } else {
                    pd[((y * bh) + j) * sw + ((x * bw) + i)] = temp[j * bw + i];
                }
            }
        }
    }

    refreshpixels() {
        for (var y = 0; y < yb; y++) {
            for (var x = 0; x < xb; x++) {
                this.writeblock(x, y, this.list[y * yb + x]);
            }
        }
        drawscreen();
    }
}

let bd = new BlockData;


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
    bd.refreshpixels();
    // showblockgrids();
}

function initialise() {
    clearpixels();
    document.addEventListener('keydown', keyhandler);
    // initial text
    for (var i = 0; i < xb * yb; i++) {
        bd.iassign(i, pi[i]);
    }
    // player controllable tiles
    bd.assign(fx, fy, 'flag');
    bd.assign(rx, ry, 'rainbow');

    refresh();
}

function keyhandler(e) {
    switch (e.key) {
        case 'w':
            fy--; ry++; break;
        case 'a':
            fx--; rx++; break;
        case 's':
            fy++; ry--; break;
        case 'd':
            fx++; rx--; break;
    }
    bd.assign(fx, fy, 'flag');
    bd.assign(rx, ry, 'rainbow');
    refresh();
}

// -----------------------------------------------------------------
// sound related stuff
// -----------------------------------------------------------------

var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();

document.getElementById('sound').addEventListener('click', () => { audioCtx.resume(); });

// TODO: use one oscillator but disconnect and re-connect nodes for mute
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
    setTimeout(() => { oscNode.stop(); }, 250);
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
    'rainbow': TET(60),
    '.': TET(62)
}

async function playmap() {
    for (var i = 0; i < bd.length; i++) {
        bd.list[i].playing = true;
        refresh();
        beep(freqlut[bd.list[i].tile]);
        await timer(300);
        bd.list[i].playing = false;
    }
}

function soundinit() {
    playmap();
}

// -----------------------------------------------------------------
// main stuff i guess
// -----------------------------------------------------------------


initialise();
