# Lift Simulator Notes

- Keep visual positions derived from shared layout constants. The lift slots, dotted outlines, and rider targets should use the same coordinate helpers rather than separate hand-tuned offsets.
- Render riders in one overlay layer and move them by changing coordinates. Moving a rider between React parents causes visible disappear/reappear artefacts.
- Keep lift timing, rider lifecycle, and display layout as separate helpers. The React component may own state, but effects should delegate to small transition functions like spawning, stop handling, boarding completion, and exit ageing.
- Exit timing belongs to each rider, not to a floor. Use rider-level properties such as `fadeAt` and `removeAt` so later passengers alighting on the same floor do not inherit an older fade timer.
- The lift has six fixed slots: two rows of three. Boarding assigns the first free slot in `SLOTS` order; if no slot is free, the rider keeps waiting.
