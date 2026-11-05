import type { ReactNode } from 'react'
import type { MdxFile, PageMapItem } from 'nextra'

type Dated = { route: string; path: ReactNode[]; title: ReactNode; date: string }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Turns a frontmatter date like 2025-10-27 into 27 Oct 2025.
export function fmt(date: string) {
    const [y, m, d] = date.split('-')
    return `${d} ${MONTHS[+m - 1]} ${y}`
}

function walk(items: PageMapItem[], path: ReactNode[] = []): Dated[] {
    const meta = items.find(i => 'data' in i)
    const titles = meta && 'data' in meta ? meta.data : {}
    const title = (name: string): ReactNode => {
        const m = titles[name]
        return (typeof m === 'object' ? m.title : m) ?? name
    }
    return items.flatMap((i): Dated[] => {
        if ('data' in i) return []
        const name = title(i.name)
        // A folder's asIndexPage page is merged into the folder, so it carries the date.
        const date = (i as MdxFile).frontMatter?.updated
        const own = date ? [{ route: i.route, path, title: name, date }] : []
        return 'children' in i ? [...own, ...walk(i.children, [...path, name])] : own
    })
}

// Every page with an `updated` date among these items and beneath them, newest first.
export function dated(items: PageMapItem[] = []) {
    return walk(items).sort((a, b) => b.date.localeCompare(a.date))
}
