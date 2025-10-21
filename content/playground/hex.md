---
title: Hexagonal Grid
layout: post
: 4
---

{: .fs-6}
A Hex Grid with Canvas

<form>
    <input id="h" type="number" style="width: 5ch;" min="0" max="99" value="5" onchange="refresh()">
    ×
    <input id="w" type="number" style="width: 5ch;" min="0" max="99" value="7" onchange="refresh()">
</form>

<br>

<canvas id='grid' height=500 width=500 style="width:100%; height:100%; margin:0"></canvas>

<script type="text/javascript" src="../js/hex.js"></script>
