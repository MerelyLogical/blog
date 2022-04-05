function TET(n) {
    return Math.pow(2, (n - 49) / 12) * 440;
}

const freqlut = {
    '0': TET(22),
    '1': TET(24),
    '2': TET(26),
    '3': TET(29),
    '4': TET(31),
    '5': TET(34),
    '6': TET(36),
    '7': TET(38),
    '8': TET(41),
    '9': TET(43),
    'flag': TET(58),
    'rainbow': TET(60),
    '.': TET(62)
};
