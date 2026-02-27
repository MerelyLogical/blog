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
    startingCash: number,
    monthlyIncome: number,
    monthlyRent: number,
    yearlyReturnRatePercent: number
) {
    const series: number[] = [];
    let cash = startingCash;
    const monthlyReturn = getMonthlyReturnRate(yearlyReturnRatePercent);

    for (let month = 0; month < months; month++) {
        series.push(Number(cash.toFixed(2)));
        const cashAfterCashflow = cash + monthlyIncome - monthlyRent;
        cash = cashAfterCashflow * (1 + monthlyReturn);
    }

    return {
        series,
        endingCash: Number(cash.toFixed(2)),
    };
}

function simulateBuying(
    months: number,
    startingCash: number,
    monthlyIncome: number,
    homePrice: number,
    deposit: number,
    mortgageRatePercent: number,
    mortgageYears: number,
    yearlyReturnRatePercent: number
) {
    const totalSeries: number[] = [];
    const cashSeries: number[] = [];
    const houseSeries: number[] = [];
    const effectiveHomePrice = Math.max(0, homePrice);
    const effectiveDeposit = Math.min(startingCash, Math.max(0, deposit), effectiveHomePrice);
    const homeValue = effectiveHomePrice;
    const initialMortgage = homeValue - effectiveDeposit;
    const monthlyInvestmentReturn = getMonthlyReturnRate(yearlyReturnRatePercent);
    const monthlyMortgageRate = getMonthlyReturnRate(mortgageRatePercent);
    const totalMortgageMonths = Math.floor(mortgageYears * 12);
    const monthlyMortgagePayment = getMonthlyMortgagePayment(
        initialMortgage,
        monthlyMortgageRate,
        totalMortgageMonths
    );

    let investedCash = startingCash - effectiveDeposit;
    let mortgageBalance = initialMortgage;

    for (let month = 0; month < months; month++) {
        const houseEquity = homeValue - mortgageBalance;
        const netWorth = houseEquity + investedCash;
        totalSeries.push(Number(netWorth.toFixed(2)));
        cashSeries.push(Number(investedCash.toFixed(2)));
        houseSeries.push(Number(houseEquity.toFixed(2)));

        let mortgagePayment = 0;
        if (mortgageBalance > 0) {
            const mortgageInterest = mortgageBalance * monthlyMortgageRate;
            const mortgageDue = mortgageBalance + mortgageInterest;
            if (month < totalMortgageMonths - 1) {
                mortgagePayment = monthlyMortgagePayment;
            } else if (month === totalMortgageMonths - 1) {
                // Final scheduled month pays remaining balance to avoid drift.
                mortgagePayment = mortgageDue;
            }
            mortgageBalance = mortgageDue - mortgagePayment;
        }

        const investedAfterCashflow = investedCash + monthlyIncome - mortgagePayment;
        investedCash = investedAfterCashflow * (1 + monthlyInvestmentReturn);
    }

    const endingNetWorth = homeValue - mortgageBalance + investedCash;
    const endingHouse = homeValue - mortgageBalance;
    return {
        totalSeries,
        cashSeries,
        houseSeries,
        endingCash: Number(investedCash.toFixed(2)),
        endingHouse: Number(endingHouse.toFixed(2)),
        endingNetWorth: Number(endingNetWorth.toFixed(2)),
    };
}

function getMonthlyReturnRate(yearlyReturnRatePercent: number) {
    return (1 + yearlyReturnRatePercent / 100) ** (1 / 12) - 1;
}

