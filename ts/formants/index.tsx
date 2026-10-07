'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'

import { Button } from '@/ts/ui/Button'

import './style.css'

type Formant = { hz: number; bw: number }
type Preset = { id: string; set: string; ipa: string; fs: Formant[]; glyph?: string }
type VowelSet = 'rp' | 'ga' | 'ja' | 'zh'
type PitchMode = 'free' | 'tet' | 'gong' | 'hirajoshi'
type Source = 'voice' | 'sawtooth' | 'square' | 'triangle' | 'noise' | 'sine'
type Voice = {
  ctx: AudioContext
  osc: OscillatorNode
  noise: AudioBufferSourceNode
  oscLevel: GainNode
  noiseLevel: GainNode
  tone: BiquadFilterNode
  filters: BiquadFilterNode[]
  levels: GainNode[]
  dry: GainNode
  master: GainNode
  analyser: AnalyserNode
}

const A2 = 110
const F_MIN = 80
const F_MAX = 5000
const MAP = { f1Min: 200, f1Max: 800, f2Min: 500, f2Max: 2500 }
const COLOURS = ['#ef4444', '#16a34a', '#2563eb']
const LEVELS = [1, 0.72, 0.5]
const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const FLATS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']

const RP_PRESETS: Preset[] = [
  { id: 'kit',     set: 'KIT',     ipa: 'ɪ',  fs: [{ hz: 340, bw: 65 }, { hz: 1990, bw: 95 }, { hz: 2550, bw: 150 }] },
  { id: 'dress',   set: 'DRESS',   ipa: 'e',  fs: [{ hz: 490, bw: 70 }, { hz: 1660, bw: 100 }, { hz: 2500, bw: 150 }] },
  { id: 'trap',    set: 'TRAP',    ipa: 'æ',  fs: [{ hz: 690, bw: 90 }, { hz: 1550, bw: 110 }, { hz: 2450, bw: 150 }] },
  { id: 'lot',     set: 'LOT/CLOTH', ipa: 'ɒ',  fs: [{ hz: 600, bw: 80 }, { hz: 990, bw: 100 }, { hz: 2400, bw: 150 }] },
  { id: 'strut',   set: 'STRUT',   ipa: 'ʌ',  fs: [{ hz: 600, bw: 80 }, { hz: 1300, bw: 100 }, { hz: 2400, bw: 150 }] },
  { id: 'foot',    set: 'FOOT',    ipa: 'ʊ',  fs: [{ hz: 360, bw: 65 }, { hz: 1170, bw: 90 }, { hz: 2350, bw: 150 }] },
  { id: 'fleece',  set: 'FLEECE',  ipa: 'iː', fs: [{ hz: 280, bw: 60 }, { hz: 2250, bw: 90 }, { hz: 3000, bw: 150 }] },
  { id: 'palm',    set: 'PALM/BATH/START', ipa: 'ɑː', fs: [{ hz: 680, bw: 90 }, { hz: 1010, bw: 110 }, { hz: 2400, bw: 150 }] },
  { id: 'thought', set: 'THOUGHT/NORTH/FORCE', ipa: 'ɔː', fs: [{ hz: 460, bw: 75 }, { hz: 740, bw: 100 }, { hz: 2400, bw: 150 }] },
  { id: 'goose',   set: 'GOOSE',   ipa: 'uː', fs: [{ hz: 300, bw: 60 }, { hz: 1120, bw: 90 }, { hz: 2400, bw: 150 }] },
  { id: 'nurse',   set: 'NURSE',   ipa: 'ɜː', fs: [{ hz: 490, bw: 75 }, { hz: 1350, bw: 100 }, { hz: 2350, bw: 150 }] },
  { id: 'comma',   set: 'COMMA/LETTER', ipa: 'ə',  fs: [{ hz: 500, bw: 80 }, { hz: 1500, bw: 110 }, { hz: 2500, bw: 150 }] },
]

