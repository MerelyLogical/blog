export type Plant = {
    name: string;
    cl1: string;
    cl2?: string;
    cl3?: string;
    ord: string;
    fam: string;
    sp: string;
    full: string;
};

export const PLANTS: Plant[] = [
    { name: 'Peter',  cl1: 'Asterids', cl2: 'Core Asterids', cl3: 'Campanulids', ord: 'Asterales',   fam: 'Asteraceae',  sp: 'Achillea ptarmica',    full: "Achillea ptarmica 'Peter Cottontail'"               },
    { name: 'Curry',  cl1: 'Asterids', cl2: 'Core Asterids', cl3: 'Campanulids', ord: 'Asterales',   fam: 'Asteraceae',  sp: 'Helichrysum italicum', full: 'Helichrysum italicum'                               },
    { name: 'Spirit', cl1: 'Asterids', cl2: 'Core Asterids', cl3: 'Campanulids', ord: 'Dipsacales',  fam: 'Viburnaceae', sp: 'Viburnum tinus',       full: "Viburnum tinus 'Anvi' (trade: SPIRIT)"              },
    { name: 'Winkle', cl1: 'Asterids', cl2: 'Core Asterids', cl3: 'Lamiids',     ord: 'Gentianales', fam: 'Apocynaceae', sp: 'Vinca minor',          full: "Vinca minor f. alba 'Gertrude Jekyll'"              },
    { name: 'Erica',  cl1: 'Asterids',                                           ord: 'Ericales',    fam: 'Ericaceae',   sp: 'Erica × darleyensis',  full: "Erica × darleyensis f. aureifolia 'Golden Perfect'" },
];
