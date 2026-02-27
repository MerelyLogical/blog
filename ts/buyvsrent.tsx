'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

const chartJsCdn = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js';

let chartPromise: Promise<void> | null = null;

function loadChartJs(): Promise<void> {
    if (typeof window === 'undefined') {
        return Promise.resolve();
    }
    if ((window as any).Chart) {
        return Promise.resolve();
    }
    if (chartPromise) {
        return chartPromise;
    }
    chartPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chartJsCdn;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Chart.js'));
        document.body.appendChild(script);
    });
    return chartPromise;
}

function simulateRenting(
    months: number,
    startingCapital: number,
    monthlyIncome: number,
    monthlyRent: number,
    yearlyReturnRatePercent: number
) {
    const series: number[] = [];
    let capital = startingCapital;
    const monthlyReturn = getMonthlyReturnRate(yearlyReturnRatePercent);

    for (let month = 0; month < months; month++) {
        series.push(Number(capital.toFixed(2)));
        const investedAfterCashflow = Math.max(0, capital + monthlyIncome - monthlyRent);
        capital = investedAfterCashflow * (1 + monthlyReturn);
    }

    return {
        series,
        endingCapital: Number(capital.toFixed(2)),
    };
}

function getMonthlyReturnRate(yearlyReturnRatePercent: number) {
    return (1 + yearlyReturnRatePercent / 100) ** (1 / 12) - 1;
}

function clampNumber(value: string, min: number, max: number) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
        return min;
    }
    return Math.min(max, Math.max(min, parsed));
}

function clampInteger(value: string, min: number, max: number) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
        return min;
    }
    return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function createMonthLabels(months: number) {
    const axisLabels: string[] = [];
    const fullLabels: string[] = [];
    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];
    const now = new Date();
    const startMonth = now.getMonth();
    const startYear = now.getFullYear();

    for (let i = 0; i < months; i++) {
        const pointDate = new Date(startYear, startMonth + i, 1);
        const month = pointDate.getMonth();
        const year = pointDate.getFullYear();
        const fullLabel = `${monthNames[month]} ${year}`;
        fullLabels.push(fullLabel);

        if (month === 0) {
            axisLabels.push(`January ${year}`);
        } else if (month === 6) {
            axisLabels.push(`July ${year}`);
        } else {
            axisLabels.push('');
        }
    }

    return { axisLabels, fullLabels };
}

