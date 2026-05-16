'use client';

import { ChangeEvent, Fragment, useMemo, useState } from 'react';
import {
    chordOffsets,
    DEGREE_LABELS,
    KEYS,
    noteChordAnalyses,
    octave,
    pc,
    PITCH_CLASS_COUNT,
    QUALITIES,
    romanLabel,
    scalePc,
    TUNINGS,
    toggleSet,
} from './music';
import type { KeyLabel, NoteChordAnalysis, QualityId, TuningId } from './music';

const EMPTY = '-';
const STRING_COUNT = 6;
const FRET_COUNT = 12;

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 960;
const LEFT = 68;
const RIGHT = 252;
const TOP = 76;
const BOTTOM = 904;

const strings = Array.from({ length: STRING_COUNT }, (_, index) => index);
const frets = Array.from({ length: FRET_COUNT + 1 }, (_, index) => index);
const capoFrets = Array.from({ length: 8 }, (_, index) => index);
const baseQualityIds: readonly QualityId[] = ['major', 'minor', 'dim', 'aug', 'sus2', 'sus4', '6', 'm6', 'add9'];
const seventhQualityIds: readonly QualityId[] = ['7', 'maj7', 'min7', 'minmaj7', 'dim7', 'm7b5', '9', 'M9', 'm9'];
const baseQualities = baseQualityIds.map((id) => QUALITIES.find((quality) => quality.id === id) ?? QUALITIES[0]);
const seventhQualities = seventhQualityIds.map((id) => QUALITIES.find((quality) => quality.id === id) ?? QUALITIES[0]);

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

