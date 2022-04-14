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
// times in microseconds, volumes in percentages

// sound parameters, i.e. tone or instrument or something
const sp = {
    "volume" : 10,
    "sustain": 75,
    "hold"   : 250,
    "attack" : 10,
    "decay"  : 100,
    "release": 50,
    "bpm"    : 120
};

// <label for="volume">volume:</label>
// <input type="range" min="0" max="100" class="slider" id="volume" style="width:50%">
// <span id="volumevalue" class="label"></span>
// TODO: kinda insane that label doesn't have a class and the span have class label
Object.entries(sp).forEach(
    ([k,v]) => {
        const ediv = document.createElement("div");

        const elabel = document.createElement("label");
        elabel.htmlFor = k;
        elabel.innerText = k+":";
        ediv.appendChild(elabel);

        const einput = document.createElement("input");
        einput.type = "range";
        einput.min = 10;
        einput.max = 100;
        einput.value = v;
        einput.className = "slider";
        einput.id = k;
        einput.style = "width:50%";
        ediv.appendChild(einput);

        const espan = document.createElement("span");
        espan.id = k+"value";
        espan.className = "label"
        espan.value = v;
        ediv.appendChild(espan);

        document.getElementById("sliders").appendChild(ediv);
    }
)

const sliders = document.getElementsByClassName("slider");
const labels = document.getElementsByClassName("label");

for (let i=0; i<sliders.length; i++){
    const pkey = sliders[i].id;
    const pvalue = sp[pkey];
    sliders[i].value = pvalue;
    labels[i].innerText = pvalue;
    sliders[i].oninput = () => {
        sp[pkey] = parseInt(sliders[i].value);
        labels[i].innerText = sliders[i].value.toString();
    }
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
    gainNode.gain.linearRampToValueAtTime(sp["volume"]/100, audioCtx.currentTime + sp["attack"]/1000);
    // 1-e^(-n), 95% reached when n=3, so take 1/3 of decay time as constant
    gainNode.gain.setTargetAtTime(sp["sustain"]*sp["volume"]/10000, audioCtx.currentTime + sp["attack"]/1000, sp["decay"]/3000);
    gainNode.gain.setTargetAtTime(0, audioCtx.currentTime + sp["hold"]/1000, sp["release"]/3000);
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
        await timer(60000/sp["bpm"]); // time between two notes in ms
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
