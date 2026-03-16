import type { ReactNode } from 'react';
import { BUY_VS_RENT_SPEC, type ModelSpec, type SpecBinding, type SpecSeriesBinding, type SpecStateBinding } from './spec';

const DISPLAY_NAME: Record<string, string> = {
    annualOwnershipCostRate: 'annual ownership cost rate',
    buying: 'buying',
    cash: 'cash',
    cashAfterCashflow: 'cash after cashflow',
    currentMonthlyRent: 'current monthly rent',
    deposit: 'deposit',
    effectiveAnnualOwnershipCostRate: 'effective annual ownership cost rate',
    effectiveBuyingCost: 'effective buying cost',
    effectiveDeposit: 'effective deposit',
    effectiveHomePrice: 'effective home price',
    endingCash: 'ending cash',
    endingHouse: 'ending house equity',
    endingNetWorth: 'ending net worth',
    homePrice: 'home price',
    homeValue: 'home value',
    initialMortgage: 'initial mortgage',
    investedAfterCashflow: 'invested cash after cashflow',
    investedCash: 'invested cash',
    monthlyHomeAppreciation: 'monthly home appreciation',
    monthlyIncome: 'monthly income',
    monthlyInvestmentReturn: 'monthly investment return',
    monthlyMortgagePayment: 'scheduled monthly mortgage payment',
    monthlyMortgageRate: 'monthly mortgage rate',
    monthlyRent: 'monthly rent',
    monthlyRentIncrease: 'monthly rent increase',
    months: 'months shown',
    mortgageBalance: 'mortgage balance',
    mortgageDue: 'mortgage due this month',
    mortgageInterest: 'mortgage interest this month',
    mortgagePayment: 'mortgage payment this month',
    mortgageRate: 'annual mortgage rate',
    mortgageYears: 'mortgage term in years',
    oneTimeBuyingCost: 'one-time buying cost',
    ownershipCost: 'ownership cost this month',
    renting: 'renting',
    scheduledMonthlyMortgagePayment: 'scheduled monthly mortgage payment',
    'series.buyingCash': 'buying cash series',
    'series.buyingHouse': 'buying house equity series',
    'series.buyingTotal': 'buying total series',
    'series.rentingCash': 'renting cash series',
    startingCash: 'starting cash',
    totalMortgageMonths: 'total mortgage months',
    year: 'year',
    yearlyHomeAppreciationRate: 'annual home appreciation rate',
    yearlyInvestmentReturnRate: 'annual investment return rate',
    yearlyRentIncreaseRate: 'annual rent increase rate',
    yearsShown: 'years shown',
};

