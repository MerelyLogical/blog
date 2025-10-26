'use client'

import type { FC, ReactNode } from 'react'

type TimeStampProps = {
    date?: ReactNode
    children?: ReactNode
}

export const TimeStamp: FC<TimeStampProps> = ({
    date,
    children = 'Last updated on'
}) => {
    if (!date) {
        return null
    }

    return (
        <div className="x:mt-12 x:mb-8 x:text-xs x:text-gray-600 x:text-end x:dark:text-gray-400">
            {children}{' '}
            <time suppressHydrationWarning>
                {date}
            </time>
        </div>
    )
}
