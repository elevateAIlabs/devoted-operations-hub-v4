# Devoted HQ Decisions

## Canonical Master Item Model

Devoted HQ should operate around one canonical master-item representation rather
than exposing duplicate legacy record/action chains to the user.

Dashboard intelligence, Tasks filtering, Schedule projections, exports, and
future UI intelligence should consume canonical data wherever practical.

## Dashboard Intelligence 4.1

Approved primary Dashboard metrics:

1. Incomplete
2. Due Today
3. Overdue
4. Due Next 10 Days

### Incomplete

Incomplete represents the total live actionable workload:

- actionable
- not archived
- not completed

It is the default Tasks working view.

### Due Today

Due Today is driven by canonical due date.

It is intentionally separate from future planning windows.

### Overdue

Overdue is a derived attention condition:

- due date is before today
- item is still incomplete

Overdue should not automatically replace the underlying stored workflow status.

### Due Next 10 Days

The forward planning window is rolling and deliberately excludes today:

`today < dueDate <= today + 10 days`

This avoids overlap with Due Today.

The 10-day horizon was selected because OHO often assigns dates somewhat
arbitrarily and benefits from a slightly wider forward-looking correction window.

### This Week

"This Week" means the current Monday-through-Sunday calendar week.

It is not equivalent to a rolling seven-day window.

## Completed Metric

Completed Last 7 Days remains useful performance/momentum intelligence but was
removed from the four prime Dashboard tiles.

It may later be surfaced in a secondary pulse, Review, or momentum area.

## Task Filter Navigation

Dashboard metric tiles should navigate directly to their corresponding Tasks
filter rather than opening Tasks on a generic All view.

## Task Default

Tasks should default to `Incomplete`, not `All`.

`All` remains available as a broad reference/audit view.

## Date Storage vs Presentation

Canonical/storage dates should remain in machine-friendly ISO-compatible form.

Future human-friendly presentation should occur in the UI layer without changing
database values or canonical date contracts.

## Work Block

Work Block remains supported for backward compatibility during 4.1.

Its current user value is questionable.

Future treatment should follow:

Minimize -> Hide if appropriate -> Observe -> Deprecate if proven unnecessary ->
Remove only when compatibility risk has been eliminated.

## Production Data Safety

Local development fixtures and production D1 data are separate environments.

Production data should never be overwritten merely to create local test parity.

Production deployments should be code/build deployments unless a migration or
data operation is explicitly required and reviewed.

## Git as Safety Net

Git is the primary source-code safety mechanism.

Temporary `.bak` traps and source-rewriting deployment hacks should not replace
proper branches, diffs, commits, tests, and controlled deployment steps.

## Deployment Pipeline

Current preferred sequence:

1. clean generated build artifacts
2. Next.js production build
3. OpenNext Cloudflare build
4. verify `.open-next/worker.js`
5. deploy using explicit canonical `wrangler.json`
6. verify Git state
7. perform production acceptance testing

Current explicit deploy command:

`npx wrangler deploy --config wrangler.json`

This avoids previously encountered redirected-config / duplicate binding issues.

## Infrastructure

Current production resources include:

- Cloudflare Worker: `devotedhqapp2-v4`
- D1 binding: `DB`
- D1 database: `devotedhq-db-v4`
- R2 binding: `BUCKET`
- R2 bucket: `devotedhq-r2-v4`
- Assets binding: `ASSETS`
