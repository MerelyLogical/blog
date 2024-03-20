---
title: Stock Market Simulator
layout: post
nav_order: 13
---

{: .fs-6}
Stock Market Simulator

## Networth: £<span id="networth"></span>

<canvas id="graph" style="width:100%"></canvas>

<button id="buy" onclick="buy()">buy</button>
<button id="sell" onclick="sell()">sell</button>

| --- | --- |
| Cash: £<span id="cash"></span> | Stock price: £<span id="price"></span> |
| Shares: <span id="shares"></span> | Average cost: £<span id="avg_cost"></span> |

---

Bank will only allow you to borrow up to 60% of your networth.

| --- | --- |
| Loan: £<span id="loan"></span> | Savings: £<span id="savings"></span> |
| <button id="borrow" onclick="borrow()">borrow</button> <button id="repay" onclick="repay()">repay</button> | <button id="save" onclick="save()">save</button> <button id="withdraw" onclick="withdraw()">withdraw</button> |
| Loan interest rate: 0.05% per tick | Savings interest rate 0.01% per tick |

<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js"></script>
<script type="text/javascript" src="../src/marketsim.js"></script>
