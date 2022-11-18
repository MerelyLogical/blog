let graph = document.getElementById("graph");
let total = 0;
let in_count = 0;
let result = document.getElementById("result");
let stats = document.getElementById("stats");
let pie = -1;

let p = document.createElementNS("http://www.w3.org/2000/svg", "path");

// Move to (0, 0)
// draw Line to (0, 1)
// draw Arc with radius (1, 1), no rotation, no large arc, no sweep to (1, 0)
// draw Line to (0, 0)
p.setAttribute("d", "M 0 0 L 0 1 A 1 1 0 0 0 1 0 L 0 0");
p.style.fill = "#444444";
graph.appendChild(p);

function step(count) {
    for (let i = 0; i<count; i++) {
        let randx = Math.random();
        let randy = Math.random();
        let c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", randx);
        c.setAttribute("cy", randy);
        c.setAttribute("r", 0.002);
        c.style.fill = "#AAAAAA";

        let dist = Math.sqrt(randx ** 2 + randy ** 2);
        if ( dist < 1 ) {
            in_count++;
            c.style.fill = "#CCCCFF";
        }
        total++;

        graph.appendChild(c);
    
        pie = 4 * in_count / total;

        result.innerHTML = pie;
        stats.innerHTML = in_count + " of " + total;
    }
}
