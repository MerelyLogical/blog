'use client'

import { useState, useMemo } from 'react';

// shuffle seating order
function shuffle(arr) {
    let i = arr.length;
    while (i > 0) {
        let j = Math.floor(Math.random() * i);
        i--;
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function simulate(size: number) {
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

    // calculate e
    let p = count / size;
    let e = 1 / (Math.sqrt(1 - (2 * p)));

    return {benchString, e, count};
}

// TODO: either split component or
//       include link in this component
export function ECalc({ defaultSize = 1000 }: { defaultSize?: number }) {
    const [size, setSize] = useState<number>(defaultSize);
    const [version, setVersion] = useState(0); // bump to reshuffle with same size
    const { benchString, e, count } = useMemo(() => simulate(size), [size, version]);


    return (
        <div className="space-y-4">
        <div>
        <button
        type="button"
        onClick={() => setVersion((v) => v + 1)}
        className="rounded-2xl px-4 py-2 shadow border hover:shadow-md active:translate-y-px transition"
        >
        Reshuffle
        </button></div>
        <form
        onSubmit={(e) => e.preventDefault()}
        className="flex items-center gap-3 flex-wrap"
        aria-label="Bench controls"
        >
        <label htmlFor="sizeinput" className="font-medium">
        Bench size:
        </label>
        <input
        id="sizeinput"
        type="number"
        value={size}
        min={0}
        onChange={(e) => setSize(Number(e.target.value))}
        className="border rounded px-3 py-1"
        />
        </form>

        <div>
        <i>e</i> = <span aria-live="polite">{Number.isFinite(e) ? e.toPrecision(6) : "∞"}</span>
        </div>

        <div>
        <div className="font-mono break-all whitespace-pre-wrap" aria-live="polite">
        {benchString}
        </div>
        </div>
        </div>
    );
}

