"use client";

import { useEffect, useRef } from "react";
import { Button } from '@/js/ui/Button';

var grid: SVGSVGElement | null = null;
var fly_dist: HTMLSpanElement | null = null;
var walk_dist: HTMLSpanElement | null = null;
var calc_button: HTMLButtonElement | null = null;

var PI = Math.PI,
    sin = Math.sin,
    cos = Math.cos,
    ceil = Math.ceil,
    sign = Math.sign,
    abs = Math.abs,
    max = Math.max;
var a = 2 * PI / 6; // 60°
var r = 20; // radius

// color palette
var back_c = "#333333",
    wall_c = "#CCCCCC",
    hover_c = "#888888",
    start_c = "#0000AA",
    goal_c = "#00AA00",
    error_c = "#FFAAAA",
    search_c = "#555577",
    path_c = "#557755",
    queue_c = "#775555",
    outline_c = "#FFFFFF";

// oh no i'm using global variables to track the state of the board!
// there's more things to clean up than just this tho so whatever
var no_start = true;
var no_goal = true;
var start: Tile | undefined;
var goal: Tile | undefined;
var path_found = false;

function ytoz(x: number, y: number) {
    return y + ceil(-x / 2);
}

function ztoy(x: number, z: number) {
    return z - ceil(-x / 2);
}

class Tile {
    x: number;
    y: number;
    z: number;
    s: "back" | "wall" | "start" | "goal";
    h: SVGPolygonElement;
    visited: boolean;
    inqueue: boolean;
    path: boolean;
    previous: Tile | null;
    constructor(x: number, y: number, z: number, s: "back" | "wall" | "start" | "goal", h: SVGPolygonElement, visited: boolean, inqueue: boolean, path: boolean, previous: Tile | null) {
        this.x = x;
        this.y = y; // y coord used for array addressing, cannot be negative
        this.z = z; // y coord used for distance calculation, can be negative
        this.s = s; // status
        this.h = h; // svg child
        this.visited = visited;
        this.inqueue = inqueue;
        this.path = path;
        this.previous = previous;
    }
}

var boardstate: Tile[][] = [];

function color(tile: Tile) {
    if (tile.path && tile.s === "back") {
        tile.h.style.fill = path_c;
    } else if (tile.inqueue && tile.s === "back") {
        tile.h.style.fill = queue_c;
    } else if (tile.visited && tile.s === "back") {
        tile.h.style.fill = search_c;
    } else {
        switch (tile.s) {
            case "back":
                tile.h.style.fill = back_c;
                break;
            case "wall":
                tile.h.style.fill = wall_c;
                break;
            case "start":
                tile.h.style.fill = start_c;
                break;
            case "goal":
                tile.h.style.fill = goal_c;
                break;
            default:
                tile.h.style.fill = error_c;
                console.log("ERROR: bad tile colour");
        }
    }
}

function colorAll() {
    for (var col of boardstate) {
        for (var tile of col) {
            color(tile);
        }
    }
}

function cycleTypes(tile: Tile) {
    if (tile.s === "back") {
        tile.s = "wall";
    } else if (tile.s === "wall") {
        if (no_start) {
            tile.s = "start";
            no_start = false;
            start = tile;
        } else if (no_goal) {
            tile.s = "goal";
            no_goal = false;
            goal = tile;
        } else {
            tile.s = "back";
        }
    } else if (tile.s === "start") {
        if (no_goal) {
            tile.s = "goal";
            no_start = true;
            no_goal = false;
            goal = tile;
        } else {
            tile.s = "back";
            no_start = true;
        }
    } else if (tile.s === "goal") {
        tile.s = "back";
        no_goal = true;
    } else {
        tile.s = "back";
        console.log("ERROR: bad tile type");
    }
    color(tile);
}

function drawHexagon(i: number, j: number, k: number, x: number, y: number) {
    var hex = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

    var arr: Array<[number, number]> = [];
    for (var n = 0; n < 6; n++) {
        arr.push([x + r * cos(a * n), y + r * sin(a * n)]);
    }

    if (!grid) {
        return hex;
    }

    for (var value of arr) {
        var point = grid.createSVGPoint();
        point.x = value[0];
        point.y = value[1];
        hex.points.appendItem(point);
        hex.style.stroke = outline_c;
    }

    hex.addEventListener("mouseover", function (e) {
        if (e.buttons === 1 || e.buttons === 3) {
            cycleTypes(boardstate[i][j]);
        } else {
            (e.target as SVGElement).style.fill = hover_c;
        }
    }, false);

    hex.addEventListener("mouseout", function () {
        color(boardstate[i][j]);
    }, false);

    hex.addEventListener("mousedown", function () {
        cycleTypes(boardstate[i][j]);
    }, false);

    grid.appendChild(hex);

    return hex;
}

//draws a grid of u * v hexgons (row * col)
// x, y is the center of the top-left hexagon
function drawGrid(u: number, v: number, x = r + 5, y = r + 5) {
    for (var i = 0; i < v; i++) {
        var col: Tile[] = [];
        for (var j = 0; j < u; j++) {
            var k = ytoz(i, j);
            var hex = drawHexagon(i, j, k, i * (r + r * cos(a)) + x, (1 / 2 + i + 2 * k) * r * sin(a) + y);
            col.push(new Tile(i, j, k, "back", hex, false, false, false, null));
        }
        boardstate.push(col);
    }
    colorAll();
}

function distance(a: Tile, b: Tile) {
    var dx = b.x - a.x;
    var dy = b.z - a.z;
    var dist;
    if (sign(dx) === sign(dy)) {
        dist = abs(dx + dy);
    } else {
        dist = max(abs(dx), abs(dy));
    }
    return dist;
}

