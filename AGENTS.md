# Project Notes

## Style

- Prefer short, compact names when they stay clear. This is a personal blog, so avoid enterprise-style verbosity in variable, type, and constant names.
- Prefer short function names too. Drop boilerplate prefixes like `get` when the shorter name is still obvious.
- This is a .co.uk site, so prefer British English in user-facing text and code names where natural. For example, prefer `lift` over `elevator`.
- For local constants and data tables, keep repeated keys especially terse when the values are the important part.
- For compact data tables, use whitespace to line up related fields when it improves scanning, like the `KEYS`, `TUNINGS`, and `QUALITIES` arrays.
- Do not run full builds as a testing step unless explicitly asked. The user will handle build testing.
- Do not run `pnpm dev` unless explicitly asked. The user will handle the dev server.
