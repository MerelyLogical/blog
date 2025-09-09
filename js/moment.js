import { SunCalcGetTimes } from "./suncalc/suncalc.js"

export function moment() {
    // roughly where Big Ben is
    let today = new Date()
    let times = SunCalcGetTimes(today, 51.501, -0.125, 11)
    let sunrise = times.sunrise
    let sunset = times.sunset
    let mlen = (sunset - sunrise) / 480000

    // TODO: read coord from user and calculate
    return mlen.toFixed(1);
}