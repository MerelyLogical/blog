'use client'

import { useEffect, useRef, useState } from 'react';

// TODO:
// [x] record price history
// [x] allow price to increase / decrease by random amount (normal distribution?)
// [ ] record buy/sell prices
// [x] average bought share price, current networth
// [x] draw prices on graph
// [ ] mark points of buy/sell
// [x] add possibility of loaning? and paying interest per tick
// [x] loan limit? -> set LTV(loan to value) to 60%?
// [x] format html, tabulate all the info
// [x] link i rates to html
// [ ] add economy cycle? a small background sine wave + general inflation -> game is boring if its purely random
// [ ] model inflation a bit better lolz
// [ ] allow pennies -> imagine doing this is £sd then calling it victorian simulator lol
// [ ] remove all the floating point maths
// [ ] allow more buying/selling methods, limit orders etc
// [ ] progression?
// [x] split files
// [ ] keyboard shortcuts

type MarketNumbers = {
    price: number;
    cash: number;
    shares: number;
    avg_cost: number;
    tick: number;
    networth: number;
    savings: number;
    loan: number;
};

type GameState = {
    grind: boolean;
    market: boolean;
    bank: boolean;
};

const history_limit = 365;
const ltv           = 0.60;
const inflation     = 0.00015;
const loan_rate     = 0.00030;
const savings_rate  = 0.00010;

const chartJsCdn = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js";

let chartPromise: Promise<void> | null = null;

function loadChartJs(): Promise<void> {
    if (typeof window === "undefined") {
        return Promise.resolve();
    }
    if ((window as any).Chart) {
        return Promise.resolve();
    }
    if (chartPromise) {
        return chartPromise;
    }
    chartPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = chartJsCdn;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Chart.js"));
        document.body.appendChild(script);
    });
    return chartPromise;
}

// Standard Normal variate using Box-Muller transform
function gaussianRandom() {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z;
}

