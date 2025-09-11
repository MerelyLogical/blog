function zeroPad(s) {
    return String(s).padStart(2, '0');
}

function msSinceMidnight(d) {
    var midnight = new Date(d);
    midnight.setHours(0, 0, 0, 0);
    return d - midnight;
}

// only need to work for [0,2359]
// input is in hhmm
function toRoman(hhmm) {
    var lut = {
            M: 1000,
            CM: 900,
            D: 500,
            CD: 400,
            C: 100,
            XC: 90,
            L: 50,
            XL: 40,
            X: 10,
            IX: 9,
            V: 5,
            IV: 4,
            I: 1,
            S: 0.5,
            "·": 1 / 12
        },
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
function toZodiac(m) {
    var zlut = ['🐁', '🐂', '🐅', '🐇', '🐉', '🐍', '🐎', '🐑', '🐒', '🐓', '🐕', '🐖', '🐁'],
        alut = '↑·↓',
        zm = (m + 60) / 120,
        zk = (zm % 1) * 3;
    return zlut[Math.floor(zm)] + alut[Math.floor(zk)];
}

// input is in hours
// names from Japan Meteorological Agency
function toTkyh(h) {
    let tkyhlut = ['未明', '明け方', '朝', '昼前', '昼過ぎ', '夕方', '夜のはじめ頃', '夜遅く'];
    return tkyhlut[Math.floor(h/3)];
}


// input is Date and form
// TODO: stop calculating dawn/dusk time every tick
function toEdo(today, form) {
    if (form === 'j') {
        var daylut = ['明け六つ', '六つ半', '朝五つ', '五つ半', '昼四つ', '四つ半', '真昼九つ', '九つ半', '昼八つ', '八つ半', '夕七つ', '七つ半'],
            nightlut = ['暮れ六つ', '六つ半', '宵五つ', '五つ半', '夜四つ', '四つ半', '真夜九つ', '九つ半', '夜八つ', '八つ半', '暁七つ', '七つ半'];
    } else if (form === 'r') {
        var daylut = ['ake-6', '6.5', 'asa-5', '5.5', 'hiru-4', '4.5', 'mahiru-9', '9.5', 'hiru-8', '8.5', 'yū-7', '7.5'],
            nightlut = ['kure-6', '6.5', 'yoi-5', '5.5', 'yoru-4', '4.5', 'mayo-9', '9.5', 'yoru-8', '8.5', 'akatsuki-7', '7.5'];
    } else {
        return "unrecognised form";
    }
    // use lat, lng and height of Kyōto (35.02N, 135.76E, 47m) to avoid asking for location
    var fakeLng = today.getTimezoneOffset() / 60 * (-15) + 0.76,
        times = SunCalc.getTimes(today, 35.02, fakeLng, 47),
        dawn = times.dawn,
        dusk = times.dusk;
    if (today < dawn) {
        var ytd = new Date();
        ytd.setDate(today.getDate() - 1);
        var timesYtd = SunCalc.getTimes(ytd, 35.02, fakeLng, 47),
            duskYtd = timesYtd.dusk,
            hourLength = (dawn - duskYtd) / 12,
            hoursSinceDusk = (today - duskYtd) / hourLength;
        return nightlut[Math.floor(hoursSinceDusk)];
    } else if (today < dusk) {
        var hourLength = (dusk - dawn) / 12,
            hoursSinceDawn = (today - dawn) / hourLength;
        return daylut[Math.floor(hoursSinceDawn)];
    } else {
        var tmr = new Date();
        tmr.setDate(today.getDate() + 1);
        var timesTmr = SunCalc.getTimes(tmr, 35.02, fakeLng, 47),
            dawnTmr = timesTmr.dawn,
            hourLength = (dawnTmr - dusk) / 12,
            hoursSinceDusk = (today - dusk) / hourLength;
        return nightlut[Math.floor(hoursSinceDusk)];
    }
}

// input is hhmmss
function toPeriodic(hhmmss) {
    var lut = ['nil', 'un', 'bi', 'tri', 'quad', 'pent', 'hex', 'sept', 'oct', 'enn'],
        p = '',
        i;
    for (i = 0; i < hhmmss.length; i++) {
        p += lut[hhmmss[i]];
    }
    p += 'ium';
    // remove double i and triple n
    return p.replace('nnn', 'nn').replace('ii', 'i');
}


//🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛🕜🕝🕞🕟🕠🕡🕢🕣🕤🕥🕦🕧

// TODO: make this into a toggle system
function show(id) {
    document.getElementById(id).style.display = "block";
}

function hide(id) {
    document.getElementById(id).style.display = "none";
}

function startTime() {
    var debug = document.getElementById("timeTravel").checked,
        t = new Date();
    if (debug) {
        show('timeForm');
        t.setHours(document.getElementById("h").value);
        t.setMinutes(document.getElementById("m").value);
        t.setSeconds(document.getElementById("s").value);
        t.setMilliseconds(0);
    }
    var h = t.getHours(),
        m = t.getMinutes(),
        s = t.getSeconds(),
        l = t.getMilliseconds(),
        // normal 24-hour time in seconds
        nt = msSinceMidnight(t) / 1000,
        // 86400 seconds in a 24-hour day, 100000 seconds in a decimal day
        // decimal time
        dt = nt / 0.864,
        st = dt.toFixed(0),
        dh = st.slice(0, -4),
        dm = st.slice(-4, -2),
        ds = st.slice(-2),
        // convert nt to roman numeral
        rt = toRoman(100 * h + m + s / 100 + l / 100000),
        // roman decimal time??
        rdt = toRoman(dt / 100),
        // zodiac time
        zt = toZodiac(nt / 60),
        // JMA weather forcast time
        jt = toTkyh(h),
        // edo time
        et = toEdo(t, 'j'),
        ret = toEdo(t, 'r'),
        // periodic (systematic element name) time
        pt = toPeriodic(h.toString() + m.toString() + s.toString());

    document.getElementById('timer').innerHTML = zeroPad(h) + ":" + zeroPad(m) + ":" + zeroPad(s);
    document.getElementById('dtimer').innerHTML = zeroPad(dh) + ":" + zeroPad(dm) + ":" + zeroPad(ds);
    document.getElementById('rtimer').innerHTML = rt;
    document.getElementById('rdtimer').innerHTML = rdt;
    document.getElementById('ztimer').innerHTML = zt;
    document.getElementById('jtimer').innerHTML = jt;
    document.getElementById('etimer').innerHTML = et;
    document.getElementById('retimer').innerHTML = ret;
    document.getElementById('ptimer').innerHTML = pt;
    if (!debug) {
        hide('timeForm');
        setTimeout(startTime, 50);
    }

}
