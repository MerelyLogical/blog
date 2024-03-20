// TODO:
// [x] record price history
// [x] allow price to increase / decrease by random amount (normal distribution?)
// [ ] record buy/sell prices
// [x] average bought share price, current networth
// [x] draw prices on graph
// [ ] mark points of buy/sell
// [x] add possibility of loaning? and paying interest per tick
// [x] loan limit? -> set LTV(loan to value) to 60%?
// [ ] format html, tabulate all the info
// [ ] link i rates to html
// [ ] add economy cycle? a small background sine wave + general inflation
// [ ] allow pennies -> imagine doing this is £sd then calling it victorian simulator lol
// [ ] remove all the floating point maths
// [ ] allow more buying/selling methods, limit orders etc

const graph = document.getElementById("graph");

const doc_price = document.getElementById("price");
const doc_cash = document.getElementById("cash");
const doc_avgcost = document.getElementById("avg_cost");
const doc_shares = document.getElementById("shares");
const doc_networth = document.getElementById("networth");
const doc_savings = document.getElementById("savings");
const doc_loan = document.getElementById("loan");

const history_limit = 200;
const ltv           = 0.60;
const loan_rate     = 0.0005;
const savings_rate  = 0.0001;

let price    = 100;
let cash     = 1000;
let shares   = 0;
let avg_cost = price;
let tick     = 0;
let networth = cash;
let savings  = 0;
let loan     = 0;

let chart = new Chart("graph", {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            label: "Stock price",
            data: [],
            borderColor: "red",
            fill: false
        }, {
            label: "Average cost",
            data: [],
            borderColor: "green",
            showLine: false,
            fill: false
        }]
    },
    options: {
        legend: {display: true},
        tooltips: {enabled: false},
        hover: {mode: null}
    }
});

// Standard Normal variate using Box-Muller transform
function gaussianRandom(mean=0, stdev=1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}

function writedocvar() {
    doc_price.innerHTML = price.toFixed(2);
    doc_cash.innerHTML = cash.toFixed(2);
    doc_avgcost.innerHTML = avg_cost.toFixed(2);
    doc_shares.innerHTML = shares;
    doc_networth.innerHTML = networth.toFixed(2);
    doc_savings.innerHTML = savings.toFixed(2);
    doc_loan.innerHTML = loan.toFixed(2);
}

function reset() {
    writedocvar();

    chart.data.labels = [0];
    chart.data.datasets[0].data = [100];
    chart.data.datasets[1].data = [100];
    chart.update();
}

function step() {
    tick++;
    price += gaussianRandom();
    networth = cash + shares * price + savings - loan;
    savings *= 1 + savings_rate;
    loan    *= 1 + loan_rate;

    writedocvar();

    if (tick > history_limit) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
    }
    chart.data.labels.push(tick);
    chart.data.datasets[0].data.push(price);
    chart.data.datasets[1].data.push(avg_cost);
    chart.update();
}

function buy() {
    if (cash - price >= 0) {
        cash -= price;
        avg_cost = (avg_cost * shares + price * 1) / (shares + 1);
        shares++;
        writedocvar();
    }
}

function sell() {
    if (shares > 0) {
        cash += price;
        shares--;
        writedocvar();
    }
}

function save() {
    if (cash >= 100) {
        cash -= 100;
        savings += 100;
        writedocvar();
    }
}

function withdraw() {
    if (savings >= 100) {
        cash += 100;
        savings -= 100;
        writedocvar();
    } else if (0 < savings < 100) {
        cash += savings;
        savings = 0;
        writedocvar();
    }
}

function borrow() {
    if (loan + 100 <= networth * ltv) {
        cash += 100;
        loan += 100;
        writedocvar();
    }
}

function repay() {
    if (cash >= 100 && loan >= 100) {
        cash -= 100;
        loan -= 100;
        writedocvar();
    } else if (0 < loan < 100) {
        cash -= loan;
        loan = 0;
        writedocvar();
    }
}

reset();
let stepper = setInterval(step, 500);

