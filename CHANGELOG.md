# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-09-30 - SPEC-1

### Added
- PostgreSQL database with Prisma ORM 7.10.0 (`@prisma/adapter-pg`): schema in `src/prisma/schema.prisma`, migrations in `migrations/`, shared client in `src/prisma/Database.ts`.
- `users`, `profiles` and `settings` tables, with check constraints keeping emails trimmed, lowercased and on `@singular.co.za`.
- Local database via `docker-compose.yml` (PostgreSQL 17, bound to localhost) and `db:*` npm scripts.
- Seed script (`src/prisma/Seed.ts`) with generic sample profiles, accounts and the combined character limit setting.
- `IMPLEMENTATION-PLAN.md` with the build order for the specification.
- Prisma agent skills for Claude Code (local only, gitignored).

### Changed
- `ProfileService` reads from the database and is now async, with `listEditorAccounts` and `listPublishedEmployees`.
- Employee list, editor list and edit profile pages load their data on the server instead of from sample data.

## [0.3.0] - 2026-09-30 - GTKM-XXXX

### Added
- App shell with side menu, breadcrumbs, profile menu and shared UI components (date picker, confirm dialog, action notices).
- Admin area (`/admin`) with a user accounts view and toolbar.
- Editor area (`/editor`) with an accounts view and profile create/edit pages.
- Employee profile page (`/profile`) with profile form and photo field.
- `auth` and `profiles` service contracts (`interface/` + `logic/`) and `EditorAccount`, `Employee`, `ProfileForm`, `UserAccount` and `UserRole` models.
- Avatar placeholder image.

### Changed
- Home page and root layout now render inside the app shell.

## [0.2.0] - 2026-09-29 - GTKM-XXXX

### Added
- Next.js (App Router), TypeScript, Tailwind CSS and DaisyUI project scaffold.
- `interface/` + `logic/` service-contract structure with a starter `health` feature and `GET /api/health`.
- Prettier configuration matching TypeScriptReactStandards.md (4-space indent, double quotes).
- Node 22 pinned via Volta and `.nvmrc`.
- CHANGELOG, CHANGELOG.public and TECH_DEBT files.
