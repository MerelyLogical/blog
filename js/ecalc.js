// shuffle seating order
function shuffle(arr) {
    let i = arr.length;
    while (i > 0) {
        let j = Math.floor(Math.random() * i);
        i--;
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function main() {
    let size = parseInt(document.getElementById('sizeinput').value);
    let order = [...Array(size).keys()];
    let bench = Array(size).fill(false);
    let count = 0;
    
    shuffle(order);

    // sit people in
    for (let i = 0; i < size; i++) {
        let sit = order[i];
        if (sit == 0) {
            if (!bench[1]) {
                bench[sit] = true;
                count++;
            }
        } else if (sit == size - 1) {
            if (!bench[size - 2]) {
                bench[sit] = true;
                count++;
            }
        } else {
            if (!bench[sit - 1] && !bench[sit + 1]) {
                bench[sit] = true;
                count++;
            }
        }
    }
    
    // draw bench
    let benchString = "";
    for (let i = 0; i < size; i++) {
        if (bench[i]) {
            benchString += "o";
        } else {
            benchString += "_";
        }
    }
    
    document.getElementById('bench').innerHTML = benchString;
    
    // calculate e
    let p = count / size;
    let e = 1 / (Math.sqrt(1 - (2 * p)));
    
    document.getElementById('e').innerHTML = e;
}

main();