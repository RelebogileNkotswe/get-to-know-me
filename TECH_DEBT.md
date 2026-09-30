# Tech Debt

Deferred issues we've consciously chosen not to fix yet, with why and what the fix looks like when we get to it. Remove an entry (and note it in the PR) once it's resolved.

## Security

### npm audit: high findings in the Prisma CLI's dependencies

- **Where**: `prisma@7.10.0` (dev dependency) → `mysql2@3.15.3`, `@prisma/config` → `deepmerge-ts`
- **Source**: `npm audit` during SPEC-1
- **Issue**: `mysql2` has credential-leak and decompression DoS advisories; `deepmerge-ts` has a stack exhaustion advisory. Neither runs in the app: `mysql2` is unused (we use PostgreSQL) and `deepmerge-ts` only merges our own `prisma.config.ts`. `npm audit fix --force` would downgrade to Prisma 6.
- **Deferred until**: Prisma 8 is stable (8.0.0 was a release candidate at the time), or a 7.x patch updates these dependencies.
- **Proposed fix**: Upgrade Prisma (CLI, client and adapter together) and re-run `npm audit`.

## Documentation / Process

### CODEOWNERS not set up

- **Where**: `.github/CODEOWNERS` (absent)
- **Source**: Project setup
- **Issue**: No code owner has been chosen yet.
- **Deferred until**: An owner is agreed.
- **Proposed fix**: Add `.github/CODEOWNERS` containing `* @<github-owner>`.
