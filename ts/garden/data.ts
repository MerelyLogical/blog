export type Plant = {
    name: string;
    cl1: string;
    cl2: string;
    cl3?: string;
    cl4?: string;
    ord: string;
    fam: string;
    gen: string;
    sp: string;
    full: string;
};

// Clade relationships and order/family pairs checked against APG V (2026),
// Figure 1 and Appendix A: https://doi.org/10.1111/jse.70096 (4 November 2026).
// This is a pruned tree of the garden's plants, with intervening clades omitted.
// Species and cultivar names are checked separately against Kew POWO and RHS.
export const PLANTS: Plant[] = [
    { name: 'Peter',             cl1: 'Angiosperms', cl2: 'Eudicots', cl3: 'Asterids', cl4: 'Campanulids', ord: 'Asterales',   fam: 'Asteraceae',     gen: 'Achillea',    sp: 'Achillea ptarmica',    full: "Achillea ptarmica 'Peter Cottontail'"               },
    { name: 'Curry',             cl1: 'Angiosperms', cl2: 'Eudicots', cl3: 'Asterids', cl4: 'Campanulids', ord: 'Asterales',   fam: 'Asteraceae',     gen: 'Helichrysum', sp: 'Helichrysum italicum', full: 'Helichrysum italicum'                               },
    { name: 'Spirit',            cl1: 'Angiosperms', cl2: 'Eudicots', cl3: 'Asterids', cl4: 'Campanulids', ord: 'Dipsacales',  fam: 'Viburnaceae',    gen: 'Viburnum',    sp: 'Viburnum tinus',       full: "Viburnum tinus Spirit = 'Anvi'"                     },
    { name: 'Winkle',            cl1: 'Angiosperms', cl2: 'Eudicots', cl3: 'Asterids', cl4: 'Lamiids',     ord: 'Gentianales', fam: 'Apocynaceae',    gen: 'Vinca',       sp: 'Vinca minor',          full: "Vinca minor f. alba 'Gertrude Jekyll'"              },
    { name: 'Erica',             cl1: 'Angiosperms', cl2: 'Eudicots', cl3: 'Asterids',                     ord: 'Ericales',    fam: 'Ericaceae',      gen: 'Erica',       sp: 'Erica × darleyensis',  full: "Erica × darleyensis f. aureifolia 'Golden Perfect'" },
    { name: 'Pak choi',          cl1: 'Angiosperms', cl2: 'Eudicots', cl3: 'Rosids',   cl4: 'Malvids',     ord: 'Brassicales', fam: 'Brassicaceae',   gen: 'Brassica',    sp: 'Brassica rapa',        full: 'Brassica rapa subsp. chinensis'                     },
    { name: 'Alpine strawberry', cl1: 'Angiosperms', cl2: 'Eudicots', cl3: 'Rosids',   cl4: 'Fabids',      ord: 'Rosales',     fam: 'Rosaceae',       gen: 'Fragaria',    sp: 'Fragaria vesca',       full: 'Fragaria vesca'                                     },
    { name: 'Garlic',            cl1: 'Angiosperms', cl2: 'Monocots',                                      ord: 'Asparagales', fam: 'Amaryllidaceae', gen: 'Allium',      sp: 'Allium sativum',       full: 'Allium sativum'                                     },
    { name: 'Spring onion',      cl1: 'Angiosperms', cl2: 'Monocots',                                      ord: 'Asparagales', fam: 'Amaryllidaceae', gen: 'Allium',      sp: 'Allium cepa',          full: 'Allium cepa'                                        },
    { name: 'Welsh onion',       cl1: 'Angiosperms', cl2: 'Monocots',                                      ord: 'Asparagales', fam: 'Amaryllidaceae', gen: 'Allium',      sp: 'Allium fistulosum',    full: 'Allium fistulosum'                                  },
];

// Clade/order translations checked against the Japanese and Chinese APG V pages:
// https://ja.wikipedia.org/wiki/APG_V
// https://zh.wikipedia.org/zh-cn/被子植物APG_V分类法
// Short Chinese clade labels omit the final 植物.
// Established Japanese and Chinese names, with optional kanji spellings.
// Omit labels that only transliterate the scientific species name.
// Keyed by English name, or by species for plants, though plant labels follow the
// English name since a species can have many. Omit page / set zhPage to
// null when there is no article; different titles may still name the same taxon.
type Name = { ja?: string; kanji?: string; page?: string; zh?: string; zhPage?: string | null };

