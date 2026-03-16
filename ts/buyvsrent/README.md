# Buy vs Rent Notes

This folder now has three separate layers for the calculator model:

1. `simulation.ts`
   The live implementation used by the website calculator.

2. `spec.ts`
   A machine-readable description of the model.
   This is not wired into the live calculator yet.

3. `spec-runtime.ts`
   A tiny interpreter for `spec.ts`, used only for verification.

There is also:

- `spec-view.tsx`
  A readable webpage rendering of the machine-readable spec.

- `../../scripts/testbvr.ts`
  A CLI verifier that compares the real simulation against the interpreted spec.

## Current Inputs

The calculator currently has two time horizons:

- `yearsShown`
  Controls the chart length.

- `yearsToSellHouse`
  Controls the summary comparison horizon for renting vs selling the house.

That means the chart can show one horizon while the summary numbers use another.

## Current Economic Model

Renting:

- Starts from `startingCash`
- Each month:
  - add `monthlyIncome`
  - subtract `monthlyExpenses`
  - subtract current rent
  - apply investment return
  - increase rent by the annual rent increase assumption

Buying:

- Starts from `startingCash - deposit - oneTimeBuyingCost`
- Tracks:
  - invested cash
  - mortgage balance
  - home value
- Each month:
  - record chart values before updates
  - accrue mortgage interest
  - make scheduled mortgage payment
  - on the final mortgage month, pay the exact remaining balance to avoid float drift
  - subtract monthly ownership cost
  - subtract `monthlyExpenses`
  - apply investment return to invested cash
  - apply home appreciation to home value

At the sale horizon:

- buying equity is reduced by `sellingCostRate` as a percentage of sale price
- buying total is `endingHouse + endingCash`

## Files

`constants.ts`

- default values
- input field definitions

`types.ts`

- calculator input types
- simulation result types

`simulation.ts`

- source of truth for the live calculator behavior today

`spec.ts`

- minimal declarative model spec
- split into:
  - `inputKeys`
  - `normalize`
  - `derived`
  - `state`
  - `monthly.recordBefore`
  - `monthly.assign`
  - `outputs`

`spec-runtime.ts`

- parses and evaluates the expressions from `spec.ts`
- supports the current minimal expression language:
  - numbers
  - variables
  - `+ - * /`
  - comparisons
  - `min`
  - `max`
  - `floor`
  - `if`
  - `monthlyRate`
  - `mortgagePayment`

`spec-view.tsx`

- renders the spec on the webpage in a readable form
- not used by the verifier

## Verification

Run:

```bash
pnpm testbvr
```

This does the following:

1. Takes `DEFAULT_INPUTS` from `constants.ts`
2. Runs the real implementation in `simulation.ts`
3. Runs the interpreted spec in `spec-runtime.ts`
4. Compares results
5. Prints `PASS` or `FAIL`

The verifier currently checks:

- Renting:
  - `endingCash`
  - all values in the chart `series`

- Buying:
  - `scheduledMonthlyMortgagePayment`
  - `endingCash`
  - `endingHouse`
  - `endingNetWorth`
  - all values in `cashSeries`
  - all values in `houseSeries`
  - all values in `totalSeries`

Important detail:

- chart series are checked over `yearsShown`
- summary outputs are checked over `yearsToSellHouse`

## Why The Spec Exists

The goal is to reduce drift between:

- what the live calculator does
- what we display as the model
- what we test

Right now:

- `simulation.ts` is the live implementation
- `spec.ts` is the structured model description
- `spec-runtime.ts` is the verifier path

The long-term direction is that the spec should become the easiest place to reason about the model, while the live simulation and the displayed spec stay aligned with it.

## Known Limitations

- The live calculator is still handwritten; it is not generated from the spec.
- The verifier currently only uses `DEFAULT_INPUTS`.
- There is no randomized/property testing yet.
- The chart’s buying lines show pre-sale values over `yearsShown`; selling-cost deduction is applied in the summary outputs at `yearsToSellHouse`.

## If You Pick This Up Later

Start here:

1. Read `simulation.ts`
2. Read `spec.ts`
3. Run `pnpm testbvr`
4. Check `spec-view.tsx` and the webpage if you changed the structure or naming

If `pnpm testbvr` fails after a model change, it usually means one of these drifted:

- simulation logic
- spec logic
- chart-vs-summary horizon assumptions
- rounding assumptions
