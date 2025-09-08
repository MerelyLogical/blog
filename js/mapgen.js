var graph = document.getElementById("map");

var size = 25;

var nodes = [];
var edges = [];
var dist_matrix = [];
var solution = [];

var start;
var goal;

// 1. generate random nodes
// 2. calculate distance between all nodes
// 3. randomly add edges between the nodes, prioritising ones with shorter distance and with fewer connections

// TODO:
// make start and goal more interesting -> force 2 points at far edges of the map?
// make maps more interesting?
// visualise pathfinding process?
// error message to user + allow user config parameters

class Node {
    constructor(x, y, visited=false, search_dist=999, search_last=999) {
        this.x = x;
        this.y = y;
        this.visited = visited;
        this.search_dist = search_dist;
        this.search_last = search_last;
    }
}

function generateGraph() {
    // generate nodes
    for (let i = 0; i < size; i++) {
        let randx = Math.random();
        let randy = Math.random();
        nodes.push(new Node(randx, randy));

        let dists = Array(size).fill(999);
        for (let j = 0; j < i; j++) {
            let dist = Math.sqrt(((randx - nodes[j].x) ** 2) + (randy - nodes[j].y) ** 2);
            dists[j] = dist;
        }
        dist_matrix.push(dists);
    }

    // generate edges
    for (let i = 0; i < size; i++) {
        let connections = 0;
        for (let j = 0; j < i; j++) {
            // probability linear against distance and number of existing connections. consider using Sigmoid?
            let roll = Math.random() / 2.5;
            let threshold = (dist_matrix[i][j] / Math.sqrt(2)) + (connections / size);
            // console.log(i, j, roll, threshold, roll > threshold);
            if (roll > threshold) {
                edges.push([i, j]);
                dist_matrix[j][i] = dist_matrix[i][j];
                connections++;
            } else {
                // disconnect the nodes
                dist_matrix[i][j] = 999;
            }
        }
        // complete the distance matrix
        dist_matrix[i][i] = 0;
    }

    // for (let i = 0; i < size; i++) {
    //     // if a point ends up isolated, randomly picking a point to connect it to the network
    //     if (dist_matrix[i].reduce((a, b) => a + b) == (1-size)) {
    //         console.log(i, "i'm disconnected!");
    //         let friend = Math.floor(Math.random() * (size-1));
    //         if (friend >= i) { friend++ };
    //         let dist = Math.sqrt(((nodes[i].x - nodes[friend].x) ** 2) + (nodes[i].y - nodes[friend].y) ** 2);
    //         edges.push([i, friend]);
    //         dist_matrix[i][friend] = dist;
    //         dist_matrix[friend][i] = dist;
    //     }
    // }

    // pick start and end points
    start = Math.floor(Math.random() * size);
    nodes[start].search_dist = 0;
    nodes[start].search_last = start;
    goal  = Math.floor(Math.random() * (size-1));
    if (goal >= start) { goal++ };
}

// this is broken when there is no possible path from start to end
function findPath() {
    let visiting_node = start;
    let visiting_dist = 0;
    let search_prios = Array(size).fill(999);
    search_prios[start] = 0;
    console.log("start, goal:", start, goal);

    for (let cnt = 0; cnt < size; cnt++) {
        // visit closest point to start that has not been visited

        console.log("search priorities:", search_prios);
        visiting_node = search_prios.indexOf(Math.min(...search_prios));
        visiting_dist = nodes[visiting_node].search_dist;
        console.log("visiting:", visiting_node, visiting_dist);

        // stop if we have reached the goal node
        if (visiting_node == goal) {break;}
        if (nodes[visiting_node].visited) {break;}

        // visit all neighbours and update if a shorter path is found
        for (let i = 0; i < size; i++) {
            if (!nodes[i].visited) {
                let new_dist = visiting_dist + dist_matrix[visiting_node][i];
                console.log("exploring:", i, new_dist, nodes[i].search_dist);
                if (new_dist < nodes[i].search_dist) {
                    nodes[i].search_dist = new_dist;
                    search_prios[i] = new_dist;
                    nodes[i].search_last = visiting_node;
                }
            }
        }

        // mark node as visited
        nodes[visiting_node].visited = true;
        search_prios[visiting_node] = 999;
    }

    console.log(nodes);
}

function connectPath() {
    let current_node = goal;
    while (current_node != start && current_node != 999) {
        let next_node = nodes[current_node].search_last;
        solution.push([current_node, next_node]);
        current_node = next_node;
    }
    console.log(solution);
}

function drawGraph() {
    for ([i, node] of nodes.entries()) {
        let c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        if (i == start) {
            c.setAttribute("r", 0.010);
            c.style.fill = "#AA00AA";
        } else if (i == goal) {
            c.setAttribute("r", 0.010);
            c.style.fill = "#00AA00";
        } else {
            c.setAttribute("r", 0.005);
            c.style.fill = "#AAAAAA";
        };
        c.setAttribute("cx", node.x);
        c.setAttribute("cy", node.y);
        graph.appendChild(c);
    }

    for (edge of edges) {
        let newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
        newLine.setAttribute("x1", nodes[edge[0]].x);
        newLine.setAttribute("y1", nodes[edge[0]].y);
        newLine.setAttribute("x2", nodes[edge[1]].x);
        newLine.setAttribute("y2", nodes[edge[1]].y);
        newLine.setAttribute("stroke", "#AAAAAA")
        newLine.setAttribute("stroke-width", 0.003)
        graph.appendChild(newLine);
    }

    // just draw thicker line over old edges cause i'm lazy
    if (solution[solution.length - 1][1] != start) {
        console.log("no solutions found");
    } else {
        for (edge of solution) {
            let newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
            newLine.setAttribute("x1", nodes[edge[0]].x);
            newLine.setAttribute("y1", nodes[edge[0]].y);
            newLine.setAttribute("x2", nodes[edge[1]].x);
            newLine.setAttribute("y2", nodes[edge[1]].y);
            newLine.setAttribute("stroke", "#00AAAA")
            newLine.setAttribute("stroke-width", 0.005)
            graph.appendChild(newLine);
        }
    }
}

function main() {
    nodes = [];
    edges = [];
    dist_matrix = [];
    solution = [];
    graph.innerHTML = "";

    generateGraph();
    findPath();
    connectPath();
    drawGraph();
}
