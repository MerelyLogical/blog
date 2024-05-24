const BENCH_SIZE = 10000;

// TODO: cleanup code
// TODO: add buttons to increase bench_size

var order = [...Array(BENCH_SIZE).keys()];
var bench = Array(BENCH_SIZE).fill(false);
var count = 0;

let i = BENCH_SIZE;
while (i > 0) {
  let j = Math.floor(Math.random() * i);
  i--;
  [order[i], order[j]] = [order[j], order[i]];
}

for (i = 0; i < BENCH_SIZE; i++) {
  let sit = order[i];
  if (sit == 0) {
    if (!bench[1]) { bench[sit] = true; count++; }
  } else if (sit == BENCH_SIZE-1) {
    if (!bench[BENCH_SIZE-2]) { bench[sit] = true; count++; }
  } else {
    if (!bench[sit-1] && !bench[sit+1]) { bench[sit] = true; count++; }
  }
}

var benchString = "";
for (i = 0; i < BENCH_SIZE; i++) {
  if (bench[i]) {
    benchString += "o";
  } else {
    benchString += "_";
  }
}

document.getElementById('bench').innerHTML = benchString;

let p = count / BENCH_SIZE;
let e = 1 / (Math.sqrt(1 - (2 * p)));

document.getElementById('e').innerHTML = e;

