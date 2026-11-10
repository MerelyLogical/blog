import { NAMES } from './data';

// Names link to the English Wikipedia page of the same name, or of their species
// for plants. These are the exceptions, with null for names that have no page.
const WIKI: Record<string, string | null> = {
    'Rosa':          'Rose',
    'Nasturtium':    'Nasturtium (plant genus)',
    'Erica':         'Erica (plant)',
    'Brassica rapa': 'Pak choi',
    'Allium cepa':   'Scallion',
};

function url(lang: string, page: string) {
    return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.replaceAll(' ', '_'))}`;
}

// A name's Chinese and Japanese labels, with each language's Wikipedia page.
export function labels(name: string) {
    const label = NAMES[name];
    const page = name in WIKI ? WIKI[name] : name;
    const zhPage = label?.zhPage === null ? undefined : label?.zhPage ?? label?.zh;
    return {
        ja: label?.kanji ?? label?.ja,
        zh: label?.zh,
        kana: label?.kanji ? label.ja : undefined,
        wiki: page ? url('en', page) : undefined,
        jaWiki: label?.page ? url('ja', label.page) : undefined,
        zhWiki: zhPage ? url('zh', zhPage) : undefined,
    };
}
