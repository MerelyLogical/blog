import { DEFAULT_INPUTS } from '../ts/buyvsrent/constants.ts';
import { simulateBuying, simulateRenting } from '../ts/buyvsrent/simulation.ts';
import { evaluateBuyVsRentSpec } from '../ts/buyvsrent/spec-runtime.ts';

type Check = {
    label: string;
    actual: number;
    expected: number;
};

function round2(value: number) {
    return Number(value.toFixed(2));
}

function compareNumbers(actual: number, expected: number) {
    return Math.abs(actual - expected) < 1e-9;
}

function printSection(title: string) {
    console.log(title);
}

function printCheck(check: Check) {
    const pass = compareNumbers(check.actual, check.expected);
    const status = pass ? 'PASS' : 'FAIL';
    console.log(`  ${check.label}: actual=${check.actual.toFixed(2)} expected=${check.expected.toFixed(2)} ${status}`);
    return pass;
}

function printSeriesCheck(label: string, actual: number[], expected: number[]) {
    const sameLength = actual.length === expected.length;
    const sameValues = sameLength && actual.every((value, index) => compareNumbers(value, expected[index] ?? NaN));
    const status = sameValues ? 'PASS' : 'FAIL';
    console.log(`  ${label}: length=${actual.length}/${expected.length} ${status}`);

    if (!sameValues) {
        const mismatchIndex = actual.findIndex((value, index) => !compareNumbers(value, expected[index] ?? NaN));
        const expectedValue = expected[mismatchIndex] ?? NaN;
        const actualValue = actual[mismatchIndex] ?? NaN;
        console.log(`    first mismatch at index ${mismatchIndex}: actual=${actualValue.toFixed(2)} expected=${expectedValue.toFixed(2)}`);
    }

    return sameValues;
}

const months = DEFAULT_INPUTS.yearsShown * 12;
const actualRenting = simulateRenting(
    months,
    DEFAULT_INPUTS.startingCash,
    DEFAULT_INPUTS.monthlyIncome,
    DEFAULT_INPUTS.monthlyRent,
    DEFAULT_INPUTS.yearlyRentIncreaseRate,
    DEFAULT_INPUTS.yearlyInvestmentReturnRate
);

const actualBuying = simulateBuying(
    months,
    DEFAULT_INPUTS.startingCash,
    DEFAULT_INPUTS.monthlyIncome,
    DEFAULT_INPUTS.homePrice,
    DEFAULT_INPUTS.deposit,
    DEFAULT_INPUTS.oneTimeBuyingCost,
    DEFAULT_INPUTS.mortgageRate,
    DEFAULT_INPUTS.mortgageYears,
    DEFAULT_INPUTS.yearlyHomeAppreciationRate,
    DEFAULT_INPUTS.annualOwnershipCostRate,
    DEFAULT_INPUTS.yearlyInvestmentReturnRate
);

const interpreted = evaluateBuyVsRentSpec(DEFAULT_INPUTS);

const expectedRentingSeries = (interpreted.renting.series['series.rentingCash'] ?? []).map(round2);
const expectedBuyingCashSeries = (interpreted.buying.series['series.buyingCash'] ?? []).map(round2);
const expectedBuyingHouseSeries = (interpreted.buying.series['series.buyingHouse'] ?? []).map(round2);
const expectedBuyingTotalSeries = (interpreted.buying.series['series.buyingTotal'] ?? []).map(round2);

const checks: Check[] = [
    {
        label: 'endingCash',
        actual: actualRenting.endingCash,
        expected: round2(interpreted.renting.outputs.endingCash),
    },
    {
        label: 'scheduledMonthlyMortgagePayment',
        actual: actualBuying.scheduledMonthlyMortgagePayment,
        expected: round2(interpreted.buying.outputs.scheduledMonthlyMortgagePayment),
    },
    {
        label: 'endingCash',
        actual: actualBuying.endingCash,
        expected: round2(interpreted.buying.outputs.endingCash),
    },
    {
        label: 'endingHouse',
        actual: actualBuying.endingHouse,
        expected: round2(interpreted.buying.outputs.endingHouse),
    },
    {
        label: 'endingNetWorth',
        actual: actualBuying.endingNetWorth,
        expected: round2(interpreted.buying.outputs.endingNetWorth),
    },
];

console.log('Buy vs Rent spec check');
console.log('Inputs: DEFAULT_INPUTS');
console.log(JSON.stringify(DEFAULT_INPUTS, null, 2));
console.log('');

let passed = true;

printSection('Renting');
passed = printCheck(checks[0]) && passed;
passed = printSeriesCheck('series', actualRenting.series, expectedRentingSeries) && passed;
console.log('');

printSection('Buying');
for (const check of checks.slice(1)) {
    passed = printCheck(check) && passed;
}
passed = printSeriesCheck('cashSeries', actualBuying.cashSeries, expectedBuyingCashSeries) && passed;
passed = printSeriesCheck('houseSeries', actualBuying.houseSeries, expectedBuyingHouseSeries) && passed;
passed = printSeriesCheck('totalSeries', actualBuying.totalSeries, expectedBuyingTotalSeries) && passed;
console.log('');

if (passed) {
    console.log('PASS');
    process.exit(0);
}

console.log('FAIL');
process.exit(1);
