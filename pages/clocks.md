---
title: Clocks
layout: post
---

<strong>A collection of interesting time formats, see if you can figure out how each works :))</strong>

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

<!-- ### E

* <span id="etimer"></span> -->

### F

* <span id="ptimer"></span>

<!-- ### F

* <span style="font-size:xx-large">🕐</span> -->

<script type="text/javascript">

    function zeroPad(s) {
        return String(s).padStart(2,'0');
    }

    // only need to work for [0,2359]
    // input is in hhmm
    function toRoman(hhmm) {
        var lut = {M:1000, CM:900,
                   D:500,  CD:400,
                   C:100,  XC:90,
                   L:50,   XL:40,
                   X:10,   IX:9,
                   V:5,    IV:4,
                   I:1,    S:0.5,
                   "·":1/12},
            dtm = hhmm,
            r = '',
            i;
        for (i in lut) {
            while (dtm >= lut[i]) {
                r += i;
                dtm -= lut[i];
            }
        }
        return r;
    }

    // input is in minutes
    function toZodiac(m){
        var zlut = ['🐁', '🐂', '🐅', '🐇', '🐉', '🐍', '🐎', '🐑', '🐒', '🐓', '🐕', '🐖', '🐁'],
            alut = '↑·↓',
            zm = (m+60) / 120,
            zk = zm / 40;
        return zlut[Math.floor(zm)] + alut[Math.floor(zk)];
    }

    // input is in minutes
    // TODO: add half, calculate twilight time
    function toEdo(m){
        var lut = ['真夜九つ', '夜八つ', '暁七つ', '明け六つ', '朝五つ', '昼四つ', '真昼九つ', '昼八つ', '夕七つ', '暮れ六つ', '宵五つ', '夜四つ']
            zm = (m+60) / 120;
        return lut[Math.floor(zm)];
    }

    // input is hhmmss
    function toPeriodic(hhmmss){
        var lut = ['nil', 'un', 'bi', 'tri', 'quad', 'pent', 'hex', 'sept', 'oct', 'enn'],
            p = '',
            i;
        for (i=0; i<hhmmss.length; i++){
            p += lut[hhmmss[i]];
        }
        p += 'ium';
        // remove double i and triple n
        return p.replace('nnn', 'nn').replace('ii','i');
    }

    // notes for 12shi lets do emojis omg
    // mayo-9     真夜九つ rat
    // yoru-8     夜八つ   rat
    // akatsuki-7 暁七つ   rat
    // ake-6      明け六つ rat // daybreak, start of twillight
    // asa-5      朝五つ   rat
    // hiru-4     昼四つ   rat
    // mahiru-9   真昼九つ rat
    // hiru-8     昼八つ   rat
    // yuu-7      夕七つ   rat
    // kure-6     暮れ六つ rat // sunset, end of twillight
    // yoi-5      宵五つ   rat
    // yoru-4     夜四つ   rat

    // CN  JP
    // 🐁 🐭 子 ね
    // 🐂 🐮 丑 うし
    // 🐅 🐯 寅 とら
    // 🐇 🐰 卯 う
    // 🐉 🐲 辰 たつ
    // 🐍 🐍 巳 み
    // 🐎 🐴 午 うま
    // 🐑 🐏 未 ひつじ
    // 🐒 🐵 申 さる
    // 🐓 🐔 酉 とり
    // 🐕 🐶 戌 いぬ
    // 🐖 🐗 亥 い
    // ↖
    // ⬅
    // ↙

    //🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛🕜🕝🕞🕟🕠🕡🕢🕣🕤🕥🕦🕧

    function startTime() {
        var t = new Date(),
            h = t.getHours(),
            m = t.getMinutes(),
            s = t.getSeconds(),
            l = t.getMilliseconds(),
            // normal 24-hour time in seconds
            nt = (3600*h + 60*m + s + l/1000),
            // 86400 seconds in a 24-hour day, 100000 seconds in a decimal day
            // decimal time
            dt = nt/0.864,
            st = dt.toFixed(0),
            dh = st.slice(0,-4),
            dm = st.slice(-4,-2),
            ds = st.slice(-2),
            // convert nt to roman numeral
            rt = toRoman(100*h + m + s/60 + l/60000),
            // roman decimal time??
            rdt = toRoman(dt/100),
            // zodiac time
            zt = toZodiac(nt/60),
            // edo time
            et = toEdo(nt/60),
            // periodic (systematic element name) time
            pt = toPeriodic(h.toString() + m.toString() + s.toString());

        document.getElementById(  'timer').innerHTML = zeroPad(h)  + ":" + zeroPad(m)  + ":" + zeroPad(s);
        document.getElementById( 'dtimer').innerHTML = zeroPad(dh) + ":" + zeroPad(dm) + ":" + zeroPad(ds);
        document.getElementById( 'rtimer').innerHTML = rt;
        document.getElementById('rdtimer').innerHTML = rdt;
        document.getElementById( 'ztimer').innerHTML = zt;
        // document.getElementById( 'etimer').innerHTML = et;
        document.getElementById( 'ptimer').innerHTML = pt;
        setTimeout(startTime, 50);
    }

    startTime();

</script>