import type { MonthLabels } from './types';

const chartJsCdn = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js';

let chartPromise: Promise<void> | null = null;

export const DATASET_INDEX = {
    rentingCash: 0,
    buyingCash: 1,
    buyingHouse: 2,
    buyingTotal: 3,
} as const;

export function loadChartJs(): Promise<void> {
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

export function createMonthLabels(months: number): MonthLabels {
    const axisLabels: string[] = [];
    const fullLabels: string[] = [];
    const monthYearFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' });
    const now = new Date();
    const startMonth = now.getMonth();
    const startYear = now.getFullYear();

    for (let i = 0; i < months; i++) {
        const pointDate = new Date(startYear, startMonth + i, 1);
        const month = pointDate.getMonth();
        const fullLabel = monthYearFormatter.format(pointDate).replace(',', '');
        fullLabels.push(fullLabel);
        axisLabels.push(month === 0 || month === 6 ? fullLabel : '');
    }

    return { axisLabels, fullLabels };
}

export function createChartDatasets() {
    return [
        {
            label: 'Renting Cash',
            data: [],
            borderColor: '#ef4444',
            lineTension: 0,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHitRadius: 12,
            fill: false,
        },
        {
            label: 'Buying Cash',
            data: [],
            borderColor: '#93c5fd',
            lineTension: 0,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHitRadius: 12,
            borderDash: [6, 3],
            fill: false,
        },
        {
            label: 'Buying Equity',
            data: [],
            borderColor: '#3b82f6',
            lineTension: 0,
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
            lineTension: 0,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHitRadius: 12,
            fill: false,
        },
    ];
}
