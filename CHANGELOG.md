# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [0.11.0] - 2026-10-20 - FrontEndCommits

### Fixed
- `statusFilter` ("All / Linked / Pending" chips) is now included in `EmployeeToolbar`'s `hasFilters` check and reset by the Clear button; previously, selecting a status filter disabled the Clear button and clearing search left the status filter active.
- `AppShell` content wrapper no longer carries `bg-brand-navy`, which was causing daisyUI's default dark `text-base-content` to render on a navy background across `/profile`, `/admin`, `/editor`, `/editor/invites`, and `/editor/profiles/new`.
- Bare `<span className="material-symbols-outlined">` icons in `LoginForm` and `NoProfileNotice` replaced with `<Icon />`, which sets `aria-hidden="true"`; previously screen readers announced the ligature text ("error", "lock", "sync") aloud.
- `Icon` accepts an optional `className` prop so callers can add size and colour utilities without duplicating the component.
- `package-lock.json` restored from `main`; the committed lockfile referenced version 0.5.0 and omitted `react-easy-crop` and `sharp`, causing `npm ci` to fail.
## [0.10.0] - 2026-10-19 - pdf-export

### Added
- PDF export for editors and admins: "Export as PDF (A5 format)" opens `/employees/<id>/print`, one A5 sheet with no menu, saved through the browser's print dialog. Colours are kept, and email and LinkedIn are plain text.
- A warning on the print page when the text is too long for one A5 page. The sheet uses tighter spacing, so the current 500-character limit fits.
- `ProfileTemplate`, shared by the profile page and the print page so the PDF matches the screen.

### Known gaps
- No server-made PDF file (needs a host that can run a headless browser), the logo is still text, and exports are not in the audit log.

## [0.9.0] - 2026-10-19 - auditing

### Added
- Audit log: a record of who did what to which account or profile, and when. It covers role changes, unlocks, accounts locked after five wrong passwords, profiles created, edited (the names of the changed fields, never their values), published and deleted, photos saved, and invites created, renewed, cancelled and submitted. New `audit_events` table (migration `20261019091110_add_audit_events`); the app only ever adds rows.
- Each event is saved in the same database transaction as the change it records, so a change is never saved without its record, and a failed change leaves no record.
- The actor of each event is a signed-in user, a new joiner using their private invite link, or the system (automatic lockouts). Emails are copied into the record, so it stays readable after the user or profile is deleted.
- Audit log page for admins (`/admin/audit`, "Audit log" in the side menu): search by email, filter by action and date range (South African time), 10 per page by default, newest first, with short summaries such as "Viewer → Editor" or "Changed: Position".
- `ClientUtils.companyTimeZone`, `startOfCompanyDay` and `formatDateTime`.

### Changed
- `UserRole`, `ProfileStatus`, `AuditAction` and `AuditActorType` are TypeScript enums with the same values as the database (e.g. `UserRole.Editor = "editor"`), and code uses the enum members instead of string literals.
- Services that change data take the actor as a parameter (`AuditActor`), and server actions pass the signed-in user (`currentUserWithRole` replaces `currentUserHasRole`). `findOpenInviteProfileId` became `findOpenInvite`, which also returns the invitee's email.
- Role changes run the last-admin check, the update and the audit record in one transaction.
- `DatePicker` gives each instance its own popover, so several can share a page.
- Empty filter constants renamed to camelCase (`emptyEmployeeFilter`, `emptyEditorAccountFilter`, `emptyUserAccountFilter`), matching `emptyProfileForm`.

### Known gaps
- No retention period for audit events yet (to agree with the data owner); rows are never deleted.
- Sign-ins, sign-outs and password changes are not recorded.

## [0.8.0] - 2026-10-19 - server-side-filtering

### Added
- Pagination on the employee, editor and admin lists: a "Showing 1–20 of 87" summary, page buttons and a per-page choice of 10, 20, 50 or 100 (`ClientUtils.pageSizes`). The employee list shows 20 per page by default; the editor and admin lists show 10. The database returns one page at a time, a page past the end shows the last page, and changing a filter or the page size goes back to page 1.
- One shared `Pagination` component (DaisyUI `join`) and a `useServerFilter` hook (`src/components/ServerFilter.ts`) used by all three lists.
- `src/utils/ClientUtils.ts` (helpers safe in the browser and on the server: dates, strings, ids, URL parameters, paging, photo cropping) and `src/utils/ServerUtils.ts` (`server-only`: tokens, Prisma errors, search helpers).

### Changed
- Search and filters on the employee, editor and admin lists run in the database instead of the browser. The filter and page are kept in the page address (e.g. `/?search=sample&page=2`), so a filtered list can be bookmarked, shared or reloaded.
- Search matches each word on its own and ignores case, so "sample one" finds a first name "Sample" with a last name "One". Preferred name is now searchable on the employee and editor lists.
- The new starter carousel follows the employee list search and start date, so it only shows people who also match the list.
- The editor list's Delete button deletes the profile on the server and reloads the list (it previously only removed the row on the page).
- Helpers spread across components, models and services (date, crop, token, UUID and Prisma helpers, including three duplicates) moved into `ClientUtils` and `ServerUtils`. `DateUtils.ts`, `CropImage.ts` and `InviteToken.ts` were removed.

### Fixed
- A search for `%` or `_` matched every row, because Prisma passes these SQL wildcards through; they are now escaped (`ServerUtils.escapeLikePattern`).
- Removed `file.ts` from the repository root, so `next build` type-checks cleanly again.

## [0.7.0] - 2026-10-13 - image-upload

### Added
- Employee photos: choose a JPG, PNG or WebP (up to 5 MB), crop it in a portrait 4:5 frame in the browser (`react-easy-crop`), preview it, and it is saved with the form. New joiners can add a photo on their private invite page, uploaded just before they submit.
- Server-side photo processing (`sharp`): the file type is read from the image's own bytes, the photo is rotated upright, scaled to 800x1000, converted to JPEG, compressed, and stripped of camera and location data. Files that are not real JPG, PNG or WebP images, empty files and files over 5 MB are refused with a clear message.
- Photos are stored in a new `profile_photos` table (kept apart from `profiles` so lists never load image bytes) behind `PhotoService`, so object storage can replace it later by changing one file.
- `/photos/<profileId>` serves photos to signed-in users only: viewers see photos of published profiles, editors and admins also see photos on profiles still in review.
- Photos show on the employee cards and list, the new starter carousel, the profile page and the edit form, with initials when a person has no photo.

### Changed
- `serverActions.bodySizeLimit` raised to 6 MB in `next.config.ts` so a photo can be uploaded with a form.
- The profile form now keeps a profile that was saved but whose photo failed, and saves it again as an edit instead of creating a duplicate.

### Known gaps
- No "remove photo" button; a photo can only be replaced, and it is deleted with its profile.
- Photos are stored in the database for now (storage is undecided); a retention period and access review are still needed before real photos are used.
- `file.ts` in the repository root still fails `next build` type-checking.

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
