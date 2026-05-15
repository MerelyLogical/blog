export const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;

const NOTE_COUNT = NOTES.length;
const ROOT_DEGREE_OFFSETS = [0, 2, 4, 5, 7, 9, 11] as const;

export const CHROMATIC_NOTE_LABELS = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;
export const CHROMATIC_DEGREE_LABELS = ['1', '♯1', '2', '♭3', '3', '4', '♯4', '5', '♭6', '6', '♭7', '7'] as const;
export const CHROMATIC_ROMAN_LABELS = ['I', '♯I', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'] as const;

export type KeyOption = {
    label: string;
    pitchClass: number;
};

export const KEY_OPTIONS = [
    { label: 'C♭', pitchClass: 11 },
    { label: 'G♭', pitchClass: 6 },
    { label: 'D♭', pitchClass: 1 },
    { label: 'A♭', pitchClass: 8 },
    { label: 'E♭', pitchClass: 3 },
    { label: 'B♭', pitchClass: 10 },
    { label: 'F', pitchClass: 5 },
    { label: 'C', pitchClass: 0 },
    { label: 'G', pitchClass: 7 },
    { label: 'D', pitchClass: 2 },
    { label: 'A', pitchClass: 9 },
    { label: 'E', pitchClass: 4 },
    { label: 'B', pitchClass: 11 },
    { label: 'F♯', pitchClass: 6 },
    { label: 'C♯', pitchClass: 1 },
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
    { id: 'major', label: 'Major', intervals: [0, 4, 7] },
    { id: 'minor', label: 'Minor', intervals: [0, 3, 7] },
    { id: 'dim', label: 'Dim', intervals: [0, 3, 6] },
    { id: 'aug', label: 'Aug', intervals: [0, 4, 8] },
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
    return ((midi % NOTE_COUNT) + NOTE_COUNT) % NOTE_COUNT;
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

    CHROMATIC_NOTE_LABELS.forEach((_, rootPitchClass) => {
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

export function getNoteLabels() {
    return [...CHROMATIC_NOTE_LABELS];
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
