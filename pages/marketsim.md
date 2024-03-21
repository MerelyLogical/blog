---
title: Stock Market Simulator
layout: post
nav_order: 13
---

{: .fs-6}
Stock Market Simulator

## Networth: £<span id="networth"></span>

<canvas id="networth_chart" style="height:50%; width:100%"></canvas>

<button id="grind" onclick="grind()">grind</button>

<div id="stockhtml"> </div>

<div id="bankhtml"> </div>


<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js"></script>
<script type="text/javascript" src="../src/marketsim/main.js"></script>
<script type="text/javascript" src="../src/marketsim/buttons.js"></script>
