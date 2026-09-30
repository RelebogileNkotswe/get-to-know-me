# Implementation Plan

How to take Get To Know Me from its current UI scaffold (v0.3.0) to the tool described in the specification (Sep 29, 2026). It covers where the project stands, the build order, what each phase delivers, and the decisions that are still open.

## 1. Where the project stands (v0.3.0)

The app shell and most editor and admin screens exist, but nothing is stored, nobody signs in, and every list runs on sample data.

| Area | State | Where |
| --- | --- | --- |
| App shell, side menu, breadcrumbs, role-based menu links | Done | `src/components/AppShell.tsx`, `SideMenuItems.ts` |
| Profile form (fields, combined character counter, validation) | UI done, save not wired | `src/components/ProfileForm.tsx`, `src/models/ProfileForm.ts` |
| Photo field (type + 5 MB check, circular preview) | Partial: no crop, no compression, no upload | `src/components/ProfilePhotoField.tsx` |
| Employee list (table/card view, name/position/start-date filter) | UI done on sample data | `src/components/EmployeesView.tsx` |
| Editor accounts view ("not linked" / "no profile" filters) | UI done on sample data | `src/components/EditorAccountsView.tsx`, `src/models/EditorAccount.ts` |
| Admin users view (roles, lock status filters) | UI done on sample data | `src/components/AdminUsersView.tsx` |
| Edit profile actions (unlock, block, delete) | Page state only | `src/components/EditProfileView.tsx` |
| Auth | Stub: always returns `"admin"` | `src/logic/auth/AuthService.ts` |
| Profile data | Hard-coded sample profiles | `src/logic/profiles/ProfileService.ts` |
| Own Profile page (change password) | Placeholder | `src/app/profile/page.tsx` |
| Database, file storage, email | Not started | none |
| Profile template (Get To Know Me page) | Not started | none |
| Profile invites and review | Not started | none |
| New starter carousel | Not started | none |
| PDF export | Not started | none |
| Tests | No test framework | none |

Housekeeping found:

- `file.ts` at the repo root contains only the word `file` (from commit "create a file for easy upload"). Remove it unless it is needed.
- `ACCEPTED_PHOTO_TYPES` already assumes JPG, PNG and WebP, but the spec still lists formats as an open question.
- `MAX_COMBINED_TEXT_CHARACTERS` is a constant (90). The spec wants it to be a setting.
- `.env.example` is empty; it will need database, storage, email and session variables.

## 2. Build order

Each phase is one ticket/branch (`GTKM-XXXX`), with its own `package.json` version bump and `CHANGELOG.md` entry. A phase is only merged once it works end to end, with no sample data left in the parts it touches.

| # | Phase | Depends on | Why this position |
| --- | --- | --- | --- |
| 0 | Decisions and foundations | none | Database, storage, email and hosting shape every later phase. |
| 1 | Data layer | 0 | Replaces sample data; every feature reads and writes through it. |
| 2 | Authentication and access control | 1 | Real personal information must not be stored until everything sits behind a login (spec + POPIA). |
| 3 | Profile create/edit and account linking | 1, 2 | Core editor workflow; the form UI already exists. |
| 4 | Photo upload, crop and compression | 3 | Plugs into the profile form; the invite form reuses it later. |
| 5 | Profile template (on-screen) | 3, 4 | The main value of the tool; needs real profile and photo data. |
| 6 | Employee list and filters | 5 | List rows open the template, so the template comes first. |
| 7 | New starter carousel | 6 | Sits on top of the list and reuses its data query. |
| 8 | PDF export | 5 | Reuses the template with A5 print rules. |
| 9 | Admin: roles and locked accounts | 2 | Wires the existing admin UI to real accounts. |
| 10 | Profile invites and review | 3, 4, 5, email | Reuses the form, photo, template and email; has the most open questions. |
| 11 | Hardening and release | all | Security review, accessibility, retention, docs. |

Parallel work: the template HTML/CSS (phase 5) can start on sample data alongside phases 1 and 2, because it only needs the `IProfileFormValues` shape. Phase 9 can run alongside phases 3 to 8 once phase 2 is merged.

## 3. Phases

### Phase 0: Decisions and foundations

Nothing in the repo or spec settles these yet. Each needs an owner's decision before phase 1.

| Decision | Recommendation (to confirm) | Notes |
| --- | --- | --- |
| Database | PostgreSQL with Prisma | `PROJECT-STRUCTURE-SETUP.md` already expects `migrations/` and `src/prisma/` if Prisma is used. |
| Photo storage | Object storage (e.g. Azure Blob or S3), private, served through an authenticated route | Keeps binary data out of the database; photos must never be public URLs. |
| Email sending | Company SMTP relay or Microsoft Graph | Needed for verification (phase 2), password reset (phase 2) and invites (phase 10). |
| Hosting | To decide | Affects PDF approach (headless browser needs a suitable host) and file storage. |
| Session handling | Signed, httpOnly, secure cookie holding a server-side session id | See `node_modules/next/dist/docs/01-app/02-guides/authentication.md`. |
| Test tooling | Vitest for model and service logic; Playwright for a few end-to-end flows | Keep it small; start with validation, auth rules and the character limit. |

