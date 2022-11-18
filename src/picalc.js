let graph = document.getElementById("graph");
let total = 0;
let in_count = 0;
let result = document.getElementById("result");
let stats = document.getElementById("stats");
let pie = -1;

function step(count) {
    for (let i = 0; i<count; i++) {
        let randx = Math.random();
        let randy = Math.random();
        c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", randx);
        c.setAttribute("cy", randy);
        c.setAttribute("r", 0.001);
        c.style.fill = "#CCCCCC";
        graph.appendChild(c);

        dist = Math.sqrt(randx ** 2 + randy ** 2);
        if ( dist < 1 ) { in_count++; }
        total++;
    
        pie = 4 * in_count / total;

        result.innerHTML = pie;
        stats.innerHTML = in_count + " of " + total;
    }
}
