# Devoted HQ V4

Private Devoted Landscaping operations hub reconstructed from the verified
August 5, 2026 V3 export and recovered production assets.

## Product contract

- One canonical master item across Dashboard, Tasks, Schedule, Content, and exports.
- Work blocks, deadlines, and follow-ups are projections of that item, not duplicate records.
- Existing V3 record, action, prompt, attachment, and migration identifiers remain preserved.
- Owner identity comes from the Sites-authenticated request and every database query is owner-scoped.
- The recovered backup can be claimed only by the first authorized workspace owner; later identities receive an empty workspace.
- Missing attachment bytes and resource URLs stay visibly unavailable rather than pretending to work.
- The original V3 deployment is independent of this project and must remain untouched.

## Stack and bindings

- Vinext / React / TypeScript
- Cloudflare D1 binding: `DB`
- Cloudflare R2 binding: `BUCKET`
- Drizzle schema and migration files under `db/` and `drizzle/`
- Sites project identity in `.openai/hosting.json`

## Validation

- `npm run lint` — source linting
- `npx tsc --noEmit` — strict type checking
- `npm run test:contracts` — V4 data, calendar, copy, PDF, and Accounting contracts
- `npm test` — contract tests, production build/artifact validation, rendered HTML, and simulated second-user isolation
- `npm run validate:artifact` — validate an existing deployable artifact

Every Sites deployment URL is production. Do not deploy this project until the
release candidate has passed the full validation command and Greg has approved
the reviewed candidate.