Also in this phase:

- Fill `.env.example` with variable names only (no values).
- Add a `Guides/<Tool>-Guide.md` for each tool chosen, per the structure guide.
- Remove `file.ts` (after confirmation).

### Phase 1: Data layer

Replace sample data with a real store behind the existing `interface/` + `logic/` contracts.

Tables (first pass):

| Table | Key fields |
| --- | --- |
| `users` | id, email (unique, lowercased), password hash, role, failed attempts, locked at, verified at, last sign-in |
| `profiles` | id, company email (unique, lowercased, `@singular.co.za`), names, preferred name, position, start date, LinkedIn, three text sections, photo key, status (`invited` / `awaiting_review` / `published`), created/updated by |
| `invites` | id, profile id, personal email, token hash, expires at, used at |
| `auth_tokens` | id, user/email, purpose (`verify` / `reset`), token hash, expires at (15 min), used at |
| `sessions` | id, user id, expires at |
| `settings` | key, value (e.g. `combinedTextLimit`) |

Work:

- Schema and first migration.
- `ProfileService` contract grows to list, get, create, update, delete, and publish; `app/` routes and pages stay thin and call `logic/` only.
- Account linking is derived: a profile is "linked" when a `users` row has the same email.
- Move `MAX_COMBINED_TEXT_CHARACTERS` to the `settings` table, read on the server and passed to the form.
- Seed script with generic test data only (`sample1@singular.co.za` style), never real people.

### Phase 2: Authentication and access control

Every route except the invite form and auth pages requires a signed-in user.

- Sign-in page (email + password), `@singular.co.za` only; email trimmed and lowercased.
- First login: enter email, receive a verification email, verify within 15 minutes, set a password. Account is created as a viewer and linked to the profile with the same email, if one exists.
- Password reset by email, link valid for 15 minutes.
- Five wrong passwords lock the account.
- Own Profile page (`/profile`): change password.
- Route protection in `proxy.ts` (read `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` first; `middleware` is renamed in this Next.js version), plus a role check inside every server action and route handler. The proxy check alone is not enough.
- Replace `authService.getCurrentRole()` with the real session role; the existing `hasRoleAtLeast` and menu `minimumRole` stay.
- "No profile yet" notice for signed-in users without a profile, with a way to raise it (exact channel to decide; no email alerts for now).

Security notes: hash passwords with Argon2id or bcrypt; store only hashes of tokens; give the same response for unknown and known emails on reset and first login; rate-limit sign-in and email-sending endpoints.

### Phase 3: Profile create/edit and account linking

- Wire `ProfileForm` save to server actions for create and edit; server re-runs `validateProfileForm`.
- Enforce email uniqueness in the database and show a clear error on duplicates.
- Editor-created profiles can be published straight away.
- Editor accounts view on real data: "linked / not yet linked" marker and "accounts without a profile" list.
- Wire delete profile, and admin block/delete account in `EditProfileView`, with confirmation already in place.
- Decide which fields are required (open question) and add those rules to `validateProfileForm`.

### Phase 4: Photo upload, crop and compression

Goal: editors (and later invitees) pick a photo, frame it, see a preview, and a small compressed image is stored.

Flow:

1. **Pick.** Keep the current checks in `validatePhoto`: reject anything over 5 MB with the existing message, and reject formats not accepted.
2. **Crop.** Open a cropper (e.g. `react-easy-crop`) in a DaisyUI modal. Lock the crop to the template's portrait frame ratio, if confirmed (open question); the frame's rounded corners are applied by CSS, not baked into the image.
3. **Compress in the browser.** Draw the crop to a canvas, scale to a fixed maximum (e.g. 800 × 1000 px, to be matched to the frame at 2x), and export as WebP (JPEG fallback) at about 0.85 quality. Target under 300 KB.
4. **Preview.** Show the cropped result in the same portrait frame the template uses, with "Use photo" and "Choose again".
5. **Upload.** Send the compressed blob with the profile save. Server actions cap request bodies at 1 MB by default (`serverActions.bodySizeLimit`); the compressed image fits under that, so the default can stay.
6. **Verify on the server.** Do not trust the browser: check the real file type from its bytes, enforce a size cap on the compressed file, re-encode with `sharp`, and strip EXIF metadata (it can hold GPS location, which is personal information).
7. **Store.** Save to private storage under a random key; the profile holds only the key. Replacing a photo deletes the old file.
8. **Serve.** An authenticated route returns the photo; the invite form may see only its own photo.

Notes:

- The 5 MB limit applies to the original file and is checked in the browser, because only the compressed file reaches the server.
- Original files are not kept, which reduces stored personal data.
- Formats: JPG, PNG and WebP are already coded; confirm (open question). HEIC from iPhones would need extra handling.

