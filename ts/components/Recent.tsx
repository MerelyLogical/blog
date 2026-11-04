import Link from 'next/link'
import { getPageMap } from 'nextra/page-map'
import { dated, fmt } from '../pages'

export async function Recent({ limit }: { limit?: number }) {
    const pages = dated(await getPageMap()).slice(0, limit)
    return (
        <ul className="recent">
            {pages.map(p => (
                <li key={p.route}>
                    <Link href={p.route}>
                        {p.path.map((s, i) => <span key={i} className="recent-path">{s} / </span>)}
                        {p.title}
                    </Link>
                    <time>{fmt(p.date)}</time>
                </li>
            ))}
        </ul>
    )
}
