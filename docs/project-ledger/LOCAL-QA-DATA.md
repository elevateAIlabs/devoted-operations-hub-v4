# Devoted HQ Local QA Data Framework

## Purpose

This document defines how Devoted HQ development and localhost QA environments
should obtain realistic test data without confusing local state with the live
DEV/production workspace or placing production data at unnecessary risk.

The goal is:

**realistic local testing with explicit provenance and controlled refreshes.**

Local QA data is not the canonical live workspace.

---

## Canonical Environment Separation

Devoted HQ currently has several distinct data concepts that must not be treated
as interchangeable.

### Live DEV / Production Workspace

The live Cloudflare environment contains the current operational Devoted HQ
workspace.

Current infrastructure includes:

- Cloudflare D1 database: `devotedhq-db-v4`
- Cloudflare R2 bucket: `devotedhq-r2-v4`
- authenticated owner-scoped application data

The live environment is authoritative for current operational work.

Local QA procedures must not mutate live D1 or R2 merely to obtain test data.

---

### Frozen Repository Fixture

The repository contains:

`data/devoted-hq-backup.json`

This file is a historical recovery/export fixture.

Audited provenance:

- exportedAt: `2026-08-05T06:34:55.571Z`
- records: `70`
- actions: `9`
- attachments: `6`

SHA-256 observed during 4.2A5:

`756a21ac0cffc74572ef8b822714f240174db6c670428a62103a738f937da725`

The fixture is imported by `lib/repository.ts`.

It also supports automated regression tests.

This historical fixture should remain stable unless an explicit fixture
migration is reviewed and approved.

It should not silently become a moving copy of the current live workspace.

---

### Mutable Local Miniflare D1

`npm run dev` uses project-local Cloudflare / Miniflare state.

During 4.2A5 inspection, the active local D1 SQLite database was located under:

`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`

The audited local database contained:

- records: `70`
- actions: `9`
- attachments: `6`

Its activity log confirmed that it had originally been seeded from the August 5
repository fixture.

The local database is persistent mutable QA state.

It is not automatically refreshed when the repository JSON fixture changes.

---

## Seed Lifecycle

`lib/repository.ts` imports the frozen repository fixture and exposes
`ensureSeeded(ownerEmail)`.

The seed is only applied when:

1. the requested owner has no records; and
2. the database has not already been claimed by another workspace owner.

If owner-scoped records already exist, seeding does not replace or refresh them.

Therefore:

**changing `data/devoted-hq-backup.json` alone does not refresh an existing local
Miniflare D1 database.**

This behavior is intentional protection against silently overwriting workspace
data.

A deliberate local refresh mechanism must therefore manage local QA state
explicitly.

---

## 4.2A5 Fresh DEV Snapshot

OHO generated a new full JSON export from the live DEV environment on
2026-08-29.

Audited snapshot:

- exportedAt: `2026-08-29T04:42:47.194Z`
- records: `105`
- actions: `44`
- attachments: `16`

SHA-256:

`58a2e9d63b821e5273d4b5ba11999bd0b624612e583d7ce9f828a149b73a93cf`

Structural audit confirmed:

- no duplicate record IDs
- no duplicate action IDs
- no duplicate attachment IDs
- zero orphan actions
- zero attachments with missing parent records
- zero attachments with missing referenced actions
- no `available=true` attachment lacking a storage key
- no storage-key-bearing attachment marked unavailable

Compared with the August 5 fixture:

### Records

- old: 70
- fresh: 105
- shared: 70
- fresh-only: 35
- old-only: 0

### Actions

- old: 9
- fresh: 44
- shared: 9
- fresh-only: 35
- old-only: 0

### Attachments

- old: 6
- fresh: 16
- shared: 0
- fresh-only: 16
- old-only: 6

The attachment difference is consistent with known migration history and later
manual cleanup of unrecoverable legacy Burchard attachment references.

---

## Why Fresh Local Data Matters

During 4.2 Schedule validation, localhost initially appeared to be failing to
surface expected work.

Further testing showed that most Schedule behavior was functioning correctly.

