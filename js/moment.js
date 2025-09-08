// roughly where Big Ben is
var today = new Date(),
    times = SunCalc.getTimes(today, 51.501, -0.125, 11),
    sunrise = times.sunrise,
    sunset = times.sunset;
    mlen = (sunset - sunrise) / 480000

    // TODO: read coord from user and calculate
document.getElementById('moment').innerHTML = mlen.toFixed(1);