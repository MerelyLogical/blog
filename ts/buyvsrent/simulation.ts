import type { BuyingSimulationResult, RentingSimulationResult } from './types.ts';

export function simulateRenting(
    months: number,
    startingCash: number,
    monthlyIncome: number,
    monthlyRent: number,
    yearlyRentIncreaseRatePercent: number,
    yearlyReturnRatePercent: number
): RentingSimulationResult {
    const series: number[] = [];
    let cash = startingCash;
    const monthlyReturn = getMonthlyReturnRate(yearlyReturnRatePercent);
    const monthlyRentIncrease = getMonthlyReturnRate(yearlyRentIncreaseRatePercent);
    let currentMonthlyRent = monthlyRent;

    for (let month = 0; month < months; month++) {
        series.push(Number(cash.toFixed(2)));
        const cashAfterCashflow = cash + monthlyIncome - currentMonthlyRent;
        cash = cashAfterCashflow * (1 + monthlyReturn);
        currentMonthlyRent *= 1 + monthlyRentIncrease;
    }

    return {
        series,
        endingCash: Number(cash.toFixed(2)),
    };
}

export function simulateBuying(
    months: number,
    startingCash: number,
    monthlyIncome: number,
    homePrice: number,
    deposit: number,
    oneTimeBuyingCost: number,
    mortgageRatePercent: number,
    mortgageYears: number,
    yearlyHomeAppreciationRatePercent: number,
    annualOwnershipCostRatePercent: number,
    yearlyReturnRatePercent: number
): BuyingSimulationResult {
    const totalSeries: number[] = [];
    const cashSeries: number[] = [];
    const houseSeries: number[] = [];
    const effectiveHomePrice = Math.max(0, homePrice);
    const effectiveDeposit = Math.min(startingCash, Math.max(0, deposit), effectiveHomePrice);
    const effectiveBuyingCost = Math.max(0, oneTimeBuyingCost);
    const initialMortgage = effectiveHomePrice - effectiveDeposit;
    const monthlyInvestmentReturn = getMonthlyReturnRate(yearlyReturnRatePercent);
    const monthlyMortgageRate = getMonthlyReturnRate(mortgageRatePercent);
    const monthlyHomeAppreciation = getMonthlyReturnRate(yearlyHomeAppreciationRatePercent);
    const totalMortgageMonths = Math.floor(mortgageYears * 12);
    const monthlyMortgagePayment = getMonthlyMortgagePayment(
        initialMortgage,
        monthlyMortgageRate,
        totalMortgageMonths
    );
    const ownershipCostRate = Math.max(0, annualOwnershipCostRatePercent) / 100;

    let investedCash = startingCash - effectiveDeposit - effectiveBuyingCost;
    let mortgageBalance = initialMortgage;
    let homeValue = effectiveHomePrice;

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

        const ownershipCost = homeValue * ownershipCostRate / 12;
        const investedAfterCashflow = investedCash + monthlyIncome - mortgagePayment - ownershipCost;
        investedCash = investedAfterCashflow * (1 + monthlyInvestmentReturn);
        homeValue *= 1 + monthlyHomeAppreciation;
    }

    const endingNetWorth = homeValue - mortgageBalance + investedCash;
    const endingHouse = homeValue - mortgageBalance;
    return {
        totalSeries,
        cashSeries,
        houseSeries,
        scheduledMonthlyMortgagePayment: Number(monthlyMortgagePayment.toFixed(2)),
        endingCash: Number(investedCash.toFixed(2)),
        endingHouse: Number(endingHouse.toFixed(2)),
        endingNetWorth: Number(endingNetWorth.toFixed(2)),
    };
}

export function getMonthlyReturnRate(yearlyReturnRatePercent: number) {
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