function getMonthlyMortgagePayment(principal: number, monthlyRate: number, totalMonths: number) {
    if (totalMonths <= 0 || principal <= 0) {
        return 0;
    }
    if (monthlyRate === 0) {
        return principal / totalMonths;
    }
    const growth = (1 + monthlyRate) ** totalMonths;
    return principal * (monthlyRate * growth) / (growth - 1);
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
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    const now = new Date();
    const startMonth = now.getMonth();
    const startYear = now.getFullYear();

    for (let i = 0; i < months; i++) {
        const pointDate = new Date(startYear, startMonth + i, 1);
        const month = pointDate.getMonth();
        const year = pointDate.getFullYear();
        const shortYear = String(year).slice(-2);
        const fullLabel = `${monthNames[month]} ${shortYear}`;
        fullLabels.push(fullLabel);

        if (month === 0) {
            axisLabels.push(`Jan ${shortYear}`);
        } else if (month === 6) {
            axisLabels.push(`Jul ${shortYear}`);
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
    const [startingCash, setStartingCash] = useState(100000);
    const [monthlyIncome, setMonthlyIncome] = useState(3000);
    const [monthlyRent, setMonthlyRent] = useState(1500);
    const [yearlyInvestmentReturnRate, setYearlyInvestmentReturnRate] = useState(5);
    const [homePrice, setHomePrice] = useState(250000);
    const [deposit, setDeposit] = useState(50000);
    const [mortgageRate, setMortgageRate] = useState(4);
    const [mortgageYears, setMortgageYears] = useState(25);

    const months = yearsShown * 12;
    const { axisLabels, fullLabels } = useMemo(() => createMonthLabels(months), [months]);
    const rentingResult = useMemo(
        () => simulateRenting(
            months,
            startingCash,
            monthlyIncome,
            monthlyRent,
            yearlyInvestmentReturnRate
        ),
        [months, startingCash, monthlyIncome, monthlyRent, yearlyInvestmentReturnRate]
    );
    const buyingResult = useMemo(
        () => simulateBuying(
            months,
            startingCash,
            monthlyIncome,
            homePrice,
            deposit,
            mortgageRate,
            mortgageYears,
            yearlyInvestmentReturnRate
        ),
        [months, startingCash, monthlyIncome, homePrice, deposit, mortgageRate, mortgageYears, yearlyInvestmentReturnRate]
    );
    const rentingSeries = rentingResult.series;
    const buyingTotalSeries = buyingResult.totalSeries;
    const buyingCashSeries = buyingResult.cashSeries;
    const buyingHouseSeries = buyingResult.houseSeries;
    const finalRentingValue = rentingResult.endingCash;
    const finalBuyingCash = buyingResult.endingCash;
    const finalBuyingHouse = buyingResult.endingHouse;
    const finalBuyingValue = buyingResult.endingNetWorth;

    function handleYearsShownChange(event: ChangeEvent<HTMLInputElement>) {
        setYearsShown(clampInteger(event.target.value, 1, 100));
    }

    function handleStartingCashChange(event: ChangeEvent<HTMLInputElement>) {
        setStartingCash(clampNumber(event.target.value, 0, 1_000_000_000));
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

    function handleDepositChange(event: ChangeEvent<HTMLInputElement>) {
        setDeposit(clampNumber(event.target.value, 0, 1_000_000_000));
    }

    function handleHomePriceChange(event: ChangeEvent<HTMLInputElement>) {
        setHomePrice(clampNumber(event.target.value, 0, 1_000_000_000));
    }

    function handleMortgageRateChange(event: ChangeEvent<HTMLInputElement>) {
        setMortgageRate(clampNumber(event.target.value, -100, 100));
    }

    function handleMortgageYearsChange(event: ChangeEvent<HTMLInputElement>) {
        setMortgageYears(clampInteger(event.target.value, 1, 100));
    }

    function formatValue(value: number) {
        return value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
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
                                    label: 'Renting Cash',
                                    data: [],
                                    borderColor: '#ef4444',
                                    pointRadius: 0,
                                    pointHoverRadius: 4,
                                    pointHitRadius: 12,
                                    fill: false,
                                },
                                {
                                    label: 'Buying Cash',
                                    data: [],
                                    borderColor: '#93c5fd',
                                    pointRadius: 0,
                                    pointHoverRadius: 4,
                                    pointHitRadius: 12,
                                    borderDash: [6, 3],
                                    fill: false,
                                },
                                {
                                    label: 'Buying House Equity',
                                    data: [],
                                    borderColor: '#3b82f6',
                                    pointRadius: 0,
                                    pointHoverRadius: 4,
                                    pointHitRadius: 12,
                                    borderDash: [2, 2],
                                    fill: false,
                                },
                                {
                                    label: 'Buying Total',
                                    data: [],
                                    borderColor: '#1e3a8a',
                                    borderWidth: 2.5,
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
                    label: (item: any, data: any) => {
                        const dataset = data?.datasets?.[item?.datasetIndex];
                        const name = dataset?.label ?? '';
                        return `${name}: ${Number(item.yLabel).toFixed(2)}`;
                    },
                };
                chartRef.current.data.labels = axisLabels;
                chartRef.current.data.datasets[0].data = rentingSeries;
                chartRef.current.data.datasets[1].data = buyingCashSeries;
                chartRef.current.data.datasets[2].data = buyingHouseSeries;
                chartRef.current.data.datasets[3].data = buyingTotalSeries;
                chartRef.current.update(0);
            })
            .catch(() => {
                // Keep the page functional even if the chart script fails to load.
            });

        return () => {
            cancelled = true;
        };
    }, [axisLabels, fullLabels, rentingSeries, buyingCashSeries, buyingHouseSeries, buyingTotalSeries]);

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
                aria-label="Renting starting cash"
            >
                <label htmlFor="starting-cash" className="app-form-label">
                    Starting cash:
                </label>
                <input
                    id="starting-cash"
                    type="number"
                    className="app-input"
                    value={startingCash}
                    min={0}
                    max={1000000000}
                    step={1000}
                    onChange={handleStartingCashChange}
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
            <form
                onSubmit={(event) => event.preventDefault()}
                className="app-form-inline"
                aria-label="Buying home price"
            >
                <label htmlFor="home-price" className="app-form-label">
                    Home price:
                </label>
                <input
                    id="home-price"
                    type="number"
                    className="app-input"
                    value={homePrice}
                    min={0}
                    max={1000000000}
                    step={1000}
                    onChange={handleHomePriceChange}
                />
            </form>
            <form
                onSubmit={(event) => event.preventDefault()}
                className="app-form-inline"
                aria-label="Buying deposit"
            >
                <label htmlFor="deposit" className="app-form-label">
                    Deposit:
                </label>
                <input
                    id="deposit"
                    type="number"
                    className="app-input"
                    value={deposit}
                    min={0}
                    max={1000000000}
                    step={1000}
                    onChange={handleDepositChange}
                />
            </form>
            <form
                onSubmit={(event) => event.preventDefault()}
                className="app-form-inline"
                aria-label="Buying mortgage rate"
            >
                <label htmlFor="mortgage-rate" className="app-form-label">
                    Mortgage rate (%):
                </label>
                <input
                    id="mortgage-rate"
                    type="number"
                    className="app-input"
                    value={mortgageRate}
                    min={-100}
                    max={100}
                    step={0.1}
                    onChange={handleMortgageRateChange}
                />
            </form>
            <form
                onSubmit={(event) => event.preventDefault()}
                className="app-form-inline"
                aria-label="Buying mortgage years"
            >
                <label htmlFor="mortgage-years" className="app-form-label">
                    Mortgage term (years):
                </label>
                <input
                    id="mortgage-years"
                    type="number"
                    className="app-input"
                    value={mortgageYears}
                    min={1}
                    max={100}
                    step={1}
                    onChange={handleMortgageYearsChange}
                />
            </form>
            <p>
                Final renting value after {yearsShown} years: <strong>{formatValue(finalRentingValue)}</strong>
                <br />
                Final buying cash after {yearsShown} years: <strong>{formatValue(finalBuyingCash)}</strong>
                <br />
                Final buying house after {yearsShown} years: <strong>{formatValue(finalBuyingHouse)}</strong>
                <br />
                Final buying total after {yearsShown} years: <strong>{formatValue(finalBuyingValue)}</strong>
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
