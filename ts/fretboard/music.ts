export const PITCH_CLASS_COUNT = 12;
const ROOT_DEGREE_OFFSETS = [0, 2, 4, 5, 7, 9, 11] as const;

export const CHROMATIC_DEGREE_LABELS = ['1', '♯1', '2', '♭3', '3', '4', '♯4', '5', '♭6', '6', '♭7', '7'] as const;
export const CHROMATIC_ROMAN_LABELS = ['I', '♯I', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'] as const;

export type NoteLabels = readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
];

export type KeyOption = {
    label: string;
    pitchClass: number;
    noteLabels: NoteLabels;
};

type NoteLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

const CHROMATIC_SCALE_SPELLING = [
    { scaleIndex: 0, accidentalOffset: 0 },
    { scaleIndex: 0, accidentalOffset: 1 },
    { scaleIndex: 1, accidentalOffset: 0 },
    { scaleIndex: 2, accidentalOffset: -1 },
    { scaleIndex: 2, accidentalOffset: 0 },
    { scaleIndex: 3, accidentalOffset: 0 },
    { scaleIndex: 3, accidentalOffset: 1 },
    { scaleIndex: 4, accidentalOffset: 0 },
    { scaleIndex: 5, accidentalOffset: -1 },
    { scaleIndex: 5, accidentalOffset: 0 },
    { scaleIndex: 6, accidentalOffset: -1 },
    { scaleIndex: 6, accidentalOffset: 0 },
] as const;

