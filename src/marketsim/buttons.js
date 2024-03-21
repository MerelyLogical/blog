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
