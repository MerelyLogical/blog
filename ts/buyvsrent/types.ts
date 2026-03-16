export type BuyVsRentInputs = {
    yearsShown: number;
    yearsToSellHouse: number;
    startingCash: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyRent: number;
    yearlyInvestmentReturnRate: number;
    yearlyRentIncreaseRate: number;
    homePrice: number;
    deposit: number;
    oneTimeBuyingCost: number;
    sellingCostRate: number;
    mortgageRate: number;
    mortgageYears: number;
    yearlyHomeAppreciationRate: number;
    annualOwnershipCostRate: number;
};

export type NumericInputKey = {
    [K in keyof BuyVsRentInputs]: BuyVsRentInputs[K] extends number ? K : never;
}[keyof BuyVsRentInputs];

export type NumericFieldConfig = {
    key: NumericInputKey;
    id: string;
    label: string;
    ariaLabel: string;
    min: number;
    max: number | ((inputs: BuyVsRentInputs) => number);
    step: number;
    integer?: boolean;
};

export type RentingSimulationResult = {
    series: number[];
    endingCash: number;
};

export type BuyingSimulationResult = {
    totalSeries: number[];
    cashSeries: number[];
    houseSeries: number[];
    scheduledMonthlyMortgagePayment: number;
    endingCash: number;
    endingHouse: number;
    endingNetWorth: number;
};

export type MonthLabels = {
    axisLabels: string[];
    fullLabels: string[];
};
