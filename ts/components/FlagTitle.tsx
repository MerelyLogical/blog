import type { ReactNode } from 'react';

type FlagTitleProps = {
    image: string;
    label: string;
    children?: ReactNode;
    width?: number;
    height?: number;
};

const FlagTitle = ({
    image,
    label,
    children,
    width = 18,
    height = 12
}: FlagTitleProps) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
        <img
            src={`/images/${image}`}
            width={width}
            height={height}
            alt={label}
            style={{ display: 'block' }}
        />
        <span>{children ?? label}</span>
    </span>
);

export default FlagTitle;
