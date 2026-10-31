# SCIENCE EXPLORER — Targeted Runtime Error Fix Report

## Root cause

The Science, Explore Science, Topic Detail, and classroom assignment queries returned JavaScript `Set` instances from React Query query functions. In `src/routes/_authenticated/app.sciences.tsx`, completion checks called `progress.data?.has(...)`. The runtime error `progress.data?.has is not a function` indicates the query data at runtime was not a live `Set` (for example, after serialization/hydration or cache restoration it can be represented as a plain serialized value). Optional chaining only protects missing data; it does not ensure that `has` exists.

## Exact fix

The affected query functions now return plain arrays of IDs/slugs, which are safe to serialize and hydrate. Completion checks use `Array.prototype.includes`. The topic-progress query key was versioned to `topic-progress-slugs` to avoid reusing stale cached values created under the previous Set-shaped contract. The classroom assignment query key was likewise versioned to `assignment-quiz-ids`.

Empty query results naturally return `[]`; missing query data remains safely optional while loading. No hardcoded progress state or fake result was introduced.

## Files changed

- `src/routes/_authenticated/app.sciences.tsx`
- `src/routes/_authenticated/app.explore.tsx`
- `src/routes/_authenticated/app.topic.$slug.tsx`
- `src/routes/_authenticated/app.classroom.$id.tsx`
- `FIX_REPORT.md`

## Related `.has()` audit

Reviewed other `.has()` occurrences in `src`. The remaining Set `.has()` calls operate on Sets created locally in the same render/function (for example, locally derived `doneSlugs`, `memberIds`, and gamification date sets), rather than on Set values returned from React Query. The query-backed classroom assignment Set was also corrected because it had the same serialization risk.

## Route path observation

The generated route tree declares the Science route at `/app/sciences` under the `/_authenticated` route layout. No literal duplicated `/app/sciences/app/sciences` route declaration was found in the route tree or route file. The duplicated route shown in the error boundary therefore was not changed without further runtime evidence; it may reflect how the route/error boundary formats its route identifier.

## Checks run

- ZIP/source inspection: passed.
- Static audit after edits: passed; no remaining `progress.data?.has`, `assignments.data?.has`, or query functions returning `new Set(data.map(...))` in the affected routes.
- `npm install --no-audit --no-fund`: attempted, but timed out in this environment before dependencies were installed.
- Type check: not run; dependencies were unavailable.
- Lint: not run; dependencies were unavailable.
- Unit tests: not run; dependencies were unavailable.
- Production build: not run; dependencies were unavailable.
- Browser/live Supabase verification: not run; no configured runtime credentials or browser session was available.

## Remaining issues / verification needed

After extracting the ZIP, install dependencies in a network-enabled environment, then run `npm run lint`, `npm test`, and `npm run build`. Verify the Science page for an empty progress table, a populated progress table, and a newly completed topic. Verify classroom quiz assignment rendering as well. The route-identifier duplication should be investigated separately if it persists after this crash is fixed.
