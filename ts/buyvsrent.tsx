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

function createFlatSeries(months: number, amount: number) {
    return Array.from({ length: months }, () => amount);
}

function createRisingSeries(months: number, start: number, monthlyGrowth: number) {
    const values: number[] = [];
    let amount = start;
    for (let month = 0; month < months; month++) {
        values.push(Number(amount.toFixed(2)));
        amount *= 1 + monthlyGrowth;
    }
    return values;
}

function clampNumber(value: string, min: number, max: number) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
        return min;
    }
    return Math.min(max, Math.max(min, parsed));
}

function createMonthLabels(months: number) {
    const labels: string[] = [];
    const now = new Date();
    const startMonth = now.getMonth();
    const startYear = now.getFullYear();

    for (let i = 0; i < months; i++) {
        const pointDate = new Date(startYear, startMonth + i, 1);
        const month = pointDate.getMonth();
        const year = pointDate.getFullYear();

        if (month === 0) {
            labels.push(`January ${year}`);
        } else if (month === 6) {
            labels.push(`July ${year}`);
        } else {
            labels.push('');
        }
    }

    return labels;
}

export function BuyVsRentChart() {
    const chartRef = useRef<any>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [rentStartCapital, setRentStartCapital] = useState(100);
    const [buyStartCapital, setBuyStartCapital] = useState(50);
    const [monthlyInterestRate, setMonthlyInterestRate] = useState(1);

    const months = 60;
    const labels = useMemo(() => createMonthLabels(months), [months]);
    const rentSeries = useMemo(
        () => createFlatSeries(months, rentStartCapital),
        [months, rentStartCapital]
    );
    const buySeries = useMemo(
        () => createRisingSeries(months, buyStartCapital, monthlyInterestRate / 100),
        [months, buyStartCapital, monthlyInterestRate]
    );

    function handleRentStartCapitalChange(event: ChangeEvent<HTMLInputElement>) {
        setRentStartCapital(clampNumber(event.target.value, 0, 1_000_000_000));
    }

    function handleBuyStartCapitalChange(event: ChangeEvent<HTMLInputElement>) {
        setBuyStartCapital(clampNumber(event.target.value, 0, 1_000_000_000));
    }

    function handleMonthlyInterestRateChange(event: ChangeEvent<HTMLInputElement>) {
        setMonthlyInterestRate(clampNumber(event.target.value, -100, 100));
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
                                    label: 'Rent',
                                    data: [],
                                    borderColor: 'red',
                                    radius: 0,
                                    fill: false,
                                },
                                {
                                    label: 'Buy',
                                    data: [],
                                    borderColor: 'blue',
                                    radius: 0,
                                    fill: false,
                                },
                            ],
                        },
                        options: {
                            animation: {
                                duration: 0,
                            },
                            legend: { display: true },
                            tooltips: { enabled: true },
                            hover: { mode: null },
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

                chartRef.current.data.labels = labels;
                chartRef.current.data.datasets[0].data = rentSeries;
                chartRef.current.data.datasets[1].data = buySeries;
                chartRef.current.update(0);
            })
            .catch(() => {
                // Keep the page functional even if the chart script fails to load.
            });

        return () => {
            cancelled = true;
        };
    }, [labels, rentSeries, buySeries]);

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
            <p>Placeholder 5-year monthly cost lines for Buy vs Rent.</p>
            <form
                onSubmit={(event) => event.preventDefault()}
                className="app-form-inline"
                aria-label="Buy vs Rent assumptions"
            >
                <label htmlFor="monthly-interest-rate" className="app-form-label">
                    Expected interest rate (% / month):
                </label>
                <input
                    id="monthly-interest-rate"
                    type="number"
                    className="app-input"
                    value={monthlyInterestRate}
                    min={-100}
                    max={100}
                    step={0.01}
                    onChange={handleMonthlyInterestRateChange}
                />
            </form>
            <form
                onSubmit={(event) => event.preventDefault()}
                className="app-form-inline"
                aria-label="Rent starting capital"
            >
                <label htmlFor="rent-start-capital" className="app-form-label">
                    Rent starting capital (£):
                </label>
                <input
                    id="rent-start-capital"
                    type="number"
                    className="app-input"
                    value={rentStartCapital}
                    min={0}
                    max={1000000000}
                    step={0.01}
                    onChange={handleRentStartCapitalChange}
                />
            </form>
            <form
                onSubmit={(event) => event.preventDefault()}
                className="app-form-inline"
                aria-label="Buy starting capital"
            >
                <label htmlFor="buy-start-capital" className="app-form-label">
                    Buy starting capital (£):
                </label>
                <input
                    id="buy-start-capital"
                    type="number"
                    className="app-input"
                    value={buyStartCapital}
                    min={0}
                    max={1000000000}
                    step={0.01}
                    onChange={handleBuyStartCapitalChange}
                />
            </form>
            <canvas
                ref={canvasRef}
                id="buy-vs-rent-chart"
                aria-label="Buy vs Rent monthly cost chart"
                role="img"
            />
        </div>
    );
}
