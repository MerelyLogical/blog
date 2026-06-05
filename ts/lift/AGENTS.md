# Lift Simulator Notes

- File boundaries: `constants.ts` holds shared tuning/layout constants, `types.ts` holds model types, `layout.ts` holds coordinate helpers, `sim.ts` holds pure lift/rider transitions, `algo.ts` holds pure dispatch/algorithm choices, `metrics.ts` holds metric helpers, and `index.tsx` owns React state/effects/rendering.
- Keep visual positions derived from shared layout constants. The lift slots, dotted outlines, and rider targets should use the same coordinate helpers rather than separate hand-tuned offsets.
- Keep horizontal lane spacing derived from `LANE_EDGE`. `WAIT_LEFT` adds the floor label width, `EXIT_RIGHT` uses the lane edge directly, and `CAR_X` is offset from centre by the same edge.
- Render riders in one overlay layer and move them by changing coordinates. Moving a rider between React parents causes visible disappear/reappear artefacts.
- Waiting riders render from the lift outwards. Show at most `WAIT_SHOWN` waiting riders per floor; if more are queued, use the last visible circle as a `+x` marker while keeping hidden riders in the simulation state.
- Keep lift timing, rider lifecycle, and display layout as separate helpers. The React component may own state, but effects should delegate to small transition functions like spawning, stop handling, boarding completion, and exit ageing.
- Exit timing belongs to each rider, not to a floor. Use rider-level properties such as `fadeAt` and `removeAt` so later passengers alighting on the same floor do not inherit an older fade timer.
- The lift has six fixed slots: two rows of three. Boarding assigns the first free slot in `SLOTS` order; if no slot is free, the rider keeps waiting.
- The algorithm selector supports `bounce`, `nearest`, and `popular`. Add future algorithms in `algo.ts`, then expose them via `ALGOS`. `bounce` moves one floor at a time and stops at each floor. `nearest` treats onboard riders as lift requests and targets the onboard destination nearest to the current floor. `popular` chooses the side with more onboard destination requests; ties use the first matching rider in array order. When request-based algorithms are empty, they fall back to the normal up/down bounce and board waiting riders at reached floors.
- Boarding time is staggered. A stop alternates alight ticks and board ticks every `STEP_MS`; each lane therefore starts one rider every `WALK_MS`. Empty ticks still count, so board-only queues still board every `WALK_MS`, not every `STEP_MS`.
- Metrics use lightweight histories: sampled counts for waiting/load and event histories for wait/trip completions. Keep the panel compact with current, 10s, and 60s values before adding graphs.

## TODO

- Passengers calling the lift.
- Multiple lifts.
- Physics-based movement with acceleration/deceleration so algorithms can be rewarded for skipping floors.
- Control knobs for simulation settings.