type FormattedChordAnalysis = {
    roman: string;
    sup: string | null;
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
    const [selectedCapoFret, setSelectedCapoFret] = useState(0);
    const [selectedKeyLabel, setSelectedKeyLabel] = useState<KeyLabel>('C/a');
    const [selectedDegrees, setSelectedDegrees] = useState<Set<number>>(new Set());
    const [isBuildingChord, setIsBuildingChord] = useState(false);
    const [buildRoot, setBuildRoot] = useState<BuildRoot | null>(null);
    const [buildQuality, setBuildQuality] = useState<QualityId | null>(null);
    const stringGap = (RIGHT - LEFT) / (STRING_COUNT - 1);
    const visibleScaleRatio = 1 - 1 / (2 ** (FRET_COUNT / 12));
    const scaleLen = (BOTTOM - TOP) / visibleScaleRatio;
    const selectedKeyOption = KEYS.find((key) => key.label === selectedKeyLabel)
        ?? KEYS[0];
    const selectedKey = selectedKeyOption.pitchClass;
    const selectedTuning = TUNINGS.find((tuning) => tuning.id === selectedTuningId)
        ?? TUNINGS[0];
    const noteLabels = selectedKeyOption.noteLabels;
    const capoY = fretY(selectedCapoFret);
    const selectedPitchClasses = useMemo(() => {
        const pitchClasses = new Set(selectedNotes);

        selectedDegrees.forEach((degree) => {
            pitchClasses.add(scalePc(selectedKey, degree));
        });

        return pitchClasses;
    }, [selectedDegrees, selectedKey, selectedNotes]);
    const chordAnalyses = useMemo(() => {
        function formatAnalysis(analysis: NoteChordAnalysis): FormattedChordAnalysis {
            const quality = QUALITIES.find((option) => option.id === analysis.qualityId)
                ?? QUALITIES[0];
            const rootOffset = scalePc(analysis.rootPitchClass, -selectedKey);

            return {
                roman: romanLabel(rootOffset, quality.romanCase),
                sup: quality.sup,
                note: `${noteLabels[analysis.rootPitchClass]}${quality.suffix}`,
            };
        }

        return noteChordAnalyses(selectedPitchClasses).map(formatAnalysis);
    }, [noteLabels, selectedKey, selectedPitchClasses]);
    const selectedDegreeLabels = useMemo(() => {
        const labels = new Map<number, string>();

        selectedDegrees.forEach((degree) => {
            labels.set(scalePc(selectedKey, degree), DEGREE_LABELS[degree]);
        });

        return labels;
    }, [selectedDegrees, selectedKey]);
    const controlRows = useMemo<ControlRow[]>(() => {
        return Array.from({ length: PITCH_CLASS_COUNT }, (_, offset) => {
            const pitchClass = scalePc(selectedKey, offset);

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
                const pitchClass = pc(midi);
                const degree = scalePc(pitchClass, -selectedKey);

                return {
                    id: `${stringIndex}-${fret}`,
                    fret,
                    note: noteLabels[pitchClass],
                    pitchClass,
                    degree,
                    octave: octave(midi),
                    label: selectedDegreeLabels.get(pitchClass) ?? noteLabels[pitchClass],
                    x: LEFT + stringIndex * stringGap,
                    y: noteY(fret),
                };
            });
        });
    }, [noteLabels, scaleLen, selectedDegreeLabels, selectedKey, selectedTuning, stringGap]);
    const visibleNotes = useMemo<FretboardNote[]>(() => {
        return fretboardPositions.filter((note) => selectedPitchClasses.has(note.pitchClass));
    }, [fretboardPositions, selectedPitchClasses]);

    function toggleNote(pitchClass: number) {
        if (isBuildingChord) {
            const nextRoot: BuildRoot = { source: 'note', value: pitchClass };

            setBuildRoot(nextRoot);
            setSelectedNotes(new Set([pitchClass]));
            setSelectedDegrees(new Set());
            finishChord(nextRoot, buildQuality);
            return;
        }

        setSelectedNotes((previous) => toggleSet(previous, pitchClass));
    }

    function toggleDegree(degree: number) {
        if (isBuildingChord) {
            const nextRoot: BuildRoot = { source: 'degree', value: degree };

            setBuildRoot(nextRoot);
            setSelectedDegrees(new Set([degree]));
            setSelectedNotes(new Set());
            finishChord(nextRoot, buildQuality);
            return;
        }

        setSelectedDegrees((previous) => toggleSet(previous, degree));
    }

    function changeKey(event: ChangeEvent<HTMLSelectElement>) {
        const nextKeyOption = KEYS.find((key) => key.label === event.target.value);

        if (!nextKeyOption) {
            return;
        }

        setBuildRoot((previous) => {
            if (!previous || previous.source !== 'degree') {
                return previous;
            }

            const pitchClass = scalePc(selectedKey, previous.value);

            return {
                ...previous,
                value: scalePc(pitchClass, -nextKeyOption.pitchClass),
            };
        });
        setSelectedDegrees((previous) => {
            return new Set(Array.from(previous, (degree) => {
                const pitchClass = scalePc(selectedKey, degree);

                return scalePc(pitchClass, -nextKeyOption.pitchClass);
            }));
        });
        setSelectedKeyLabel(nextKeyOption.label);
    }

    function changeTuning(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedTuningId(event.target.value as TuningId);
    }

    function changeCapo(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedCapoFret(Number(event.target.value));
    }

    function fretY(fret: number) {
        return TOP + scaleLen * (1 - 1 / (2 ** (fret / 12)));
    }

    function noteY(fret: number) {
        if (fret === 0) {
            return TOP - 34;
        }

        return (fretY(fret - 1) + fretY(fret)) / 2;
    }

    function finishChord(root: BuildRoot | null, quality: QualityId | null) {
        if (!root || !quality) {
            return;
        }

        if (root.source === 'degree') {
            setSelectedDegrees(new Set(chordOffsets(root.value, quality)));
        } else {
            setSelectedNotes(new Set(chordOffsets(root.value, quality)));
        }

        setIsBuildingChord(false);
        setBuildRoot(null);
        setBuildQuality(null);
    }

    function chooseQuality(quality: QualityId) {
        if (!isBuildingChord) {
            return;
        }

        setBuildQuality(quality);
        finishChord(buildRoot, quality);
    }

    function startChord() {
        setIsBuildingChord(true);
        setBuildRoot(null);
        setBuildQuality(null);
        setSelectedDegrees(new Set());
        setSelectedNotes(new Set());
    }

    function clear() {
        setSelectedDegrees(new Set());
        setSelectedNotes(new Set());
        setIsBuildingChord(false);
        setBuildRoot(null);
        setBuildQuality(null);
    }

    function renderAnalysis() {
        if (chordAnalyses.length === 0) {
            return EMPTY;
        }

        return chordAnalyses.map((analysis, index) => (
            <div className="fretboard-chord-analysis-row" key={`${analysis.roman}-${analysis.note}-${index}`}>
                <span className="fretboard-chord-analysis-roman">
                    {analysis.roman}
                    {analysis.sup && <sup>{analysis.sup}</sup>}
                </span>
                <span className="fretboard-chord-analysis-note">{analysis.note}</span>
            </div>
        ));
    }

    function renderRoot() {
        if (!isBuildingChord) {
            return null;
        }

        if (!buildRoot) {
            return EMPTY;
        }

        if (buildRoot.source === 'degree') {
            return DEGREE_LABELS[buildRoot.value];
        }

        return noteLabels[buildRoot.value];
    }

    function renderQuality() {
        if (!isBuildingChord || !buildQuality) {
            return EMPTY;
        }

        return QUALITIES.find((quality) => quality.id === buildQuality)?.label ?? EMPTY;
    }

    function degreeToggle(degree: number) {
        return (
            <TogglePill
                label={DEGREE_LABELS[degree]}
                checked={selectedDegrees.has(degree)}
                onToggle={() => toggleDegree(degree)}
            />
        );
    }

    function qualityToggle(quality: typeof QUALITIES[number]) {
        return (
            <button
                className={`fretboard-quality-toggle${buildQuality === quality.id ? ' fretboard-quality-toggle--selected' : ''}`}
                type="button"
                onClick={() => chooseQuality(quality.id)}
            >
                {quality.label}
            </button>
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
                    const y = fretY(fret);
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
                {selectedCapoFret > 0 && (
                    <g className="fretboard-capo-marker" aria-label={`Capo at fret ${selectedCapoFret}`}>
                        <rect
                            className="fretboard-capo-bar"
                            x={LEFT - 30}
                            y={capoY - 8}
                            width={RIGHT - LEFT + 60}
                            height="16"
                            rx="8"
                        />
                        <text
                            className="fretboard-capo-label"
                            x={LEFT - 36}
                            y={capoY}
                        >
                            {selectedCapoFret}
                        </text>
                    </g>
                )}
                {fretboardPositions.map((position) => (
                    <circle
                        key={position.id}
                        className="fretboard-click-target"
                        cx={position.x}
                        cy={position.y}
                        r="13"
                        role="button"
                        tabIndex={0}
                        aria-label={`Toggle degree ${DEGREE_LABELS[position.degree]} at ${position.note}${position.octave}${position.fret === 0 ? ' open string' : ` fret ${position.fret}`}`}
                        onClick={() => toggleDegree(position.degree)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                toggleDegree(position.degree);
                            }
                        }}
                    >
                        <title>{`Toggle degree ${DEGREE_LABELS[position.degree]}`}</title>
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
                                onChange={changeTuning}
                            >
                                {TUNINGS.map((tuning) => (
                                    <option key={tuning.id} value={tuning.id}>
                                        {tuning.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="fretboard-key-select-label" htmlFor="fretboard-capo">
                            Capo
                            <select
                                id="fretboard-capo"
                                className="app-input app-input--compact fretboard-key-select"
                                value={selectedCapoFret}
                                onChange={changeCapo}
                            >
                                {capoFrets.map((fret) => (
                                    <option key={fret} value={fret}>
                                        {fret === 0 ? 'None' : fret}
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
                                onChange={changeKey}
                            >
                                {KEYS.map((key) => (
                                    <option key={key.label} value={key.label}>
                                        {key.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>
                <div className="fretboard-control-group" aria-label="Scale degrees and notes to show">
                    <div className={`fretboard-aligned-controls${isBuildingChord ? ' fretboard-aligned-controls--building' : ''}`}>
                        <div className="fretboard-aligned-header">Degree</div>
                        <div className="fretboard-aligned-header">Note</div>
                        {isBuildingChord && <div className="fretboard-aligned-header">Quality</div>}
                        {isBuildingChord && <div className="fretboard-aligned-header">7th</div>}
                        {controlRows.map((row) => (
                            <Fragment key={row.pitchClass}>
                                <div className="fretboard-aligned-cell">
                                    {degreeToggle(row.degree)}
                                </div>
                                <div className="fretboard-aligned-cell">
                                    <TogglePill
                                        label={row.note}
                                        checked={selectedNotes.has(row.pitchClass)}
                                        onToggle={() => toggleNote(row.pitchClass)}
                                    />
                                </div>
                                {isBuildingChord && (
                                    <div className="fretboard-aligned-cell">
                                        {baseQualities[row.degree] ? qualityToggle(baseQualities[row.degree]) : null}
                                    </div>
                                )}
                                {isBuildingChord && (
                                    <div className="fretboard-aligned-cell">
                                        {seventhQualities[row.degree] ? qualityToggle(seventhQualities[row.degree]) : null}
                                    </div>
                                )}
                            </Fragment>
                        ))}
                    </div>
                    <div className="fretboard-select-row">
                        <button
                            className="app-button app-button--compact fretboard-clear-button"
                            type="button"
                            onClick={startChord}
                        >
                            Build Chord
                        </button>
                        <button
                            className="app-button app-button--compact fretboard-clear-button"
                            type="button"
                            onClick={clear}
                        >
                            Clear
                        </button>
                    </div>
                    {isBuildingChord && (
                        <div className="fretboard-build-status">
                            Root: {renderRoot()} · Quality: {renderQuality()}
                        </div>
                    )}
                    <div className="fretboard-chord-analysis" aria-live="polite">
                        <span className="fretboard-chord-analysis-label">Chord:</span>
                        <div className="fretboard-chord-analysis-list">
                            {renderAnalysis()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
