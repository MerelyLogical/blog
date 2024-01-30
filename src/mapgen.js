var graph = document.getElementById("map");

var height = 500;
var width = 600;
var size = 30;

var nodes = [];
var edges = [];

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
    }

    // generate edges
    // this can generate duplicate edges
    // consider searching for nearest point in a cone to generate realistic maps
    for (let i = 0; i < size; i++) {
        let a = Math.floor(Math.random() * size);
        let b = Math.floor(Math.random() * size);
        edges.push([a, b]);
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
    generateGraph();
    drawGraph();
}
