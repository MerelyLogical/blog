---
title: Pi Calculator
layout: post
nav_order: 10
---

{: .fs-6}
Estimate π with Monte Carlo Method

<span id="stats"></span> dots landed inside the circle.

π is <span id="result"></span>

<button id="step" onclick="step(1)">Go</button>
<button id="step10" onclick="step(10)">×10</button>
<button id="step100" onclick="step(100)">×100</button>
<button id="step1000" onclick="step(1000)">×1000</button>

<svg id="graph" viewBox="0 0 1 1"></svg>

<script type="text/javascript" src="../js/picalc.js"></script>
