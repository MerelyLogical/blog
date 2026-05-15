'use client';

import { ChangeEvent, Fragment, useMemo, useState } from 'react';

const STRING_COUNT = 6;
const FRET_COUNT = 12;

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 960;
const LEFT = 48;
const RIGHT = 272;
const TOP = 76;
const BOTTOM = 904;

const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT_NOTES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const SHARP_NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const KEY_OPTIONS = [
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
];
const SCALE_MODES = {
    major: {
        label: 'Major',
        intervals: [0, 2, 4, 5, 7, 9, 11],
    },
    minor: {
        label: 'Minor',
        intervals: [0, 2, 3, 5, 7, 8, 10],
    },
};
type ScaleMode = keyof typeof SCALE_MODES;
const TUNINGS = [
    { id: 'standard', label: 'Standard', openStrings: [40, 45, 50, 55, 59, 64] },
    { id: 'drop-d', label: 'Drop D', openStrings: [38, 45, 50, 55, 59, 64] },
];
type TuningId = typeof TUNINGS[number]['id'];

const strings = Array.from({ length: STRING_COUNT }, (_, index) => index);
const frets = Array.from({ length: FRET_COUNT + 1 }, (_, index) => index);

function getPitchClass(midi: number) {
    return midi % 12;
}

function getOctave(midi: number) {
    return Math.floor(midi / 12) - 1;
}

