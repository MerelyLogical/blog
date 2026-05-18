import type { ReactNode } from 'react';
import { BUY_VS_RENT_SPEC, type ModelSpec, type SpecBinding, type SpecSeriesBinding, type SpecStateBinding } from './spec';
import { parseExpression, type ExprNode } from './expr-parser';

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
    effectiveSellingCost: 'effective selling cost',
    endingCash: 'ending cash',
    endingHouse: 'ending house equity',
    endingNetWorth: 'ending net worth',
    homePrice: 'home price',
    homeValue: 'home value',
    initialMortgage: 'initial mortgage',
    investedAfterCashflow: 'invested cash after cashflow',
    investedCash: 'invested cash',
    monthlyHomeAppreciation: 'monthly home appreciation',
    monthlyExpenses: 'monthly expenses',
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
    saleProceeds: 'sale proceeds this month',
    sellAfterMonths: 'sell-after months',
    scheduledMonthlyMortgagePayment: 'scheduled monthly mortgage payment',
    'series.buyingCash': 'buying cash series',
    'series.buyingHouse': 'buying house equity series',
    'series.buyingTotal': 'buying total series',
    'series.rentingCash': 'renting cash series',
    sellingCostRate: 'selling cost rate',
    startingCash: 'starting cash',
    totalMortgageMonths: 'total mortgage months',
    year: 'year',
    yearlyHomeAppreciationRate: 'annual home appreciation rate',
    yearlyInvestmentReturnRate: 'annual investment return rate',
    yearlyRentIncreaseRate: 'annual rent increase rate',
    yearsToSellHouse: 'years to sell house',
    yearsShown: 'years shown',
};

function displayName(value: string) {
    return DISPLAY_NAME[value] ?? value
        .replace(/\./g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .toLowerCase();
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
    sectionKey,
}: {
    items: Array<SpecBinding | SpecSeriesBinding | SpecStateBinding>;
    mode: 'expr' | 'initial';
    sectionKey: string;
}) {
    return (
        <div className="buyvsrent-spec-rules">
            {items.map((item, index) => {
                return (
                    <div key={`${sectionKey}:${item.key}:${index}`} className="buyvsrent-spec-rule">
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
                    <RuleList items={selectedModel.normalize} mode="expr" sectionKey="normalize" />
                </SpecSection>
            )}

            {selectedModel.derived && selectedModel.derived.length > 0 && (
                <SpecSection title="Derived Values">
                    <RuleList items={selectedModel.derived} mode="expr" sectionKey="derived" />
                </SpecSection>
            )}

            <SpecSection title="Initial State">
                <RuleList items={selectedModel.state} mode="initial" sectionKey="state" />
            </SpecSection>

            {selectedModel.monthly.recordBefore && selectedModel.monthly.recordBefore.length > 0 && (
                <SpecSection title="Record Before Each Month">
                    <RuleList items={selectedModel.monthly.recordBefore} mode="expr" sectionKey="recordBefore" />
                </SpecSection>
            )}

            <SpecSection title="Monthly Update Order">
                <RuleList items={selectedModel.monthly.assign} mode="expr" sectionKey="assign" />
            </SpecSection>

            <SpecSection title="Outputs">
                <RuleList items={selectedModel.outputs} mode="expr" sectionKey="outputs" />
            </SpecSection>
        </div>
    );
}