const GA_PRESETS: Preset[] = [
  { id: 'kit',     set: 'KIT',     ipa: 'ɪ',  fs: [{ hz: 390, bw: 65 }, { hz: 1990, bw: 95 }, { hz: 2550, bw: 150 }] },
  { id: 'dress',   set: 'DRESS',   ipa: 'ɛ',  fs: [{ hz: 530, bw: 70 }, { hz: 1840, bw: 100 }, { hz: 2480, bw: 150 }] },
  { id: 'trap',    set: 'TRAP/BATH', ipa: 'æ', fs: [{ hz: 660, bw: 90 }, { hz: 1720, bw: 110 }, { hz: 2410, bw: 150 }] },
  { id: 'lot',     set: 'LOT/PALM', ipa: 'ɑ',  fs: [{ hz: 730, bw: 90 }, { hz: 1090, bw: 110 }, { hz: 2440, bw: 150 }] },
  { id: 'thought', set: 'CLOTH/THOUGHT', ipa: 'ɔ', fs: [{ hz: 570, bw: 80 }, { hz: 840, bw: 100 }, { hz: 2410, bw: 150 }] },
  { id: 'strut',   set: 'STRUT',   ipa: 'ʌ',  fs: [{ hz: 640, bw: 80 }, { hz: 1190, bw: 100 }, { hz: 2390, bw: 150 }] },
  { id: 'foot',    set: 'FOOT',    ipa: 'ʊ',  fs: [{ hz: 440, bw: 65 }, { hz: 1020, bw: 90 }, { hz: 2240, bw: 150 }] },
  { id: 'fleece',  set: 'FLEECE',  ipa: 'i',  fs: [{ hz: 270, bw: 60 }, { hz: 2290, bw: 90 }, { hz: 3010, bw: 150 }] },
  { id: 'goose',   set: 'GOOSE',   ipa: 'u',  fs: [{ hz: 300, bw: 60 }, { hz: 870, bw: 90 }, { hz: 2240, bw: 150 }] },
  { id: 'nurse',   set: 'NURSE',   ipa: 'ɝ',  fs: [{ hz: 490, bw: 75 }, { hz: 1350, bw: 100 }, { hz: 1690, bw: 140 }] },
  { id: 'comma',   set: 'COMMA',   ipa: 'ə',  fs: [{ hz: 500, bw: 80 }, { hz: 1500, bw: 110 }, { hz: 2500, bw: 150 }] },
  { id: 'letter',  set: 'LETTER',  ipa: 'ɚ',  fs: [{ hz: 500, bw: 80 }, { hz: 1500, bw: 110 }, { hz: 1700, bw: 140 }] },
]

const JA_PRESETS: Preset[] = [
  { id: 'a', set: 'A', glyph: 'あ', ipa: 'a', fs: [{ hz: 750, bw: 90 }, { hz: 1187, bw: 110 }, { hz: 2595, bw: 170 }] },
  { id: 'i', set: 'I', glyph: 'い', ipa: 'i', fs: [{ hz: 281, bw: 90 }, { hz: 2281, bw: 110 }, { hz: 3187, bw: 170 }] },
  { id: 'u', set: 'U', glyph: 'う', ipa: 'ɯ', fs: [{ hz: 312, bw: 90 }, { hz: 1219, bw: 110 }, { hz: 2469, bw: 170 }] },
  { id: 'e', set: 'E', glyph: 'え', ipa: 'e', fs: [{ hz: 469, bw: 90 }, { hz: 2031, bw: 110 }, { hz: 2687, bw: 170 }] },
  { id: 'o', set: 'O', glyph: 'お', ipa: 'o', fs: [{ hz: 468, bw: 90 }, { hz: 781, bw: 110 }, { hz: 2656, bw: 170 }] },
]

