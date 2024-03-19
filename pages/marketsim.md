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

You have: £<span id="balance"></span> and <span id="shares"></span> shares

<svg id="graph" viewBox="0 0 1 1"></svg>

<script type="text/javascript" src="../src/marketsim.js"></script>
