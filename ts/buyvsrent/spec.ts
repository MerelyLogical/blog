import type { BuyVsRentInputs } from './types.ts';

type ModelInputKey = keyof BuyVsRentInputs;

export type SpecFunctionName =
    | 'floor'
    | 'if'
    | 'max'
    | 'min'
    | 'monthlyRate'
    | 'mortgagePayment';

export type SpecBinding = {
    key: string;
    expr: string;
    note?: string;
};

export type SpecStateBinding = {
    key: string;
    initial: string;
    note?: string;
};

export type SpecSeriesBinding = {
    key: string;
    expr: string;
};

export type ModelSpec = {
    name: string;
    inputKeys: ModelInputKey[];
    normalize?: SpecBinding[];
    derived?: SpecBinding[];
    state: SpecStateBinding[];
    monthly: {
        recordBefore?: SpecSeriesBinding[];
        assign: SpecBinding[];
    };
    outputs: SpecBinding[];
};

export type BuyVsRentSpec = {
    version: 1;
    expressionLanguage: {
        functions: SpecFunctionName[];
        notes: string[];
    };
    models: {
        renting: ModelSpec;
        buying: ModelSpec;
    };
};

// Expressions are plain strings on purpose. The next step can be a tiny parser
// and interpreter for this restricted grammar, without trying to parse LaTeX.
export const BUY_VS_RENT_SPEC: BuyVsRentSpec = {
    version: 1,
    expressionLanguage: {
        functions: ['floor', 'if', 'max', 'min', 'monthlyRate', 'mortgagePayment'],
        notes: [
            'Expressions may reference inputs, normalized values, derived values, state variables, and the zero-based loop variable month.',
            'normalize, derived, state, monthly.assign, and outputs are evaluated top-to-bottom in the order written.',
            'monthly.recordBefore is evaluated before monthly.assign on each loop iteration.',
            'if(condition, thenExpr, elseExpr) is the only conditional form in the minimal grammar.',
        ],
    },
    models: {
        renting: {
            name: 'renting',
            inputKeys: [
                'yearsShown',
                'startingCash',
                'monthlyIncome',
                'monthlyRent',
                'yearlyRentIncreaseRate',
                'yearlyInvestmentReturnRate',
            ],
            derived: [
                { key: 'months', expr: 'yearsShown * 12' },
                { key: 'monthlyInvestmentReturn', expr: 'monthlyRate(yearlyInvestmentReturnRate)' },
                { key: 'monthlyRentIncrease', expr: 'monthlyRate(yearlyRentIncreaseRate)' },
            ],
            state: [
                { key: 'cash', initial: 'startingCash' },
                { key: 'currentMonthlyRent', initial: 'monthlyRent' },
            ],
            monthly: {
                recordBefore: [
                    { key: 'series.rentingCash', expr: 'cash' },
                ],
                assign: [
                    { key: 'cashAfterCashflow', expr: 'cash + monthlyIncome - currentMonthlyRent' },
                    { key: 'cash', expr: 'cashAfterCashflow * (1 + monthlyInvestmentReturn)' },
                    { key: 'currentMonthlyRent', expr: 'currentMonthlyRent * (1 + monthlyRentIncrease)' },
                ],
            },
            outputs: [
                { key: 'endingCash', expr: 'cash' },
            ],
        },
        buying: {
            name: 'buying',
            inputKeys: [
                'yearsShown',
                'startingCash',
                'monthlyIncome',
                'homePrice',
                'deposit',
                'oneTimeBuyingCost',
                'mortgageRate',
                'mortgageYears',
                'yearlyHomeAppreciationRate',
                'annualOwnershipCostRate',
                'yearlyInvestmentReturnRate',
            ],
            normalize: [
                { key: 'effectiveHomePrice', expr: 'max(0, homePrice)' },
                { key: 'effectiveDeposit', expr: 'min(startingCash, max(0, deposit), effectiveHomePrice)' },
                { key: 'effectiveBuyingCost', expr: 'max(0, oneTimeBuyingCost)' },
                { key: 'effectiveAnnualOwnershipCostRate', expr: 'max(0, annualOwnershipCostRate)' },
            ],
            derived: [
                { key: 'months', expr: 'yearsShown * 12' },
                { key: 'initialMortgage', expr: 'effectiveHomePrice - effectiveDeposit' },
                { key: 'monthlyInvestmentReturn', expr: 'monthlyRate(yearlyInvestmentReturnRate)' },
                { key: 'monthlyMortgageRate', expr: 'monthlyRate(mortgageRate)' },
                { key: 'monthlyHomeAppreciation', expr: 'monthlyRate(yearlyHomeAppreciationRate)' },
                { key: 'totalMortgageMonths', expr: 'floor(mortgageYears * 12)' },
                {
                    key: 'monthlyMortgagePayment',
                    expr: 'mortgagePayment(initialMortgage, monthlyMortgageRate, totalMortgageMonths)',
                },
            ],
            state: [
                { key: 'investedCash', initial: 'startingCash - effectiveDeposit - effectiveBuyingCost' },
                { key: 'mortgageBalance', initial: 'initialMortgage' },
                { key: 'homeValue', initial: 'effectiveHomePrice' },
            ],
            monthly: {
                recordBefore: [
                    { key: 'series.buyingCash', expr: 'investedCash' },
                    { key: 'series.buyingHouse', expr: 'homeValue - mortgageBalance' },
                    { key: 'series.buyingTotal', expr: '(homeValue - mortgageBalance) + investedCash' },
                ],
                assign: [
                    { key: 'mortgageInterest', expr: 'mortgageBalance * monthlyMortgageRate' },
                    { key: 'mortgageDue', expr: 'mortgageBalance + mortgageInterest' },
                    {
                        key: 'mortgagePayment',
                        expr: 'if(mortgageBalance > 0, if(month < totalMortgageMonths - 1, monthlyMortgagePayment, if(month == totalMortgageMonths - 1, mortgageDue, 0)), 0)',
                        note: 'Matches the current final-payment drift correction in simulation.ts.',
                    },
                    {
                        key: 'mortgageBalance',
                        expr: 'if(mortgageBalance > 0, mortgageDue - mortgagePayment, mortgageBalance)',
                    },
                    {
                        key: 'ownershipCost',
                        expr: 'homeValue * effectiveAnnualOwnershipCostRate / 100 / 12',
                    },
                    {
                        key: 'investedAfterCashflow',
                        expr: 'investedCash + monthlyIncome - mortgagePayment - ownershipCost',
                    },
                    { key: 'investedCash', expr: 'investedAfterCashflow * (1 + monthlyInvestmentReturn)' },
                    { key: 'homeValue', expr: 'homeValue * (1 + monthlyHomeAppreciation)' },
                ],
            },
            outputs: [
                { key: 'scheduledMonthlyMortgagePayment', expr: 'monthlyMortgagePayment' },
                { key: 'endingCash', expr: 'investedCash' },
                { key: 'endingHouse', expr: 'homeValue - mortgageBalance' },
                { key: 'endingNetWorth', expr: '(homeValue - mortgageBalance) + investedCash' },
            ],
        },
    },
};
