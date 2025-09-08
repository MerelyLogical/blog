var grid = document.getElementById("grid");

var PI = Math.PI,
    sin = Math.sin,
    cos = Math.cos,
    floor = Math.floor,
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
var start;
var goal;
var path_found = false;

function ytoz(x, y) {
    return y + ceil(-x / 2);
}

function ztoy(x, z) {
    return z - ceil(-x / 2);
}

class Tile {
    // x, y, status, hexagon
    constructor(x, y, z, s, h, visited, inqueue, path, previous) {
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

var boardstate = [];

function color(tile) {
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
                console.log("ERROR: bad tile colour")
        }
    }
}

function colorAll() {
    for (col of boardstate) {
        for (tile of col) {
            color(tile);
        }
    }
}

function cycleTypes(tile) {
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
        console.log("ERROR: bad tile type")
    }
    color(tile);
}

function drawHexagon(i, j, k, x, y) {
    var hex = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

    // convert i j from distance index to array index
    // maybe do this the other way round
    var arr = [];
    for (var n = 0; n < 6; n++) {
        arr.push([x + r * cos(a * n), y + r * sin(a * n)]);
    }

    for (value of arr) {
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
            e.target.style.fill = hover_c;
        }
        // console.log(boardstate[i][j]);
        // console.log(boardstate);
    }, false);

    hex.addEventListener("mouseout", function (e) {
        color(boardstate[i][j]);
    }, false);

    hex.addEventListener("mousedown", function (e) {
        cycleTypes(boardstate[i][j]);
    }, false);

    grid.appendChild(hex);

    return (hex);
}

//draws a grid of u * v hexgons (row * col)
// x, y is the center of the top-left hexagon
function drawGrid(u, v, x = r + 5, y = r + 5) {
    for (var i = 0; i < v; i++) {
        var col = [];
        for (var j = 0; j < u; j++) {
            var k = ytoz(i, j);
            var hex = drawHexagon(i, j, k, i * (r + r * cos(a)) + x, (1 / 2 + i + 2 * k) * r * sin(a) + y);
            col.push(new Tile(i, j, k, "back", hex, false, false, false, null));
        }
        boardstate.push(col);
    }
    colorAll();
}

function distance(a, b) {
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

var queue = [];

// take step from a to b
function try_move(a, b) {
    if (!b.visited && b.s !== "wall") {
        b.previous = a;
        b.inqueue = true;
        b.visited = true;
        queue.push(b);
        color(b);
    }
}

function try_cell(a, b) {
    // check if we've been here
    // if (a.visited) {
    //     return false;
    // }
    // check if out of bounds
    // if (0 > a.x || a.x > boardstate.length || 0 > a.y || a.y > boardstate[0].length) {
    //     return false
    // }
    // check if its a wall
    // if (boardstate[a.x][a.y].s === "wall") {
    //     return false;
    // }

    color(a);
    // check if its the goal
    if (a.x === b.x && a.z === b.z) {
        return true;
    }

    // try adj nodes
    // make a find adjacent method in tile class
    if (boardstate[a.x] !== undefined) {
        var u = a.x,
            v = a.z + 1;
        if (boardstate[u][ztoy(u, v)] !== undefined) {
            try_move(a, boardstate[u][ztoy(u, v)]);
        }
        var u = a.x,
            v = a.z - 1;
        if (boardstate[u][ztoy(u, v)] !== undefined) {
            try_move(a, boardstate[u][ztoy(u, v)]);
        }
    }

    if (boardstate[a.x + 1] !== undefined) {
        var u = a.x + 1,
            v = a.z;
        if (boardstate[u][ztoy(u, v)] !== undefined) {
            try_move(a, boardstate[u][ztoy(u, v)]);
        }

        var u = a.x + 1,
            v = a.z - 1;
        if (boardstate[u][ztoy(u, v)] !== undefined) {
            try_move(a, boardstate[u][ztoy(u, v)]);
        }
    }


    if (boardstate[a.x - 1] !== undefined) {
        var u = a.x - 1,
            v = a.z;
        if (boardstate[u][ztoy(u, v)] !== undefined) {
            try_move(a, boardstate[u][ztoy(u, v)]);
        }

        var u = a.x - 1,
            v = a.z + 1;
        if (boardstate[u][ztoy(u, v)] !== undefined) {
            try_move(a, boardstate[u][ztoy(u, v)]);
        }
    }

    return false;
}

function bfd(a, b) {
    // add root pos to queue
    queue = [];
    var iter = 0;
    var pathlength = 0;
    if (!a.visited) {
        queue.push(a);
        a.visited = true;
    }
    // while there's something in the queue
    while (queue.length !== 0 && iter < 500) {
        // check pos top of the queue
        var current = queue.shift();
        current.inqueue = false;
        // console.log(iter, "checking ", current);
        if (try_cell(current, b)) {
            // console.log("found path!", current);
            // walk backwards once goal is found
            while (current.previous !== null) {
                current.path = true;
                current = current.previous;
                pathlength++;
            }
            document.getElementById("calc").innerHTML = "Reset";
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
        document.getElementById("calc").innerHTML = "Reset";
        path_found = true;
        console.log("no path found after " + iter + " iterations");
        return -1;
    }
}

function calculate() {
    if (path_found) {
        for (col of boardstate) {
            for (tile of col) {
                tile.visited = false;
                tile.inqueue = false;
                tile.path = false;
                tile.previous = null;
            }
        }
        colorAll();
        document.getElementById("calc").innerHTML = "Calculate";
        path_found = false;
    } else {
        if (no_start || no_goal) {
            document.getElementById("fly_dist").innerHTML = "ERROR: no start or no goal";
            document.getElementById("walk_dist").innerHTML = "ERROR: no start or no goal";
        } else {
            // console.log(start, goal);
            document.getElementById("fly_dist").innerHTML = distance(start, goal);
            document.getElementById("walk_dist").innerHTML = bfd(start, goal);
        }
    }
}

drawGrid(15, 18);