export default function Fretboard() {
    const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());
    const [selectedTuningId, setSelectedTuningId] = useState<TuningId>('standard');
    const [selectedKeyLabel, setSelectedKeyLabel] = useState('E');
    const [scaleMode, setScaleMode] = useState<ScaleMode>('major');
    const [selectedDegrees, setSelectedDegrees] = useState<Set<number>>(new Set());
    const stringGap = (RIGHT - LEFT) / (STRING_COUNT - 1);
    const fretGap = (BOTTOM - TOP) / FRET_COUNT;
    const scaleIntervals = SCALE_MODES[scaleMode].intervals;
    const selectedKeyOption = KEY_OPTIONS.find((key) => key.label === selectedKeyLabel)
        ?? KEY_OPTIONS[0];
    const selectedKeyIndex = KEY_OPTIONS.indexOf(selectedKeyOption);
    const selectedKey = selectedKeyOption.pitchClass;
    const selectedScaleNoteLabels = selectedKeyOption[scaleMode];
    const selectedTuning = TUNINGS.find((tuning) => tuning.id === selectedTuningId)
        ?? TUNINGS[0];
    const noteLabels = useMemo(() => {
        const cIndex = KEY_OPTIONS.findIndex((key) => key.label === 'C');
        const labels = selectedKeyIndex < cIndex ? [...FLAT_NOTES] : [...SHARP_NOTES];

        scaleIntervals.forEach((interval, degree) => {
            labels[(selectedKey + interval) % NOTES.length] = selectedScaleNoteLabels[degree];
        });

        return labels;
    }, [scaleIntervals, selectedKey, selectedKeyIndex, selectedScaleNoteLabels]);
    const selectedPitchClasses = useMemo(() => {
        const pitchClasses = new Set(selectedNotes);

        selectedDegrees.forEach((degree) => {
            pitchClasses.add((selectedKey + scaleIntervals[degree]) % NOTES.length);
        });

        return pitchClasses;
    }, [scaleIntervals, selectedDegrees, selectedKey, selectedNotes]);
    const selectedDegreeLabels = useMemo(() => {
        const labels = new Map<number, string>();

        selectedDegrees.forEach((degree) => {
            labels.set((selectedKey + scaleIntervals[degree]) % NOTES.length, String(degree + 1));
        });

        return labels;
    }, [scaleIntervals, selectedDegrees, selectedKey]);
    const controlRows = useMemo(() => {
        return Array.from({ length: NOTES.length }, (_, offset) => {
            const pitchClass = (selectedKey + offset) % NOTES.length;
            const degree = scaleIntervals.findIndex((interval) => interval === offset);

            return {
                pitchClass,
                degree: degree === -1 ? null : degree,
                note: noteLabels[pitchClass],
            };
        });
    }, [noteLabels, scaleIntervals, selectedKey]);
    const visibleNotes = useMemo(() => {
        return selectedTuning.openStrings.flatMap((openMidi, stringIndex) => {
            return frets.map((fret) => {
                const midi = openMidi + fret;
                return {
                    id: `${stringIndex}-${fret}`,
                    fret,
                    stringIndex,
                    note: NOTES[getPitchClass(midi)],
                    pitchClass: getPitchClass(midi),
                    octave: getOctave(midi),
                    label: selectedDegreeLabels.get(getPitchClass(midi)) ?? noteLabels[getPitchClass(midi)],
                    x: LEFT + stringIndex * stringGap,
                    y: fret === 0 ? TOP - 34 : TOP + (fret - 0.5) * fretGap,
                };
            });
        }).filter((note) => selectedPitchClasses.has(note.pitchClass));
    }, [fretGap, noteLabels, selectedDegreeLabels, selectedPitchClasses, selectedTuning, stringGap]);

    function toggleNote(pitchClass: number) {
        setSelectedNotes((previous) => {
            const next = new Set(previous);

            if (next.has(pitchClass)) {
                next.delete(pitchClass);
            } else {
                next.add(pitchClass);
            }

            return next;
        });
    }

    function toggleDegree(degree: number) {
        setSelectedDegrees((previous) => {
            const next = new Set(previous);

            if (next.has(degree)) {
                next.delete(degree);
            } else {
                next.add(degree);
            }

            return next;
        });
    }

    function handleKeyChange(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedKeyLabel(event.target.value);
    }

    function handleScaleModeChange(event: ChangeEvent<HTMLSelectElement>) {
        setScaleMode(event.target.value as ScaleMode);
    }

    function handleTuningChange(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedTuningId(event.target.value as TuningId);
    }

    return (
        <div className="fretboard-panel" aria-label="Guitar fretboard diagram">
            <svg
                className="fretboard-svg"
                viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                role="img"
                aria-labelledby="fretboard-title"
            >
                <title id="fretboard-title">Vertical guitar fretboard with six strings and twelve frets</title>
                <rect
                    className="fretboard-surface"
                    x={LEFT - 22}
                    y={TOP}
                    width={RIGHT - LEFT + 44}
                    height={BOTTOM - TOP}
                    rx="6"
                />
                {frets.map((fret) => {
                    const y = TOP + fret * fretGap;
                    return (
                        <line
                            key={fret}
                            className={fret === 0 ? 'fretboard-nut' : 'fretboard-fret'}
                            x1={LEFT - 22}
                            y1={y}
                            x2={RIGHT + 22}
                            y2={y}
                        />
                    );
                })}
                {strings.map((string) => {
                    const x = LEFT + string * stringGap;
                    return (
                        <line
                            key={string}
                            className="fretboard-string"
                            x1={x}
                            y1={TOP}
                            x2={x}
                            y2={BOTTOM}
                        />
                    );
                })}
                {visibleNotes.map((note) => (
                    <g key={note.id} className="fretboard-note-marker">
                        <circle
                            className="fretboard-note-dot"
                            cx={note.x}
                            cy={note.y}
                            r="13"
                        >
                            <title>{`${note.note}${note.octave}${note.fret === 0 ? ' open string' : ` fret ${note.fret}`}`}</title>
                        </circle>
                        <text
                            className="fretboard-note-label"
                            x={note.x}
                            y={note.y}
                            aria-hidden="true"
                        >
                            {note.label}
                        </text>
                    </g>
                ))}
            </svg>
            <div className="fretboard-control-panel">
                <div className="fretboard-control-group">
                    <h4 className="fretboard-control-title">Tuning</h4>
                    <div className="fretboard-select-row">
                        <label className="fretboard-key-select-label" htmlFor="fretboard-tuning">
                            Tuning
                            <select
                                id="fretboard-tuning"
                                className="app-input app-input--compact fretboard-key-select"
                                value={selectedTuningId}
                                onChange={handleTuningChange}
                            >
                                {TUNINGS.map((tuning) => (
                                    <option key={tuning.id} value={tuning.id}>
                                        {tuning.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>
                <div className="fretboard-control-group">
                    <h4 className="fretboard-control-title">Scale</h4>
                    <div className="fretboard-select-row">
                        <label className="fretboard-key-select-label" htmlFor="fretboard-key">
                            Key
                            <select
                                id="fretboard-key"
                                className="app-input app-input--compact fretboard-key-select"
                                value={selectedKeyLabel}
                                onChange={handleKeyChange}
                            >
                                {KEY_OPTIONS.map((key) => (
                                    <option key={key.label} value={key.label}>
                                        {key.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="fretboard-key-select-label" htmlFor="fretboard-mode">
                            Mode
                            <select
                                id="fretboard-mode"
                                className="app-input app-input--compact fretboard-key-select"
                                value={scaleMode}
                                onChange={handleScaleModeChange}
                            >
                                {Object.entries(SCALE_MODES).map(([mode, config]) => (
                                    <option key={mode} value={mode}>
                                        {config.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>
                <div className="fretboard-control-group" aria-label="Scale degrees and notes to show">
                    <h4 className="fretboard-control-title">Degrees / Notes</h4>
                    <div className="fretboard-aligned-controls">
                        <div className="fretboard-aligned-header">Degree</div>
                        <div className="fretboard-aligned-header">Note</div>
                        {controlRows.map((row) => (
                            <Fragment key={row.pitchClass}>
                                <div className="fretboard-aligned-cell">
                                    {row.degree === null ? (
                                        <span className="fretboard-degree-spacer" aria-hidden="true" />
                                    ) : (
                                        <label className="fretboard-note-toggle fretboard-note-toggle--aligned">
                                            <input
                                                type="checkbox"
                                                checked={selectedDegrees.has(row.degree)}
                                                onChange={() => toggleDegree(row.degree)}
                                            />
                                            <span>{row.degree + 1}</span>
                                        </label>
                                    )}
                                </div>
                                <div className="fretboard-aligned-cell">
                                    <label className="fretboard-note-toggle fretboard-note-toggle--aligned">
                                        <input
                                            type="checkbox"
                                            checked={selectedNotes.has(row.pitchClass)}
                                            onChange={() => toggleNote(row.pitchClass)}
                                        />
                                        <span>{row.note}</span>
                                    </label>
                                </div>
                            </Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
