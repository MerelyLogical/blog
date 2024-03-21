// TODO:
// [x] record price history
// [x] allow price to increase / decrease by random amount (normal distribution?)
// [ ] record buy/sell prices
// [x] average bought share price, current networth
// [x] draw prices on graph
// [ ] mark points of buy/sell
// [x] add possibility of loaning? and paying interest per tick
// [x] loan limit? -> set LTV(loan to value) to 60%?
// [x] format html, tabulate all the info
// [x] link i rates to html
// [ ] add economy cycle? a small background sine wave + general inflation
// [ ] model inflation a bit better lolz
// [ ] allow pennies -> imagine doing this is £sd then calling it victorian simulator lol
// [ ] remove all the floating point maths
// [ ] allow more buying/selling methods, limit orders etc
// [ ] progression?
// [ ] split files
// [ ] keyboard shortcuts

const doc_networth = document.getElementById("networth");
const doc_stock    = document.getElementById("stockhtml");
const doc_bank     = document.getElementById("bankhtml");

const history_limit = 365;
const ltv           = 0.60;
const inflation     = 0.00010;
const loan_rate     = 0.00020;
const savings_rate  = 0.00007;

let game_state = {grind: true, market: false, bank: false};
let chart;

let price    = 100;
let cash     = 1000;
let shares   = 0;
let avg_cost = price;
let tick     = 0;
let networth = cash;
let savings  = 0;
let loan     = 0;

function initialiseChart() {
    chart = new Chart("graph", {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Stock price",
                data: [],
                borderColor: "red",
                radius: 0,
                fill: false
            }, {
                label: "Average cost",
                data: [],
                borderColor: "green",
                radius: 0,
                fill: false
            }]
        },
        options: {
            legend: {display: true},
            tooltips: {enabled: false},
            hover: {mode: null}
        }
    });

    chart.data.labels = [0];
    chart.data.datasets[0].data = [100];
    chart.data.datasets[1].data = [null];
    chart.update();
}

// Standard Normal variate using Box-Muller transform
function gaussianRandom() {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z;
}

function initialiseDoc() {
    doc_networth.innerText = networth.toFixed(2);

    let stockhtml = `
        <canvas id="graph" style="width:100%"></canvas>
        <p>
            <button id="buy" onclick="buy()">buy</button>
            <button id="sell" onclick="sell()">sell</button>
        </p>
        <div class="table-wrapper">
            <table> <tbody>
                <tr>
                    <td> Cash: £<span id="cash"></span>
                    <td> Stock price: £<span id="price"></span>
                <tr>
                    <td> Shares: <span id="shares"></span>
                    <td> Average cost: £<span id="avg_cost"></span>
            </table>
        </div>
    `
    doc_stock.innerHTML = stockhtml;

    let bankhtml = `
        <p> Bank will only allow you to borrow up to `+(100*ltv).toFixed(0)+`% of your networth.</p>
        <p> Current inflation rate is `+(100*(((1+inflation) ** 365) - 1)).toFixed(2)+`% per 365 ticks

        <div class="table-wrapper">
        <table> <tbody>
            <tr>
                <td> Loan: £<span id="loan"></span>
                <td> Savings: £<span id="savings"></span>
            <tr>
                <td> <button id="borrow" onclick="borrow()">borrow</button> <button id="repay" onclick="repay()">repay</button>
                <td> <button id="save" onclick="save()">save</button> <button id="withdraw" onclick="withdraw()">withdraw</button>
            <tr>
                <td> Loan interest rate: `+(100*(((1+loan_rate) ** 365) - 1)).toFixed(2)+`% per 365 ticks
                <td> Savings interest rate: `+(100*(((1+savings_rate) ** 365) - 1)).toFixed(2)+`% per 365 ticks
        </table>
        </div>
    `;

    doc_bank.innerHTML = bankhtml;
}

function refreshDoc() {
    doc_networth.innerText = networth.toFixed(2);
    document.getElementById("cash").innerText     = cash.toFixed(2);
    document.getElementById("price").innerText    = price.toFixed(2);
    document.getElementById("shares").innerText   = shares;
    document.getElementById("avg_cost").innerText = avg_cost.toFixed(2);
    document.getElementById("loan").innerText     = loan.toFixed(2);
    document.getElementById("savings").innerText  = savings.toFixed(2);
}

function reset() {
    initialiseDoc();
    initialiseChart();
}

function refreshchart() {
    if (tick > history_limit) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
    }
    chart.data.labels.push(tick);
    chart.data.datasets[0].data.push(price);
    if (shares > 0) {
        chart.data.datasets[1].data.push(avg_cost);
    } else {
        chart.data.datasets[1].data.push(null);
    }
    chart.update();
}

function step() {
    tick++;
    price += gaussianRandom();
    price *= 1+inflation;
    networth = cash + shares * price + savings - loan;
    savings *= 1 + savings_rate;
    loan    *= 1 + loan_rate;
    refreshDoc();
    refreshchart();
}

function buy() {
    if (cash - price >= 0) {
        cash -= price;
        avg_cost = (avg_cost * shares + price * 1) / (shares + 1);
        shares++;
        refreshDoc();
    }
}

function sell() {
    if (shares > 0) {
        cash += price;
        shares--;
        refreshDoc();
    }
}

function save() {
    if (cash >= 100) {
        cash -= 100;
        savings += 100;
        refreshDoc();
    }
}

function withdraw() {
    if (savings >= 100) {
        cash += 100;
        savings -= 100;
        refreshDoc();
    } else if (0 < savings < 100) {
        cash += savings;
        savings = 0;
        refreshDoc();
    }
}

function borrow() {
    if (loan + 100 <= networth * ltv) {
        cash += 100;
        loan += 100;
        refreshDoc();
    }
}

function repay() {
    if (cash >= 100 && loan >= 100) {
        cash -= 100;
        loan -= 100;
        refreshDoc();
    } else if (cash >= loan && 0 < loan < 100) {
        cash -= loan;
        loan = 0;
        refreshDoc();
    }
}

function grind() {
    cash++;
    refreshDoc();
}

reset();
setInterval(step, 200);
