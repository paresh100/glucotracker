# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a diabetes tracking mobile app (GlucoTrack) with Express API backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo (React Native) with Expo Router

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (all routes)
│   └── glucotrack/         # Expo mobile app (GlucoTrack)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## GlucoTrack App

A diabetes tracking mobile app with:
- Blood glucose logging with timestamps and meal context
- Medication management (add meds, log doses)
- Meal logging
- Line charts and histograms for Day/Week/Month/Year
- Warnings for low (<70 mg/dL) and high (>180 mg/dL) readings
- Estimated HbA1c from average glucose
- Time-in-range statistics
- Dark theme with teal/emerald accent colors

### App Screens
- `(tabs)/index.tsx` - Dashboard with latest reading, alerts, stats
- `(tabs)/history.tsx` - Charts (line chart + histogram) with period selection
- `(tabs)/medications.tsx` - Medication management and dose logging
- `(tabs)/history-log.tsx` - Full log history with filtering
- `log-glucose.tsx` - Modal: log a glucose reading
- `log-meal.tsx` - Modal: log a meal
- `log-medication.tsx` - Modal: log a medication dose
- `manage-medications.tsx` - Modal: add/delete medications

### DB Schema
- `glucose_readings` - Blood glucose readings
- `medications` - User's medications
- `medication_logs` - Medication dose logs
- `meals` - Meal records

### API Routes
- `GET/POST /api/glucose` - Glucose readings (with `?period=day|week|month|year`)
- `DELETE /api/glucose/:id`
- `GET /api/stats` - Glucose statistics
- `GET/POST /api/medications`
- `DELETE /api/medications/:id`
- `GET/POST /api/medication-logs`
- `GET/POST /api/meals`
- `DELETE /api/meals/:id`

## TypeScript & Composite Projects

- `lib/*` packages are composite and emit declarations via `tsc --build`.
- `artifacts/*` are leaf workspace packages checked with `tsc --noEmit`.
- Root `tsconfig.json` is a solution file for libs only.

## Root Scripts

- `pnpm run build` — runs typecheck first, then recursively runs build
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Development

- API: `pnpm --filter @workspace/api-server run dev`
- Mobile: `pnpm --filter @workspace/glucotrack run dev`
- DB push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
