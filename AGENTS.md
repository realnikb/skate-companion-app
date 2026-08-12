<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project runtime and package manager

- Use Node.js 24. The repository pins the developer runtime in `.nvmrc`.
- npm is the authoritative package manager. `package-lock.json` must remain the only dependency lockfile; do not create `pnpm-lock.yaml`, `yarn.lock`, or `bun.lock`.
- On a normal developer machine, run `nvm use` followed by `npm ci` when dependencies need to be restored.
- In Codex, system `node`, `npm`, and `npx` may be inaccessible because the sandbox cannot follow the user's NVM symlink. Before verification, load the bundled workspace dependencies and use the returned Node.js executable.
- Do not run pnpm in this npm-managed working tree: even `pnpm run` can relocate npm-installed packages. With an existing `node_modules`, use the bundled Node.js executable to invoke project binaries directly (for example, `node node_modules/eslint/bin/eslint.js` and `node node_modules/next/dist/bin/next build`). Put the bundled Node.js directory on `PATH` first so child processes can resolve `node`.
- If dependency metadata must change, use npm and update both `package.json` and `package-lock.json`. If npm is unavailable in the sandbox, report that limitation instead of switching package managers.

# Verification

- After code changes, run the narrowest relevant checks, then run `npm run lint` and `npm run build` when practical. In Codex, invoke the corresponding project binaries with bundled Node.js when npm is inaccessible.
- Do not treat a missing system npm command as a project failure; use the bundled runtime guidance above.