The principal source of confusion was that localhost contained the historical
August 5 dataset while OHO's live DEV workspace had evolved substantially.

The old local dataset contained only nine records with Due Dates and only four
records with Follow-Up dates.

The fresh DEV snapshot contains substantially richer scheduling data:

- 41 records with Due Dates
- 28 records with Follow-Up dates
- 5 records with scheduled/work-block values

It also contains a significantly larger real operational workload.

Therefore a reasonably fresh QA snapshot improves validation of:

- Schedule Day view
- Schedule Week view
- Schedule Month view
- task-list density
- Due / Follow-Up resurfacing
- cross-month calendar behavior
- crowded dates
- real OHO workflows
- larger-workload UI behavior

Fresh test data improves product testing without making live production data the
runtime dependency of localhost.

---

## Attachment Model

Full JSON backup contains attachment metadata.

It does not embed attachment binaries.

Fresh attachment records contain fields including:

- attachment ID
- parent record ID
- optional action ID
- file name
- content type
- size
- availability
- R2 storage key

Actual file bytes live in R2.

Therefore:

**D1/JSON snapshot refresh and R2 binary refresh are separate concerns.**

---

## Local Attachment State

The historical local D1 contained six legacy attachment records.

All six were:

- `available = false`
- missing a storage key

The local Miniflare R2 state contained no corresponding user attachment objects.

This matches the seed behavior in `lib/repository.ts`, which deliberately marks
seeded attachment metadata unavailable.

The historical attachment records therefore do not prove that local attachment
binaries exist.

---

## Live Attachment State

The audited August 29 snapshot contains 16 attachment records.

All 16:

- are structurally linked to valid records
- have valid storage keys
- are marked available

Those storage keys refer to objects in the live Cloudflare R2 environment.

The JSON snapshot itself does not contain those file bytes.

A future local snapshot refresh must never falsely claim that a file is locally
available merely because production metadata says it is available.

---

## Approved Local QA Data Architecture

The approved model separates four roles:

### 1. Frozen Regression Fixture

Purpose:

- deterministic tests
- migration/regression reference
- historical recovery evidence

Location:

`data/devoted-hq-backup.json`

Policy:

**stable by default**

---

### 2. External Fresh Snapshot

Purpose:

- source material for refreshing realistic local QA state

Source:

a manually exported full JSON backup from the live Devoted HQ Export feature

Policy:

**explicitly selected and audited before use**

A fresh export is not automatically committed to Git.

---

### 3. Mutable Local QA D1

Purpose:

- localhost development
- manual acceptance testing
- real-workload UX evaluation

Policy:

**refreshable and disposable only through an explicit local-only workflow**

The workflow must never target remote D1.

---

### 4. Local QA R2

Purpose:

- attachment-binary testing when needed

Policy:

**independent from D1 snapshot refresh**

A metadata-only refresh may intentionally mark attachment files unavailable.

A future binary-mirroring workflow may populate local R2 through a separate,
explicit operation.

Remote R2 must never be modified as part of local refresh.

---

## Refresh Safety Principles

Any future local QA refresh implementation must:

1. be explicitly local-only
2. identify the target Miniflare D1 before mutation
3. refuse to run against remote D1
4. preserve or archive existing local QA state before destructive replacement
5. validate the selected JSON snapshot before import
6. preserve owner-scoped relational integrity
7. distinguish attachment metadata from attachment bytes
8. never claim attachment availability when the local binary is absent
9. leave the frozen repository regression fixture unchanged by default
10. produce an auditable summary of imported counts and source provenance

The preferred workflow is:

live DEV
-> Full JSON Export
-> external snapshot file
-> validation/audit
-> explicit local QA refresh
-> localhost testing

Not:

live DEV D1
-> localhost application runtime

and not:

replace frozen Git fixture
-> hope existing Miniflare state refreshes itself

---

## Attachment Refresh Modes

A future refresh tool should support at least two conceptual modes.

### Metadata-Only Refresh

Import current:

- records
- actions
- attachment metadata
- preferences
- migration metadata

But mark attachments locally unavailable unless their binaries actually exist in
local R2.

This should be the default and safest QA refresh.

