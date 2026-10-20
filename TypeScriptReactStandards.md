# TypeScript / React Standards — Get To Know Me

This document describes the coding standards that apply to this project. It supersedes the generic Singular TypeScript guide for anything that conflicts with it, because this project uses a different stack (Next.js App Router, React 19, Tailwind CSS 4, daisyUI 5, Prisma 7) from the Neo/MobX applications that guide was written for.

---

## 1. File organisation

| Kind | Location | Naming |
| --- | --- | --- |
| Next.js pages and layouts | `src/app/` (App Router conventions) | lowercase with hyphens (`page.tsx`, `layout.tsx`) |
| Server actions | `src/app/<route>/actions.ts` | `actions.ts` in the route folder they serve |
| React components | `src/components/` | PascalCase `.tsx` (e.g. `EmployeesView.tsx`) |
| Service contracts | `src/interface/<feature>/ServiceName.ts` | PascalCase `.ts` |
| Service implementations | `src/logic/<feature>/ServiceName.ts` | PascalCase `.ts` |
| Data models and shared types | `src/models/` | PascalCase `.ts` (e.g. `Employee.ts`) |
| Browser-safe utilities | `src/utils/ClientUtils.ts` | Static methods on a named class |
| Server-only utilities | `src/utils/ServerUtils.ts` | Same; begins with `import "server-only"` |
| Prisma schema | `src/prisma/schema.prisma` | |
| Shared Prisma client | `src/prisma/Database.ts` | Exports `db` |

One primary export per file. Split files when a second component or service is large enough to have its own concerns.

---

## 2. Server vs client components

Every component is a **server component by default**. Add `"use client"` only when the component needs browser APIs, React state, effects, or event handlers. The directive goes on the very first line.

```tsx
"use client";

import { useState } from "react";
```

Server components fetch data directly — no `useEffect`, no fetch in the browser. They pass data down as props to client components.

```tsx
// src/app/page.tsx — server component, no directive
export default async function Home() {
    const employees = await profileService.listPublishedEmployees();
    return <EmployeesView employees={employees} />;
}
```

---

## 3. Naming conventions

| Thing | Convention | Example |
| --- | --- | --- |
| Variables, function parameters | camelCase | `currentUserId`, `hasAccount` |
| Functions and methods | camelCase | `confirmRoleChange()`, `toUrl()` |
| React components | PascalCase | `AdminUsersView`, `DatePicker` |
| Interfaces | PascalCase, `I` prefix | `IEmployee`, `IAdminUsersViewProps` |
| Type aliases | PascalCase | `EmployeeView`, `AuditActionFilter` |
| TypeScript enums | PascalCase name, PascalCase members | `UserRole.Editor`, `ProfileStatus.Published` |
| Constants (module-level, fixed) | UPPER_SNAKE_CASE | `MAX_FAILED_SIGN_IN_ATTEMPTS`, `SESSION_HOURS` |
| Database-derived constants | camelCase | `EMPLOYEE_PAGE_SIZE = 20` |
| Boolean variables | verb prefix | `isLoading`, `hasProfile`, `canDelete`, `showLinkStatus` |

---

## 4. TypeScript

### Explicit types

Always annotate function parameters and return types. Let the compiler infer local variable types when the type is obvious from the right-hand side.

```typescript
// Good — parameters and return typed, local inferred
function fullName(profile: IProfileFormValues): string {
    const first = profile.firstName.trim();
    return `${first} ${profile.lastName.trim()}`.trim() || profile.companyEmail;
}

// Avoid — unannotated parameters
function fullName(profile) { ... }
```

### Enums

Use TypeScript enums whose members match the database string values exactly. Reference the enum member everywhere in code; never use the raw string literal.

```typescript
export enum UserRole {
    Viewer = "viewer",
    Editor = "editor",
    Admin  = "admin",
}

// Good
if (user.role === UserRole.Editor) { ... }

// Bad
if (user.role === "editor") { ... }
```

### Result objects

Use a discriminated union for operations that can fail, so callers are forced to check the outcome before using the data.

```typescript
type SaveProfileResult =
    | { ok: true; profileId: string }
    | { ok: false; errors: ProfileFormErrors };
```

### Null and undefined

Use optional chaining `?.` and nullish coalescing `??`. Never cast away null with `!` unless you can prove it is impossible.

```typescript
const label = user.lastSignIn ?? "Never";
const email = invite?.email ?? "";
```

### `type` vs `interface`

Use `interface` for object shapes that components or services depend on. Use `type` for union types, aliases, and mapped types.

```typescript
interface IEmployee { id: string; name: string; ... }
type EmployeeView = "list" | "card";
type AuditActionFilter = AuditAction | "all";
```

### Braces on `if`

Always include braces on `if` bodies, including single-line guards.

```typescript
// Good
if (!pending) {
    return;
}

// Bad
if (!pending) return;
```

---

## 5. React components

### Functional components only

Do not use class components. All components are plain functions.

