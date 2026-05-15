'use client';

import { ChangeEvent, Fragment, useMemo, useState } from 'react';
import {
    getNoteLabels,
    getOctave,
    getPitchClass,
    getScalePitchClass,
    KEY_OPTIONS,
    NOTES,
    SCALE_MODES,
    TUNINGS,
    toggleSetValue,
} from './music';
import type { KeyLabel, ScaleMode, TuningId } from './music';

const STRING_COUNT = 6;
const FRET_COUNT = 12;

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 960;
const LEFT = 48;
const RIGHT = 272;
const TOP = 76;
const BOTTOM = 904;

const strings = Array.from({ length: STRING_COUNT }, (_, index) => index);
const frets = Array.from({ length: FRET_COUNT + 1 }, (_, index) => index);

type ControlRow = {
    pitchClass: number;
    degree: number | null;
    note: string;
};

type FretboardNote = {
    id: string;
    fret: number;
    note: string;
    pitchClass: number;
    octave: number;
    label: string;
    x: number;
    y: number;
};

function TogglePill({
    label,
    checked,
    onToggle,
}: {
    label: string | number;
    checked: boolean;
    onToggle: () => void;
}) {
    return (
        <label className="fretboard-note-toggle fretboard-note-toggle--aligned">
            <input
                type="checkbox"
                checked={checked}
                onChange={onToggle}
            />
            <span>{label}</span>
        </label>
    );
}

export default function Fretboard() {
    const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());
    const [selectedTuningId, setSelectedTuningId] = useState<TuningId>('standard');
    const [selectedKeyLabel, setSelectedKeyLabel] = useState<KeyLabel>('E');
    const [scaleMode, setScaleMode] = useState<ScaleMode>('major');
    const [selectedDegrees, setSelectedDegrees] = useState<Set<number>>(new Set());
    const stringGap = (RIGHT - LEFT) / (STRING_COUNT - 1);
    const fretGap = (BOTTOM - TOP) / FRET_COUNT;
    const scaleIntervals = SCALE_MODES[scaleMode].intervals;
    const selectedKeyOption = KEY_OPTIONS.find((key) => key.label === selectedKeyLabel)
        ?? KEY_OPTIONS[0];
    const selectedKeyIndex = KEY_OPTIONS.indexOf(selectedKeyOption);
    const selectedKey = selectedKeyOption.pitchClass;
    const selectedTuning = TUNINGS.find((tuning) => tuning.id === selectedTuningId)
        ?? TUNINGS[0];
    const noteLabels = useMemo(() => {
        return getNoteLabels(selectedKeyOption, selectedKeyIndex, scaleMode);
    }, [scaleMode, selectedKeyIndex, selectedKeyOption]);
    const selectedPitchClasses = useMemo(() => {
        const pitchClasses = new Set(selectedNotes);

        selectedDegrees.forEach((degree) => {
            pitchClasses.add(getScalePitchClass(selectedKey, scaleIntervals[degree]));
        });

        return pitchClasses;
    }, [scaleIntervals, selectedDegrees, selectedKey, selectedNotes]);
    const selectedDegreeLabels = useMemo(() => {
        const labels = new Map<number, string>();

        selectedDegrees.forEach((degree) => {
            labels.set(getScalePitchClass(selectedKey, scaleIntervals[degree]), String(degree + 1));
        });

        return labels;
    }, [scaleIntervals, selectedDegrees, selectedKey]);
    const controlRows = useMemo<ControlRow[]>(() => {
        return Array.from({ length: NOTES.length }, (_, offset) => {
            const pitchClass = getScalePitchClass(selectedKey, offset);
            const degree = scaleIntervals.findIndex((interval) => interval === offset);

            return {
                pitchClass,
                degree: degree === -1 ? null : degree,
                note: noteLabels[pitchClass],
            };
        });
    }, [noteLabels, scaleIntervals, selectedKey]);
    const visibleNotes = useMemo<FretboardNote[]>(() => {
        return selectedTuning.openStrings.flatMap((openMidi, stringIndex) => {
            return frets.map((fret) => {
                const midi = openMidi + fret;
                const pitchClass = getPitchClass(midi);

                return {
                    id: `${stringIndex}-${fret}`,
                    fret,
                    note: NOTES[pitchClass],
                    pitchClass,
                    octave: getOctave(midi),
                    label: selectedDegreeLabels.get(pitchClass) ?? noteLabels[pitchClass],
                    x: LEFT + stringIndex * stringGap,
                    y: fret === 0 ? TOP - 34 : TOP + (fret - 0.5) * fretGap,
                };
            });
        }).filter((note) => selectedPitchClasses.has(note.pitchClass));
    }, [fretGap, noteLabels, selectedDegreeLabels, selectedPitchClasses, selectedTuning, stringGap]);

    function toggleNote(pitchClass: number) {
        setSelectedNotes((previous) => toggleSetValue(previous, pitchClass));
    }

    function toggleDegree(degree: number) {
        setSelectedDegrees((previous) => toggleSetValue(previous, degree));
    }

    function handleKeyChange(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedKeyLabel(event.target.value as KeyLabel);
    }

    function handleScaleModeChange(event: ChangeEvent<HTMLSelectElement>) {
        setScaleMode(event.target.value as ScaleMode);
    }

    function handleTuningChange(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedTuningId(event.target.value as TuningId);
    }

    function renderDegreeToggle(degree: number) {
        return (
            <TogglePill
                label={degree + 1}
                checked={selectedDegrees.has(degree)}
                onToggle={() => toggleDegree(degree)}
            />
        );
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
                                        renderDegreeToggle(row.degree)
                                    )}
                                </div>
                                <div className="fretboard-aligned-cell">
                                    <TogglePill
                                        label={row.note}
                                        checked={selectedNotes.has(row.pitchClass)}
                                        onToggle={() => toggleNote(row.pitchClass)}
                                    />
                                </div>
                            </Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
