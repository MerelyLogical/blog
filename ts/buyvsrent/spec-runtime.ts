import { BUY_VS_RENT_SPEC, type ModelSpec } from './spec.ts';
import type { BuyVsRentInputs } from './types.ts';

type ExprNode =
    | { kind: 'number'; value: number }
    | { kind: 'variable'; name: string }
    | { kind: 'unary'; op: '-'; arg: ExprNode }
    | { kind: 'binary'; op: string; left: ExprNode; right: ExprNode }
    | { kind: 'call'; name: string; args: ExprNode[] };

type Token = {
    type: 'identifier' | 'number' | 'operator' | 'paren' | 'comma';
    value: string;
};

type RuntimeContext = Record<string, number>;

export type EvaluatedModel = {
    outputs: Record<string, number>;
    series: Record<string, number[]>;
};

const expressionCache = new Map<string, ExprNode>();

function tokenize(expr: string) {
    const tokens: Token[] = [];
    let index = 0;

    while (index < expr.length) {
        const char = expr[index];

        if (/\s/.test(char)) {
            index += 1;
            continue;
        }

        const twoCharOperator = expr.slice(index, index + 2);
        if (['==', '>=', '<='].includes(twoCharOperator)) {
            tokens.push({ type: 'operator', value: twoCharOperator });
            index += 2;
            continue;
        }

        if (['+', '-', '*', '/', '>', '<'].includes(char)) {
            tokens.push({ type: 'operator', value: char });
            index += 1;
            continue;
        }

        if (char === '(' || char === ')') {
            tokens.push({ type: 'paren', value: char });
            index += 1;
            continue;
        }

        if (char === ',') {
            tokens.push({ type: 'comma', value: char });
            index += 1;
            continue;
        }

        const numberMatch = expr.slice(index).match(/^\d+(\.\d+)?/);
        if (numberMatch) {
            tokens.push({ type: 'number', value: numberMatch[0] });
            index += numberMatch[0].length;
            continue;
        }

        const identifierMatch = expr.slice(index).match(/^[a-zA-Z_][a-zA-Z0-9_.]*/);
        if (identifierMatch) {
            tokens.push({ type: 'identifier', value: identifierMatch[0] });
            index += identifierMatch[0].length;
            continue;
        }

        throw new Error(`Unsupported token in expression: ${expr.slice(index)}`);
    }

    return tokens;
}

function parseExpression(expr: string): ExprNode {
    const cached = expressionCache.get(expr);
    if (cached) {
        return cached;
    }

    const tokens = tokenize(expr);
    let index = 0;

    function peek() {
        return tokens[index];
    }

    function consume(expectedType?: Token['type'], expectedValue?: string) {
        const token = tokens[index];
        if (!token) {
            throw new Error('Unexpected end of expression');
        }
        if (expectedType && token.type !== expectedType) {
            throw new Error(`Expected token type ${expectedType} but got ${token.type}`);
        }
        if (expectedValue && token.value !== expectedValue) {
            throw new Error(`Expected token ${expectedValue} but got ${token.value}`);
        }
        index += 1;
        return token;
    }

    function parsePrimary(): ExprNode {
        const token = peek();
        if (!token) {
            throw new Error('Missing expression');
        }

        if (token.type === 'number') {
            consume('number');
            return { kind: 'number', value: Number(token.value) };
        }

        if (token.type === 'identifier') {
            consume('identifier');
            if (peek()?.type === 'paren' && peek()?.value === '(') {
                consume('paren', '(');
                const args: ExprNode[] = [];
                if (!(peek()?.type === 'paren' && peek()?.value === ')')) {
                    while (true) {
                        args.push(parseComparison());
                        if (peek()?.type === 'comma') {
                            consume('comma');
                            continue;
                        }
                        break;
                    }
                }
                consume('paren', ')');
                return { kind: 'call', name: token.value, args };
            }
            return { kind: 'variable', name: token.value };
        }

        if (token.type === 'paren' && token.value === '(') {
            consume('paren', '(');
            const inner = parseComparison();
            consume('paren', ')');
            return inner;
        }

        throw new Error(`Unexpected token ${token.value}`);
    }

    function parseUnary(): ExprNode {
        if (peek()?.type === 'operator' && peek()?.value === '-') {
            consume('operator', '-');
            return { kind: 'unary', op: '-', arg: parseUnary() };
        }
        return parsePrimary();
    }

    function parseMultiplicative(): ExprNode {
        let node = parseUnary();
        while (peek()?.type === 'operator' && ['*', '/'].includes(peek()!.value)) {
            const op = consume('operator').value;
            node = { kind: 'binary', op, left: node, right: parseUnary() };
        }
        return node;
    }

    function parseAdditive(): ExprNode {
        let node = parseMultiplicative();
        while (peek()?.type === 'operator' && ['+', '-'].includes(peek()!.value)) {
            const op = consume('operator').value;
            node = { kind: 'binary', op, left: node, right: parseMultiplicative() };
        }
        return node;
    }

    function parseComparison(): ExprNode {
        let node = parseAdditive();
        while (peek()?.type === 'operator' && ['==', '>', '<', '>=', '<='].includes(peek()!.value)) {
            const op = consume('operator').value;
            node = { kind: 'binary', op, left: node, right: parseAdditive() };
        }
        return node;
    }

    const parsed = parseComparison();
    if (index !== tokens.length) {
        throw new Error(`Unexpected trailing token ${tokens[index]?.value}`);
    }
    expressionCache.set(expr, parsed);
    return parsed;
}

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
                    return getMonthlyRate(args[0] ?? 0);
                case 'mortgagePayment':
                    return getMonthlyMortgagePayment(args[0] ?? 0, args[1] ?? 0, args[2] ?? 0);
                default:
                    throw new Error(`Unsupported function: ${node.name}`);
            }
        }
    }
}

function assignValue(context: RuntimeContext, key: string, expr: string) {
    context[key] = evaluateExpression(parseExpression(expr), context);
}

function getMonthlyRate(yearlyRatePercent: number) {
    return (1 + yearlyRatePercent / 100) ** (1 / 12) - 1;
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
