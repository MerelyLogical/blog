---
title: Pi Player
layout: post
---

<strong>Pi Player made in JS from scratch</strong>

Press play to start a new playing cursor

You can have multiple cursors playing at the same time, but having two consecutive players
less than one note apart breaks the visuals :(

Press WSAD to alter the music being played with flags and rainbows

More features to come!

<div id="sliders"></div>

<button id="sound" onclick="soundinit()">Play</button>

<canvas id='screen' height=500 width=500 style="width:100%; height:100%; margin:0"></canvas>

<script type="text/javascript" src="../src/pixel/graphics_data.js"></script>
<script type="text/javascript" src="../src/pixel/sound_data.js"></script>
<script type="text/javascript" src="../src/pixel/main.js"></script>
