# Devoted HQ Releases

## 4.1 — Dashboard Intelligence

Status: SHIPPED / PROD ACCEPTED

Git commit:

`7d7f474 add dashboard intelligence and task filter navigation`

Production Cloudflare Worker:

`devotedhqapp2-v4`

Production URL:

`https://devotedhqapp2-v4.gibby3579.workers.dev`

Cloudflare deployment version:

`b4c8e01d-efd6-40f4-bb4e-3571ca98c291`

### Major Changes

- added canonical Dashboard intelligence
- added Incomplete as a first-class canonical workload metric
- added Due Today
- added Overdue
- changed rolling forward horizon from 7 days to 10 days
- Dashboard primary cards became:
  - Incomplete
  - Due Today
  - Overdue
  - Due Next 10 Days
- Dashboard cards navigate directly to matching Tasks filters
- Tasks defaults to Incomplete
- added Next 10 Days Tasks filter
- changed This Week to Monday-Sunday calendar semantics
- retained Completed Last 7 Days intelligence for future secondary use
- added regression coverage for canonical Dashboard behavior
- preserved production D1 and R2 data

### Automated Validation

Before production deployment:

- core tests passed
- contract tests passed
- production Next.js build passed
- OpenNext Cloudflare build passed
- Git diff check clean
- feature branch fast-forwarded cleanly into main
- `main` synchronized with GitHub

### Production Dataset Preservation

Production validation confirmed that current production records remained intact
after deployment.

Observed production corpus during validation included approximately:

- 92 source records
- 31 primary actions
- 90 canonical items

Local August 5 fixtures were not imported into production.

### 4.1 Backlog Findings

The release itself was accepted, while production testing surfaced future items
captured in `BACKLOG.md`, including:

- human-friendly date display
- stronger status/attention hierarchy
- Schedule timeframe-aware navigation
- Recurring-work audit
- Work Block simplification/deprecation investigation
- canonical helper consolidation
- archived-state live validation
- legacy attachment reconciliation

---

## 4.2 — Operational Schedule Semantics and UX

Status:

**IMPLEMENTATION MERGED TO MAIN / NOT YET CLOUDFLARE DEPLOYED**

Current canonical Git head after 4.2A4:

`38f0481 use calendar weeks in schedule view`

### 4.2A1 — Schedule Semantic Engine

Commit:

`9bb4af0 implement schedule follow-up resurfacing semantics`

Canonical behavior introduced:

- one active Due / Follow-Up operational Schedule position
- post-deadline Follow-Up resurfacing
- original Due Date remains overdue truth
- invalid legacy Follow-Up dates do not move items backward
- completed items do not actively resurface
- Work Block remains independent
- ICS/calendar-export projection remains isolated

No database migration was performed.

### 4.2A2 — Schedule UI + Timeframe Navigation

Commit:

`211af63 improve schedule states and timeframe navigation`

Introduced:

- explicit Upcoming / Overdue / Follow-Up Schedule presentation
- overdue-since-original-Due-Date explanation
- accessible non-color semantic labels
- Day navigation by one day
- Week navigation by one week
- Month navigation by one month
- 3 Months navigation by three months
- Today synchronization
- preservation of same-day Work Block + Due meaning

### 4.2A3 — Operations Terminology

Commit:

`9452430 clarify operations terminology`

Terminology updates:

- Operations Queue -> Needs Action
- Open loops -> Open work
- What is missing? -> Project Readiness

No classification, filtering, ranking, lifecycle, or database behavior changed.

### 4.2A4 — Calendar Week Semantics

Commit:

`38f0481 use calendar weeks in schedule view`

Week now means:

**Sunday through Saturday calendar week containing the selected date**

Behavior includes:

- Month -> Week preserves selected focal date
- Week navigation moves exactly one calendar week
- Week heading reflects actual visible date range
- task population follows the visible Sunday-Saturday range
- cross-month weeks are supported

### 4.2A5 — Local QA Data Integrity

Status:

**ARCHITECTURE / DOCUMENTATION TRACK**

4.2 QA exposed that localhost was operating against the historical August 5
seeded dataset while the live DEV workspace had materially evolved.

Investigation confirmed:

