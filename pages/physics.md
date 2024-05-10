---
title: Physics Engine
layout: post
nav_order: 14
---

{: .fs-6}
Ball Bouncing Physics Simulator

Play with arrowkeys. Arrow key scrolling should be disabled.

Σv<sup>2</sup> = <span id="sv2"></span>

Σdv on walls = <span id="sdv"></span>

ratio = <span id="ratio"></span>

| <input type="checkbox" id="heater"> Heater | <input type="checkbox" id="wrap"> Wall wrap | <input type="checkbox" id="gravity"> Gravity |
| <input type="checkbox" id="freezer"> Freezer | <input type="checkbox" id="elasticwall"> Perfectly elastic walls |


<canvas id='cscreen' height=1000 width=1000 style="width:100%; height:100%; margin:0"></canvas>

<script type="text/javascript" src="../src/physics.js"></script>

