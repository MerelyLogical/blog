'use client'

import { useEffect, useState } from 'react'
import { SunCalcGetTimes } from './suncalc/suncalc'

// a moment is 1/40 of an hour, and an hour is 1/12 of the daylight
function len(d: Date) {
    // roughly where Big Ben is
    const t = SunCalcGetTimes(d, 51.501, -0.125, 11)
    const ms = t.sunset.getTime() - t.sunrise.getTime()
    return (ms / 480000).toFixed(1)
}

// worked out in the browser, as the page is built ahead of time
export function Moment() {
    const [v, setV] = useState<string | null>(null)
    useEffect(() => setV(len(new Date())), [])
    return <>{v ?? '…'}</>
}
