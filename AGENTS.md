# Project Notes

## Style

- Prefer short, compact names when they stay clear. This is a personal blog, so avoid enterprise-style verbosity in variable, type, and constant names.
- Prefer short function names too. Drop boilerplate prefixes like `get` when the shorter name is still obvious.
- For local constants and data tables, keep repeated keys especially terse when the values are the important part.
- For compact data tables, use whitespace to line up related fields when it improves scanning, like the `KEYS`, `TUNINGS`, and `QUALITIES` arrays.
- Do not run full builds as a testing step unless explicitly asked. The user will handle build testing.

## Fretboard Project

- Prefer small, explicit music data tables over clever abstractions. The fretboard is easier to maintain when scales, tunings, chord qualities, labels, and matching rules are visible at a glance.
- Keep UI grouping musical rather than purely technical. Controls should be organized by how a player thinks about the instrument, such as basic qualities versus extended qualities.
- Be conservative with chord detection. Exact matches are better than surprising guesses; only allow omitted notes when the omission is common and musically low-risk, such as fifths in seventh or ninth chords.
- Keep related chord types distinct even when they share pitch classes. For example, suspended, added-tone, and extended chords should remain separate concepts because the 3rd and 7th change the chord's function.
- Use realistic instrument geometry when it improves intuition. For fret spacing, map the displayed fret range onto a longer implied string length so the visible frets fill the drawing while keeping real relative distances.
