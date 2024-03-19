// TODO:
// [x] record price history
// [x] allow price to increase / decrease by random amount (normal distribution?)
// [ ] record buy/sell prices, average bought share price, current networth
// [ ] draw prices on graph and mark points of buy/sell
// [ ] add possibility of loaning? and paying interest per tick
// [ ] add economy cycle? a small background sine wave + general inflation
// [ ] allow pennies -> imagine doing this is £sd then calling it victorian simulator lol
// [ ] remove all the floating point maths

const graph = document.getElementById("graph");
const p = document.getElementById("price");
const b = document.getElementById("balance");
const s = document.getElementById("shares");

let price   = 100;
let balance = 1000;
let shares  = 0;
let tick    = 0;

let chart = new Chart("graph", {
  type: "line",
  data: {
    labels: [],
    datasets: [{ 
      data: [],
      borderColor: "red",
      fill: false
    }, { 
      data: [],
      borderColor: "green",
      showLine: false,
      fill: false
    }]
  },
  options: { legend: {display: false} }
});

// Standard Normal variate using Box-Muller transform
function gaussianRandom(mean=0, stdev=1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}

function reset() {
    p.innerHTML = price.toFixed(2);
    b.innerHTML = balance.toFixed(2);
    s.innerHTML = shares;
    chart.data.labels = [0];
    chart.data.datasets[0].data = [100];
    chart.update();
}

function step() {
    tick++;
    price += gaussianRandom();
    p.innerHTML = price.toFixed(2);
    chart.data.labels.push(tick);
    chart.data.datasets[0].data.push(price);
    chart.update();
}

function buy() {
    if (balance - price > 0) {
        balance -= price;
        shares++;
    }
    b.innerHTML = balance.toFixed(2);
    s.innerHTML = shares;
}

function sell() {
    if (shares > 0) {
        balance += price;
        shares--;
    }
    b.innerHTML = balance.toFixed(2);
    s.innerHTML = shares;
}

reset()
let stepper = setInterval(step, 500);

