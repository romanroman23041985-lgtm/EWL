# Easy Weight Loss

Easy Weight Loss is a mobile-first nutrition planner built as a lightweight PWA/web app. It is designed for everyday phone use: quick day editing, simple product search, calendar history, profile-based macro targets, and a calm wellness-style interface.

## Tech Stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS v4
- Local persistence through `localStorage`
- Small repository/store layer prepared for future backend replacement

## What The MVP Does

- `Today` screen with current calories, target, remaining/over balance, quick add, and macro progress
- `Plan` screen as the main working area for day editing
- `Calendar` with monthly overview, day states, and compact month stats
- `Profile` with multiple user profiles and automatic macro target recalculation
- Seed data with demo profiles, products, and example days

## What Was Added In Step 2

- Better `Plan` UX for daily use on mobile
- Faster gram editing with quick `-10 / -5 / +5 / +10` actions
- Stronger `Today` overview with clearer hero and empty states
- More useful monthly calendar stats
- Cleaner profile editing UX and profile creation validation
- Recent products in product search
- Custom product creation, editing, and soft deletion through archive
- Better safe-area handling and bottom-nav spacing for phones

## Local Development

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build

```bash
npm run lint
npm run build
npm run start
```

No environment variables are required for the current version.

## Deploy On Vercel

This project builds on Vercel without special configuration.

Steps:

1. Import the repository into Vercel.
2. Keep the default Next.js settings.
3. Deploy.

There are no required server secrets or custom runtime settings in the current version.

## Project Structure

```text
src/
  app/
    (shell)/
      today/
      plan/
      calendar/
      profile/
  components/
  features/
    today/
    plan/
    calendar/
    profile/
  lib/
  store/
```

## Where State Lives

- App state is managed in `src/store/app-store.tsx`
- Persistence is handled by `src/lib/repository.ts`
- Seed data is defined in `src/lib/seed.ts`
- Domain selectors and calculations live in `src/lib/selectors.ts`, `src/lib/macros.ts`, and `src/lib/products.ts`

The storage layer is intentionally small so it can later be swapped for Supabase, Firebase, or another backend without rewriting the UI structure.

## Current Limitations

- Data is local to the current browser/device
- No authentication or sync between devices
- No barcode scanning, recipes, drag-and-drop, or advanced analytics
- No backend database yet
- Product management is intentionally simple and focused on direct day planning

## Next Logical Steps

- Move persistence from `localStorage` to `IndexedDB`
- Add export/import backup
- Add optional day notes and lightweight meal templates
- Connect a backend for sync without changing the existing UI model
- Add install-focused PWA polish if needed
