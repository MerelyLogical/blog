---
title: Clocks
layout: post
nav_order: 2
---

{: .fs-6}
A collection of interesting time formats, see if you can figure out how each works :))

### 24-hour time

* <span id="timer"></span>

### A

* <span id="dtimer"></span>

### B

* <span id="rtimer"></span>

### C

* <span id="rdtimer"></span>

### D

* <span id="ztimer" style="font-size:xx-large"></span>

### E

* <span id="jtimer"></span>

### F

* <span id="etimer"></span>
* <span id="retimer"></span>

### G

* <span id="ptimer"></span>

<!-- ### H

* <span style="font-size:xx-large">🕐</span> -->

<br>

<input id="timeTravel" type="checkbox" onchange="startTime();"> Enable time travel

<div id="timeForm" display="none">
<strong>Select current time:</strong>

<form>
    <input id="h" type="number" style="width: 5ch;" min="0" max="23" value="12" onchange="startTime()"> :
    <input id="m" type="number" style="width: 5ch;" min="0" max="59" value="34" onchange="startTime()"> :
    <input id="s" type="number" style="width: 5ch;" min="0" max="59" value="56" onchange="startTime()">
</form>
<br>
</div>

<!-- <input type="checkbox"> Enable hints -->

<script type="text/javascript" src="../src/suncalc/suncalc.js"></script>

<script type="text/javascript" src="../src/clocks.js"></script>

<script type="text/javascript">startTime(); hide('timeForm');</script>
