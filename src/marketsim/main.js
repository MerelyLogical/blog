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
// [ ] add economy cycle? a small background sine wave + general inflation -> game is boring if its purely random
// [ ] model inflation a bit better lolz
// [ ] allow pennies -> imagine doing this is £sd then calling it victorian simulator lol
// [ ] remove all the floating point maths
// [ ] allow more buying/selling methods, limit orders etc
// [ ] progression?
// [x] split files
// [ ] keyboard shortcuts

const doc_networth = document.getElementById("networth");
const doc_stock    = document.getElementById("stockhtml");
const doc_bank     = document.getElementById("bankhtml");

const history_limit = 365;
const ltv           = 0.60;
const inflation     = 0.00015;
const loan_rate     = 0.00030;
const savings_rate  = 0.00010;

let game_state = {grind: true, market: false, bank: false};
let stock_chart, net_chart, p_inter;

let price    = 10;
let cash     = 0;
let shares   = 0;
let avg_cost = 0;
let tick     = 0;
let networth = 0;
let savings  = 0;
let loan     = 0;

function initialiseChart() {
    stock_chart = new Chart("stock_chart", {
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

    stock_chart.data.labels = [0];
    stock_chart.data.datasets[0].data = [price];
    stock_chart.data.datasets[1].data = [null];
    stock_chart.update();

    net_chart = new Chart("networth_chart", {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Stock price",
                data: [],
                borderColor: "green",
                radius: 0,
                fill: false
            }]
        },
        options: {
            legend: {display: false},
            tooltips: {enabled: false},
            hover: {mode: null}
        }
    });

    net_chart.data.labels = [0];
    net_chart.data.datasets[0].data = [networth];
    net_chart.update();
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
        <canvas id="stock_chart" style="width:100%"></canvas>
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
    doc_stock.style.display = "none";
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

    doc_bank.style.display = "none";
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
        stock_chart.data.labels.shift();
        stock_chart.data.datasets[0].data.shift();
        stock_chart.data.datasets[1].data.shift();
        net_chart.data.labels.shift();
        net_chart.data.datasets[0].data.shift();
    }
    stock_chart.data.labels.push(tick);
    stock_chart.data.datasets[0].data.push(price);
    net_chart.data.labels.push(tick);
    net_chart.data.datasets[0].data.push(networth);
    if (shares > 0) {
        stock_chart.data.datasets[1].data.push(avg_cost);
    } else {
        stock_chart.data.datasets[1].data.push(null);
    }
    stock_chart.update();
    net_chart.update();
}

function step() {
    tick++;
    price += gaussianRandom()/2;
    price *= 1+inflation;
    if (price < 0) {price = 0};
    networth = cash + shares * price + savings - loan;
    savings *= 1 + savings_rate;
    loan    *= 1 + loan_rate;
    refreshDoc();
    refreshchart();
}

function progress() {
    if (!game_state.market && networth > 20) {
        game_state.market = true;
        doc_stock.style.display = "block";
    }
    if (game_state.market && !game_state.bank && networth > 100) {
        game_state.bank = true;
        doc_bank.style.display = "block";
        clearInterval(p_inter);
    }
    console.log(game_state);
}

reset();
setInterval(step, 200);
p_inter = setInterval(progress, 5000);
