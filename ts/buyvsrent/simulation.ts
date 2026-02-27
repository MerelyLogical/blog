import type { BuyingSimulationResult, RentingSimulationResult } from './types';

export function simulateRenting(
    months: number,
    startingCash: number,
    monthlyIncome: number,
    monthlyRent: number,
    yearlyReturnRatePercent: number
): RentingSimulationResult {
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

export function simulateBuying(
    months: number,
    startingCash: number,
    monthlyIncome: number,
    homePrice: number,
    deposit: number,
    oneTimeBuyingCost: number,
    mortgageRatePercent: number,
    mortgageYears: number,
    yearlyReturnRatePercent: number
): BuyingSimulationResult {
    const totalSeries: number[] = [];
    const cashSeries: number[] = [];
    const houseSeries: number[] = [];
    const effectiveHomePrice = Math.max(0, homePrice);
    const effectiveDeposit = Math.min(startingCash, Math.max(0, deposit), effectiveHomePrice);
    const effectiveBuyingCost = Math.max(0, oneTimeBuyingCost);
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

    let investedCash = startingCash - effectiveDeposit - effectiveBuyingCost;
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
