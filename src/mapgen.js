var graph = document.getElementById("map");

var height = 500;
var width = 600;
var size = 10;

var nodes = [];
var edges = [];
var dist_matrix = [];

// 1. generate random nodes
// 2. calculate distance between all nodes
// 3. randomly add edges between the nodes, prioritising ones with shorter distance

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function generateGraph() {
    // generate nodes
    for (let i = 0; i < size; i++) {
        let randx = Math.random();
        let randy = Math.random();
        nodes.push(new Node(randx, randy));

        let dists = Array(size).fill(-1);
        for (let j = 0; j < i; j++) {
            let dist = Math.sqrt(((randx - nodes[j].x) ** 2) + (randy - nodes[j].y) ** 2);
            dists[j] = dist;
        }
        dist_matrix.push(dists);
    }

    // generate edges
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < i; j++) {
            // linear probability. consider using Sigmoid?
            let roll = Math.random() / 1.8;
            let threshold = dist_matrix[i][j] / Math.sqrt(2);
            console.log(i, j, roll, threshold, roll > threshold);
            if (roll > threshold) {
                edges.push([i, j]);
            }
        }
    }
}

function drawGraph() {
    for (node of nodes) {
        let c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("r", 5);
        c.style.fill = "#AAAAAA";
        c.setAttribute("cx", node.x * width);
        c.setAttribute("cy", node.y * height);
        graph.appendChild(c);
    }

    for (edge of edges) {
        let newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
        newLine.setAttribute("x1", nodes[edge[0]].x * width);
        newLine.setAttribute("y1", nodes[edge[0]].y * height);
        newLine.setAttribute("x2", nodes[edge[1]].x * width);
        newLine.setAttribute("y2", nodes[edge[1]].y * height);
        newLine.setAttribute("stroke", "#AAAAAA")
        graph.appendChild(newLine);
    }
}

function main() {
    nodes = [];
    edges = [];
    dist_matrix = [];
    graph.innerHTML = "";
    generateGraph();
    console.log(dist_matrix);
    drawGraph();
}