Personal blog + learning how to webdev.

stack:

next.js
nextra
react
mdx
ts

Published at https://mlogical.co.uk

Uses Node 24 (pinned in `.nvmrc`, also used by CI) and the pnpm version in `package.json`.

On this machine, nvm is installed through Fisher and runs in Fish:

```fish
nvm install # Install the version in .nvmrc if needed.
nvm use
pnpm install
pnpm dev
```

`nvm use` selects the exact pinned version; `nvm use v24` can select a different installed Node 24 release. This switches Node and its bundled npm, but this project uses pnpm for dependencies and scripts.

For Bash-based tools, run Node commands through Fish (for example, `fish -c 'nvm use; and node --version'`) or configure a Node version manager for Bash too.