function parseScaleNote(note: string) {
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

function formatNote(letter: NoteLetter, accidentalOffset: number) {
    const accidentals: Record<number, string> = {
        [-2]: '𝄫',
        [-1]: '♭',
        0: '',
        1: '♯',
        2: '𝄪',
    };

    return `${letter}${accidentals[accidentalOffset] ?? ''}`;
}

function formatScaleAlteration(note: string, accidentalOffset: number) {
    const parsed = parseScaleNote(note);

    return formatNote(parsed.letter, parsed.accidentalOffset + accidentalOffset);
}

function buildKeyNoteLabels(tonicPitchClass: number, majorScale: readonly string[]): NoteLabels {
    const noteLabels: [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
    ] = ['', '', '', '', '', '', '', '', '', '', '', ''];

    CHROMATIC_SCALE_SPELLING.forEach((spelling, offset) => {
        const pitchClass = getPitchClass(tonicPitchClass + offset);

        noteLabels[pitchClass] = formatScaleAlteration(
            majorScale[spelling.scaleIndex],
            spelling.accidentalOffset,
        );
    });

    return noteLabels;
}

export const KEY_OPTIONS = [
    { label: 'C♭/a♭', pitchClass: 11, noteLabels: buildKeyNoteLabels(11, ['C♭', 'D♭', 'E♭', 'F♭', 'G♭', 'A♭', 'B♭']) },
    { label: 'G♭/e♭', pitchClass: 6, noteLabels: buildKeyNoteLabels(6, ['G♭', 'A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F']) },
    { label: 'D♭/b♭', pitchClass: 1, noteLabels: buildKeyNoteLabels(1, ['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C']) },
    { label: 'A♭/f', pitchClass: 8, noteLabels: buildKeyNoteLabels(8, ['A♭', 'B♭', 'C', 'D♭', 'E♭', 'F', 'G']) },
    { label: 'E♭/c', pitchClass: 3, noteLabels: buildKeyNoteLabels(3, ['E♭', 'F', 'G', 'A♭', 'B♭', 'C', 'D']) },
    { label: 'B♭/g', pitchClass: 10, noteLabels: buildKeyNoteLabels(10, ['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A']) },
    { label: 'F/d', pitchClass: 5, noteLabels: buildKeyNoteLabels(5, ['F', 'G', 'A', 'B♭', 'C', 'D', 'E']) },
    { label: 'C/a', pitchClass: 0, noteLabels: buildKeyNoteLabels(0, ['C', 'D', 'E', 'F', 'G', 'A', 'B']) },
    { label: 'G/e', pitchClass: 7, noteLabels: buildKeyNoteLabels(7, ['G', 'A', 'B', 'C', 'D', 'E', 'F♯']) },
    { label: 'D/b', pitchClass: 2, noteLabels: buildKeyNoteLabels(2, ['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯']) },
    { label: 'A/f♯', pitchClass: 9, noteLabels: buildKeyNoteLabels(9, ['A', 'B', 'C♯', 'D', 'E', 'F♯', 'G♯']) },
    { label: 'E/c♯', pitchClass: 4, noteLabels: buildKeyNoteLabels(4, ['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D♯']) },
    { label: 'B/g♯', pitchClass: 11, noteLabels: buildKeyNoteLabels(11, ['B', 'C♯', 'D♯', 'E', 'F♯', 'G♯', 'A♯']) },
    { label: 'F♯/d♯', pitchClass: 6, noteLabels: buildKeyNoteLabels(6, ['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯']) },
    { label: 'C♯/a♯', pitchClass: 1, noteLabels: buildKeyNoteLabels(1, ['C♯', 'D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B♯']) },
] as const satisfies readonly KeyOption[];

export type KeyLabel = typeof KEY_OPTIONS[number]['label'];

export const CHORD_ROOTS = [
    { id: '0', label: 'I', degreeOffset: ROOT_DEGREE_OFFSETS[0] },
    { id: '1', label: 'II', degreeOffset: ROOT_DEGREE_OFFSETS[1] },
    { id: '2', label: 'III', degreeOffset: ROOT_DEGREE_OFFSETS[2] },
    { id: '3', label: 'IV', degreeOffset: ROOT_DEGREE_OFFSETS[3] },
    { id: '4', label: 'V', degreeOffset: ROOT_DEGREE_OFFSETS[4] },
    { id: '5', label: 'VI', degreeOffset: ROOT_DEGREE_OFFSETS[5] },
    { id: '6', label: 'VII', degreeOffset: ROOT_DEGREE_OFFSETS[6] },
] as const;

export type ChordRootId = typeof CHORD_ROOTS[number]['id'];

export const CHORD_QUALITIES = [
    { id: 'major', label: 'Major', intervals: [0, 4, 7], noteSuffix: 'maj', romanSuperscript: null, romanNumeralCase: 'upper' },
    { id: 'minor', label: 'Minor', intervals: [0, 3, 7], noteSuffix: 'min', romanSuperscript: null, romanNumeralCase: 'lower' },
    { id: 'dim', label: 'Dim', intervals: [0, 3, 6], noteSuffix: 'dim', romanSuperscript: 'o', romanNumeralCase: 'lower' },
    { id: 'aug', label: 'Aug', intervals: [0, 4, 8], noteSuffix: 'aug', romanSuperscript: '+', romanNumeralCase: 'upper' },
    { id: 'sus2', label: 'Sus2', intervals: [0, 2, 7], noteSuffix: 'sus2', romanSuperscript: 'sus2', romanNumeralCase: 'upper' },
    { id: 'sus4', label: 'Sus4', intervals: [0, 5, 7], noteSuffix: 'sus4', romanSuperscript: 'sus4', romanNumeralCase: 'upper' },
] as const;

export type ChordQualityId = typeof CHORD_QUALITIES[number]['id'];

export type ChordSelection = {
    rootId: ChordRootId;
    qualityId: ChordQualityId;
    degrees: readonly [number, number, number];
};

export type DegreeChordAnalysis = ChordSelection & {
    rootOffset: number;
};

export type NoteChordAnalysis = {
    rootPitchClass: number;
    rootOffset: number;
    qualityId: ChordQualityId;
    pitchClasses: readonly [number, number, number];
};

export type Tuning = {
    id: string;
    label: string;
    openStrings: readonly number[];
};

export const TUNINGS = [
    { id: 'standard', label: 'Standard', openStrings: [40, 45, 50, 55, 59, 64] },
    { id: 'drop-d', label: 'Drop D', openStrings: [38, 45, 50, 55, 59, 64] },
] as const satisfies readonly Tuning[];

export type TuningId = typeof TUNINGS[number]['id'];

export function getPitchClass(midi: number) {
    return ((midi % PITCH_CLASS_COUNT) + PITCH_CLASS_COUNT) % PITCH_CLASS_COUNT;
}

export function getOctave(midi: number) {
    return Math.floor(midi / 12) - 1;
}

export function getScalePitchClass(rootPitchClass: number, interval: number) {
    return getPitchClass(rootPitchClass + interval);
}

export function getChordDegrees(rootId: ChordRootId, qualityId: ChordQualityId) {
    const root = CHORD_ROOTS.find((option) => option.id === rootId) ?? CHORD_ROOTS[0];

    return getChordOffsets(root.degreeOffset, qualityId);
}

export function getChordOffsets(rootOffset: number, qualityId: ChordQualityId) {
    const quality = CHORD_QUALITIES.find((option) => option.id === qualityId) ?? CHORD_QUALITIES[0];

    return [
        getScalePitchClass(rootOffset, quality.intervals[0]),
        getScalePitchClass(rootOffset, quality.intervals[1]),
        getScalePitchClass(rootOffset, quality.intervals[2]),
    ] as const;
}

export function getDegreeChordAnalyses(selectedDegrees: ReadonlySet<number>): DegreeChordAnalysis[] {
    if (selectedDegrees.size !== 3) {
        return [];
    }

    const matches: DegreeChordAnalysis[] = [];

    for (const root of CHORD_ROOTS) {
        for (const quality of CHORD_QUALITIES) {
            const degrees = getChordDegrees(root.id, quality.id);
            const matchesSelection = degrees.length === selectedDegrees.size
                && degrees.every((degree) => selectedDegrees.has(degree));

            if (matchesSelection) {
                matches.push({
                    rootId: root.id,
                    qualityId: quality.id,
                    rootOffset: root.degreeOffset,
                    degrees,
                });
            }
        }
    }

    return matches;
}

export function getNoteChordAnalyses(selectedPitchClasses: ReadonlySet<number>): NoteChordAnalysis[] {
    if (selectedPitchClasses.size !== 3) {
        return [];
    }

    const matches: NoteChordAnalysis[] = [];

    Array.from({ length: PITCH_CLASS_COUNT }, (_, rootPitchClass) => {
        for (const quality of CHORD_QUALITIES) {
            const pitchClasses = getChordOffsets(rootPitchClass, quality.id);
            const matchesSelection = pitchClasses.length === selectedPitchClasses.size
                && pitchClasses.every((pitchClass) => selectedPitchClasses.has(pitchClass));

            if (matchesSelection) {
                matches.push({
                    rootPitchClass,
                    rootOffset: rootPitchClass,
                    qualityId: quality.id,
                    pitchClasses,
                });
            }
        }
    });

    return matches;
}

export function isChordQualityId(value: string): value is ChordQualityId {
    return CHORD_QUALITIES.some((quality) => quality.id === value);
}

export function toggleSetValue<T>(previous: ReadonlySet<T>, value: T) {
    const next = new Set(previous);

    if (next.has(value)) {
        next.delete(value);
    } else {
        next.add(value);
    }

    return next;
}
