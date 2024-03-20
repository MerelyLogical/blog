---
title: Stock Market Simulator
layout: post
nav_order: 13
---

{: .fs-6}
Stock Market Simulator

Stock price is currently: £<span id="price"></span>

<button id="buy" onclick="buy()">buy</button>
<button id="sell" onclick="sell()">sell</button>

Cash: £<span id="cash"></span>
Shares: <span id="shares"></span>
Average cost: £<span id="avg_cost"></span>
Networth: £<span id="networth"></span>

---

Bank

<button id="borrow" onclick="borrow()">borrow</button>
<button id="save" onclick="save()">save</button>

Savings: £<span id="savings"></span>
Loan: £<span id="loan"></span>

<canvas id="graph" style="width:100%"></canvas>

<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js"></script>
<script type="text/javascript" src="../src/marketsim.js"></script>
