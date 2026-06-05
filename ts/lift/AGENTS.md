# Lift Simulator Notes

- File boundaries: `constants.ts` holds shared tuning/layout constants, `types.ts` holds model types, `layout.ts` holds coordinate helpers, `sim.ts` holds pure lift/rider transitions, `algo.ts` holds pure dispatch/algorithm choices, `metrics.ts` holds metric helpers, and `index.tsx` owns React state/effects/rendering.
- Keep visual positions derived from shared layout constants. The lift slots, dotted outlines, and rider targets should use the same coordinate helpers rather than separate hand-tuned offsets.
- Keep horizontal lane spacing derived from `LANE_EDGE`. `WAIT_LEFT` adds the floor label width, `EXIT_RIGHT` uses the lane edge directly, and `CAR_X` is offset from centre by the same edge.
- Render riders in one overlay layer and move them by changing coordinates. Moving a rider between React parents causes visible disappear/reappear artefacts.
- Waiting riders render from the lift outwards. Show at most `WAIT_SHOWN` waiting riders per floor; if more are queued, use the last visible circle as a `+x` marker while keeping hidden riders in the simulation state.
- Keep lift timing, rider lifecycle, and display layout as separate helpers. The React component may own state, but effects should delegate to small transition functions like spawning, stop handling, boarding completion, and exit ageing.
- Keep physics math in `motion.ts` pure and derived from the tuning constants in `constants.ts`. `posAt`, `velAt`, and `travelMs` should share the same motion profile so the rendered car, velocity readout, and arrival timer cannot drift apart.
- During active lift motion, car and onboard rider vertical positions are driven by `requestAnimationFrame`; do not add CSS `bottom` transitions to those moving elements. Boarding/leaving riders still need short CSS transitions so they walk into and out of slots smoothly.
- Exit timing belongs to each rider, not to a floor. Use rider-level properties such as `fadeAt` and `removeAt` so later passengers alighting on the same floor do not inherit an older fade timer.
- The lift has six fixed slots: two rows of three. Boarding assigns the first free slot in `SLOTS` order; if no slot is free, the rider keeps waiting.
- `DEST_WEIGHTS` in `constants.ts` controls destination demand by floor. Origins stay uniformly random; destinations use the weights while excluding the rider's origin floor.
- Add future algorithms in `algo.ts`, then expose them via `ALGOS`.
- Keep the algorithms table in `content/playground/lift.mdx` as the source of truth for implemented algorithm behaviour. Any algorithm change must leave the code and table consistent.
- Boarding time is staggered. A stop alternates alight ticks and board ticks every `STEP_MS`; each lane therefore starts one rider every `WALK_MS`. Empty ticks still count, so board-only queues still board every `WALK_MS`, not every `STEP_MS`.
- Metrics use lightweight histories: sampled counts for waiting/load and event histories for wait/trip completions. Keep the panel compact with current, 10s, and 60s values before adding graphs.

## TODO

- Passengers calling the lift.
- Multiple lifts.
- Control knobs for simulation settings.