function displayName(value: string) {
    return DISPLAY_NAME[value] ?? value
        .replace(/\./g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .toLowerCase();
}

type ExprNode =
    | { kind: 'number'; value: string }
    | { kind: 'variable'; name: string }
    | { kind: 'unary'; op: '-'; arg: ExprNode }
    | { kind: 'binary'; op: string; left: ExprNode; right: ExprNode }
    | { kind: 'call'; name: string; args: ExprNode[] };

type Token = {
    type: 'identifier' | 'number' | 'operator' | 'paren' | 'comma';
    value: string;
};

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

function parseExpression(expr: string) {
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
            return { kind: 'number', value: token.value };
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
    return parsed;
}

function precedence(node: ExprNode) {
    if (node.kind === 'binary') {
        if (['==', '>', '<', '>=', '<='].includes(node.op)) {
            return 1;
        }
        if (['+', '-'].includes(node.op)) {
            return 2;
        }
        return 3;
    }
    if (node.kind === 'unary') {
        return 4;
    }
    return 5;
}

function renderExpressionNode(node: ExprNode, parentPrecedence = 0): ReactNode {
    const renderWithParens = (content: ReactNode, child: ExprNode) => {
        if (precedence(child) < parentPrecedence) {
            return (
                <>
                    <span className="buyvsrent-spec-op">(</span>
                    {content}
                    <span className="buyvsrent-spec-op">)</span>
                </>
            );
        }
        return content;
    };

    if (node.kind === 'number') {
        return <span className="buyvsrent-spec-number">{node.value}</span>;
    }

    if (node.kind === 'variable') {
        return <span className="buyvsrent-spec-var">{displayName(node.name)}</span>;
    }

    if (node.kind === 'unary') {
        return renderWithParens(
            <>
                <span className="buyvsrent-spec-op">-</span>
                {renderExpressionNode(node.arg, precedence(node))}
            </>,
            node
        );
    }

    if (node.kind === 'call') {
        if (node.name === 'if' && node.args.length === 3) {
            return (
                <>
                    <span className="buyvsrent-spec-keyword">if</span>{' '}
                    {renderExpressionNode(node.args[0], 0)}{' '}
                    <span className="buyvsrent-spec-keyword">then</span>{' '}
                    {renderExpressionNode(node.args[1], 0)}{' '}
                    <span className="buyvsrent-spec-keyword">else</span>{' '}
                    {renderExpressionNode(node.args[2], 0)}
                </>
            );
        }

        return (
            <>
                <span className="buyvsrent-spec-keyword">{node.name}</span>
                <span className="buyvsrent-spec-op">(</span>
                {node.args.map((arg, argIndex) => (
                    <span key={argIndex}>
                        {argIndex > 0 && <span className="buyvsrent-spec-op">, </span>}
                        {renderExpressionNode(arg, 0)}
                    </span>
                ))}
                <span className="buyvsrent-spec-op">)</span>
            </>
        );
    }

    const content = (
        <>
            {renderExpressionNode(node.left, precedence(node))}
            <span className="buyvsrent-spec-op"> {node.op} </span>
            {renderExpressionNode(node.right, precedence(node) + (node.op === '-' || node.op === '/' ? 1 : 0))}
        </>
    );
    return renderWithParens(content, node);
}

function renderExpression(expr: string) {
    try {
        return renderExpressionNode(parseExpression(expr));
    } catch {
        return expr.replace(/\b[a-zA-Z_][a-zA-Z0-9_.]*\b/g, (token) => displayName(token));
    }
}

function RuleList({
    items,
    mode,
}: {
    items: Array<SpecBinding | SpecSeriesBinding | SpecStateBinding>;
    mode: 'expr' | 'initial';
}) {
    return (
        <div className="buyvsrent-spec-rules">
            {items.map((item) => {
                return (
                    <div key={item.key} className="buyvsrent-spec-rule">
                        <div className="buyvsrent-spec-code">
                            <span className="buyvsrent-spec-var">{displayName(item.key)}</span>
                            {mode === 'initial' ? (
                                <>
                                    <span className="buyvsrent-spec-keyword"> starts as </span>
                                    {renderExpression((item as SpecStateBinding).initial)}
                                </>
                            ) : (
                                <>
                                    <span className="buyvsrent-spec-op"> = </span>
                                    {renderExpression((item as SpecBinding | SpecSeriesBinding).expr)}
                                </>
                            )}
                        </div>
                        {'note' in item && item.note && (
                            <p className="buyvsrent-spec-note">{item.note}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function SpecSection({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="buyvsrent-spec-section">
            <h4 className="buyvsrent-spec-section-title">{title}</h4>
            {children}
        </section>
    );
}

export function BuyVsRentModelSpecView({
    model,
}: {
    model: keyof typeof BUY_VS_RENT_SPEC.models;
}) {
    const selectedModel: ModelSpec = BUY_VS_RENT_SPEC.models[model];

    return (
        <div className="buyvsrent-spec-card">
            <SpecSection title="Inputs">
                <ul className="buyvsrent-spec-list">
                    {selectedModel.inputKeys.map((key) => (
                        <li key={key}>{displayName(key)}</li>
                    ))}
                </ul>
            </SpecSection>

            {selectedModel.normalize && selectedModel.normalize.length > 0 && (
                <SpecSection title="Normalize Inputs">
                    <RuleList items={selectedModel.normalize} mode="expr" />
                </SpecSection>
            )}

            {selectedModel.derived && selectedModel.derived.length > 0 && (
                <SpecSection title="Derived Values">
                    <RuleList items={selectedModel.derived} mode="expr" />
                </SpecSection>
            )}

            <SpecSection title="Initial State">
                <RuleList items={selectedModel.state} mode="initial" />
            </SpecSection>

            {selectedModel.monthly.recordBefore && selectedModel.monthly.recordBefore.length > 0 && (
                <SpecSection title="Record Before Each Month">
                    <RuleList items={selectedModel.monthly.recordBefore} mode="expr" />
                </SpecSection>
            )}

            <SpecSection title="Monthly Update Order">
                <RuleList items={selectedModel.monthly.assign} mode="expr" />
            </SpecSection>

            <SpecSection title="Outputs">
                <RuleList items={selectedModel.outputs} mode="expr" />
            </SpecSection>
        </div>
    );
}