```tsx
interface IEmployeeCardProps {
    employee: IEmployee;
    /** Show the linked/unlinked badge; editors and admins only. */
    showLinkStatus: boolean;
}

/**
 * A card in the employee grid showing the person's photo, name, position
 * and a snippet from their profile text.
 */
export default function EmployeeCard({ employee, showLinkStatus }: IEmployeeCardProps) {
    return ( ... );
}
```

### Props interfaces

Define a props interface directly above the component it belongs to. Always use the `I` prefix and the component name suffix (`IEmployeeCardProps`). Document each prop whose purpose is not obvious.

### JSDoc on every export

Every exported component, hook, function, constant, and service method gets a JSDoc comment. Keep it concise — one sentence for simple things, a short paragraph for anything with non-obvious behaviour.

```typescript
/**
 * Debounced hook that stores the filter and page in the URL so the list can be
 * bookmarked and reloaded. Text inputs are debounced; all other changes are immediate.
 */
export function useServerFilter<TFilter>(...) { ... }
```

### No JSX comments that restate the structure

Comments like `{/* Page header */}` or `{/* Table card */}` add noise without adding information. Remove them. Only add a JSX comment when the WHY of a block is genuinely non-obvious.

---

## 6. State management

Use React's built-in hooks. There is no MobX, Redux, or Zustand in this project.

| Need | Hook |
| --- | --- |
| Local UI state | `useState` |
| Non-blocking async (server actions) | `useTransition` |
| Imperative refs | `useRef` |
| Filter and pagination state in the URL | `useServerFilter` (project hook in `src/components/ServerFilter.ts`) |

```typescript
const [pending, setPending] = useState<IPendingRoleChange | null>(null);
const [isWorking, startWorking] = useTransition();
```

Server-side filter state goes in the URL via `useServerFilter`, not in `useState`. This makes filtered views bookmarkable and shareable.

```typescript
const { inputs, isLoading, typeText, choose, clear } = useServerFilter(
    filter,
    employeeListPath,
    emptyEmployeeFilter,
);
```

---

## 7. Service layer

### Interface before implementation

Define the service contract in `src/interface/<feature>/ServiceName.ts` and implement it in `src/logic/<feature>/ServiceName.ts`. Components and actions import from the implementation, which satisfies the interface.

### Service objects, not classes

Services are plain objects exported as `const`. There is no dependency injection container.

```typescript
// src/logic/profiles/ProfileService.ts
import "server-only";

export const profileService: IProfileService = {
    async listPublishedEmployees(): Promise<IEmployee[]> { ... },
    async createProfile(values): Promise<SaveProfileResult> { ... },
};
```

### Server actions

Actions live in `src/app/<route>/actions.ts`, are marked `"use server"`, check authorisation before doing anything, validate input, call a service, and call `revalidatePath` so the page reflects the change.

```typescript
"use server";

export async function createProfileAction(values: IProfileFormValues): Promise<SaveProfileResult> {
    const editor = await currentUserWithRole(UserRole.Editor);
    if (!editor) {
        return NOT_ALLOWED;
    }
    return profileService.createProfile(values, editor);
}
```

Do not use axios. HTTP calls from server components and actions go through the service layer, which calls the database directly via Prisma or calls an external API with the standard `fetch`.

### Database

All database access goes through the shared `db` instance in `src/prisma/Database.ts`. Use Prisma transactions for multi-step writes that must succeed or fail together.

```typescript
await db.$transaction(async (tx) => {
    await tx.profile.update({ ... });
    await tx.auditEvent.create({ ... });
});
```

---

## 8. Styling

### daisyUI first, custom Tailwind second

This project has a custom dark daisyUI theme (`brand`) defined in `globals.css` that maps all daisyUI semantic tokens to the navy/green palette. Use daisyUI component classes wherever they fit. Only write custom Tailwind when daisyUI does not cover the use case.

```tsx
// Good — daisyUI handles the semantics
<button className="btn btn-primary">Save</button>
<span className="badge badge-success badge-sm">Active</span>
<div role="alert" className="alert alert-error alert-soft">...</div>
<select className="select select-sm">...</select>

// Acceptable — custom Tailwind for a bespoke element daisyUI doesn't cover
<label className="flex items-center gap-2 bg-brand-navy-light border border-white/10 rounded-full px-4 py-2 focus-within:border-brand-green/40 transition-colors">
```

Do not replicate an entire daisyUI component (btn, badge, alert, input, select, modal-action) with repeated inline Tailwind. This defeats the purpose of having a component library.

### Brand colour tokens

Use the CSS custom properties defined in `@theme` in `globals.css`:

| Token | Hex | Use |
| --- | --- | --- |
| `bg-brand-navy` | `#0b1b30` | Page and content backgrounds |
| `bg-brand-navy-light` | `#132a47` | Cards, table containers, toolbar search inputs |
| `text-brand-green` / `bg-brand-green` | `#2fe3a5` | Primary action colour |

### Opacity modifiers for hierarchy

