export const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;

const FLAT_NOTES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const SHARP_NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const NOTE_COUNT = NOTES.length;

type ScaleNoteLabels = readonly [string, string, string, string, string, string, string];

export type KeyOption = {
    label: string;
    pitchClass: number;
    major: ScaleNoteLabels;
    minor: ScaleNoteLabels;
};

export const KEY_OPTIONS = [
    { label: 'C♭', pitchClass: 11, major: ['C♭', 'D♭', 'E♭', 'F♭', 'G♭', 'A♭', 'B♭'], minor: ['C♭', 'D♭', 'E𝄫', 'F♭', 'G♭', 'A𝄫', 'B𝄫'] },
    { label: 'G♭', pitchClass: 6, major: ['G♭', 'A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F'], minor: ['G♭', 'A♭', 'B𝄫', 'C♭', 'D♭', 'E𝄫', 'F♭'] },
    { label: 'D♭', pitchClass: 1, major: ['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C'], minor: ['D♭', 'E♭', 'F♭', 'G♭', 'A♭', 'B𝄫', 'C♭'] },
    { label: 'A♭', pitchClass: 8, major: ['A♭', 'B♭', 'C', 'D♭', 'E♭', 'F', 'G'], minor: ['A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F♭', 'G♭'] },
    { label: 'E♭', pitchClass: 3, major: ['E♭', 'F', 'G', 'A♭', 'B♭', 'C', 'D'], minor: ['E♭', 'F', 'G♭', 'A♭', 'B♭', 'C♭', 'D♭'] },
    { label: 'B♭', pitchClass: 10, major: ['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A'], minor: ['B♭', 'C', 'D♭', 'E♭', 'F', 'G♭', 'A♭'] },
    { label: 'F', pitchClass: 5, major: ['F', 'G', 'A', 'B♭', 'C', 'D', 'E'], minor: ['F', 'G', 'A♭', 'B♭', 'C', 'D♭', 'E♭'] },
    { label: 'C', pitchClass: 0, major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], minor: ['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B♭'] },
    { label: 'G', pitchClass: 7, major: ['G', 'A', 'B', 'C', 'D', 'E', 'F♯'], minor: ['G', 'A', 'B♭', 'C', 'D', 'E♭', 'F'] },
    { label: 'D', pitchClass: 2, major: ['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯'], minor: ['D', 'E', 'F', 'G', 'A', 'B♭', 'C'] },
    { label: 'A', pitchClass: 9, major: ['A', 'B', 'C♯', 'D', 'E', 'F♯', 'G♯'], minor: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
    { label: 'E', pitchClass: 4, major: ['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D♯'], minor: ['E', 'F♯', 'G', 'A', 'B', 'C', 'D'] },
    { label: 'B', pitchClass: 11, major: ['B', 'C♯', 'D♯', 'E', 'F♯', 'G♯', 'A♯'], minor: ['B', 'C♯', 'D', 'E', 'F♯', 'G', 'A'] },
    { label: 'F♯', pitchClass: 6, major: ['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯'], minor: ['F♯', 'G♯', 'A', 'B', 'C♯', 'D', 'E'] },
    { label: 'C♯', pitchClass: 1, major: ['C♯', 'D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B♯'], minor: ['C♯', 'D♯', 'E', 'F♯', 'G♯', 'A', 'B'] },
] as const satisfies readonly KeyOption[];

export type KeyLabel = typeof KEY_OPTIONS[number]['label'];

export const SCALE_MODES = {
    major: {
        label: 'Major',
        intervals: [0, 2, 4, 5, 7, 9, 11],
    },
    minor: {
        label: 'Minor',
        intervals: [0, 2, 3, 5, 7, 8, 10],
    },
} as const;

export type ScaleMode = keyof typeof SCALE_MODES;

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
    return midi % NOTE_COUNT;
}

export function getOctave(midi: number) {
    return Math.floor(midi / 12) - 1;
}

export function getScalePitchClass(rootPitchClass: number, interval: number) {
    return (rootPitchClass + interval) % NOTE_COUNT;
}

export function getNoteLabels(keyOption: KeyOption, keyIndex: number, scaleMode: ScaleMode) {
    const cIndex = KEY_OPTIONS.findIndex((key) => key.label === 'C');
    const labels = keyIndex < cIndex ? [...FLAT_NOTES] : [...SHARP_NOTES];
    const scaleIntervals = SCALE_MODES[scaleMode].intervals;
    const scaleNoteLabels = keyOption[scaleMode];

    scaleIntervals.forEach((interval, degree) => {
        labels[getScalePitchClass(keyOption.pitchClass, interval)] = scaleNoteLabels[degree];
    });

    return labels;
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
