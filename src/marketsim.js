// TODO:
// [ ] record price history
// [ ] allow price to increase / decrease by random amount (normal distribution?)
// [ ] record buy/sell prices
// [ ] draw prices on graph and mark points of buy/sell
// [ ] add possibility of loaning? and paying interest per tick
// [ ] allow pennies -> imagine doing this is £sd then calling it victorian simulator lol

let graph = document.getElementById("graph");
let p = document.getElementById("price");
let b = document.getElementById("balance");
let s = document.getElementById("shares");

let price   = 100;
let balance = 1000;
let shares  = 0;
p.innerHTML = price;
b.innerHTML = balance;
s.innerHTML = shares;

function step() {
    let dice = Math.random();
    if (dice > 0.5) { price++; } else { price--; }
    p.innerHTML = price;
}

function buy() {
    if (balance - price > 0) {
        balance -= price;
        shares++;
    }
    b.innerHTML = balance;
    s.innerHTML = shares;
}

function sell() {
    if (shares > 0) {
        balance += price;
        shares--;
    }
    b.innerHTML = balance;
    s.innerHTML = shares;
}

let stepper = setInterval(step, 1000);

