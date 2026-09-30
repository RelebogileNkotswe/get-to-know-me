# Get To Know Me

A Next.js web application with a DaisyUI front end, written in TypeScript.

## Technologies

| Area | Technology | Version |
| --- | --- | --- |
| Framework | [Next.js](https://nextjs.org) (App Router) | 16.3.7 |
| UI library | [React](https://react.dev) | 19.2.8 |
| Language | [TypeScript](https://www.typescriptlang.org) (strict mode) | 5.x |
| Styling | [Tailwind CSS](https://tailwindcss.com) | 4.x |
| Component library | [DaisyUI](https://daisyui.com) | 5.x |
| Date picker | [React Day Picker](https://daypicker.dev) (styled by DaisyUI) | 10.x |
| Icons | [Google Material Symbols](https://fonts.google.com/icons) (Outlined) | n/a |
| Linting | [ESLint](https://eslint.org) with `eslint-config-next` | 9.x |
| Formatting | [Prettier](https://prettier.io) (4-space indent, double quotes) | latest |
| Runtime | [Node.js](https://nodejs.org) | 22 |
| Node version management | [Volta](https://volta.sh) (`package.json`) and `.nvmrc` | n/a |
| Database | [PostgreSQL](https://www.postgresql.org) (Docker locally) | 17 |
| ORM | [Prisma ORM](https://www.prisma.io/orm) with `@prisma/adapter-pg` | 7.10.0 |
| Fonts | [`next/font`](https://nextjs.org/docs/app/getting-started/fonts) with [Geist](https://vercel.com/font) | n/a |

## Getting Started

Install [Volta](https://volta.sh) so the pinned Node version (22) is used automatically inside this repo, or use any tool that reads `.nvmrc`.

You also need Docker (Docker Desktop or Rancher Desktop with the `moby` engine) for the local database.

```bash
cp .env.example .env    # then set POSTGRES_PASSWORD and the same password in DATABASE_URL
npm install             # also generates the Prisma client
npm run db:up           # start PostgreSQL in Docker
npm run db:migrate      # apply migrations
npm run db:seed         # add sample data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format `src/` with Prettier |
| `npm run format:check` | Check formatting without changing files |
| `npm run db:up` / `db:down` | Start / stop the local PostgreSQL container |
| `npm run db:migrate` | Create and apply migrations (`prisma migrate dev`) |
| `npm run db:seed` | Load sample data |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Project Structure

```
src/
├── app/                  # Next.js routing layer (thin: parse request, call a service, return response)
├── interface/<feature>/  # Service contracts: types and interfaces only
├── logic/<feature>/      # Service implementations of those contracts
└── prisma/               # Prisma schema, shared client (Database.ts) and seed script
migrations/               # Prisma migrations
```

The starter `health` feature shows the pattern: `GET /api/health` calls `logic/health/HealthService.ts`, which implements `interface/health/HealthService.ts`.

## Conventions

- Code standards: [TypeScriptReactStandards.md](TypeScriptReactStandards.md)
- Repository structure: [PROJECT-STRUCTURE-SETUP.md](PROJECT-STRUCTURE-SETUP.md)
- Change history: [CHANGELOG.md](CHANGELOG.md), with user-facing notes in [CHANGELOG.public.md](CHANGELOG.public.md)
- Deferred issues: [TECH_DEBT.md](TECH_DEBT.md)