const ZH_PRESETS: Preset[] = [
  { id: 'a',  set: 'A',  glyph: '啊', ipa: 'a', fs: [{ hz: 795, bw: 80 }, { hz: 1168, bw: 110 }, { hz: 2945, bw: 170 }] },
  { id: 'o',  set: 'O',  glyph: '哦', ipa: 'o', fs: [{ hz: 532, bw: 80 }, { hz: 817,  bw: 110 }, { hz: 2949, bw: 170 }] },
  { id: 'e',  set: 'E',  glyph: '鹅', ipa: 'ɤ', fs: [{ hz: 501, bw: 80 }, { hz: 1163, bw: 110 }, { hz: 2736, bw: 170 }] },
  { id: 'eh', set: 'Ê',  glyph: '诶', ipa: 'ɛ', fs: [{ hz: 705, bw: 80 }, { hz: 1789, bw: 110 }, { hz: 2656, bw: 170 }] },
  { id: 'i',  set: 'YI', glyph: '衣', ipa: 'i', fs: [{ hz: 279, bw: 80 }, { hz: 2240, bw: 110 }, { hz: 3168, bw: 170 }] },
  { id: 'u',  set: 'WU', glyph: '乌', ipa: 'u', fs: [{ hz: 342, bw: 80 }, { hz: 701,  bw: 110 }, { hz: 2800, bw: 170 }] },
  { id: 'yu', set: 'YU', glyph: '迂', ipa: 'y', fs: [{ hz: 280, bw: 80 }, { hz: 1992, bw: 110 }, { hz: 2331, bw: 170 }] },
]

const SETS: Record<VowelSet, Preset[]> = { rp: RP_PRESETS, ga: GA_PRESETS, ja: JA_PRESETS, zh: ZH_PRESETS }

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function noteHz(note: number) {
  return 440 * 2 ** ((note - 69) / 12)
}

function noteName(note: number, flats = false) {
  return `${(flats ? FLATS : NOTES)[note % 12]}${Math.floor(note / 12) - 1}`
}

function toneHz(brightness: number) {
  return 2400 * 2 ** (brightness / 50)
}

function voiceWave(ctx: AudioContext, brightness: number) {
  const real = new Float32Array(65)
  const imag = new Float32Array(65)
  const slope = 2.35 - brightness * .0095
  for (let harmonic = 1; harmonic < imag.length; harmonic += 1) {
    imag[harmonic] = 1 / harmonic ** slope
  }
  return new PeriodicWave(ctx, { real, imag })
}

function noiseBuffer(ctx: AudioContext) {
  const buffer = new AudioBuffer({
    length: ctx.sampleRate * 2,
    numberOfChannels: 1,
    sampleRate: ctx.sampleRate,
  })
  const data = buffer.getChannelData(0)
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1
  return buffer
}

function scaleNotes(mode: PitchMode) {
  const pcs = mode === 'gong'
    ? [0, 2, 4, 7, 9]
    : mode === 'hirajoshi'
      ? [0, 2, 3, 7, 8]
      : undefined
  return Array.from({ length: 37 }, (_, index) => index + 33)
    .filter((note) => pcs === undefined || pcs.includes(note % 12))
}

function closestNote(notes: number[], hz: number) {
  const target = 69 + 12 * Math.log2(hz / 440)
  return notes.reduce((best, note) => (
    Math.abs(note - target) < Math.abs(best - target) ? note : best
  ), notes[0])
}

function mapX(f2: number) {
  return 28 + (MAP.f2Max - f2) / (MAP.f2Max - MAP.f2Min) * 264
}

function mapY(f1: number) {
  return 20 + (f1 - MAP.f1Min) / (MAP.f1Max - MAP.f1Min) * 180
}

function nearest(presets: Preset[], fs: Formant[]) {
  return presets.reduce((best, item) => {
    const dx = (item.fs[1].hz - fs[1].hz) / (MAP.f2Max - MAP.f2Min)
    const dy = (item.fs[0].hz - fs[0].hz) / (MAP.f1Max - MAP.f1Min)
    const bestX = (best.fs[1].hz - fs[1].hz) / (MAP.f2Max - MAP.f2Min)
    const bestY = (best.fs[0].hz - fs[0].hz) / (MAP.f1Max - MAP.f1Min)
    return dx * dx + dy * dy < bestX * bestX + bestY * bestY ? item : best
  })
}