export function BuyVsRentChart() {
    const chartRef = useRef<any>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [yearsShown, setYearsShown] = useState(5);
    const [startingCapital, setStartingCapital] = useState(100000);
    const [monthlyIncome, setMonthlyIncome] = useState(3000);
    const [monthlyRent, setMonthlyRent] = useState(1500);
    const [yearlyInvestmentReturnRate, setYearlyInvestmentReturnRate] = useState(5);

    const months = yearsShown * 12;
    const { axisLabels, fullLabels } = useMemo(() => createMonthLabels(months), [months]);
    const rentingResult = useMemo(
        () => simulateRenting(
            months,
            startingCapital,
            monthlyIncome,
            monthlyRent,
            yearlyInvestmentReturnRate
        ),
        [months, startingCapital, monthlyIncome, monthlyRent, yearlyInvestmentReturnRate]
    );
    const monthlyReturnRate = useMemo(
        () => getMonthlyReturnRate(yearlyInvestmentReturnRate),
        [yearlyInvestmentReturnRate]
    );
    const rentingSeries = rentingResult.series;
    const finalValue = rentingResult.endingCapital;

    function handleYearsShownChange(event: ChangeEvent<HTMLInputElement>) {
        setYearsShown(clampInteger(event.target.value, 1, 100));
    }

    function handleStartingCapitalChange(event: ChangeEvent<HTMLInputElement>) {
        setStartingCapital(clampNumber(event.target.value, 0, 1_000_000_000));
    }

    function handleMonthlyIncomeChange(event: ChangeEvent<HTMLInputElement>) {
        setMonthlyIncome(clampNumber(event.target.value, 0, 1_000_000_000));
    }

    function handleMonthlyRentChange(event: ChangeEvent<HTMLInputElement>) {
        setMonthlyRent(clampNumber(event.target.value, 0, 1_000_000_000));
    }

    function handleYearlyInvestmentReturnRateChange(event: ChangeEvent<HTMLInputElement>) {
        setYearlyInvestmentReturnRate(clampNumber(event.target.value, -100, 100));
    }

    useEffect(() => {
        let cancelled = false;

        loadChartJs()
            .then(() => {
                if (cancelled) {
                    return;
                }

                const Chart = (window as any).Chart;
                if (!Chart || !canvasRef.current) {
                    return;
                }

                if (!chartRef.current) {
                    chartRef.current = new Chart(canvasRef.current, {
                        type: 'line',
                        data: {
                            labels: [],
                            datasets: [
                                {
                                    label: 'Renting Capital',
                                    data: [],
                                    borderColor: 'red',
                                    pointRadius: 0,
                                    pointHoverRadius: 4,
                                    pointHitRadius: 12,
                                    fill: false,
                                },
                            ],
                        },
                        options: {
                            animation: {
                                duration: 0,
                            },
                            legend: { display: true },
                            tooltips: {
                                enabled: true,
                                mode: 'nearest',
                                intersect: false,
                                callbacks: {},
                            },
                            hover: {
                                mode: 'nearest',
                                intersect: false,
                            },
                            scales: {
                                xAxes: [{
                                    ticks: {
                                        autoSkip: false,
                                        maxRotation: 0,
                                        minRotation: 0,
                                    },
                                }],
                            },
                        },
                    });
                }

                chartRef.current.options.tooltips.callbacks = {
                    title: (items: any[]) => {
                        const index = items?.[0]?.index;
                        if (index === undefined || index === null) {
                            return '';
                        }
                        return fullLabels[index] ?? '';
                    },
                    label: (item: any) => `${Number(item.yLabel).toFixed(2)}`,
                };
                chartRef.current.data.labels = axisLabels;
                chartRef.current.data.datasets[0].data = rentingSeries;
                chartRef.current.update(0);
            })
            .catch(() => {
                // Keep the page functional even if the chart script fails to load.
            });

        return () => {
            cancelled = true;
        };
    }, [axisLabels, fullLabels, rentingSeries]);

    useEffect(() => {
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, []);

    return (
        <div className="space-y-3">
            <p>Renting model: income minus rent is added to investments each month.</p>
            <form
                onSubmit={(event) => event.preventDefault()}
                className="app-form-inline"
                aria-label="Graph years shown"
            >
                <label htmlFor="years-shown" className="app-form-label">
                    Years shown:
                </label>
                <input
                    id="years-shown"
                    type="number"
                    className="app-input"
                    value={yearsShown}
                    min={1}
                    max={100}
                    step={1}
                    onChange={handleYearsShownChange}
                />
            </form>
            <form
                onSubmit={(event) => event.preventDefault()}
                className="app-form-inline"
                aria-label="Renting starting capital"
            >
                <label htmlFor="starting-capital" className="app-form-label">
                    Starting capital:
                </label>
                <input
                    id="starting-capital"
                    type="number"
                    className="app-input"
                    value={startingCapital}
                    min={0}
                    max={1000000000}
                    step={1000}
                    onChange={handleStartingCapitalChange}
                />
            </form>
            <form
                onSubmit={(event) => event.preventDefault()}
                className="app-form-inline"
                aria-label="Renting monthly income"
            >
                <label htmlFor="monthly-income" className="app-form-label">
                    Monthly income:
                </label>
                <input
                    id="monthly-income"
                    type="number"
                    className="app-input"
                    value={monthlyIncome}
                    min={0}
                    max={1000000000}
                    step={100}
                    onChange={handleMonthlyIncomeChange}
                />
            </form>
            <form
                onSubmit={(event) => event.preventDefault()}
                className="app-form-inline"
                aria-label="Renting monthly rent"
            >
                <label htmlFor="monthly-rent" className="app-form-label">
                    Monthly rent:
                </label>
                <input
                    id="monthly-rent"
                    type="number"
                    className="app-input"
                    value={monthlyRent}
                    min={0}
                    max={1000000000}
                    step={100}
                    onChange={handleMonthlyRentChange}
                />
            </form>
            <form
                onSubmit={(event) => event.preventDefault()}
                className="app-form-inline"
                aria-label="Renting yearly investment return rate"
            >
                <label htmlFor="yearly-investment-return-rate" className="app-form-label">
                    Yearly investment return rate (%):
                </label>
                <input
                    id="yearly-investment-return-rate"
                    type="number"
                    className="app-input"
                    value={yearlyInvestmentReturnRate}
                    min={-100}
                    max={100}
                    step={0.1}
                    onChange={handleYearlyInvestmentReturnRateChange}
                />
            </form>
            <p>
                Formula used:
                <br />
                <code>C[t+1] = max(0, C[t] + income - rent) * (1 + r_monthly)</code>
                <br />
                <code>r_monthly = (1 + r_yearly)^(1/12) - 1</code>
                <br />
                <code>
                    r_monthly = {monthlyReturnRate.toFixed(6)} using r_yearly = {(yearlyInvestmentReturnRate / 100).toFixed(4)}
                </code>
            </p>
            <p>
                Final value after {yearsShown} years: <strong>{finalValue.toFixed(2)}</strong>
            </p>
            <canvas
                ref={canvasRef}
                id="buy-vs-rent-chart"
                aria-label="Buy vs Rent monthly cost chart"
                role="img"
            />
        </div>
    );
}
