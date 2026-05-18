// Shared tokenizer + recursive-descent parser for the minimal spec grammar.
// Used by spec-runtime.ts (to evaluate) and spec-view.tsx (to render). Keeping
// one parser here is the whole point of the spec layer: the grammar can only
// drift in one place.

export type ExprNode =
    | { kind: 'number'; value: number }
    | { kind: 'variable'; name: string }
    | { kind: 'unary'; op: '-'; arg: ExprNode }
    | { kind: 'binary'; op: string; left: ExprNode; right: ExprNode }
    | { kind: 'call'; name: string; args: ExprNode[] };

export type Token = {
    type: 'identifier' | 'number' | 'operator' | 'paren' | 'comma';
    value: string;
};

const cache = new Map<string, ExprNode>();

export function tokenize(expr: string) {
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

export function parseExpression(expr: string): ExprNode {
    const cached = cache.get(expr);
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
    cache.set(expr, parsed);
    return parsed;
}
