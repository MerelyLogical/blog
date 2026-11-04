export type Plant = {
    name: string;
    cl1: string;
    cl2: string;
    cl3?: string;
    cl4?: string;
    cl5?: string;
    ord: string;
    fam: string;
    gen: string;
    sp: string;
    full: string;
};

export const PLANTS: Plant[] = [
    { name: 'Peter',    cl1: 'Angiosperms', cl2: 'Eudicots', cl3: 'Asterids', cl4: 'Core Asterids', cl5: 'Campanulids', ord: 'Asterales',   fam: 'Asteraceae',     gen: 'Achillea',    sp: 'Achillea ptarmica',    full: "Achillea ptarmica 'Peter Cottontail'"               },
    { name: 'Curry',    cl1: 'Angiosperms', cl2: 'Eudicots', cl3: 'Asterids', cl4: 'Core Asterids', cl5: 'Campanulids', ord: 'Asterales',   fam: 'Asteraceae',     gen: 'Helichrysum', sp: 'Helichrysum italicum', full: 'Helichrysum italicum'                               },
    { name: 'Spirit',   cl1: 'Angiosperms', cl2: 'Eudicots', cl3: 'Asterids', cl4: 'Core Asterids', cl5: 'Campanulids', ord: 'Dipsacales',  fam: 'Viburnaceae',    gen: 'Viburnum',    sp: 'Viburnum tinus',       full: "Viburnum tinus 'Anvi' (trade: SPIRIT)"              },
    { name: 'Winkle',   cl1: 'Angiosperms', cl2: 'Eudicots', cl3: 'Asterids', cl4: 'Core Asterids', cl5: 'Lamiids',     ord: 'Gentianales', fam: 'Apocynaceae',    gen: 'Vinca',       sp: 'Vinca minor',          full: "Vinca minor f. alba 'Gertrude Jekyll'"              },
    { name: 'Erica',    cl1: 'Angiosperms', cl2: 'Eudicots', cl3: 'Asterids',                                           ord: 'Ericales',    fam: 'Ericaceae',      gen: 'Erica',       sp: 'Erica × darleyensis',  full: "Erica × darleyensis f. aureifolia 'Golden Perfect'" },
    { name: 'Pak choi', cl1: 'Angiosperms', cl2: 'Eudicots', cl3: 'Rosids',   cl4: 'Malvids',                           ord: 'Brassicales', fam: 'Brassicaceae',   gen: 'Brassica',    sp: 'Brassica rapa',        full: 'Brassica rapa subsp. chinensis'                     },
    { name: 'Garlic',   cl1: 'Angiosperms', cl2: 'Monocots',                                                            ord: 'Asparagales', fam: 'Amaryllidaceae', gen: 'Allium',      sp: 'Allium sativum',       full: 'Allium sativum'                                     },
];