export default function FormantSynth() {
  const [vowelSet, setVowelSet] = useState<VowelSet>('rp')
  const [formants, setFormants] = useState<Formant[]>(() => RP_PRESETS[2].fs.map((f) => ({ ...f })))
  const [preset, setPreset] = useState('trap')
  const [source, setSource] = useState<Source>('voice')
  const [brightness, setBrightness] = useState(45)
  const [f0, setF0] = useState(A2)
  const [pitchMode, setPitchMode] = useState<PitchMode>('free')
  const [enabled, setEnabled] = useState([true, true, true])
  const [dry, setDry] = useState(false)
  const [playing, setPlaying] = useState(false)
  const voice = useRef<Voice | undefined>(undefined)
  const canvas = useRef<HTMLCanvasElement>(null)
  const presets = SETS[vowelSet]

  useEffect(() => {
    const active = voice.current
    if (!active) return
    const now = active.ctx.currentTime
    formants.forEach((formant, index) => {
      active.filters[index].frequency.setTargetAtTime(formant.hz, now, 0.015)
      active.filters[index].Q.setTargetAtTime(formant.hz / formant.bw, now, 0.015)
    })
  }, [formants])

  useEffect(() => {
    const active = voice.current
    if (!active) return
    const now = active.ctx.currentTime
    active.osc.frequency.setTargetAtTime(f0, now, 0.015)
    if (source === 'voice') active.osc.setPeriodicWave(voiceWave(active.ctx, brightness))
    else if (source !== 'noise') active.osc.type = source
    active.oscLevel.gain.setTargetAtTime(source === 'noise' ? 0 : 1, now, 0.015)
    active.noiseLevel.gain.setTargetAtTime(source === 'noise' ? .55 : 0, now, 0.015)
    active.tone.frequency.setTargetAtTime(toneHz(brightness), now, 0.02)
    active.levels.forEach((level, index) => {
      level.gain.setTargetAtTime(enabled[index] ? LEVELS[index] : 0, now, 0.015)
    })
    active.dry.gain.setTargetAtTime(dry ? 0.18 : 0, now, 0.015)
  }, [brightness, dry, enabled, f0, source])

  useEffect(() => {
    const current = canvas.current
    if (!current) return
    const el: HTMLCanvasElement = current
    let frame = 0
    let bins = new Float32Array(0)

    function draw() {
      const rect = el.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const width = Math.max(300, rect.width)
      const height = Math.max(220, rect.height)
      if (el.width !== Math.round(width * dpr) || el.height !== Math.round(height * dpr)) {
        el.width = Math.round(width * dpr)
        el.height = Math.round(height * dpr)
      }
      const ctx = el.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const text = getComputedStyle(el).color
      const muted = getComputedStyle(el).getPropertyValue('--app-text-muted') || '#64748b'
      ctx.clearRect(0, 0, width, height)
      ctx.font = '12px system-ui'
      ctx.strokeStyle = 'rgba(148, 163, 184, .25)'
      ctx.fillStyle = muted
      ctx.lineWidth = 1

      const left = 42
      const right = width - 12
      const top = 14
      const bottom = height - 28
      const x = (hz: number) => left + Math.log(hz / F_MIN) / Math.log(F_MAX / F_MIN) * (right - left)
      const y = (db: number) => top + clamp((-db) / 72, 0, 1) * (bottom - top)

      for (const hz of [100, 200, 500, 1000, 2000, 5000]) {
        const px = x(hz)
        ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, bottom); ctx.stroke()
        ctx.fillText(hz >= 1000 ? `${hz / 1000}k` : String(hz), px - 8, height - 8)
      }
      for (const db of [0, -24, -48, -72]) {
        const py = y(db)
        ctx.beginPath(); ctx.moveTo(left, py); ctx.lineTo(right, py); ctx.stroke()
        ctx.fillText(String(db), 10, py + 4)
      }

      // Approximate the summed response of the three parallel resonators.
      ctx.beginPath()
      for (let px = left; px <= right; px += 2) {
        const hz = F_MIN * (F_MAX / F_MIN) ** ((px - left) / (right - left))
        const amp = formants.reduce((sum, f, index) => {
          if (!enabled[index]) return sum
          const q = f.hz / f.bw
          const d = q * (hz / f.hz - f.hz / hz)
          return sum + LEVELS[index] / Math.sqrt(1 + d * d)
        }, dry ? 0.18 : 0)
        const py = y(20 * Math.log10(Math.max(amp, 0.00025)))
        px === left ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.strokeStyle = text
      ctx.lineWidth = 2
      ctx.stroke()

      formants.forEach((f, index) => {
        const px = x(f.hz)
        ctx.strokeStyle = enabled[index] ? COLOURS[index] : `${COLOURS[index]}55`
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, bottom); ctx.stroke()
        ctx.fillStyle = COLOURS[index]
        ctx.fillText(`F${index + 1}`, px + 4, top + 12 + index * 14)
      })

      const analyser = voice.current?.analyser
      if (playing && analyser) {
        if (bins.length !== analyser.frequencyBinCount) {
          bins = new Float32Array(analyser.frequencyBinCount)
        }
        analyser.getFloatFrequencyData(bins)
        ctx.beginPath()
        let began = false
        for (let i = 0; i < bins.length; i += 1) {
          const hz = i * analyser.context.sampleRate / analyser.fftSize
          if (hz < F_MIN || hz > F_MAX) continue
          const px = x(hz)
          const py = y(bins[i])
          began ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
          began = true
        }
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 1.25
        ctx.stroke()
      }

      if (playing) frame = requestAnimationFrame(draw)
    }

    draw()
    const resize = new ResizeObserver(() => {
      if (!playing) draw()
    })
    resize.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
    }
  }, [dry, enabled, formants, playing])

  useEffect(() => () => {
    const active = voice.current
    if (!active) return
    active.osc.stop()
    active.noise.stop()
    void active.ctx.close()
  }, [])

  async function start() {
    const ctx = new AudioContext()
    const osc = new OscillatorNode(ctx, { frequency: f0 })
    if (source === 'voice') osc.setPeriodicWave(voiceWave(ctx, brightness))
    else if (source !== 'noise') osc.type = source
    const noise = new AudioBufferSourceNode(ctx, { buffer: noiseBuffer(ctx), loop: true })
    const oscLevel = new GainNode(ctx, { gain: source === 'noise' ? 0 : 1 })
    const noiseLevel = new GainNode(ctx, { gain: source === 'noise' ? .55 : 0 })
    const input = new GainNode(ctx, { gain: 0.35 })
    const tone = new BiquadFilterNode(ctx, {
      type: 'lowpass',
      frequency: toneHz(brightness),
      Q: .7,
    })
    const master = new GainNode(ctx, { gain: 0 })
    const limiter = new DynamicsCompressorNode(ctx, {
      threshold: -12,
      knee: 12,
      ratio: 4,
      attack: .003,
      release: .18,
    })
    const analyser = new AnalyserNode(ctx, {
      fftSize: 8192,
      minDecibels: -90,
      maxDecibels: -10,
      smoothingTimeConstant: 0.72,
    })
    const levels: GainNode[] = []
    const filters = formants.map((f, index) => {
      const filter = new BiquadFilterNode(ctx, {
        type: 'bandpass',
        frequency: f.hz,
        Q: f.hz / f.bw,
      })
      const level = new GainNode(ctx, { gain: enabled[index] ? LEVELS[index] : 0 })
      levels.push(level)
      tone.connect(filter).connect(level).connect(master)
      return filter
    })
    const dryLevel = new GainNode(ctx, { gain: dry ? 0.18 : 0 })
    tone.connect(dryLevel).connect(master)
    osc.connect(oscLevel).connect(input)
    noise.connect(noiseLevel).connect(input)
    input.connect(tone)
    master.connect(limiter).connect(analyser).connect(ctx.destination)
    master.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.04)
    osc.start()
    noise.start()
    voice.current = { ctx, osc, noise, oscLevel, noiseLevel, tone, filters, levels, dry: dryLevel, master, analyser }
    await ctx.resume()
    setPlaying(true)
  }

  function stop() {
    const active = voice.current
    if (!active) return
    const now = active.ctx.currentTime
    active.master.gain.cancelScheduledValues(now)
    active.master.gain.setTargetAtTime(0, now, 0.02)
    active.osc.stop(now + 0.15)
    active.noise.stop(now + 0.15)
    window.setTimeout(() => {
      void active.ctx.close()
      if (voice.current === active) voice.current = undefined
    }, 200)
    setPlaying(false)
  }

  function change(index: number, field: keyof Formant, value: number) {
    setPreset('custom')
    setFormants((old) => old.map((f, i) => i === index ? { ...f, [field]: value } : f))
  }

  function choose(id: string) {
    const selected = presets.find((item) => item.id === id)
    if (!selected) return
    setPreset(id)
    setFormants(selected.fs.map((f) => ({ ...f })))
  }

  function chooseSet(next: VowelSet) {
    const nextPresets = SETS[next]
    const selected = nearest(nextPresets, formants)
    setVowelSet(next)
    setPreset(selected.id)
    setFormants(selected.fs.map((f) => ({ ...f })))
  }

  function toggle(index: number) {
    setEnabled((old) => old.map((value, i) => i === index ? !value : value))
  }

  function setMode(mode: PitchMode) {
    setPitchMode(mode)
    setF0(mode === 'free' ? Math.round(f0) : noteHz(closestNote(scaleNotes(mode), f0)))
  }

  function moveMap(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width * 320
    const py = (event.clientY - rect.top) / rect.height * 225
    const x = clamp((px - 28) / 264, 0, 1)
    const y = clamp((py - 20) / 180, 0, 1)
    change(0, 'hz', Math.round(MAP.f1Min + y * (MAP.f1Max - MAP.f1Min)))
    setFormants((old) => old.map((f, index) => index === 1
      ? { ...f, hz: Math.round(MAP.f2Max - x * (MAP.f2Max - MAP.f2Min)) }
      : f))
  }

  const currentX = mapX(formants[1].hz)
  const currentY = mapY(formants[0].hz)
  const pitchNotes = scaleNotes(pitchMode)
  const pitchNote = closestNote(pitchNotes, f0)
  const pitchIndex = pitchNotes.indexOf(pitchNote)
  return (
    <div className="formant-synth">
      <div className="formant-play-row">
        <Button className="formant-play" onClick={playing ? stop : start}>
          {playing ? 'Stop' : 'Play'}
        </Button>
      </div>
      <div className="formant-toolbar">
        <label className="formant-source-control">Source
          <select className="app-input app-input--compact app-select" value={source} onChange={(event) => setSource(event.target.value as Source)}>
            <option value="voice">Voice/glottal</option>
            <option value="sawtooth">Saw</option>
            <option value="square">Square</option>
            <option value="triangle">Triangle</option>
            <option value="noise">Whisper/noise</option>
            <option value="sine">Sine (test)</option>
          </select>
        </label>
        <label className="formant-pitch">Pitch
          <select className="app-input app-input--compact app-select" value={pitchMode} disabled={source === 'noise'} onChange={(event) => setMode(event.target.value as PitchMode)}>
            <option value="free">Any frequency</option>
            <option value="tet">12-TET chromatic</option>
            <option value="gong">C gōng pentatonic</option>
            <option value="hirajoshi">C hirajōshi pentatonic</option>
          </select>
          <input
            type="range"
            min={pitchMode === 'free' ? 55 : 0}
            max={pitchMode === 'free' ? 440 : pitchNotes.length - 1}
            step="1"
            value={pitchMode === 'free' ? f0 : pitchIndex}
            disabled={source === 'noise'}
            onChange={(event) => setF0(pitchMode === 'free' ? Number(event.target.value) : noteHz(pitchNotes[Number(event.target.value)]))}
          />
          <output>{source === 'noise' ? 'Unpitched' : `${pitchMode === 'free' ? f0.toFixed(0) : `${noteName(pitchNote, pitchMode === 'hirajoshi')} · ${f0.toFixed(1)}`} Hz`}</output>
        </label>
        <label className="formant-brightness">Brightness
          <input type="range" min="0" max="100" value={brightness} onChange={(event) => setBrightness(Number(event.target.value))} />
          <output>{brightness}%</output>
        </label>
        <label className="formant-dry"><input type="checkbox" checked={dry} onChange={() => setDry((value) => !value)} /> Dry source</label>
      </div>
      <div className="formant-set" aria-label="Vowel set">
        <span>Vowel set</span>
        <button type="button" aria-pressed={vowelSet === 'rp'} onClick={() => chooseSet('rp')}>Received Pronunciation</button>
        <button type="button" aria-pressed={vowelSet === 'ga'} onClick={() => chooseSet('ga')}>General American</button>
        <button type="button" aria-pressed={vowelSet === 'ja'} onClick={() => chooseSet('ja')}>Japanese</button>
        <button type="button" aria-pressed={vowelSet === 'zh'} onClick={() => chooseSet('zh')}>Mandarin</button>
      </div>
      <div className="formant-presets" aria-label={`${vowelSet === 'rp' ? 'Received Pronunciation' : vowelSet === 'ga' ? 'General American' : vowelSet === 'ja' ? 'Japanese' : 'Mandarin'} vowel presets`}>
        {presets.map((item) => (
          <button key={item.id} type="button" aria-pressed={preset === item.id} onClick={() => choose(item.id)}>
            {item.glyph && <span className="formant-glyph">{item.glyph}</span>}
            <span className="formant-preset-label">{item.set}</span> /{item.ipa}/
          </button>
        ))}
      </div>

      <div className="formant-grid">
        <section className="formant-card" aria-labelledby="formant-controls-title">
          <h3 id="formant-controls-title">Formants</h3>
          {formants.map((formant, index) => (
            <div className={`formant-row ${enabled[index] ? '' : 'is-off'}`} key={index} style={{ '--formant-colour': COLOURS[index] } as CSSProperties}>
              <label className="formant-enable"><input type="checkbox" checked={enabled[index]} onChange={() => toggle(index)} /> F{index + 1}</label>
              <label>
                <span>Frequency <output>{formant.hz} Hz</output></span>
                <input type="range" min={index === 0 ? 200 : index === 1 ? 500 : 1500} max={index === 0 ? 800 : index === 1 ? 2500 : 4000} step="10" value={formant.hz} onChange={(event) => change(index, 'hz', Number(event.target.value))} />
              </label>
              <label>
                <span>Bandwidth <output>{formant.bw} Hz</output></span>
                <input type="range" min="40" max="400" step="10" value={formant.bw} onChange={(event) => change(index, 'bw', Number(event.target.value))} />
              </label>
            </div>
          ))}
        </section>

        <section className="formant-card" aria-labelledby="vowel-map-title">
          <h3 id="vowel-map-title">F1/F2 vowel map</h3>
          <svg className="vowel-map" viewBox="0 0 320 225" role="img" aria-label={`Vowel map: F1 ${formants[0].hz} hertz, F2 ${formants[1].hz} hertz`} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); moveMap(event) }} onPointerMove={(event) => { if (event.buttons === 1) moveMap(event) }}>
            <rect x="28" y="20" width="264" height="180" />
            <text x="160" y="218" textAnchor="middle">F2: front ← → back</text>
            <text x="12" y="110" textAnchor="middle" transform="rotate(-90 12 110)">F1: close → open</text>
            {presets.map((item) => <g key={item.id} className="vowel-point">
              <circle cx={mapX(item.fs[1].hz)} cy={mapY(item.fs[0].hz)} r="3" />
              <text
                className="vowel-point-label"
                x={mapX(item.fs[1].hz)}
                y={mapY(item.fs[0].hz) - 7}
                textAnchor="middle"
              >/{item.ipa}/</text>
              <title>{`${item.glyph ? `${item.glyph} ` : ''}${item.set} /${item.ipa}/`}</title>
            </g>)}
            <circle className="vowel-current" cx={currentX} cy={currentY} r="7" />
          </svg>
        </section>
      </div>

      <section className="formant-card formant-spectrum" aria-labelledby="spectrum-title">
        <h3 id="spectrum-title">Spectrum</h3>
        <p>Filter response with live output in amber.</p>
        <canvas ref={canvas} aria-label="Live frequency spectrum with F1, F2 and F3 markers" />
      </section>
    </div>
  )
}
