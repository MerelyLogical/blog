import { BUY_VS_RENT_SPEC, type ModelSpec } from './spec.ts';
import type { BuyVsRentInputs } from './types.ts';
import { parseExpression, type ExprNode } from './expr-parser.ts';

type RuntimeContext = Record<string, number>;

export type EvaluatedModel = {
    outputs: Record<string, number>;
    series: Record<string, number[]>;
};

function evaluateExpression(node: ExprNode, context: RuntimeContext): number {
    switch (node.kind) {
        case 'number':
            return node.value;
        case 'variable': {
            const value = context[node.name];
            if (value === undefined) {
                throw new Error(`Unknown variable: ${node.name}`);
            }
            return value;
        }
        case 'unary':
            return -evaluateExpression(node.arg, context);
        case 'binary': {
            const left = evaluateExpression(node.left, context);
            const right = evaluateExpression(node.right, context);
            switch (node.op) {
                case '+':
                    return left + right;
                case '-':
                    return left - right;
                case '*':
                    return left * right;
                case '/':
                    return left / right;
                case '==':
                    return left === right ? 1 : 0;
                case '>':
                    return left > right ? 1 : 0;
                case '<':
                    return left < right ? 1 : 0;
                case '>=':
                    return left >= right ? 1 : 0;
                case '<=':
                    return left <= right ? 1 : 0;
                default:
                    throw new Error(`Unsupported operator: ${node.op}`);
            }
        }
        case 'call': {
            const args = node.args.map((arg) => evaluateExpression(arg, context));
            switch (node.name) {
                case 'floor':
                    return Math.floor(args[0] ?? 0);
                case 'if':
                    return args[0] !== 0 ? args[1] : args[2];
                case 'max':
                    return Math.max(...args);
                case 'min':
                    return Math.min(...args);
                case 'monthlyRate':
                    return monthlyRate(args[0] ?? 0);
                case 'mortgagePayment':
                    return mortgagePayment(args[0] ?? 0, args[1] ?? 0, args[2] ?? 0);
                default:
                    throw new Error(`Unsupported function: ${node.name}`);
            }
        }
    }
}

function assignValue(context: RuntimeContext, key: string, expr: string) {
    context[key] = evaluateExpression(parseExpression(expr), context);
}

// Independent re-derivation of the finance math from simulation.ts, kept
// separate on purpose so the verifier actually checks these formulas.
function monthlyRate(yearlyRatePercent: number) {
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

function evaluateModel(model: ModelSpec, inputs: BuyVsRentInputs): EvaluatedModel {
    const context: RuntimeContext = { ...inputs };
    const series: Record<string, number[]> = {};

    for (const binding of model.normalize ?? []) {
        assignValue(context, binding.key, binding.expr);
    }

    for (const binding of model.derived ?? []) {
        assignValue(context, binding.key, binding.expr);
    }

    for (const binding of model.state) {
        assignValue(context, binding.key, binding.initial);
    }

    const months = Math.max(0, Math.floor(context.months ?? 0));
    for (let month = 0; month < months; month++) {
        context.month = month;

        for (const binding of model.monthly.recordBefore ?? []) {
            const value = evaluateExpression(parseExpression(binding.expr), context);
            series[binding.key] ??= [];
            series[binding.key].push(value);
        }

        for (const binding of model.monthly.assign) {
            assignValue(context, binding.key, binding.expr);
        }
    }

    const outputs: Record<string, number> = {};
    for (const binding of model.outputs) {
        outputs[binding.key] = evaluateExpression(parseExpression(binding.expr), context);
    }

    return { outputs, series };
}

export function evaluateBuyVsRentSpec(inputs: BuyVsRentInputs) {
    return {
        renting: evaluateModel(BUY_VS_RENT_SPEC.models.renting, inputs),
        buying: evaluateModel(BUY_VS_RENT_SPEC.models.buying, inputs),
    };
}
