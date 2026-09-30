@AGENTS.md

- Follow the standards in TypeScriptReactStandards.md
- Follow the structure in PROJECT-STRUCTURE-SETUP.md
- Where the standards define a convention that the structure guide also defines, the standards take precedence.
- This project uses Next.js and does not use axios; use `fetch` for HTTP calls.

## Local environment setup

- Profile reads come from PostgreSQL, so the app returns 500 (Prisma `ECONNREFUSED`) until the database is up and seeded.
- Order: Docker daemon running, `npm run db:up`, `npm run db:migrate`, `npm run db:seed`, `npm run dev`. The seed is idempotent.
- Docker on this project's Windows machines is Rancher Desktop (moby engine). Start it headless with `rdctl start --container-engine.name=moby --kubernetes.enabled=false --application.start-in-background`, then confirm with `docker ps`.
- Dev server runs on http://localhost:3000 (3001 when taken); PostgreSQL on `127.0.0.1:5432`.
- After editing `.env`, restart `npm run dev`; the running server keeps its old database connection.
- `POSTGRES_PASSWORD` is fixed when the Docker volume is first created. To change it, recreate the volume with `npm run db:down -- -v`.
- Symptom-to-fix table: the Troubleshooting section of README.md.

## Skills

If a tool ships agent skills, check whether they are installed in `.claude/skills/`; if not, install them scoped to Claude Code only (e.g. `npx skills add <org>/skills --agent claude-code -y`). Do not install for other agents unless the developer uses them.

## AI agent skills are local-machine only

`.claude/skills/`, `.cursor/skills/`, `.devin/skills/`, `.agents/skills/` and `skills-lock.json` are gitignored and never committed.

## Commit ownership (hard rule)

The developer runs `git commit` themselves. Agents may `git add`, write commit messages, and do other git operations, but must not run `git commit`. Exceptions: resolving merge conflicts, cherry-picks, untangling git history problems.

## Before pushing

Before any `git push` confirm:

1. `package.json` `version` is bumped.
2. `CHANGELOG.md` has a matching entry `## [<version>] - <date> - <TICKET>` using the branch's ticket number (format `GTKM-XXXX`).
3. The two versions match exactly.

If anything is missing, stop, stage the fix, and hand the commit back to the developer.
