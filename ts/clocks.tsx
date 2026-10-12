'use client'

import { SunCalcGetTimes } from "./suncalc/suncalc";
import { useEffect, useState, createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

function zeroPad(s) {
    return String(s).padStart(2, '0');
}

function msSinceMidnight(d: Date) {
    var midnight = new Date(d);
    midnight.setHours(0, 0, 0, 0);
    return d.getTime() - midnight.getTime();
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
    };
    let dtm = hhmm;
    let r = '';
    for (let i in lut) {
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
    times = SunCalcGetTimes(today, 35.02, fakeLng, 47),
    dawn = times.dawn,
    dusk = times.dusk,
    todayMs = today.getTime(),
    dawnMs = dawn.getTime(),
    duskMs = dusk.getTime();
    if (today < dawn) {
        var ytd = new Date();
        ytd.setDate(today.getDate() - 1);
        var timesYtd = SunCalcGetTimes(ytd, 35.02, fakeLng, 47),
        duskYtd = timesYtd.dusk,
        duskYtdMs = duskYtd.getTime(),
        hourLength = (dawnMs - duskYtdMs) / 12,
        hoursSinceDusk = (todayMs - duskYtdMs) / hourLength;
        return nightlut[Math.floor(hoursSinceDusk)];
    } else if (today < dusk) {
        var hourLength = (duskMs - dawnMs) / 12,
        hoursSinceDawn = (todayMs - dawnMs) / hourLength;
        return daylut[Math.floor(hoursSinceDawn)];
    } else {
        var tmr = new Date();
        tmr.setDate(today.getDate() + 1);
        var timesTmr = SunCalcGetTimes(tmr, 35.02, fakeLng, 47),
        dawnTmr = timesTmr.dawn,
        dawnTmrMs = dawnTmr.getTime(),
        hourLength = (dawnTmrMs - duskMs) / 12,
        hoursSinceDusk = (todayMs - duskMs) / hourLength;
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

const TimeOverrideContext = createContext<Date | null>(null);

export function TimeOverrideProvider({
    currentTime,
    children,
}: {
    currentTime: Date | null;
    children: ReactNode;
}) {
    return (
        <TimeOverrideContext.Provider value={currentTime}>
        {children}
        </TimeOverrideContext.Provider>
    );
}

function clampTimePart(value: string, max: number) {
    const next = Number(value);
    if (Number.isNaN(next)) {
        return 0;
    }
    return Math.min(max, Math.max(0, Math.floor(next)));
}

export function TimeTravelControls({ children }: { children: ReactNode }) {
    const [enabled, setEnabled] = useState(false);
    const [h, setH] = useState('12');
    const [m, setM] = useState('34');
    const [s, setS] = useState('56');

    const overrideDate = useMemo(() => {
        if (!enabled) {
            return null;
        }
        const base = new Date();
        base.setHours(
            clampTimePart(h, 23),
            clampTimePart(m, 59),
            clampTimePart(s, 59),
            0
        );
        return base;
    }, [enabled, h, m, s]);

    return (
        <TimeOverrideProvider currentTime={overrideDate}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>{children}</div>
        <div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => setEnabled(event.target.checked)}
        />
        Enable time travel
        </label>
        {enabled && (
            <div style={{ marginTop: '0.5rem' }}>
            <strong>Select current time:</strong>
            <form
            onSubmit={(event) => event.preventDefault()}
            className="app-form-inline app-form-inline--compact"
            >
            <input
            type="number"
            min="0"
            max="23"
            className="app-input app-input--compact"
            value={h}
            aria-label="Hours"
            onChange={(event) => setH(event.target.value)}
            />
            <span className="app-form-separator" aria-hidden="true">
            :
            </span>
            <input
            type="number"
            min="0"
            max="59"
            className="app-input app-input--compact"
            value={m}
            aria-label="Minutes"
            onChange={(event) => setM(event.target.value)}
            />
            <span className="app-form-separator" aria-hidden="true">
            :
            </span>
            <input
            type="number"
            min="0"
            max="59"
            className="app-input app-input--compact"
            value={s}
            aria-label="Seconds"
            onChange={(event) => setS(event.target.value)}
            />
            </form>
            </div>
        )}
        </div>
        </div>
        </TimeOverrideProvider>
    );
}

function getDecimalParts(secondsSinceMidnight: number) {
    const decimalSeconds = secondsSinceMidnight / 0.864;
    const rounded = Math.round(decimalSeconds);
    const str = rounded.toString().padStart(5, '0');
    const h = str.slice(0, -4) || '0';
    const m = str.slice(-4, -2) || '0';
    const s = str.slice(-2) || '0';
    return { decimalSeconds, h, m, s };
}

export function useTicker(ms = 100): Date {
    const override = useContext(TimeOverrideContext);
    const [t, setNow] = useState(() => new Date());
    useEffect(() => {
        if (override) {
            return;
        }
        const id = setInterval(() => setNow(new Date()), ms);
        return () => clearInterval(id);
    }, [ms, override]);
    return override ?? t;
}

export function Timer() {
    let t = useTicker();
    let h = t.getHours();
    let m = t.getMinutes();
    let s = t.getSeconds();
    return <span>{zeroPad(h) + ":" + zeroPad(m) + ":" + zeroPad(s)}</span>
}

export function DTimer() {
    let t = useTicker();
    const secondsSinceMidnight = msSinceMidnight(t) / 1000;
    const decimal = getDecimalParts(secondsSinceMidnight);
    return (
        <span>
        {`${zeroPad(decimal.h)}:${zeroPad(decimal.m)}:${zeroPad(decimal.s)}`}
        </span>
    );
}

export function RTimer() {
    let t = useTicker();
    let h = t.getHours();
    let m = t.getMinutes();
    let s = t.getSeconds();
    let l = t.getMilliseconds();
    const roman = toRoman(100 * h + m + s / 100 + l / 100000);
    return <span>{roman}</span>;
}

export function RdTimer() {
    let t = useTicker();
    const secondsSinceMidnight = msSinceMidnight(t) / 1000;
    const decimal = getDecimalParts(secondsSinceMidnight);
    const romanDecimal = toRoman(decimal.decimalSeconds / 100);
    return <span>{romanDecimal}</span>;
}

export function ZTimer() {
    let t = useTicker();
    const secondsSinceMidnight = msSinceMidnight(t) / 1000;
    const zodiac = toZodiac(secondsSinceMidnight / 60);
    return <span>{zodiac}</span>;
}

export function JTimer() {
    let t = useTicker();
    let h = t.getHours();
    const jma = toTkyh(h);
    return <span>{jma}</span>;
}

export function ETimer() {
    let t = useTicker();
    const edo = toEdo(t, 'j');
    return <span>{edo}</span>;
}

export function ReTimer() {
    let t = useTicker();
    const edoRoman = toEdo(t, 'r');
    return <span>{edoRoman}</span>;
}

export function PTimer() {
    let t = useTicker();
    let h = t.getHours();
    let m = t.getMinutes();
    let s = t.getSeconds();
    const periodic = toPeriodic(h.toString() + m.toString() + s.toString());
    return <span>{periodic}</span>;
}