//      \  0, -1  /
//       \       /
// -1, 0  -------  1, -1
//       /       \
// ------  0,  0  -------
//       \       /
// -1, 1  -------  1,  0
//       /       \
//      /  0,  1  \

var queue: Tile[] = [];

// take step from a to b
function try_move(a: Tile, b: Tile) {
    if (!b.visited && b.s !== "wall") {
        b.previous = a;
        b.inqueue = true;
        b.visited = true;
        queue.push(b);
        color(b);
    }
}

function try_cell(a: Tile, b: Tile) {
    color(a);
    if (a.x === b.x && a.z === b.z) {
        return true;
    }

    if (boardstate[a.x] !== undefined) {
        var u = a.x,
            v = a.z + 1;
        var candidate = boardstate[u][ztoy(u, v)];
        if (candidate !== undefined) {
            try_move(a, candidate);
        }
        var u2 = a.x,
            v2 = a.z - 1;
        var candidate2 = boardstate[u2][ztoy(u2, v2)];
        if (candidate2 !== undefined) {
            try_move(a, candidate2);
        }
    }

    if (boardstate[a.x + 1] !== undefined) {
        var u3 = a.x + 1,
            v3 = a.z;
        var candidate3 = boardstate[u3][ztoy(u3, v3)];
        if (candidate3 !== undefined) {
            try_move(a, candidate3);
        }

        var u4 = a.x + 1,
            v4 = a.z - 1;
        var candidate4 = boardstate[u4][ztoy(u4, v4)];
        if (candidate4 !== undefined) {
            try_move(a, candidate4);
        }
    }


    if (boardstate[a.x - 1] !== undefined) {
        var u5 = a.x - 1,
            v5 = a.z;
        var candidate5 = boardstate[u5][ztoy(u5, v5)];
        if (candidate5 !== undefined) {
            try_move(a, candidate5);
        }

        var u6 = a.x - 1,
            v6 = a.z + 1;
        var candidate6 = boardstate[u6][ztoy(u6, v6)];
        if (candidate6 !== undefined) {
            try_move(a, candidate6);
        }
    }

    return false;
}

function setButtonLabel(label: string) {
    if (calc_button) {
        calc_button.textContent = label;
    }
}

function setFlyDistanceText(value: string) {
    if (fly_dist) {
        fly_dist.textContent = value;
    }
}

function setWalkDistanceText(value: string) {
    if (walk_dist) {
        walk_dist.textContent = value;
    }
}

function bfd(a: Tile, b: Tile) {
    queue = [];
    var iter = 0;
    var pathlength = 0;
    if (!a.visited) {
        queue.push(a);
        a.visited = true;
    }
    while (queue.length !== 0 && iter < 500) {
        var current = queue.shift();
        if (!current) {
            break;
        }
        current.inqueue = false;
        if (try_cell(current, b)) {
            while (current.previous !== null) {
                current.path = true;
                current = current.previous;
                pathlength++;
            }
            setButtonLabel("Reset");
            path_found = true;
            console.log("path found in " + iter + " iterations");
            colorAll();
            break;
        }
        iter++;
    }
    if (path_found) {
        return pathlength;
    } else {
        setButtonLabel("Reset");
        path_found = true;
        console.log("no path found after " + iter + " iterations");
        return -1;
    }
}

function resetBoardState() {
    for (var col of boardstate) {
        for (var tile of col) {
            tile.visited = false;
            tile.inqueue = false;
            tile.path = false;
            tile.previous = null;
        }
    }
    colorAll();
}

function calculate() {
    if (path_found) {
        resetBoardState();
        setButtonLabel("Calculate");
        path_found = false;
    } else {
        if (no_start || no_goal || !start || !goal) {
            setFlyDistanceText("ERROR: no start or no goal");
            setWalkDistanceText("ERROR: no start or no goal");
        } else {
            setFlyDistanceText(String(distance(start, goal)));
            setWalkDistanceText(String(bfd(start, goal)));
        }
    }
}

function initializeBoard() {
    boardstate = [];
    queue = [];
    no_start = true;
    no_goal = true;
    path_found = false;
    start = undefined;
    goal = undefined;
    setFlyDistanceText("");
    setWalkDistanceText("");
    setButtonLabel("Calculate");
    if (grid) {
        grid.replaceChildren();
        drawGrid(22, 32);
    }
}

export function HexGridPathfinding() {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const flyDistRef = useRef<HTMLSpanElement | null>(null);
    const walkDistRef = useRef<HTMLSpanElement | null>(null);
    const calcButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        grid = svgRef.current;
        fly_dist = flyDistRef.current;
        walk_dist = walkDistRef.current;
        calc_button = calcButtonRef.current;

        initializeBoard();

        return () => {
            boardstate = [];
            queue = [];
            grid = null;
            fly_dist = null;
            walk_dist = null;
            calc_button = null;
        };
    }, []);

    return (
        <div>
            <Button ref={calcButtonRef} onClick={calculate}>Calculate</Button>
            <p>
                Flying distance from start(blue) to end(green) is:{" "}
                <span ref={flyDistRef} />
            </p>
            <p>
                Walking distance from start(blue) to end(green) is:{" "}
                <span ref={walkDistRef} />
            </p>
            <svg
                ref={svgRef}
                id="grid"
                viewBox="0 0 1000 1000"
                style={{ display: "block", marginTop: "1rem" }}
            />
        </div>
    );
}
