import { labels } from './wiki';
import './style.css';

function Link({ href, lang, title, children }: {
    href?: string; lang?: string; title?: string; children: React.ReactNode;
}) {
    return href
        ? <a href={href} lang={lang} title={title} target="_blank" rel="noreferrer">{children}</a>
        : <span lang={lang} title={title}>{children}</span>;
}

// A genus as the label of a log-style list entry: its scientific, Chinese and
// Japanese names in a column each, linking to their own Wikipedia. Missing names
// still get an empty cell, so the columns stay lined up.
export default function Gen({ n }: { n: string }) {
    const l = labels(n);
    return (
        <>
            <span className="app-label garden-gen">
                <Link href={l.wiki}><i>{n}</i></Link>
            </span>
            <span className="app-label garden-gen garden-gen-cjk">
                {l.zh && <Link href={l.zhWiki} lang="zh">{l.zh}</Link>}
            </span>
            <span className="app-label garden-gen garden-gen-cjk">
                {l.ja && <Link href={l.jaWiki} lang="ja" title={l.kana}>{l.ja}</Link>}
            </span>
        </>
    );
}
