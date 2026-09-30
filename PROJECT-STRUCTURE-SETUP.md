# Project Structure Setup Instructions (for an AI agent)

Set up this repository using the structure and conventions below. Adapt names (project name, ticket prefix, framework) to the target project. Ask the developer for: project name, ticket prefix (e.g. `SH`), GitHub owner for CODEOWNERS, and which AI agents they use (default: Claude Code only).

## 1. Layout

```
<repo>/
├── CLAUDE.md                 # Agent entry point; imports the guides + holds project rules
├── Guides/
│   ├── AGENTS.md             # Framework-specific agent rules (e.g. Next.js "read node_modules docs first")
│   └── <Tool>-Guide.md       # One reference guide per major tool (e.g. Prisma-Guide.md)
├── CHANGELOG.md              # Engineering changelog (Keep a Changelog + SemVer), one entry per ticket
├── CHANGELOG.public.md       # User-facing release notes, only updated on real live deploys
├── TECH_DEBT.md              # Consciously deferred issues
├── README.md
├── .github/CODEOWNERS        # `* @<github-owner>`
├── .nvmrc                    # Node version
├── .env.example              # Committed; real `.env*` files are gitignored
├── migrations/               # DB migrations + contract snapshots (if using a DB tool)
└── src/
    ├── app/                  # Framework routing layer (thin: parse request, call a service, return response)
    ├── interface/<feature>/  # Service contracts: types + interface only, no implementation
    ├── logic/<feature>/      # Service implementations of those contracts
    │   └── templates/        # Editable copy (e.g. .md) with a .ts loader, so text changes need no code edits
    └── prisma/               # DB schema/contract + db client (if using Prisma)
```

## 2. The service-contract convention (`interface/` + `logic/`)

For every feature `<feature>`:

- `src/interface/<feature>/<Name>Service.ts` (PascalCase file) exports the result types and an `interface <Name>Service`. No implementation, no side-effect imports.
- `src/logic/<feature>/<name>Service.ts` (camelCase file) exports `const <name>Service: <Name>Service = { ... }` that implements the interface and imports its types from `../../interface/<feature>/<Name>Service`.
- `src/app/**/route.ts` (or pages) import only from `logic/` and stay thin. Example:

```ts
// src/interface/streams/StreamService.ts
export type StreamsHealth = { status: 'ok'; service: 'streams'; timestamp: string };
export interface StreamService { getHealth(): StreamsHealth; }

// src/logic/streams/streamService.ts
import type { StreamService, StreamsHealth } from '../../interface/streams/StreamService';
export const streamService: StreamService = {
  getHealth(): StreamsHealth {
    return { status: 'ok', service: 'streams', timestamp: new Date().toISOString() };
  },
};

// src/app/api/streams/route.ts
import { streamService } from '../../../logic/streams/streamService';
export function GET() { return Response.json(streamService.getHealth()); }
```

Add a new `<feature>` folder pair in both `interface/` and `logic/` for each new feature area.

## 3. `CLAUDE.md` contents

Create `CLAUDE.md` at the repo root with these sections, in order:

1. Import lines: `./Guides/@AGENTS.md` and `./Guides/@<Tool>-Guide.md` (the `@` makes Claude Code load them).
2. **Skills note:** if a tool ships agent skills, check whether they are installed in `.claude/skills/`; if not, install scoped to Claude Code only (e.g. `npx skills add <org>/skills --agent claude-code -y`). Do not install for other agents unless the developer uses them.
3. **AI agent skills are local-machine only:** `.claude/skills/`, `.cursor/skills/`, `.devin/skills/`, `.agents/skills/` and `skills-lock.json` are gitignored and never committed.
4. **Commit ownership (hard rule):** the developer runs `git commit` themselves. Agents may `git add`, write commit messages, and do other git operations, but must not run `git commit`. Exceptions: resolving merge conflicts, cherry-picks, untangling git history problems.
5. **Before pushing (checklist):** before any `git push` confirm (a) `package.json` `version` is bumped, (b) `CHANGELOG.md` has a matching entry `## [<version>] - <date> - <TICKET>` using the branch's ticket number, (c) the two versions match exactly. If anything is missing, stop, stage the fix, and hand the commit back to the developer.
6. Framework agent-rules block (if the framework generates one, e.g. Next.js `<!-- BEGIN:nextjs-agent-rules -->` ... `<!-- END:nextjs-agent-rules -->`). Leave generated blocks intact.

## 4. `.gitignore` additions

```
# env files
.env*
!.env.example

# AI agent skills (downloaded/synced per machine via tool CLIs; not source we maintain)
.claude/skills/
.cursor/skills/
.devin/skills/
.agents/skills/
skills-lock.json
```

## 5. Changelog files

**`CHANGELOG.md`**: header "All notable changes to this project will be documented in this file." referencing Keep a Changelog 1.1.0 and Semantic Versioning 2.0.0. Entries look like `## [0.6.0] - 2026-09-26 - SH-04` with `### Added`, `### Changed`, `### Fixed` subsections. Newest first. One entry per ticket/branch.

**`CHANGELOG.public.md`**: title "Release Notes", one-line intro ("Updates and new features for <Project>, in plain language."), and this HTML comment:

```
<!--
NOTE: Only add an entry here when actually deploying to live hosting —
not for every dev-branch merge or internal change. This file tracks what real
users saw ship, not engineering progress.

Add an entry each time a user-facing feature or fix goes live.
Keep it short, skip internal implementation details, ticket numbers, and file paths —
this file is for users, not developers. See CHANGELOG.md for the full engineering history.
-->
```

## 6. `TECH_DEBT.md`

Header: "Deferred issues we've consciously chosen not to fix yet, with why and what the fix looks like when we get to it. Remove an entry (and note it in the PR) once it's resolved." Group by category (Security, Documentation / Process, Frontend, ...). Each entry has: **Where**, **Source** (e.g. PR review link, if any), **Issue**, **Deferred until**, **Proposed fix**.

## 7. Branch and versioning conventions

- Branch per ticket named `<PREFIX>-<nn>` (e.g. `SH-05`); PRs target `main`.
- Bump `package.json` `version` (SemVer) for each pushed change set, and keep it in lockstep with the `CHANGELOG.md` heading.
- Commit messages: `feat: ...` / `fix: ...` style, optionally prefixed with the ticket (`SH-04: feat(api): ...`).

## 8. Setup steps for the agent

1. Create the folders and files above (empty `src/interface/` and `src/logic/` with one starter feature if useful).
2. Write `CLAUDE.md`, the two changelogs, `TECH_DEBT.md`, `.github/CODEOWNERS`, and `.gitignore` additions.
3. Copy or write the `Guides/` files for the project's actual tools; do not copy Prisma/Next.js guides unless the new project uses them.
4. Stage the files with `git add`. Do not run `git commit`; give the developer a suggested commit message.
