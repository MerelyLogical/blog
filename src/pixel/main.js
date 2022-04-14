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
    ctx.fillStyle = pixelcolorlut[color];
    ctx.fillRect(m * ps, n * ps, ps, ps);
}

function drawscreen() {
    for (let i = 0; i < sh * sw; i++) {
        drawpixel(i, pd[i]);
    }
}

function clearpixels() {
    for (let i = 0; i < sh * sw; i++) {
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
        for (let j = 0; j < bh; j++) {
            for (let i = 0; i < bw; i++) {
                let temp; // block data from font.js
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
        for (let y = 0; y < yb; y++) {
            for (let x = 0; x < xb; x++) {
                this.writeblock(x, y, this.list[y * yb + x]);
            }
        }
        drawscreen();
    }
}

let bd = new BlockData;


// debug function, draw grids of blocks
// function showblockgrids() {
//     for (let i = 0; i < sw / bw; i++) {
//         ctx.beginPath();
//         ctx.moveTo(i * ps * bw - 0.5, 0);
//         ctx.lineTo(i * ps * bw - 0.5, ps * sh);
//         ctx.strokeStyle = '#555555';
//         ctx.stroke();
//     }
//     for (let j = 0; j < sh / bh; j++) {
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
    for (let i = 0; i < xb * yb; i++) {
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

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

document.getElementById('sound').addEventListener('click', () => { audioCtx.resume(); });

// TODO: use one oscillator but disconnect and re-connect nodes for mute
// freqencies can be changed smoothly between notes if only one osc used
// sine waves produces a glitch on start, try smooth attack with compressor maybe?

// linear attack but exponential decay and release cause I'm mad
// hold = attack + decay + sustain time
// actual duration = hold + release time
// in seconds
// TODO: make everything sliders
let hold    = 0.250;
let attack  = 0.010;
let decay   = 0.100;
let release = 0.050;
let bpm     = 120;
let spacing = 60000/bpm; // time between two notes in ms

// gain percentage
const volumeslider = document.getElementById("volume");
const sustainslider = document.getElementById("sustain");
let volume = 10;
let sustain = 75;
volumeslider.value = volume;
sustainslider.value = sustain;
document.getElementById("volumevalue").innerHTML = volume;
document.getElementById("sustainvalue").innerHTML = sustain;
volumeslider.oninput = () => {
    volume = volumeslider.value;
    document.getElementById("volumevalue").innerHTML = volume;
}
sustainslider.oninput = () => {
    sustain = sustainslider.value;
    document.getElementById("sustainvalue").innerHTML = sustain;
}

// TODO: have a new node per press of the play button
const oscNode = audioCtx.createOscillator();
const gainNode = audioCtx.createGain();
oscNode.type = 'square';
gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
oscNode.connect(gainNode);
gainNode.connect(audioCtx.destination);
oscNode.start();

function beep(freq = 440) {
    // gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    // leaving the potential for some portamentos
    oscNode.frequency.exponentialRampToValueAtTime(freq, audioCtx.currentTime+0.005);
    gainNode.gain.linearRampToValueAtTime(volume/100, audioCtx.currentTime + attack);
    // 1-e^(-n), 95% reached when n=3, so take 1/3 of decay time as constant
    gainNode.gain.setTargetAtTime(sustain*volume/10000, audioCtx.currentTime + attack, decay/3);
    gainNode.gain.setTargetAtTime(0, audioCtx.currentTime + hold, release/3);
    // setTimeout(() => { oscNode.stop(); }, 250);
};

function timer(ms) {
    return new Promise(res => setTimeout(res, ms));
}

async function playmap() {
    for (let i = 0; i < bd.length; i++) {
        bd.list[i].playing = true;
        refresh();
        beep(freqlut[bd.list[i].tile]);
        await timer(spacing);
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
