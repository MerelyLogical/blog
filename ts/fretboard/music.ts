export const PITCH_CLASS_COUNT = 12;

export const DEGREE_LABELS = ['1', '♯1', '2', '♭3', '3', '4', '♯4', '5', '♭6', '6', '♭7', '7'] as const;
export const ROMAN_LABELS = ['I', '♯I', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'] as const;

export type NoteLabels = readonly [
    string, string, string, string, string, string,
    string, string, string, string, string, string,
];

export type KeyOption = {
    label: string;
    pitchClass: number;
    noteLabels: NoteLabels;
};

type NoteLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

const SPELLINGS = [
    { scaleIndex: 0, accidentalOffset: 0 },
    { scaleIndex: 0, accidentalOffset: +1 },
    { scaleIndex: 1, accidentalOffset: 0 },
    { scaleIndex: 2, accidentalOffset: -1 },
    { scaleIndex: 2, accidentalOffset: 0 },
    { scaleIndex: 3, accidentalOffset: 0 },
    { scaleIndex: 3, accidentalOffset: +1 },
    { scaleIndex: 4, accidentalOffset: 0 },
    { scaleIndex: 5, accidentalOffset: -1 },
    { scaleIndex: 5, accidentalOffset: 0 },
    { scaleIndex: 6, accidentalOffset: -1 },
    { scaleIndex: 6, accidentalOffset: 0 },
] as const;

function parseNote(note: string) {
    const letter = note[0] as NoteLetter;
    let accidentalOffset = 0;

    for (const accidental of Array.from(note.slice(1))) {
        if (accidental === '♯') {
            accidentalOffset += 1;
        } else if (accidental === '♭') {
            accidentalOffset -= 1;
        } else if (accidental === '𝄪') {
            accidentalOffset += 2;
        } else if (accidental === '𝄫') {
            accidentalOffset -= 2;
        }
    }

    return { letter, accidentalOffset };
}

const ACCIDENTALS: Record<number, string> = {
    [-2]: '𝄫',
    [-1]: '♭',
    0: '',
    1: '♯',
    2: '𝄪',
};

function noteName(letter: NoteLetter, accidentalOffset: number) {
    return `${letter}${ACCIDENTALS[accidentalOffset] ?? ''}`;
}

function alterNote(note: string, accidentalOffset: number) {
    const parsed = parseNote(note);

    return noteName(parsed.letter, parsed.accidentalOffset + accidentalOffset);
}

function buildNoteLabels(tonicPitchClass: number, majorScale: readonly string[]): NoteLabels {
    const noteLabels: [
        string, string, string, string, string, string,
        string, string, string, string, string, string,
    ] = ['', '', '', '', '', '', '', '', '', '', '', ''];

    SPELLINGS.forEach((spelling, offset) => {
        const pitchClass = pc(tonicPitchClass + offset);

        noteLabels[pitchClass] = alterNote(
            majorScale[spelling.scaleIndex],
            spelling.accidentalOffset,
        );
    });

    return noteLabels;
}

export const KEYS = [
    { label: 'C♭/a♭', pitchClass: 11, noteLabels: buildNoteLabels(11, ['C♭', 'D♭', 'E♭', 'F♭', 'G♭', 'A♭', 'B♭']) },
    { label: 'G♭/e♭', pitchClass: 6,  noteLabels: buildNoteLabels(6,  ['G♭', 'A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F']) },
    { label: 'D♭/b♭', pitchClass: 1,  noteLabels: buildNoteLabels(1,  ['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C']) },
    { label: 'A♭/f',  pitchClass: 8,  noteLabels: buildNoteLabels(8,  ['A♭', 'B♭', 'C', 'D♭', 'E♭', 'F', 'G']) },
    { label: 'E♭/c',  pitchClass: 3,  noteLabels: buildNoteLabels(3,  ['E♭', 'F', 'G', 'A♭', 'B♭', 'C', 'D']) },
    { label: 'B♭/g',  pitchClass: 10, noteLabels: buildNoteLabels(10, ['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A']) },
    { label: 'F/d',   pitchClass: 5,  noteLabels: buildNoteLabels(5,  ['F', 'G', 'A', 'B♭', 'C', 'D', 'E']) },
    { label: 'C/a',   pitchClass: 0,  noteLabels: buildNoteLabels(0,  ['C', 'D', 'E', 'F', 'G', 'A', 'B']) },
    { label: 'G/e',   pitchClass: 7,  noteLabels: buildNoteLabels(7,  ['G', 'A', 'B', 'C', 'D', 'E', 'F♯']) },
    { label: 'D/b',   pitchClass: 2,  noteLabels: buildNoteLabels(2,  ['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯']) },
    { label: 'A/f♯',  pitchClass: 9,  noteLabels: buildNoteLabels(9,  ['A', 'B', 'C♯', 'D', 'E', 'F♯', 'G♯']) },
    { label: 'E/c♯',  pitchClass: 4,  noteLabels: buildNoteLabels(4,  ['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D♯']) },
    { label: 'B/g♯',  pitchClass: 11, noteLabels: buildNoteLabels(11, ['B', 'C♯', 'D♯', 'E', 'F♯', 'G♯', 'A♯']) },
    { label: 'F♯/d♯', pitchClass: 6,  noteLabels: buildNoteLabels(6,  ['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯']) },
    { label: 'C♯/a♯', pitchClass: 1,  noteLabels: buildNoteLabels(1,  ['C♯', 'D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B♯']) },
] as const satisfies readonly KeyOption[];

export type KeyLabel = typeof KEYS[number]['label'];

export function keyByLabel(label: KeyLabel) {
    return KEYS.find((key) => key.label === label) ?? KEYS[0];
}

export const QUALITIES = [
    { id: 'major',   label: 'major', suffix: '',      sup: null,   romanCase: 'upper', intervals: [0, 4, 7] },
    { id: 'minor',   label: 'minor', suffix: 'm',     sup: null,   romanCase: 'lower', intervals: [0, 3, 7] },
    { id: 'dim',     label: 'dim',   suffix: 'dim',   sup: 'o',    romanCase: 'lower', intervals: [0, 3, 6] },
    { id: 'aug',     label: 'aug',   suffix: 'aug',   sup: '+',    romanCase: 'upper', intervals: [0, 4, 8] },
    { id: 'sus2',    label: 'sus2',  suffix: 'sus2',  sup: 'sus2', romanCase: 'upper', intervals: [0, 2, 7] },
    { id: 'sus4',    label: 'sus4',  suffix: 'sus4',  sup: 'sus4', romanCase: 'upper', intervals: [0, 5, 7] },
    { id: '6',       label: '6',     suffix: '6',     sup: '6',    romanCase: 'upper', intervals: [0, 4, 7, 9] },
    { id: 'm6',      label: 'm6',    suffix: 'm6',    sup: '6',    romanCase: 'lower', intervals: [0, 3, 7, 9] },
    { id: '7',       label: '7',     suffix: '7',     sup: '7',    romanCase: 'upper', intervals: [0, 4, 7, 10], matches: [[0, 4, 7, 10], [0, 4, 10]] },
    { id: 'maj7',    label: 'M7',    suffix: 'M7',    sup: '∆7',   romanCase: 'upper', intervals: [0, 4, 7, 11], matches: [[0, 4, 7, 11], [0, 4, 11]] },
    { id: 'min7',    label: 'm7',    suffix: 'm7',    sup: '7',    romanCase: 'lower', intervals: [0, 3, 7, 10], matches: [[0, 3, 7, 10], [0, 3, 10]] },
    { id: 'minmaj7', label: 'mM7',   suffix: 'mM7',   sup: '∆7',   romanCase: 'lower', intervals: [0, 3, 7, 11], matches: [[0, 3, 7, 11], [0, 3, 11]] },
    { id: 'dim7',    label: 'dim7',  suffix: 'dim7',  sup: 'o7',   romanCase: 'lower', intervals: [0, 3, 6, 9] },
    { id: 'm7b5',    label: 'm7♭5',  suffix: 'm7♭5',  sup: 'ø7',   romanCase: 'lower', intervals: [0, 3, 6, 10] },
    { id: 'add9',    label: 'add9',  suffix: 'add9',  sup: 'add9', romanCase: 'upper', intervals: [0, 2, 4, 7] },
    { id: '9',       label: '9',     suffix: '9',     sup: '9',    romanCase: 'upper', intervals: [0, 2, 4, 7, 10], matches: [[0, 2, 4, 7, 10], [0, 2, 4, 10]] },
    { id: 'M9',      label: 'M9',    suffix: 'M9',    sup: '∆9',   romanCase: 'upper', intervals: [0, 2, 4, 7, 11], matches: [[0, 2, 4, 7, 11], [0, 2, 4, 11]] },
    { id: 'm9',      label: 'm9',    suffix: 'm9',    sup: '9',    romanCase: 'lower', intervals: [0, 2, 3, 7, 10], matches: [[0, 2, 3, 7, 10], [0, 2, 3, 10]] },
] as const;

export type QualityId = typeof QUALITIES[number]['id'];

export function qualityById(id: QualityId) {
    return QUALITIES.find((quality) => quality.id === id) ?? QUALITIES[0];
}

export type NoteChordAnalysis = {
    rootPitchClass: number;
    qualityId: QualityId;
};

export type Tuning = {
    id: string;
    label: string;
    openStrings: readonly number[];
};

export const TUNINGS = [
    { id: 'standard', label: 'Standard', openStrings: [40, 45, 50, 55, 59, 64] },
    { id: 'drop-d',   label: 'Drop D',   openStrings: [38, 45, 50, 55, 59, 64] },
] as const satisfies readonly Tuning[];

export type TuningId = typeof TUNINGS[number]['id'];

export function tuningById(id: TuningId) {
    return TUNINGS.find((tuning) => tuning.id === id) ?? TUNINGS[0];
}

export function pc(midi: number) {
    return ((midi % PITCH_CLASS_COUNT) + PITCH_CLASS_COUNT) % PITCH_CLASS_COUNT;
}

export function octave(midi: number) {
    return Math.floor(midi / 12) - 1;
}

export function scalePc(rootPitchClass: number, interval: number) {
    return pc(rootPitchClass + interval);
}

export function chordOffsets(rootOffset: number, qualityId: QualityId) {
    return qualityById(qualityId).intervals.map((interval) => scalePc(rootOffset, interval));
}

export function romanLabel(rootOffset: number, romanCase: 'lower' | 'upper') {
    const roman = ROMAN_LABELS[rootOffset];
    const accidentalMatch = roman.match(/^[♯♭]+/)?.[0] ?? '';
    const numeral = roman.slice(accidentalMatch.length);

    if (romanCase === 'lower') {
        return `${accidentalMatch}${numeral.toLowerCase()}`;
    }

    return roman;
}

function intervalSets(quality: typeof QUALITIES[number]) {
    return 'matches' in quality ? quality.matches : [quality.intervals];
}

function intervalPcs(rootPitchClass: number, intervals: readonly number[]) {
    return intervals.map((interval) => scalePc(rootPitchClass, interval));
}

function samePcs(
    selectedPitchClasses: ReadonlySet<number>,
    pitchClasses: readonly number[],
) {
    return pitchClasses.length === selectedPitchClasses.size
        && pitchClasses.every((pitchClass) => selectedPitchClasses.has(pitchClass));
}

export function noteChordAnalyses(selectedPitchClasses: ReadonlySet<number>): NoteChordAnalysis[] {
    const matches: NoteChordAnalysis[] = [];

    for (let rootPitchClass = 0; rootPitchClass < PITCH_CLASS_COUNT; rootPitchClass += 1) {
        for (const quality of QUALITIES) {
            const sets = intervalSets(quality);
            const matchedIntervals = sets.find((intervals) => {
                return samePcs(
                    selectedPitchClasses,
                    intervalPcs(rootPitchClass, intervals),
                );
            });

            if (matchedIntervals) {
                matches.push({
                    rootPitchClass,
                    qualityId: quality.id,
                });
            }
        }
    }

    return matches;
}

export function toggleSet<T>(previous: ReadonlySet<T>, value: T) {
    const next = new Set(previous);

    if (next.has(value)) {
        next.delete(value);
    } else {
        next.add(value);
    }

    return next;
}
