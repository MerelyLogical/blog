const CHART_JS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js';

let chartPromise: Promise<void> | null = null;

export function loadChartJs(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    if ((window as any).Chart) return Promise.resolve();
    if (chartPromise) return chartPromise;
    chartPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = CHART_JS_CDN;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Chart.js'));
        document.body.appendChild(script);
    });
    return chartPromise;
}
