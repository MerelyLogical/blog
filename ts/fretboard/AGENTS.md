# Fretboard Project Notes

- Prefer small, explicit music data tables over clever abstractions. The fretboard is easier to maintain when scales, tunings, chord qualities, labels, and matching rules are visible at a glance.
- Keep UI grouping musical rather than purely technical. Controls should be organized by how a player thinks about the instrument, such as basic qualities versus extended qualities.
- Be conservative with chord detection. Exact matches are better than surprising guesses; only allow omitted notes when the omission is common and musically low-risk, such as fifths in seventh or ninth chords.
- Keep related chord types distinct even when they share pitch classes. For example, suspended, added-tone, and extended chords should remain separate concepts because the 3rd and 7th change the chord's function.
- Use realistic instrument geometry when it improves intuition. For fret spacing, map the displayed fret range onto a longer implied string length so the visible frets fill the drawing while keeping real relative distances.
