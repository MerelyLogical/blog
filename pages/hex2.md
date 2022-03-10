---
title: Hexagonal Grid Pathfinding
layout: post
---

<strong>Pathfinding on a SVG-based Hexagonal Grid</strong>

Flying distance from start(blue) to end(green) is: <span id="fly_dist"></span>

Walking distance from start(blue) to end(green) is: <span id="walk_dist"></span>

<button id="calc" onclick="calculate()">Calculate</button>

<svg id="grid" viewBox="0 0 500 600" height="500" width="600"></svg>

<script type="text/javascript" src="../src/hex2.js"></script>