- frozen repo fixture: 70 records / 9 actions / 6 attachments
- fresh August 29 DEV export: 105 records / 44 actions / 16 attachments
- local Miniflare D1 persisted the historical seed
- replacing the JSON fixture would not itself refresh populated local D1
- JSON export contains attachment metadata rather than attachment binaries
- local R2 binary state is separate

The approved response is a dedicated local QA snapshot-refresh framework rather
than using live D1 directly or continually rewriting the deterministic Git
fixture.

See:

`LOCAL-QA-DATA.md`

No Cloudflare deployment has occurred for 4.2 at the time of this entry.


### 4.2A5 Local QA Refresh Tool — Implementation

Status:

**IMPLEMENTED / VALIDATED / NOT YET APPLIED TO ACTIVE LOCALHOST**

4.2A5 introduced a local-only QA snapshot refresh utility:

`scripts/refresh-local-qa.py`

Package command:

`npm run qa:refresh`

The utility:

- defaults to dry-run mode
- accepts an explicitly selected full JSON backup
- supports SHA-256 verification
- targets only project-local Miniflare SQLite state
- refuses explicit SQLite targets outside the approved local D1 directory
- creates an automatic rollback snapshot before apply
- refreshes records, actions, preferences, migration metadata, and attachment metadata
- imports attachments as locally unavailable metadata
- strips production R2 storage keys from local attachment records
- records refresh provenance in local activity history
- does not invoke Wrangler
- does not mutate remote D1
- does not mutate remote R2

A disposable apply rehearsal successfully transformed a cloned local database
from 70 / 9 / 6 records-actions-attachments to 105 / 44 / 16 while preserving
relational integrity.

The active localhost database was not changed during the rehearsal.

The real localhost refresh remains separately gated after the tool is committed,
merged, and pushed.


### 4.2A6 — Schedule Density + Text Containment

Commit:

`b580ddc contain schedule density and long titles`

Status:

**IMPLEMENTED / VISUALLY ACCEPTED / MERGED TO MAIN**

OHO localhost acceptance identified two Schedule presentation issues after the
realistic August 29 QA dataset was introduced:

1. long titles could exceed Day / Week event-column boundaries;
2. crowded Month cells could expose only a clipped portion of a third event card.

A6 corrected these issues by:

- adding defensive Day / Week text containment;
- limiting Month preview cards to two complete events;
- representing additional Month workload through `+N more`;
- preserving the complete selected-day agenda below the Month calendar.

Validation:

- OHO visual acceptance passed;
- contract tests passed;
- production build passed;
- realistic localhost dataset remained 105 records / 44 actions / 16 attachment metadata records;
- frozen August 5 regression fixture remained unchanged;
- no production D1 mutation occurred;
- no production R2 mutation occurred.

The integrated Devoted HQ 4.2 localhost release-candidate pass now governs the
next deployment gate.

See:

`ACCEPTANCE-4.2.md`


### 4.2A7 — Weekly Agenda

Status:

**IMPLEMENTED / OHO VISUALLY ACCEPTED / PENDING CANONICAL COMMIT**

4.2 localhost release-candidate testing identified that Week View displayed
the seven-day calendar workload but did not provide the list-oriented weekly
workload OHO expected below it.

A7 adds a **Weekly Agenda** *(full task list for the visible week)* below the
existing Week Calendar.

The implementation:

- preserves the existing Sunday-through-Saturday Week Calendar;
- preserves existing Schedule Cards;
- derives the Weekly Agenda from the same visible-week date range;
- uses the same canonical Schedule projections as the Week Calendar;
- groups workload into date-based Agenda Sections;
- represents items with Record Rows;
- preserves the existing Item Drawer interaction;
- leaves Month Selected Day Agenda behavior unchanged.

OHO localhost visual acceptance passed on 2026-09-05.

OHO confirmed:

- the Weekly Agenda appears below Week View as expected;
- selecting a Record Row opens the Item Drawer as expected.

Automated contract coverage accompanies the implementation.

The intermittent Week-to-Month Schedule reset remains a separately scoped
release-candidate investigation and is not part of A7.

No D1, R2, schema, or external calendar-export behavior changed.