Acceptance checks:

- A 6 MB file is rejected with a clear message before any upload.
- A 4 MB JPG is cropped, previewed, and stored well under 1 MB.
- A stored image has no EXIF data.
- A renamed non-image file is rejected by the server.
- A signed-out request for a photo URL is refused.

### Phase 5: Profile template (on-screen)

- One `ProfileTemplate` component built in HTML/CSS to match the supplied design: logo and "Get to know..." heading, first name in white, last name in green, position, green "Call me" tag, photo in a white rounded portrait frame, green and blue shapes on dark navy, three sections with icon, heading and divider, green "Welcome to Singular Systems" footer tag.
- Email link with a small icon, always shown; LinkedIn link with icon only when set, leaving no gap.
- Profile page route (e.g. `/employees/[id]`), visible to every signed-in user, published profiles only.
- Placement of start date, email and LinkedIn is still undecided (open question).
- Build the template so the same markup can print to A5 (phase 8).

### Phase 6: Employee list and filters

- Load published profiles only.
- Filters: name, position, start date, and the hobbies, interests and background text (the spec asks the stakeholder to confirm this list). Filter on the server once the list is large; client-side is fine at first.
- Rows and cards open the profile template; cards show the real photo.

### Phase 7: New starter carousel

- Published profiles with a start date in the last 30 days, above the full list.
- Cards: photo, preferred name, position, a small "New" badge; click opens the profile.
- Slow automatic scroll, pauses on hover and touch, still when `prefers-reduced-motion` is set.
- Hidden when nobody qualifies.
- Depends on the open questions about start date being required and whether future starters show.

### Phase 8: PDF export

- Editors and admins only; viewers never see the button, and the server enforces the role.
- Same template, fixed A5 page, links not clickable, empty LinkedIn absent.
- Approach to choose:
  - **Print stylesheet** (`@page { size: A5 }` + "Save as PDF" in the browser): no new dependency, but the output depends on the user's browser settings.
  - **Server-side render** with a headless browser (e.g. Playwright) of a print route to a PDF file: consistent file every time, but needs a host that can run Chromium.
- Recommendation: start with the print stylesheet to settle the A5 layout, then move to server-side rendering if a consistent downloadable file is required.
- Depends on the open questions about the A5 fit and how email and LinkedIn appear in the PDF.

### Phase 9: Admin: roles and locked accounts

- Admin users view on real data: change roles (admin only), see locked accounts, unlock.
- An admin cannot remove the last admin role.
- Log role changes and unlocks (who, when) for accountability.

### Phase 10: Profile invites and review

- Invite form: name, personal email, optional pre-filled fields (position, start date).
- Email a private link; the link opens only that person's form, with no login. Store only a hash of the token.
- Invite form reuses `ProfileForm`, the photo cropper and the combined character limit.
- Statuses: Invited → Awaiting review → Published. Only published profiles appear in the list and the carousel.
- Review screen for editors and admins: edit and approve.
- Open questions to settle before this phase starts: who enters the company email, link expiry, resend and cancel, editing after submission, and send-back with comments.
- Privacy: the personal email is only needed for the invite. Delete it once the profile is published or the invite expires.

### Phase 11: Hardening and release

- Run `/security-review` on the full branch; fix findings or log them in `TECH_DEBT.md`.
- Accessibility pass: keyboard use of the cropper and carousel, colour contrast on the template, labels.
- Retention: agree how long profiles, photos and accounts are kept after someone leaves, and add a way to delete them.
- Update `README.md`, `.env.example`, and the first `CHANGELOG.public.md` entry on the live deploy.

## 4. Personal information and security (POPIA / GDPR)

The tool stores names, photos, work emails, personal emails (invites), start dates and free-text personal details.

- Everything behind a login; photos served only through authenticated routes.
- Encryption in transit (HTTPS) and at rest (database and storage).
- Least privilege: role checks on the server for every action, not just hidden buttons.
- Retention: personal invite emails deleted after use; profile and photo removal when a person leaves (period to agree with the data owner).
- No real personal information in seed data, tests, logs or commits.
- Strip photo metadata on upload.

## 5. Open questions (from the spec)

| Question | Blocks phase |
| --- | --- |
| Which fields are required, including start date? | 3, 7 |
| Accepted photo formats (JPG, PNG, WebP)? | 4 |
| Should the cropper lock to the portrait frame? | 4 |
| Where do start date, email and LinkedIn sit on the template? | 5 |
| Do the list filters cover what is needed? | 6 |
| Do upcoming starters show before their start date? | 7 |
| Combined character limit (90 is a placeholder) and A5 fit | 3, 8 |
| Email and LinkedIn in the PDF: plain text or left out? | 8 |
| Invite rules: who enters company email, link expiry, resend/cancel, edit after submit, send-back | 10 |
| How does a user without a profile "raise it"? | 2 |

Decisions not in the spec (phase 0): database, photo storage, email provider, hosting, test tooling, PDF approach.
