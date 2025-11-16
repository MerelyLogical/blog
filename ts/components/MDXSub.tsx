import { Children, ReactNode } from 'react'

type MDXSubProps = {
    children: ReactNode
}

const brKey = (parentIndex: number, segmentIndex: number) =>
    `mdxsub-br-${parentIndex}-${segmentIndex}`

export function MDXSub({ children }: MDXSubProps) {
    const normalized = Children.toArray(children).reduce<ReactNode[]>((acc, child, childIndex) => {
        if (typeof child === 'string' && child.includes('\\n')) {
            const segments = child.split('\\n')
            segments.forEach((segment, segmentIndex) => {
                acc.push(segment)
                if (segmentIndex < segments.length - 1) {
                    acc.push(<br key={brKey(childIndex, segmentIndex)} />)
                }
            })

            return acc
        }

        acc.push(child)
        return acc
    }, [])

    return (
        <sub style={{ display: 'block', textAlign: 'center', whiteSpace: 'pre-line' }}>
            {normalized}
        </sub>
    )
}
