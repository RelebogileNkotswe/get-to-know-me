# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-10-13 - invites-and-review

### Added
- Profile invites without email: an editor or admin creates an invite on the new **Invites and review** page (name, company email, optional position and start date) and copies a private link to send by hand. The `invites` table stores only a hash of the link's token; links work for 14 days and stop working after the new joiner submits.
- Public invite page (`/invite/<token>`): the new joiner fills in their own profile without signing in. It shows only their form, with no menu, and the company email cannot be changed. Submitting moves the profile to "awaiting review".
- Review and publish: editors and admins review a submitted profile on the edit page, change anything, and click **Publish** so it shows in the employee list. A new link can be made for an unsubmitted invite, or the invite cancelled.
- In-app notification when a profile is submitted: a count on the **Invites and review** menu link and a banner on the employee list. Create/edit profile shows each profile's status.

### Changed
- The new starter carousel now also shows people starting within the next 10 days, as well as those who started in the last 30 days (`NEW_STARTER_DAYS_AHEAD` in `src/models/Employee.ts`).
- The proxy lets `/invite/...` through without a session; every other page still requires sign-in.
- Shared profile data-mapping helpers moved to `src/logic/profiles/ProfileMapping.ts`.

### Known gaps
- Photos are not saved, and invite links are copied by hand (no email). There is no "send back with comments", and the employee cannot edit after submitting.
- No rate limiting on the public invite page.

## [0.5.0] - 2026-10-07 - ProfileTemplate

### Added
- Sign-in with company email and password: `/login` page, database-backed sessions (`sessions` table, hashed session token in an httpOnly cookie), sign-out, and a lockout after five wrong passwords. Password hashing with `bcryptjs`.
- `src/proxy.ts` sends visitors without a session cookie to the login page; every page and server action also checks the real session (`RequireUser`) and role.
- First admin for local development, created by `npm run db:seed` from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env` (refuses to run in production).
- Admin page on real data: change user roles and unlock locked accounts. An admin cannot change their own role, and the last admin cannot be demoted.
- Change your own password on the Profile page; other sessions are signed out after a change.
- Saving profiles: create, edit and delete write to the database, with server-side validation and a duplicate-email message.
- Employee directory as a card grid with an eye button that opens a profile page in the Get To Know Me template style.
- New starter carousel for people who started in the last 30 days.
- "No profile yet" notice with an "Ask for a profile" button (`profile_requested_at` column); editors see a "Requested" badge.
- Directory search now covers name, position and all three profile text sections.
- Side menu restyled to the navy and green design, with grouped sections and a signed-in user card.

### Changed
- Combined character limit raised from 90 to 500 (temporary; still a code constant, not yet read from `settings`).
- The role of the signed-in user now comes from the session instead of a stub that always returned "admin".

### Known gaps
- Photos are not saved yet (storage is undecided). Email-based first login, password reset and invites are not built.
- `file.ts` in the repository root still fails `next build` type-checking.

## [0.4.1] - 2026-09-30 - GTKM-02

### Added
- Local environment setup notes in `README.md` and `CLAUDE.md`: starting Rancher Desktop from the command line (`rdctl`), service ports, and the database startup order.
- Troubleshooting table in `README.md` covering the Docker daemon, PostgreSQL connection, `.env` password and empty-database errors.

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
