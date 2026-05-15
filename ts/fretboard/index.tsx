'use client';

import { ChangeEvent, Fragment, useMemo, useState } from 'react';
import {
    CHROMATIC_DEGREE_LABELS,
    CHROMATIC_ROMAN_LABELS,
    CHORD_QUALITIES,
    getChordOffsets,
    getDegreeChordAnalyses,
    getNoteLabels,
    getNoteChordAnalyses,
    getOctave,
    getPitchClass,
    getScalePitchClass,
    isChordQualityId,
    NOTES,
    KEY_OPTIONS,
    TUNINGS,
    toggleSetValue,
} from './music';
import type { ChordQualityId, KeyLabel, TuningId } from './music';

const EMPTY_CHORD_VALUE = '-';
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
    degree: number;
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

type FretboardPosition = FretboardNote & {
    degree: number;
};

type ChordAnalysisDisplay = {
    rootOffset: number;
    rootPitchClass: number;
    qualityId: ChordQualityId;
};

type FormattedChordAnalysis = {
    roman: string;
    romanSuperscript: string | null;
    note: string;
};

type BuildRoot = {
    source: 'degree' | 'note';
    value: number;
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
    const [selectedDegrees, setSelectedDegrees] = useState<Set<number>>(new Set());
    const [isBuildingChord, setIsBuildingChord] = useState(false);
    const [buildRoot, setBuildRoot] = useState<BuildRoot | null>(null);
    const stringGap = (RIGHT - LEFT) / (STRING_COUNT - 1);
    const fretGap = (BOTTOM - TOP) / FRET_COUNT;
    const selectedKeyOption = KEY_OPTIONS.find((key) => key.label === selectedKeyLabel)
        ?? KEY_OPTIONS[0];
    const selectedKey = selectedKeyOption.pitchClass;
    const selectedTuning = TUNINGS.find((tuning) => tuning.id === selectedTuningId)
        ?? TUNINGS[0];
    const noteLabels = useMemo(() => {
        return getNoteLabels();
    }, []);
    const chordAnalyses = useMemo(() => {
        function getRomanLabel(rootOffset: number, qualityId: ChordQualityId) {
            const romanLabel = CHROMATIC_ROMAN_LABELS[rootOffset];
            const accidentalMatch = romanLabel.match(/^[♯♭]+/)?.[0] ?? '';
            const numeral = romanLabel.slice(accidentalMatch.length);

            if (qualityId === 'minor' || qualityId === 'dim') {
                return `${accidentalMatch}${numeral.toLowerCase()}`;
            }

            return romanLabel;
        }

        function formatAnalysis(analysis: ChordAnalysisDisplay): FormattedChordAnalysis {
            const noteSuffixes: Record<ChordQualityId, string> = {
                major: 'maj',
                minor: 'min',
                aug: 'aug',
                dim: 'dim',
            };
            const romanSuperscripts: Record<ChordQualityId, string | null> = {
                major: null,
                minor: null,
                aug: '+',
                dim: 'o',
            };

            return {
                roman: getRomanLabel(analysis.rootOffset, analysis.qualityId),
                romanSuperscript: romanSuperscripts[analysis.qualityId],
                note: `${noteLabels[analysis.rootPitchClass]}${noteSuffixes[analysis.qualityId]}`,
            };
        }
        const degreeAnalyses = getDegreeChordAnalyses(selectedDegrees).map((analysis) => {
            return formatAnalysis({
                rootOffset: analysis.rootOffset,
                rootPitchClass: getScalePitchClass(selectedKey, analysis.rootOffset),
                qualityId: analysis.qualityId,
            });
        });
        const noteAnalyses = getNoteChordAnalyses(selectedNotes).map((analysis) => {
            return formatAnalysis({
                rootOffset: getScalePitchClass(analysis.rootPitchClass, -selectedKey),
                rootPitchClass: analysis.rootPitchClass,
                qualityId: analysis.qualityId,
            });
        });

        return [...degreeAnalyses, ...noteAnalyses];
    }, [noteLabels, selectedDegrees, selectedKey, selectedNotes]);
    const selectedPitchClasses = useMemo(() => {
        const pitchClasses = new Set(selectedNotes);

        selectedDegrees.forEach((degree) => {
            pitchClasses.add(getScalePitchClass(selectedKey, degree));
        });

        return pitchClasses;
    }, [selectedDegrees, selectedKey, selectedNotes]);
    const selectedDegreeLabels = useMemo(() => {
        const labels = new Map<number, string>();

        selectedDegrees.forEach((degree) => {
            labels.set(getScalePitchClass(selectedKey, degree), CHROMATIC_DEGREE_LABELS[degree]);
        });

        return labels;
    }, [selectedDegrees, selectedKey]);
    const controlRows = useMemo<ControlRow[]>(() => {
        return Array.from({ length: NOTES.length }, (_, offset) => {
            const pitchClass = getScalePitchClass(selectedKey, offset);

            return {
                pitchClass,
                degree: offset,
                note: noteLabels[pitchClass],
            };
        });
    }, [noteLabels, selectedKey]);
    const fretboardPositions = useMemo<FretboardPosition[]>(() => {
        return selectedTuning.openStrings.flatMap((openMidi, stringIndex) => {
            return frets.map((fret) => {
                const midi = openMidi + fret;
                const pitchClass = getPitchClass(midi);
                const degree = getScalePitchClass(pitchClass, -selectedKey);

                return {
                    id: `${stringIndex}-${fret}`,
                    fret,
                    note: NOTES[pitchClass],
                    pitchClass,
                    degree,
                    octave: getOctave(midi),
                    label: selectedDegreeLabels.get(pitchClass) ?? noteLabels[pitchClass],
                    x: LEFT + stringIndex * stringGap,
                    y: fret === 0 ? TOP - 34 : TOP + (fret - 0.5) * fretGap,
                };
            });
        });
    }, [fretGap, noteLabels, selectedDegreeLabels, selectedKey, selectedTuning, stringGap]);
    const visibleNotes = useMemo<FretboardNote[]>(() => {
        return fretboardPositions.filter((note) => selectedPitchClasses.has(note.pitchClass));
    }, [fretboardPositions, selectedPitchClasses]);

    function toggleNote(pitchClass: number) {
        if (isBuildingChord) {
            setBuildRoot({ source: 'note', value: pitchClass });
            setSelectedNotes(new Set([pitchClass]));
            setSelectedDegrees(new Set());
            return;
        }

        setSelectedNotes((previous) => toggleSetValue(previous, pitchClass));
    }

    function toggleDegree(degree: number) {
        if (isBuildingChord) {
            setBuildRoot({ source: 'degree', value: degree });
            setSelectedDegrees(new Set([degree]));
            setSelectedNotes(new Set());
            return;
        }

        setSelectedDegrees((previous) => toggleSetValue(previous, degree));
    }

    function handleKeyChange(event: ChangeEvent<HTMLSelectElement>) {
        const nextKeyOption = KEY_OPTIONS.find((key) => key.label === event.target.value);

        if (!nextKeyOption) {
            return;
        }

        setBuildRoot((previous) => {
            if (!previous || previous.source !== 'degree') {
                return previous;
            }

            const pitchClass = getScalePitchClass(selectedKey, previous.value);

            return {
                ...previous,
                value: getScalePitchClass(pitchClass, -nextKeyOption.pitchClass),
            };
        });
        setSelectedDegrees((previous) => {
            return new Set(Array.from(previous, (degree) => {
                const pitchClass = getScalePitchClass(selectedKey, degree);

                return getScalePitchClass(pitchClass, -nextKeyOption.pitchClass);
            }));
        });
        setSelectedKeyLabel(nextKeyOption.label);
    }

    function handleTuningChange(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedTuningId(event.target.value as TuningId);
    }

    function handleChordQualityChange(event: ChangeEvent<HTMLSelectElement>) {
        if (event.target.value === EMPTY_CHORD_VALUE) {
            return;
        }

        if (!isChordQualityId(event.target.value)) {
            return;
        }

        if (!isBuildingChord || !buildRoot) {
            return;
        }

        if (buildRoot.source === 'degree') {
            setSelectedDegrees(new Set(getChordOffsets(buildRoot.value, event.target.value)));
        } else {
            setSelectedNotes(new Set(getChordOffsets(buildRoot.value, event.target.value)));
        }

        setIsBuildingChord(false);
        setBuildRoot(null);
    }

    function startBuildChord() {
        setIsBuildingChord(true);
        setBuildRoot(null);
        setSelectedDegrees(new Set());
        setSelectedNotes(new Set());
    }

    function clearSelections() {
        setSelectedDegrees(new Set());
        setSelectedNotes(new Set());
        setIsBuildingChord(false);
        setBuildRoot(null);
    }

    function renderChordAnalysis() {
        if (chordAnalyses.length === 0) {
            return EMPTY_CHORD_VALUE;
        }

        return chordAnalyses.map((analysis, index) => (
            <Fragment key={`${analysis.roman}-${analysis.note}-${index}`}>
                {index > 0 && ', '}
                <span>
                    {analysis.roman}
                    {analysis.romanSuperscript && <sup>{analysis.romanSuperscript}</sup>}
                    {' / '}
                    {analysis.note}
                </span>
            </Fragment>
        ));
    }

    function renderBuildRoot() {
        if (!isBuildingChord) {
            return null;
        }

        if (!buildRoot) {
            return EMPTY_CHORD_VALUE;
        }

        if (buildRoot.source === 'degree') {
            return CHROMATIC_DEGREE_LABELS[buildRoot.value];
        }

        return noteLabels[buildRoot.value];
    }

    function renderDegreeToggle(degree: number) {
        return (
            <TogglePill
                label={CHROMATIC_DEGREE_LABELS[degree]}
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
                {fretboardPositions.map((position) => (
                    <circle
                        key={position.id}
                        className="fretboard-click-target"
                        cx={position.x}
                        cy={position.y}
                        r="13"
                        role="button"
                        tabIndex={0}
                        aria-label={`Toggle degree ${CHROMATIC_DEGREE_LABELS[position.degree]} at ${position.note}${position.octave}${position.fret === 0 ? ' open string' : ` fret ${position.fret}`}`}
                        onClick={() => toggleDegree(position.degree)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                toggleDegree(position.degree);
                            }
                        }}
                    >
                        <title>{`Toggle degree ${CHROMATIC_DEGREE_LABELS[position.degree]}`}</title>
                    </circle>
                ))}
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
                    </div>
                </div>
                <div className="fretboard-control-group" aria-label="Scale degrees and notes to show">
                    <div className="fretboard-aligned-controls">
                        <div className="fretboard-aligned-header">Degree</div>
                        <div className="fretboard-aligned-header">Note</div>
                        {controlRows.map((row) => (
                            <Fragment key={row.pitchClass}>
                                <div className="fretboard-aligned-cell">
                                    {renderDegreeToggle(row.degree)}
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
                    <div className="fretboard-select-row">
                        <button
                            className="app-button app-button--compact fretboard-clear-button"
                            type="button"
                            onClick={startBuildChord}
                        >
                            Build Chord
                        </button>
                        {isBuildingChord && (
                            <>
                                <span className="fretboard-build-root">Root: {renderBuildRoot()}</span>
                                <label className="fretboard-key-select-label" htmlFor="fretboard-chord-quality">
                                    Quality
                                    <select
                                        id="fretboard-chord-quality"
                                        className="app-input app-input--compact fretboard-key-select"
                                        value={EMPTY_CHORD_VALUE}
                                        onChange={handleChordQualityChange}
                                    >
                                        <option value={EMPTY_CHORD_VALUE}>-</option>
                                        {CHORD_QUALITIES.map((quality) => (
                                            <option key={quality.id} value={quality.id}>
                                                {quality.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </>
                        )}
                        <button
                            className="app-button app-button--compact fretboard-clear-button"
                            type="button"
                            onClick={clearSelections}
                        >
                            Clear
                        </button>
                    </div>
                    <div className="fretboard-chord-analysis" aria-live="polite">
                        Chord: {renderChordAnalysis()}
                    </div>
                </div>
            </div>
        </div>
    );
}