### Binary-Preserving / Mirrored Attachment Refresh

Optional future capability.

If implemented, it must:

- copy source attachment bytes through a read-only production path
- write them only into local QA R2
- verify local object existence
- only then mark local attachment metadata available

This capability is not required merely to obtain current task and Schedule data.

---

## Provenance

Local QA should eventually make its dataset provenance obvious.

Useful provenance includes:

- snapshot `exportedAt`
- snapshot hash
- import timestamp
- record count
- action count
- attachment metadata count
- attachment binary availability count

The operator should be able to determine whether localhost represents:

- the frozen fixture
- a recent DEV snapshot
- or locally modified QA state

without reverse-engineering the database.

---

## Release / Deployment Boundary

Refreshing local QA data is not a Cloudflare deployment.

Cloudflare deployment is not a data refresh.

Git code changes are not database migrations.

These are separate operational classes and must remain separately gated.

No 4.2A5 local-data operation should modify live DEV/production D1 or R2.

---

## 4.2A5 Status

Architecture / provenance investigation:

**COMPLETE**

FHO approval:

**APPROVED**

Documentation canonization:

**IN PROGRESS**

Remaining implementation:

- design local snapshot refresh command/tool
- preserve existing local QA state before first refresh
- perform metadata-only refresh using an audited current snapshot
- validate refreshed localhost behavior
- add provenance reporting
- evaluate optional local attachment binary mirroring separately

The August 29 full JSON snapshot remains external to Git while the refresh
mechanism is being designed.


---

## Implemented Local QA Refresh Tool

4.2A5 includes an explicit local-only QA refresh utility:

`npm run qa:refresh`

Implementation:

`scripts/refresh-local-qa.py`

The utility accepts an explicitly selected Devoted HQ full JSON backup and
targets only a project-local Miniflare SQLite database under:

`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`

The utility does not invoke Wrangler and provides no remote D1 or R2 mutation
path.

### Default Behavior: Dry Run

Dry run is the default behavior.

Example:

    npm run qa:refresh -- \
      "/path/to/devoted-hq-full-backup.json" \
      --expected-sha256 "<audited-sha256>"

Dry run:

- validates the JSON structure
- validates IDs and parent relationships
- verifies the selected SHA-256 when supplied
- identifies the project-local Miniflare D1
- reports current and source counts
- does not mutate local D1

### Apply Behavior

Mutation requires the explicit `--apply` flag.

For apply operations:

- `--expected-sha256` is mandatory
- the selected SQLite target must reside inside the project-local Miniflare D1 directory
- a pre-refresh SQLite backup is automatically created under `.local-qa-snapshots/`
- records, actions, preferences, migration metadata, and attachment metadata are replaced from the approved snapshot
- a local QA provenance activity event is created

### Attachment Safety

The initial refresh mode is metadata-only.

Imported attachment metadata is intentionally rewritten locally so that:

- `available = false`
- `storage_key = NULL`

This prevents production R2 storage references from being mistaken for local
binary availability.

Local R2 is not modified.

### Proven Safety Rehearsal

Before use against the active localhost D1, 4.2A5 performed an apply rehearsal
against a disposable clone of the historical local database.

The clone successfully changed from:

- 70 records
- 9 actions
- 6 attachments

to:

- 105 records
- 44 actions
- 16 attachments

Validation confirmed:

- zero orphan actions
- zero orphan attachment records
- zero orphan attachment actions
- all imported attachments unavailable locally
- zero production storage keys retained
- one refresh provenance event created
- automatic pre-refresh rollback snapshot created
- real active localhost D1 remained bit-for-bit unchanged
- frozen August 5 regression fixture remained unchanged

The disposable rehearsal database was deleted after validation.

### Runtime Artifacts

The following remain local runtime state and must not be committed:

- `.local-qa-snapshots/`
- Python `__pycache__/`
- Python bytecode files

These are excluded through `.gitignore`.

### Governing Principle

Local QA refresh is a deliberate data operation distinct from:

- Git changes
- application deployment
- production D1 mutation
- production R2 mutation
- schema migration

A refresh must never be treated as an incidental side effect of starting
localhost.
