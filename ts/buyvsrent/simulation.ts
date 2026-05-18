import type { BuyVsRentInputs, BuyingSimulationResult, RentingSimulationResult } from './types.ts';

export function simulateRenting(months: number, inputs: BuyVsRentInputs): RentingSimulationResult {
    const {
        startingCash,
        monthlyIncome,
        monthlyExpenses,
        monthlyRent,
        yearlyRentIncreaseRate,
        yearlyInvestmentReturnRate,
    } = inputs;
    const series: number[] = [];
    let cash = startingCash;
    const monthlyReturn = monthlyRate(yearlyInvestmentReturnRate);
    const monthlyRentIncrease = monthlyRate(yearlyRentIncreaseRate);
    let currentMonthlyRent = monthlyRent;

    for (let month = 0; month < months; month++) {
        series.push(Number(cash.toFixed(2)));
        const cashAfterCashflow = cash + monthlyIncome - monthlyExpenses - currentMonthlyRent;
        cash = cashAfterCashflow * (1 + monthlyReturn);
        currentMonthlyRent *= 1 + monthlyRentIncrease;
    }

    return {
        series,
        endingCash: Number(cash.toFixed(2)),
    };
}

export function simulateBuying(months: number, inputs: BuyVsRentInputs): BuyingSimulationResult {
    const {
        startingCash,
        monthlyIncome,
        monthlyExpenses,
        homePrice,
        deposit,
        oneTimeBuyingCost,
        yearsToSellHouse,
        sellingCostRate,
        mortgageRate,
        mortgageYears,
        yearlyHomeAppreciationRate,
        annualOwnershipCostRate,
        yearlyInvestmentReturnRate,
    } = inputs;
    const totalSeries: number[] = [];
    const cashSeries: number[] = [];
    const houseSeries: number[] = [];
    const effectiveHomePrice = Math.max(0, homePrice);
    const effectiveDeposit = Math.min(startingCash, Math.max(0, deposit), effectiveHomePrice);
    const effectiveBuyingCost = Math.max(0, oneTimeBuyingCost);
    const effectiveSellingCostRate = Math.max(0, sellingCostRate) / 100;
    const sellAfterMonths = Math.max(0, Math.floor(yearsToSellHouse * 12));
    const initialMortgage = effectiveHomePrice - effectiveDeposit;
    const monthlyInvestmentReturn = monthlyRate(yearlyInvestmentReturnRate);
    const monthlyMortgageRate = monthlyRate(mortgageRate);
    const monthlyHomeAppreciation = monthlyRate(yearlyHomeAppreciationRate);
    const totalMortgageMonths = Math.floor(mortgageYears * 12);
    const monthlyMortgagePayment = mortgagePayment(
        initialMortgage,
        monthlyMortgageRate,
        totalMortgageMonths
    );
    const ownershipCostRate = Math.max(0, annualOwnershipCostRate) / 100;

    let investedCash = startingCash - effectiveDeposit - effectiveBuyingCost;
    let mortgageBalance = initialMortgage;
    let homeValue = effectiveHomePrice;

    for (let month = 0; month < months; month++) {
        const houseEquity = homeValue - mortgageBalance;
        const netWorth = houseEquity + investedCash;
        totalSeries.push(Number(netWorth.toFixed(2)));
        cashSeries.push(Number(investedCash.toFixed(2)));
        houseSeries.push(Number(houseEquity.toFixed(2)));

        let payment = 0;
        if (mortgageBalance > 0) {
            const mortgageInterest = mortgageBalance * monthlyMortgageRate;
            const mortgageDue = mortgageBalance + mortgageInterest;
            if (month < totalMortgageMonths - 1) {
                payment = monthlyMortgagePayment;
            } else if (month === totalMortgageMonths - 1) {
                // Final scheduled month pays remaining balance to avoid drift.
                payment = mortgageDue;
            }
            mortgageBalance = mortgageDue - payment;
        }

        const ownershipCost = homeValue * ownershipCostRate / 12;
        const investedAfterCashflow = investedCash + monthlyIncome - monthlyExpenses - payment - ownershipCost;
        investedCash = investedAfterCashflow * (1 + monthlyInvestmentReturn);
        homeValue *= 1 + monthlyHomeAppreciation;

        if (homeValue > 0 && month === sellAfterMonths - 1) {
            const saleProceeds = homeValue * (1 - effectiveSellingCostRate) - mortgageBalance;
            investedCash += saleProceeds;
            mortgageBalance = 0;
            homeValue = 0;
        }
    }

    const endingHouse = homeValue - mortgageBalance;
    const endingNetWorth = endingHouse + investedCash;
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

export function monthlyRate(yearlyRatePercent: number) {
    return (1 + yearlyRatePercent / 100) ** (1 / 12) - 1;
}

function mortgagePayment(principal: number, rate: number, totalMonths: number) {
    if (totalMonths <= 0 || principal <= 0) {
        return 0;
    }
    if (rate === 0) {
        return principal / totalMonths;
    }
    const growth = (1 + rate) ** totalMonths;
    return principal * (rate * growth) / (growth - 1);
}