export const NAMES: Record<string, Name | undefined> = {
    'Angiosperms':          { ja: '被子植物',                                            page: '被子植物',             zh: '被子植物'          },
    'Eudicots':             { ja: '真正双子葉類',                                        page: '真正双子葉類',         zh: '真双子叶植物'      },
    'Monocots':             { ja: '単子葉類',                                            page: '単子葉植物',           zh: '单子叶植物'        },
    'Asterids':             { ja: 'キク類',                     kanji: '菊類',           page: 'キク類',               zh: '菊类'          },
    'Rosids':               { ja: 'バラ類',                     kanji: '薔薇類',         page: 'バラ類',               zh: '蔷薇类'        },
    'Campanulids':          { ja: 'キキョウ類',                 kanji: '桔梗類',         page: 'キキョウ類',           zh: '桔梗类'        },
    'Lamiids':              { ja: 'シソ類',                     kanji: '紫蘇類',         page: 'シソ類',               zh: '唇形类'        },
    'Malvids':              { ja: 'アオイ類',                   kanji: '葵類',           page: 'アオイ類',             zh: '锦葵类'        },
    'Fabids':               { ja: 'マメ類',                     kanji: '豆類',                                         zh: '豆类',         zhPage: '豆类植物' },
    'Asterales':            { ja: 'キク目',                     kanji: '菊目',           page: 'キク目',               zh: '菊目'              },
    'Dipsacales':           { ja: 'マツムシソウ目',             kanji: '松虫草目',       page: 'マツムシソウ目',       zh: '川续断目'          },
    'Gentianales':          { ja: 'リンドウ目',                 kanji: '竜胆目',         page: 'リンドウ目',           zh: '龙胆目'            },
    'Ericales':             { ja: 'ツツジ目',                   kanji: '躑躅目',         page: 'ツツジ目',             zh: '杜鹃花目'          },
    'Brassicales':          { ja: 'アブラナ目',                 kanji: '油菜目',         page: 'アブラナ目',           zh: '十字花目'          },
    'Rosales':              { ja: 'バラ目',                     kanji: '薔薇目',         page: 'バラ目',               zh: '蔷薇目'            },
    'Asparagales':          { ja: 'キジカクシ目',               kanji: '雉隠目',         page: 'キジカクシ目',         zh: '天门冬目'          },
    'Asteraceae':           { ja: 'キク科',                     kanji: '菊科',           page: 'キク科',               zh: '菊科'              },
    'Viburnaceae':          { ja: 'ガマズミ科',                 kanji: '莢蒾科',         page: 'ガマズミ科',           zh: '荚蒾科',           zhPage: '五福花科' },
    'Apocynaceae':          { ja: 'キョウチクトウ科',           kanji: '夾竹桃科',       page: 'キョウチクトウ科',     zh: '夹竹桃科'          },
    'Ericaceae':            { ja: 'ツツジ科',                   kanji: '躑躅科',         page: 'ツツジ科',             zh: '杜鹃花科'          },
    'Brassicaceae':         { ja: 'アブラナ科',                 kanji: '油菜科',         page: 'アブラナ科',           zh: '十字花科'          },
    'Rosaceae':             { ja: 'バラ科',                     kanji: '薔薇科',         page: 'バラ科',               zh: '蔷薇科'            },
    'Amaryllidaceae':       { ja: 'ヒガンバナ科',               kanji: '彼岸花科',       page: 'ヒガンバナ科',         zh: '石蒜科'            },
    'Achillea':             { ja: 'ノコギリソウ属',             kanji: '鋸草属',         page: 'ノコギリソウ属',       zh: '蓍属'              },
    'Helichrysum':          { ja: 'ムギワラギク属',               kanji: '麦藁菊属',       page: 'ヘリクリサム属',       zh: '拟蜡菊属'          },
    'Viburnum':             { ja: 'ガマズミ属',                 kanji: '莢蒾属',         page: 'ガマズミ属',           zh: '荚蒾属'            },
    'Vinca':                { ja: 'ツルニチニチソウ属',         kanji: '蔓日々草属',     page: 'ツルニチニチソウ',     zh: '蔓长春花属'        },
    'Erica':                { ja: 'エリカ属',                                            page: 'エリカ属',             zh: '欧石南属'          },
    'Brassica':             { ja: 'アブラナ属',                 kanji: '油菜属',         page: 'アブラナ属',           zh: '芸薹属'            },
    'Fragaria':             { ja: 'オランダイチゴ属',           kanji: '和蘭苺属',       page: 'オランダイチゴ属',     zh: '草莓属'            },
    'Allium':               { ja: 'ネギ属',                     kanji: '葱属',           page: 'ネギ属',               zh: '葱属'              },
    'Achillea ptarmica':    {                                                                                     zh: '珠蓍',             zhPage: null },
    'Helichrysum italicum': { ja: 'カレープラント',                                      page: 'カレープラント',       zh: '意大利永久花',     zhPage: null },
    'Viburnum tinus':       {                                                                                     zh: '地中海荚蒾',       zhPage: null },
    'Vinca minor':          { ja: 'ヒメツルニチニチソウ',       kanji: '姫蔓日々草',                           zh: '小蔓长春花'        },
    // Parentage description, rather than an established Chinese hybrid name.
    'Erica × darleyensis':  { zh: '冬石南 × 爱尔兰欧石南', zhPage: null },
    'Brassica rapa':        { ja: 'チンゲンサイ',               kanji: '青梗菜',         page: 'チンゲンサイ',         zh: '青菜'            },
    'Fragaria vesca':       { ja: 'エゾヘビイチゴ',             kanji: '蝦夷蛇苺',                                     zh: '野草莓'            },
    'Allium sativum':       { ja: 'ニンニク',                   kanji: '大蒜',           page: 'ニンニク',             zh: '大蒜'              },
    'Allium cepa':          { ja: 'アオネギ',                   kanji: '青葱',                                              zh: '青葱',             zhPage: null },
    'Allium fistulosum':    { ja: 'ネギ',                       kanji: '葱',             page: 'ネギ',                 zh: '葱'                },
};
