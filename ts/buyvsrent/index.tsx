'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
    BUYING_FIELDS,
    CORE_FIELDS,
    DEFAULT_INPUTS,
    OWNERSHIP_COST_RATE_FIELD,
    RENT_FIELDS,
} from './constants';
import { createChartDatasets, createMonthLabels, DATASET_INDEX, loadChartJs } from './chart';
import { simulateBuying, simulateRenting } from './simulation';
import type { BuyVsRentInputs, NumericFieldConfig } from './types';

function resolveFieldMax(field: NumericFieldConfig, inputs: BuyVsRentInputs) {
    return typeof field.max === 'function' ? field.max(inputs) : field.max;
}

function toClampedNumber(value: string, field: NumericFieldConfig, inputs: BuyVsRentInputs) {
    const parsed = Number(value);
    const max = resolveFieldMax(field, inputs);
    const raw = Number.isNaN(parsed) ? field.min : parsed;
    const normalized = field.integer ? Math.floor(raw) : raw;
    return Math.min(max, Math.max(field.min, normalized));
}

export function BuyVsRentChart() {
    const chartRef = useRef<any>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [inputs, setInputs] = useState<BuyVsRentInputs>(DEFAULT_INPUTS);

    const chartMonths = inputs.yearsShown * 12;
    const comparisonMonths = inputs.yearsToSellHouse * 12;
    const { axisLabels, fullLabels } = useMemo(() => createMonthLabels(chartMonths), [chartMonths]);

    const rentingChartResult = useMemo(
        () => simulateRenting(
            chartMonths,
            inputs.startingCash,
            inputs.monthlyIncome,
            inputs.monthlyExpenses,
            inputs.monthlyRent,
            inputs.yearlyRentIncreaseRate,
            inputs.yearlyInvestmentReturnRate
        ),
        [
            chartMonths,
            inputs.startingCash,
            inputs.monthlyIncome,
            inputs.monthlyExpenses,
            inputs.monthlyRent,
            inputs.yearlyRentIncreaseRate,
            inputs.yearlyInvestmentReturnRate,
        ]
    );

    const rentingComparisonResult = useMemo(
        () => simulateRenting(
            comparisonMonths,
            inputs.startingCash,
            inputs.monthlyIncome,
            inputs.monthlyExpenses,
            inputs.monthlyRent,
            inputs.yearlyRentIncreaseRate,
            inputs.yearlyInvestmentReturnRate
        ),
        [
            comparisonMonths,
            inputs.startingCash,
            inputs.monthlyIncome,
            inputs.monthlyExpenses,
            inputs.monthlyRent,
            inputs.yearlyRentIncreaseRate,
            inputs.yearlyInvestmentReturnRate,
        ]
    );

    const buyingChartResult = useMemo(
        () => simulateBuying(
            chartMonths,
            inputs.startingCash,
            inputs.monthlyIncome,
            inputs.monthlyExpenses,
            inputs.homePrice,
            inputs.deposit,
            inputs.oneTimeBuyingCost,
            inputs.yearsToSellHouse,
            inputs.sellingCostRate,
            inputs.mortgageRate,
            inputs.mortgageYears,
            inputs.yearlyHomeAppreciationRate,
            inputs.annualOwnershipCostRate,
            inputs.yearlyInvestmentReturnRate
        ),
        [
            chartMonths,
            inputs.startingCash,
            inputs.monthlyIncome,
            inputs.monthlyExpenses,
            inputs.homePrice,
            inputs.deposit,
            inputs.oneTimeBuyingCost,
            inputs.yearsToSellHouse,
            inputs.sellingCostRate,
            inputs.mortgageRate,
            inputs.mortgageYears,
            inputs.yearlyHomeAppreciationRate,
            inputs.annualOwnershipCostRate,
            inputs.yearlyInvestmentReturnRate
        ]
    );

    const buyingComparisonResult = useMemo(
        () => simulateBuying(
            comparisonMonths,
            inputs.startingCash,
            inputs.monthlyIncome,
            inputs.monthlyExpenses,
            inputs.homePrice,
            inputs.deposit,
            inputs.oneTimeBuyingCost,
            inputs.yearsToSellHouse,
            inputs.sellingCostRate,
            inputs.mortgageRate,
            inputs.mortgageYears,
            inputs.yearlyHomeAppreciationRate,
            inputs.annualOwnershipCostRate,
            inputs.yearlyInvestmentReturnRate
        ),
        [
            comparisonMonths,
            inputs.startingCash,
            inputs.monthlyIncome,
            inputs.monthlyExpenses,
            inputs.homePrice,
            inputs.deposit,
            inputs.oneTimeBuyingCost,
            inputs.yearsToSellHouse,
            inputs.sellingCostRate,
            inputs.mortgageRate,
            inputs.mortgageYears,
            inputs.yearlyHomeAppreciationRate,
            inputs.annualOwnershipCostRate,
            inputs.yearlyInvestmentReturnRate
        ]
    );

    const rentingSeries = rentingChartResult.series;
    const buyingTotalSeries = buyingChartResult.totalSeries;
    const buyingCashSeries = buyingChartResult.cashSeries;
    const buyingHouseSeries = buyingChartResult.houseSeries;
    const monthlyMortgageRepayment = buyingComparisonResult.scheduledMonthlyMortgagePayment;
    const startingAnnualOwnershipCost = inputs.homePrice * inputs.annualOwnershipCostRate / 100;

    function handleFieldChange(field: NumericFieldConfig, event: ChangeEvent<HTMLInputElement>) {
        setInputs((prev) => {
            const nextValue = toClampedNumber(event.target.value, field, prev);
            const next = { ...prev, [field.key]: nextValue } as BuyVsRentInputs;

            // Keep dependent constraints consistent when source field changes.
            if (field.key === 'startingCash' || field.key === 'homePrice') {
                const maxDeposit = Math.min(next.startingCash, next.homePrice);
                if (next.deposit > maxDeposit) {
                    next.deposit = maxDeposit;
                }
            }

            return next;
        });
    }

    function formatValue(value: number) {
        return value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    function renderField(field: NumericFieldConfig) {
        return (
            <div
                key={field.id}
                className="buyvsrent-field"
                aria-label={field.ariaLabel}
            >
                <label htmlFor={field.id} className="app-form-label">
                    {field.label}
                </label>
                <input
                    id={field.id}
                    type="number"
                    className="app-input app-input--compact buyvsrent-input"
                    value={inputs[field.key]}
                    min={field.min}
                    max={resolveFieldMax(field, inputs)}
                    step={field.step}
                    onChange={(event) => handleFieldChange(field, event)}
                />
            </div>
        );
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
                            datasets: createChartDatasets(),
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
                chartRef.current.data.datasets[DATASET_INDEX.rentingCash].data = rentingSeries;
                chartRef.current.data.datasets[DATASET_INDEX.buyingCash].data = buyingCashSeries;
                chartRef.current.data.datasets[DATASET_INDEX.buyingHouse].data = buyingHouseSeries;
                chartRef.current.data.datasets[DATASET_INDEX.buyingTotal].data = buyingTotalSeries;
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
        <div className="buyvsrent-panel">
            <div className="buyvsrent-grid-wrap">
                <h4 className="buyvsrent-section-title">Core Inputs</h4>
                <div className="buyvsrent-form-grid">
                    {CORE_FIELDS.map(renderField)}
                </div>
            </div>
            <div className="buyvsrent-grid-wrap">
                <h4 className="buyvsrent-section-title">Rent Inputs</h4>
                <div className="buyvsrent-form-grid">
                    {RENT_FIELDS.map(renderField)}
                </div>
            </div>
            <div className="buyvsrent-grid-wrap">
                <h4 className="buyvsrent-section-title">Buying Inputs</h4>
                <div className="buyvsrent-form-grid">
                    {BUYING_FIELDS.map(renderField)}
                    {renderField(OWNERSHIP_COST_RATE_FIELD)}
                </div>
            </div>
            <p className="buyvsrent-metric">
                Calculated monthly mortgage repayment: <strong>{formatValue(monthlyMortgageRepayment)}</strong>
                <br />
                Starting annual ownership cost: <strong>{formatValue(startingAnnualOwnershipCost)}</strong>
            </p>
            <p className="buyvsrent-metric">
                Renting value after {inputs.yearsToSellHouse} years: <strong>{formatValue(rentingComparisonResult.endingCash)}</strong>
                <br />
                Buying cash after sale in {inputs.yearsToSellHouse} years: <strong>{formatValue(buyingComparisonResult.endingCash)}</strong>
                <br />
                Buying equity after sale in {inputs.yearsToSellHouse} years: <strong>{formatValue(buyingComparisonResult.endingHouse)}</strong>
                <br />
                Buying total after sale in {inputs.yearsToSellHouse} years: <strong>{formatValue(buyingComparisonResult.endingNetWorth)}</strong>
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