Use Tailwind opacity modifiers to express visual hierarchy within the dark theme. Text at full white is the primary label; `text-white/60` is secondary; `text-white/40` is tertiary.

```tsx
<p className="text-white/50 text-sm">Secondary description text.</p>
<td className="text-white/60">{account.email}</td>
```

### Responsive design

Design mobile-first. Add breakpoint prefixes (`sm:`, `lg:`, `xl:`) for wider layouts. The employee grid uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` as the standard breakpoint set.

### Tables

Wrap every table in a two-level container: the outer for the card border and rounded corners, the inner for horizontal scroll on narrow screens.

```tsx
<div className="bg-brand-navy-light border border-white/10 rounded-xl overflow-hidden">
    <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-white/10 text-[10px] font-bold text-outline uppercase tracking-wider">
                    ...
                </tr>
            </thead>
        </table>
    </div>
</div>
```

This pattern ensures the card corners are clipped AND the table scrolls horizontally on small screens without cutting off the Actions column.

### Loading state

Wrap list content in an `aria-busy` div so assistive technology announces when the list is reloading, and apply an opacity transition for the visual indicator.

```tsx
<div aria-busy={isLoading} className={`transition-opacity ${isLoading ? "opacity-60" : ""}`}>
    {/* table or cards */}
</div>
```

---

## 9. Accessibility

- Every interactive element that lacks visible text must have `aria-label`.
- Screen-reader-only text uses the `sr-only` utility class.
- Icon-only buttons need `aria-label`; the `<Icon />` component sets `aria-hidden="true"` on the span so the ligature text is not read aloud.
- `<label>` elements must either wrap their input or carry a `htmlFor` that matches the input's `id`. Do not rely on `aria-label` on the input as a substitute for a connected label.
- Landmark regions (`<section>`, `<nav>`, `<main>`) need `aria-label` when more than one of the same type appears on the page.
- Use `role="status"` for live regions that update without a page reload (e.g. "Copied." after clipboard write). Use `role="alert"` for error messages.

---

## 10. Import order

1. `"use client"` or `"use server"` directive (must be first line; no imports before it)
2. Node built-ins (if any)
3. Third-party packages (`next/*`, `react`, `@prisma/*`, etc.)
4. Models and types from `../models/` — `type`-only imports prefixed with `type`
5. Utilities from `../utils/`
6. Services from `../logic/` or `../interface/`
7. Components from `./` or `../components/`

Use the `type` keyword for imports that are types only.

```typescript
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
    emptyEditorAccountFilter,
    editorAccountListPath,
    type AccountStatusFilter,
    type IEditorAccount,
    type IEditorAccountFilter,
} from "../models/EditorAccount";
import type { IPage } from "../models/Paging";
import { UserRole } from "../models/UserRole";
import { ProfileStatus, profileStatusLabels } from "../models/ProfileStatus";
import EditorToolbar from "./EditorToolbar";
import Pagination from "./Pagination";
```

---

## 11. Error handling

- **No console.log** in committed code.
- **No bare try/catch** around Prisma calls unless you handle a specific Prisma error code (e.g. `P2002` for unique constraint violation). Unknown errors should bubble up.
- **Validation errors** are returned as `ProfileFormErrors` (a `Partial<Record<keyof IProfileFormValues, string>>`), not thrown.
- **Authorisation failures** return a constant `NOT_ALLOWED` result object; they do not throw.
- **Database not-found** errors are caught where expected and returned as a typed `null` or `false`.

```typescript
} catch (error) {
    if (ServerUtils.hasPrismaCode(error, "P2002")) {
        return { ok: false, errors: { companyEmail: "That email already has a profile." } };
    }
    throw error;  // unknown errors propagate; Next.js error boundaries catch them
}
```

---

## 12. Formatting

- **Indentation**: 4 spaces (configured in `.prettierrc.json`).
- **Quotes**: double quotes for strings in TypeScript and JSX.
- **Trailing commas**: required (Prettier handles this).
- **Line length**: keep JSX attribute lists and class strings short enough to read without horizontal scrolling; break long strings into multi-line template literals or variables.
- **No stray blank lines** inside JSX blocks.
- Run `npm run format` before every commit. The CI check (`npm run format:check`) will fail if Prettier finds anything.

---

## 13. What this project does NOT use

These are in the generic Singular guide but do not apply here:

| Not used | Use instead |
| --- | --- |
| Neo framework (`@singularsystems/neo-*`) | Next.js App Router |
| MobX / `@observer` | `useState`, `useTransition`, `useServerFilter` |
| Class components | Functional components |
| Axios | Server actions + `fetch` (or direct Prisma calls) |
| Dependency injection / `inversify` | Plain service objects exported as `const` |
| `TaskRunner` | `useTransition` + discriminated union results |
| `AppService.get(Types....)` | Direct import of the service constant |
| `ModelBase` / `addBusinessRules` | `validateProfileForm` pure function in the model file |
| SCSS | Tailwind CSS 4 + daisyUI 5 |