export function MarketSim() {
    const market_numbers = useRef<MarketNumbers>({
        price: 10,
        cash: 0,
        shares: 0,
        avg_cost: 0,
        tick: 0,
        networth: 0,
        savings: 0,
        loan: 0,
    });
    const game_state = useRef<GameState>({grind: true, market: false, bank: false});
    const stock_chart = useRef<any>(null);
    const net_chart = useRef<any>(null);
    const step_inter = useRef<number | null>(null);
    const stockCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const netCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [, forceRender] = useState(0);

    function refreshDoc() {
        forceRender((v) => v + 1);
    }

    function initialiseChart() {
        const Chart = (typeof window !== "undefined" ? (window as any).Chart : null);
        if (!Chart || !stockCanvasRef.current || !netCanvasRef.current) {
            return;
        }
        if (stock_chart.current) {
            stock_chart.current.destroy();
        }
        if (net_chart.current) {
            net_chart.current.destroy();
        }
        stock_chart.current = new Chart(stockCanvasRef.current, {
            type: "line",
            data: {
                labels: [],
                datasets: [{
                    label: "Stock price",
                    data: [],
                    borderColor: "red",
                    radius: 0,
                    fill: false
                }, {
                    label: "Average cost",
                    data: [],
                    borderColor: "green",
                    radius: 0,
                    fill: false
                }]
            },
            options: {
                legend: {display: true},
                tooltips: {enabled: false},
                hover: {mode: null}
            }
        });

        net_chart.current = new Chart(netCanvasRef.current, {
            type: "line",
            data: {
                labels: [],
                datasets: [{
                    label: "Stock price",
                    data: [],
                    borderColor: "green",
                    radius: 0,
                    fill: false
                }]
            },
            options: {
                legend: {display: false},
                tooltips: {enabled: false},
                hover: {mode: null}
            }
        });

        stock_chart.current.data.labels = [0];
        stock_chart.current.data.datasets[0].data = [market_numbers.current.price];
        stock_chart.current.data.datasets[1].data = [null];
        stock_chart.current.update();

        net_chart.current.data.labels = [0];
        net_chart.current.data.datasets[0].data = [market_numbers.current.networth];
        net_chart.current.update();
    }

    function initialiseDoc() {
        market_numbers.current = {
            price: 10,
            cash: 0,
            shares: 0,
            avg_cost: 0,
            tick: 0,
            networth: 0,
            savings: 0,
            loan: 0,
        };
        game_state.current = {grind: true, market: false, bank: false};
        refreshDoc();
    }

    function refreshchart() {
        if (!stock_chart.current || !net_chart.current) {
            return;
        }
        const numbers = market_numbers.current;
        if (numbers.tick > history_limit) {
            stock_chart.current.data.labels.shift();
            stock_chart.current.data.datasets[0].data.shift();
            stock_chart.current.data.datasets[1].data.shift();
            net_chart.current.data.labels.shift();
            net_chart.current.data.datasets[0].data.shift();
        }
        stock_chart.current.data.labels.push(numbers.tick);
        stock_chart.current.data.datasets[0].data.push(numbers.price);
        net_chart.current.data.labels.push(numbers.tick);
        net_chart.current.data.datasets[0].data.push(numbers.networth);
        if (numbers.shares > 0) {
            stock_chart.current.data.datasets[1].data.push(numbers.avg_cost);
        } else {
            stock_chart.current.data.datasets[1].data.push(null);
        }
        stock_chart.current.update();
        net_chart.current.update();
    }

    function step() {
        const numbers = market_numbers.current;
        numbers.tick++;
        numbers.price += gaussianRandom()/2;
        numbers.price *= 1+inflation;
        if (numbers.price < 0) {numbers.price = 0};
        numbers.networth = numbers.cash + numbers.shares * numbers.price + numbers.savings - numbers.loan;
        numbers.savings *= 1 + savings_rate;
        numbers.loan    *= 1 + loan_rate;
        progress();
        refreshDoc();
        refreshchart();
    }

    function progress() {
        const numbers = market_numbers.current;
        if (!game_state.current.market && numbers.networth > 20) {
            game_state.current.market = true;
        }
        if (game_state.current.market && !game_state.current.bank && numbers.networth > 100) {
            game_state.current.bank = true;
        }
    }

    function reset() {
        initialiseDoc();
        initialiseChart();
    }

    function buy() {
        const numbers = market_numbers.current;
        if (numbers.cash - numbers.price >= 0) {
            numbers.cash -= numbers.price;
            numbers.avg_cost = (numbers.avg_cost * numbers.shares + numbers.price * 1) / (numbers.shares + 1);
            numbers.shares++;
            refreshDoc();
        }
    }

    function sell() {
        const numbers = market_numbers.current;
        if (numbers.shares > 0) {
            numbers.cash += numbers.price;
            numbers.shares--;
            refreshDoc();
        }
    }

    function save() {
        const numbers = market_numbers.current;
        if (numbers.cash >= 100) {
            numbers.cash -= 100;
            numbers.savings += 100;
            refreshDoc();
        }
    }

    function withdraw() {
        const numbers = market_numbers.current;
        if (numbers.savings >= 100) {
            numbers.cash += 100;
            numbers.savings -= 100;
            refreshDoc();
        } else if (0 < numbers.savings && numbers.savings < 100) {
            numbers.cash += numbers.savings;
            numbers.savings = 0;
            refreshDoc();
        }
    }

    function borrow() {
        const numbers = market_numbers.current;
        if (numbers.loan + 100 <= numbers.networth * ltv) {
            numbers.cash += 100;
            numbers.loan += 100;
            refreshDoc();
        }
    }

    function repay() {
        const numbers = market_numbers.current;
        if (numbers.cash >= 100 && numbers.loan >= 100) {
            numbers.cash -= 100;
            numbers.loan -= 100;
            refreshDoc();
        } else if (numbers.cash >= numbers.loan && 0 < numbers.loan && numbers.loan < 100) {
            numbers.cash -= numbers.loan;
            numbers.loan = 0;
            refreshDoc();
        }
    }

    function grind() {
        const numbers = market_numbers.current;
        numbers.cash++;
        refreshDoc();
    }

    useEffect(() => {
        let cancelled = false;

        const startGame = () => {
            if (cancelled) {
                return;
            }
            reset();
            refreshDoc();
            step_inter.current = window.setInterval(step, 200);
        };

        loadChartJs()
            .then(() => {
                startGame();
            })
            .catch((error) => {
                console.error(error);
                startGame();
            });

        return () => {
            cancelled = true;
            if (step_inter.current !== null) {
                clearInterval(step_inter.current);
                step_inter.current = null;
            }
            if (stock_chart.current) {
                stock_chart.current.destroy();
                stock_chart.current = null;
            }
            if (net_chart.current) {
                net_chart.current.destroy();
                net_chart.current = null;
            }
        };
    }, []);

    const numbers = market_numbers.current;
    const state = game_state.current;

    return (
        <div className="space-y-4">
            <div>
                Networth: £<span aria-live="polite">{numbers.networth.toFixed(2)}</span>
            </div>
            <canvas
                ref={netCanvasRef}
                style={{height: "50%", width: "100%"}}
            />
            <button type="button" onClick={grind} className="app-button">
                grind
            </button>

            <div
                className="space-y-3"
                style={{display: state.market ? undefined : "none"}}
                aria-hidden={!state.market}
            >
                <canvas
                    ref={stockCanvasRef}
                    style={{width: "100%"}}
                />
                <div className="table-wrapper">
                    <table>
                        <tbody>
                            <tr>
                                <td> Cash: £<span>{numbers.cash.toFixed(2)}</span></td>
                                <td> Stock price: £<span>{numbers.price.toFixed(2)}</span></td>
                            </tr>
                            <tr>
                                <td> Shares: <span>{numbers.shares}</span></td>
                                <td> Average cost: £<span>{numbers.avg_cost.toFixed(2)}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p>
                    <button type="button" onClick={buy} className="app-button">buy</button>{' '}
                    <button type="button" onClick={sell} className="app-button">sell</button>
                </p>
            </div>

            <div
                className="space-y-3"
                style={{display: state.bank ? undefined : "none"}}
                aria-hidden={!state.bank}
            >
                <p> Bank will only allow you to borrow up to {(100*ltv).toFixed(0)}% of your networth.</p>
                <p> Current inflation rate is {(100*(((1+inflation) ** 365) - 1)).toFixed(2)}% per 365 ticks</p>

                <div className="table-wrapper">
                    <table>
                        <tbody>
                            <tr>
                                <td> Loan: £<span>{numbers.loan.toFixed(2)}</span></td>
                                <td> Savings: £<span>{numbers.savings.toFixed(2)}</span></td>
                            </tr>
                            <tr>
                                <td>
                                    <button type="button" onClick={borrow} className="app-button">borrow</button>{' '}
                                    <button type="button" onClick={repay} className="app-button">repay</button>
                                </td>
                                <td>
                                    <button type="button" onClick={save} className="app-button">save</button>{' '}
                                    <button type="button" onClick={withdraw} className="app-button">withdraw</button>
                                </td>
                            </tr>
                            <tr>
                                <td> Loan interest rate: {(100*(((1+loan_rate) ** 365) - 1)).toFixed(2)}% per 365 ticks</td>
                                <td> Savings interest rate: {(100*(((1+savings_rate) ** 365) - 1)).toFixed(2)}% per 365 ticks</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
