import type { BuyVsRentInputs, NumericFieldConfig } from './types';

export const MAX_MONEY = 1_000_000_000;
export const MIN_RATE = -100;
export const MAX_RATE = 100;
export const MIN_YEARS = 1;
export const MAX_YEARS = 100;
export const DEFAULT_ANNUAL_OWNERSHIP_COST_RATE = 1;

export const DEFAULT_INPUTS: BuyVsRentInputs = {
    yearsShown: 5,
    startingCash: 100_000,
    monthlyIncome: 3_000,
    monthlyRent: 1_500,
    yearlyInvestmentReturnRate: 5,
    yearlyRentIncreaseRate: 3,
    homePrice: 250_000,
    deposit: 50_000,
    oneTimeBuyingCost: 5_000,
    mortgageRate: 4,
    mortgageYears: 25,
    yearlyHomeAppreciationRate: 2,
    annualOwnershipCostRate: DEFAULT_ANNUAL_OWNERSHIP_COST_RATE,
};

export const CORE_FIELDS: NumericFieldConfig[] = [
    {
        key: 'yearsShown',
        id: 'years-shown',
        label: 'Years shown:',
        ariaLabel: 'Graph years shown',
        min: MIN_YEARS,
        max: MAX_YEARS,
        step: 1,
        integer: true,
    },
    {
        key: 'startingCash',
        id: 'starting-cash',
        label: 'Starting cash:',
        ariaLabel: 'Renting starting cash',
        min: 0,
        max: MAX_MONEY,
        step: 1000,
    },
    {
        key: 'monthlyIncome',
        id: 'monthly-income',
        label: 'Monthly income:',
        ariaLabel: 'Renting monthly income',
        min: 0,
        max: MAX_MONEY,
        step: 100,
    },
    {
        key: 'yearlyInvestmentReturnRate',
        id: 'yearly-investment-return-rate',
        label: 'Annual investment return rate (%):',
        ariaLabel: 'Renting annual investment return rate',
        min: MIN_RATE,
        max: MAX_RATE,
        step: 0.1,
    },
];

export const RENT_FIELDS: NumericFieldConfig[] = [
    {
        key: 'monthlyRent',
        id: 'monthly-rent',
        label: 'Monthly rent:',
        ariaLabel: 'Renting monthly rent',
        min: 0,
        max: MAX_MONEY,
        step: 100,
    },
    {
        key: 'yearlyRentIncreaseRate',
        id: 'yearly-rent-increase-rate',
        label: 'Annual rent increase rate (%):',
        ariaLabel: 'Renting annual rent increase rate',
        min: MIN_RATE,
        max: MAX_RATE,
        step: 0.1,
    },
];

export const BUYING_FIELDS: NumericFieldConfig[] = [
    {
        key: 'homePrice',
        id: 'home-price',
        label: 'Home price:',
        ariaLabel: 'Buying home price',
        min: 0,
        max: MAX_MONEY,
        step: 1000,
    },
    {
        key: 'deposit',
        id: 'deposit',
        label: 'Deposit:',
        ariaLabel: 'Buying deposit',
        min: 0,
        max: (inputs) => Math.min(inputs.startingCash, inputs.homePrice),
        step: 1000,
    },
    {
        key: 'mortgageRate',
        id: 'mortgage-rate',
        label: 'Mortgage rate (%):',
        ariaLabel: 'Buying mortgage rate',
        min: MIN_RATE,
        max: MAX_RATE,
        step: 0.1,
    },
    {
        key: 'oneTimeBuyingCost',
        id: 'one-time-buying-cost',
        label: 'One-time buying cost:',
        ariaLabel: 'Buying one-time cost',
        min: 0,
        max: MAX_MONEY,
        step: 100,
    },
    {
        key: 'mortgageYears',
        id: 'mortgage-years',
        label: 'Mortgage term (years):',
        ariaLabel: 'Buying mortgage years',
        min: MIN_YEARS,
        max: MAX_YEARS,
        step: 1,
        integer: true,
    },
    {
        key: 'yearlyHomeAppreciationRate',
        id: 'yearly-home-appreciation-rate',
        label: 'Annual home appreciation rate (%):',
        ariaLabel: 'Buying annual home appreciation rate',
        min: MIN_RATE,
        max: MAX_RATE,
        step: 0.1,
    },
];

export const OWNERSHIP_COST_MANUAL_FIELD: NumericFieldConfig = {
    key: 'annualOwnershipCostRate',
    id: 'annual-ownership-cost-rate',
    label: 'Annual ownership cost (% of home value):',
    ariaLabel: 'Buying annual ownership cost rate',
    min: 0,
    max: MAX_RATE,
    step: 0.1,
};
