# Devoted HQ Backlog

This backlog is intentionally inclusive.

Priority affects sequencing, not whether an item deserves to be remembered.

---

## P1 — Human-Friendly Date Presentation Layer

Preserve canonical/DB dates in their current machine-friendly format.

Improve displayed dates throughout operational UI surfaces such as Tasks,
Dashboard-related views, Schedule/detail contexts, and item drawers.

Preferred example:

`Mon. - 08/24/2026`

Goals:

- familiar U.S. date presentation
- include day of week where operationally useful
- centralize formatting in one shared presentation helper
- do not mutate stored dates
- allow future workspace/locale preferences without rewriting the data model

Origin:
PROD acceptance test #6 and item-detail review.

---

## P2 — At-a-Glance Status / Attention Hierarchy

Improve individual item detail views so state can be understood immediately.

Especially emphasize:

- COMPLETED
- OVERDUE
- BLOCKED
- other high-signal states as appropriate

Requirements:

- do not rely on color alone
- preserve visible textual state
- use semantic success/danger treatments consistently
- distinguish stored workflow status from derived attention state

Example:

`INBOX` plus a separate `OVERDUE` attention indicator

rather than rewriting the stored status to Overdue.

Potential future benefit:

The same semantic status system could drive:

- task rows
- search results
- item drawers
- Dashboard surfaces
- Schedule surfaces

Origin:
PROD acceptance test #11.

---

## P3 — Schedule Timeframe-Aware Navigation

Improve Schedule previous/next navigation so the arrow controls correspond to
the active timeframe and immediately update displayed schedule projections.

Desired behavior:

- Day -> previous/next day
- Week -> previous/next week
- Month -> previous/next month
- 3 Months -> previous/next three-month period, subject to UX review

The displayed date/range and displayed tasks must update together.

Current observed issue:

Outside Month view, arrows appear partially month-centric or stale, and Week
results may not update until Today is clicked, a date/task is selected, or the
view mode is changed.

Treat this as a meaningful Schedule behavior/UX improvement.

Origin:
PROD acceptance test #27.

---

## P4 — Work Block Minimization / Potential Deprecation

Audit every use of `scheduledAt` / Work Block across:

- UI
- canonicalization
- Schedule
- exports
- APIs
- migrations
- historical data
- tests

Determine whether Work Block provides unique operational value.

Preferred progression:

1. understand dependencies
2. minimize prominence
3. hide from normal OHO workflows if justified
4. observe impact
5. deprecate
6. remove only if proven safe

Do not delete the field or schema prematurely.

Origin:
4.1 Founder/Operator discussion.

---

## P5 — Canonical Helper Consolidation

`components/views.tsx` retains older local `isDone()` / `actionable()` logic while
canonical equivalents now exist in `lib/canonical.ts`.

Refactor consumers toward canonical helpers so Devoted HQ does not eventually
develop multiple competing definitions of:

- done
- archived
- actionable
- incomplete

This was deliberately deferred from 4.1 to avoid widening the release.

---

## P6 — Recurring Work Product / Architecture Audit

Current Tasks behavior classifies Recurring as:

`item.kind === "recurring_template"`

Audit:

- where recurring_template records originate
- whether the current UI allows users to intentionally create them
- how recurrence is supposed to work operationally
- whether recurrence creates future records automatically
- whether the concept is still valuable
- whether the Recurring filter should be completed, renamed, clarified, hidden,
  or deprecated

Do not assume the existence of a backend record kind proves there is a useful
user-facing feature.

Origin:
PROD acceptance test #19.

---

## P7 — Filter / Date Semantic Regression Coverage

Strengthen automated coverage around:

- Incomplete
- Due Today
- Overdue
- Next 3 Days
- This Week Monday-Sunday boundaries
- Next 10 Days
- completion
- archived exclusion
- canonical one-item-one-count guarantees

Where practical, presentation-level tests should confirm that Tasks and Dashboard
consume the same canonical semantics.

---

## P8 — Archived-State Live Validation

PROD acceptance test #10 could not fully validate Archived rendering because
production contained zero archived items at the time.

Future controlled validation should confirm:

- archived item appears under Archived
- archived item disappears from Incomplete
- archive state persists after refresh
- restoring an archived item behaves correctly if supported

---

## P9 — Legacy Attachment Recovery / Reconciliation Audit

Some migrated records retain attachment metadata while the original attachment
binary was never recovered from the original ChatGPT-hosted environment.

Example observed:

`Burchard - Email RE: Dog Poo`

Current behavior:
`Original file not restored`

Audit:

- which records are affected
- whether any original binaries can still be recovered
- whether legacy references can be reconciled
- whether permanently unavailable files need a clearer UI treatment

This is a known migration limitation, not a 4.1 regression.

Origin:
PROD acceptance test #34.

---

## P10 — Secondary Dashboard Momentum Intelligence

`recentlyCompleted` remains available in the canonical Dashboard intelligence
layer but is no longer one of the four primary Dashboard cards.

Consider a future secondary Dashboard / Review pulse containing metrics such as:

- Completed Last 7 Days
- This Week throughput
- This Month throughput
- workstream pulse

Do not crowd the primary operational decision row.

---

## Long-Horizon Product Direction

Continue evaluating Devoted HQ as a potentially modular, configurable,
white-label-friendly operating system for small businesses whose users wear many
hats.

Near-term architecture should avoid unnecessary Devoted-specific hard-coding
where a lightweight abstraction benefits Devoted today, but should not incur
premature SaaS complexity or paid infrastructure merely for speculative future use.

---

# Post-4.1 Strategic Roadmap

This section records directional sequencing rather than a locked release scope.

## Immediate Phase — OHO Production Observation

After the accepted 4.1 release, Devoted HQ should spend time in normal
production use before another feature release is immediately opened.

The Operator should use the system for real Devoted Landscaping work rather
than deliberately testing individual controls.

Capture naturally occurring observations such as:

- repeated friction
- unnecessary clicks
- confusing terminology
- information that is difficult to find
- features that are unexpectedly useful
- features that are routinely ignored
- workflow assumptions that do not survive real use
- genuine production defects

Unless a production-breaking defect is discovered, observations should be
captured and triaged rather than immediately triggering implementation.

## Next Planning Gate — Foundry Review 002

The next substantive product-planning session should be:

**Foundry Review 002 — OHO Findings + 4.2 Scope & Roadmap**

Inputs should include:

1. the existing canonical backlog
2. new OHO production observations
3. architectural and technical-debt considerations
4. longer-term product strategy

Candidate work should be evaluated using factors including:

- Operator value
- strategic leverage
- implementation cost
- implementation risk
- architectural consequences
- regression surface
- appropriate release scope

The purpose of Foundry Review 002 is to determine the next bounded release,
not to begin implementation before scope is understood.

## Preliminary Release Horizons

These horizons are directional and are not commitments to specific version
numbers or feature sets.

### 4.2 Candidate Horizon — Operational UX Refinement

Likely focus:

- high-value friction discovered through OHO use
- bounded presentation and interaction improvements
- existing backlog items with strong daily operational value

Current candidates include human-friendly date presentation,
status/attention hierarchy, and Schedule navigation behavior.

These candidates are **not yet approved 4.2 scope**.

OHO production experience and Foundry Review 002 should determine final scope.

### Subsequent Horizon — Schedule / Work-Model Refinement

Potential areas include:

- deeper Schedule behavior
- recurrence semantics
- Work Block role and visibility
- time-related workflow concepts

### Hardening Horizon

Continue reducing architectural and regression risk through work such as:

- canonical helper consolidation
- semantic regression coverage
- migration cleanup
- legacy-data reconciliation
- archived-state validation
- adjacent technical debt

### Platform Horizon

When justified by real product needs, evaluate architecture for:

- users
- memberships
- workspaces
- permissions
- tenant isolation
- configurable platform concepts

Do not introduce multi-tenant or SaaS complexity merely because it may be
useful someday.

### Intelligence Horizon

D.A.I.S.Y. and other AI/automation capabilities should be introduced where
intelligence provides genuine workflow leverage.

Deterministic software remains preferable when deterministic software solves
the problem more reliably and simply.

Potential future intelligence areas include:

- operational summaries
- exception detection
- prioritization
- recommendations
- natural-language interaction
- human-in-the-loop automation

### Long-Horizon Productization

Continue evaluating whether capabilities proven inside Devoted Landscaping can
become modular, configurable, or white-label-friendly platform capabilities.

The governing sequence is:

real Devoted problem
-> OHO validates the problem
-> Foundry identifies the reusable concept
-> implementation preserves sensible extensibility
-> Devoted proves the solution
-> broader productization is considered

Do not reverse this sequence by building speculative SaaS infrastructure before
the reference customer proves the underlying value.

## Technical-Debt Budget Principle

Product releases may include a small amount of adjacent architectural cleanup
when that cleanup reduces risk or prevents duplication.

Technical cleanup should not be allowed to silently expand a bounded product
release into a broad refactor.

Existing example:

The local `isDone()` / `actionable()` helpers in `components/views.tsx` should
eventually converge on canonical helpers in `lib/canonical.ts`, but that cleanup
was correctly excluded from 4.1.

---

# Post-4.1 OHO Field Findings

The following findings originated from substantial real-world production use
following the 4.1 release.

See `FIELD-REPORTS.md` for the underlying production evidence.

## Urgency / Priority Filtering

### Problem

OHO does not currently have an obvious and intuitive way to isolate work items
by urgency level.

This becomes increasingly useful when the active workload contains many
simultaneous workstreams and priorities.

### Desired Capability

Allow Tasks to be filtered by urgency/priority.

High-value cases include:

- High only
- Critical only
- potentially High + Critical together

### Scope Discipline

This is currently a filtering requirement.

It does not require redesigning the underlying urgency model merely to provide
the requested capability.

Final interaction design should be evaluated through Foundry review.

---

## Work Item Export, Sharing and Portability

Export should be evaluated as a broader product capability rather than as three
unrelated file-format features.

Current export surfaces include:

- PDF
- TXT
- ICS

The user-facing goal should be based on what the user is trying to accomplish
rather than requiring the user to understand the implementation format.

Potential capability areas include:

- human-readable document export
- portable text representation
- Add to Calendar
- standards-based calendar-file fallback
- future share/destination workflows where justified

Export destinations should derive from consistent canonical work-item semantics
rather than independently inventing interpretations of application state.

---

## Add to Calendar / Calendar Handoff

### Product Goal

Provide a low-friction way for a user to take a Devoted HQ work item and add it
to a calendar without requiring the user to manually manage an ICS file when a
more direct standards-based handoff is available.

The primary user-facing concept should be:

**Add to Calendar**

rather than requiring the user to understand:

**Export ICS**

ICS should remain available as a standards-based interoperability mechanism and
fallback.

### Approved Calendar Semantic Baseline

For the initial Add-to-Calendar capability:

- `Deadline` is the sole canonical source for the calendar-event date.
- Generated events should default to all-day.
- Devoted HQ should not infer an event time.
- Devoted HQ should not infer a duration.
- Follow-up should not silently substitute for Deadline.
- Work Block should not determine calendar-event timing.
- Users may modify time, duration, calendar, and other event details in the
  destination calendar where supported.

If a work item has no Deadline, Devoted HQ should not silently select another
date field as the event date.

### OHO iOS Evidence

On OHO's iPhone using Chrome, the current ICS workflow is technically functional
but operationally cumbersome.

Observed workflow:

Devoted HQ
-> download ICS
-> Chrome Downloads / Files
-> open or share ICS
-> third-party "ICS To Calendar" Shortcut
-> usable calendar-import experience

Opening the ICS directly through Files displays the event but does not provide
OHO with a sufficiently direct Add-to-Calendar workflow.

The Shortcut currently used by OHO was obtained from RoutineHub and provides a
bridge between the downloaded ICS data and the usable calendar-add experience.

### Zero-Auth Calendar Handoff Research Spike

Before implementation, investigate reliable cross-platform approaches including:

- HTTPS-served `text/calendar`
- `Content-Disposition` behavior
- direct HTTPS ICS handling
- iOS Safari behavior
- iOS Chrome behavior
- Web Share API / share-sheet behavior where applicable
- `data:text/calendar` behavior
- Google Calendar pre-populated event URLs
- Outlook / Microsoft calendar mechanisms
- Apple / device-calendar behavior
- desktop versus mobile behavior
- standards-compliant ICS fallback

### Authentication Constraint

Do not introduce OAuth or calendar-write permissions merely to solve calendar
export unless research demonstrates that the desired user experience cannot be
satisfactorily achieved without them.

A user-confirmed calendar handoff is preferable to authenticated calendar-write
infrastructure when it satisfies the workflow.

---

## PDF Export Presentation Refinement

### Finding

Real production exports demonstrate that the underlying exported content is
generally correct.

The primary improvement opportunity is presentation and layout.

### Observed Presentation Issues

- insufficient vertical clearance between the black Devoted HQ header and the
  beginning of work-item content
- title/body content can appear uncomfortably close to the header
- short exports can contain excessive unused whitespace
- page composition should adapt more gracefully to short versus long records
- long prompt/content exports need cleaner pagination and continuation behavior
- typography, spacing, metadata density, and visual hierarchy should be reviewed
  holistically

### Preserve

The refinement should preserve the established Devoted HQ visual identity.

Useful existing structure such as footer/page numbering should not be discarded
without a specific reason.

### Scope Discipline

This is primarily a presentation/layout refinement.

Current evidence does not indicate that the canonical exported work-item content
model itself is defective.

---

## Work Block Deprecation Direction

OHO reports that Work Block does not materially improve the current operational
workflow.

Work Block remains a deprecation candidate.

New calendar-export architecture should not depend on Work Block for event
timing.

This does not authorize immediate removal.

Before deprecation or removal, audit dependencies across:

- UI
- canonicalization
- Schedule
- exports
- APIs
- migrations
- historical data
- automated tests

Preferred progression remains:

1. understand dependencies
2. minimize prominence
3. hide from normal OHO workflows if justified
4. observe impact
5. deprecate
6. remove only when proven safe

---

# OHO Field Report 002 Follow-Up

See `FIELD-REPORTS.md` for the underlying 2026-08-28 production observations.

## Projects -> Operations Semantics Audit

### Question

Clarify how Project status and Project state affect what surfaces in the
Operations tab.

Before changing behavior, inspect the current implementation and document:

- current inclusion/exclusion rules
- relationship between Project status and Operations
- whether Operations surfaces Projects, actionable work, exceptions, or a
  combination
- whether current behavior matches intended canonical product semantics

### Scope Discipline

Do not redesign Projects or Operations merely because the relationship is
currently unclear.

First establish what the application does and what the product intends the
relationship to mean.

---

## Deadline / Follow-Up Integrity

### Candidate Rule

When both Deadline and Follow-Up exist, evaluate establishing the canonical
constraint:

`Follow-Up >= Deadline`

### Open Questions

Foundry review must determine:

- whether same-day Deadline and Follow-Up is valid
- whether Follow-Up should instead be strictly later than Deadline
- treatment of legacy records that violate the eventual rule
- appropriate UI validation
- appropriate API/canonical validation
- whether Follow-Up's current product definition supports this constraint

### Data Safety

Do not automatically rewrite historical or production records merely because a
new validation rule is introduced.

---

## Operations Navigation Controls

OHO expects previous/next navigation arrows in the dashboard-style control above
the two primary Operations sections.

Before implementation:

- inspect the current Operations time-frame behavior
- reconcile this request with the existing time-frame-aware navigation backlog
- determine whether the existing navigation capability should be extended rather
  than duplicated
- define expected previous/next behavior for each supported time frame

---

## Operations Queue / What's Missing Classification Audit

Inspect and document the current classification logic for:

- Operations Queue
- What's Missing

Produce an explicit classification model showing which conditions cause an item
to appear in each section.

Foundry review should then determine:

- whether the current rules match intended product semantics
- whether labels are sufficiently understandable
- whether explanatory UI is required
- whether any underlying classification logic should change

Do not change classification behavior until current and intended semantics are
both understood.

---

## Accounting Strategic Foundry Review

### Strategic Question

Determine the appropriate role of Accounting and financial operations within
Devoted HQ under the Platform Constitution.

This is intentionally broader than an Accounting-tab redesign.

### Review Areas

Evaluate whether Devoted HQ should primarily:

- own
- coordinate
- summarize
- link
- orchestrate

accounting and financial workflows, and where combinations are justified.

Review:

- coordination-layer product thesis
- specialized-system boundaries
- canonical versus external financial data
- Monthly Close workflow
- master financial workbook
- financial quick links and supporting artifacts
- integrations
- operator workflow
- security and financial-data boundaries
- platform generality
- approximately $0 incremental-cost constraint

### Constitutional Constraint

Do not rebuild specialized accounting functionality merely because Devoted HQ
can technically do so.

Replacement should require demonstrated operator or platform value.

### Status

**Dedicated Foundry strategic review required before implementation scope is
approved.**

---

# Project / Operations Inspection Disposition

The following dispositions result from the read-only source inspection initiated
by OHO Field Report 002.

## Project Stage / Work Status UX Clarity

### Confirmed Model

Projects intentionally have two state dimensions:

- Project Stage = lifecycle position
- Work Status = execution state of current actionable work

### Improvement Opportunity

Improve UI terminology and information hierarchy so users can understand the
distinction without needing knowledge of the underlying data model.

Review surfaces including:

- Quick Add
- Project item drawer
- Operations
- Tasks
- Search results
- completion controls

Do not collapse the two state models merely for cosmetic simplicity.

---

## Operations Queue Semantics

### Current Behavior

The current Operations Queue displays up to eight actionable, incomplete items
from selected operational Workstreams.

It does not currently implement a distinct queue-ranking algorithm before
displaying the first eight matches.

### Product Options

#### Option A - Semantic Rename

Rename the section to describe its current behavior more honestly.

Candidate concept:

**Operational Open Loops**

This is the lower-complexity option.

#### Option B - Genuine Prioritized Queue

Evolve the section into a true attention-ranked Operations Queue using shared
canonical prioritization semantics.

Possible inputs may include:

- overdue state
- Critical / High priority
- upcoming Deadline
- due Follow-Up
- waiting-on state
- impact
- other canonical attention signals where justified

### Architecture Constraint

Do not create another independent ranking implementation inside
`OperationsView`.

If prioritized queue behavior is approved, it should consume shared canonical
attention semantics wherever practical.

### Foundry Direction

Prefer truthful terminology immediately when implementation scope permits.

Evaluate genuine queue ranking separately as a bounded capability.

---

## Project Readiness Summary / What Is Missing

### Confirmed Mismatch

The current `What is missing?` section does not calculate missing Project
requirements.

It currently displays all non-archived Projects with basic lifecycle and
next-step context.

### Near-Term Direction

Prefer renaming the section to match what it actually provides rather than
building speculative diagnostic complexity.

Candidate concepts for UX review include:

- Project Readiness
- Project Next Steps
- Readiness Snapshot

Final wording requires Priya/OHO UX review.

### Future Capability

A genuine readiness diagnostic may be considered later if production evidence
demonstrates value.

Potential diagnostic inputs might eventually include missing:

- Deadline
- Owner
- next action
- required lifecycle information
- waiting-on resolution
- stage-specific information

These examples are exploratory, not approved requirements.

---

## Follow-Up / Deadline Integrity - Disposition

### Earlier Candidate

OHO Field Report 002 recorded the candidate rule:

`Follow-Up >= Deadline`

### Inspection Result

**Candidate rejected.**

Current product behavior supports Follow-Up as a reminder/check-back date, which
may legitimately precede Deadline.

### Canonical Direction

Do not add general validation requiring Follow-Up to occur on or after Deadline.

Instead, preserve independent Deadline and Follow-Up semantics.

---

## Schedule Navigation - Confirmed Implementation Deficiency

Read-only inspection confirmed that previous/next Schedule arrows currently
change month state regardless of active mode.

Day and Week views use `selectedDate`, while the existing arrow behavior does
not advance that selected date.

This directly explains OHO's previously reported behavior.

### Desired Direction

Previous/next controls should become timeframe-aware:

- Day -> previous / next day
- Week -> previous / next week
- Month -> previous / next month
- 3 Months -> previous / next three-month period, subject to UX review

Displayed range and displayed work should update together.

This finding strengthens the existing Schedule navigation backlog item and does
not require a duplicate independent feature.

## Schedule Semantic Clarity + Navigation — 4.2 Candidate

### Status

Foundry-scoped implementation candidate following OHO Field Report 002 and read-only Schedule inspection.

### Schedule Due / Follow-Up projection

Replace simultaneous Due + Follow-Up Schedule projection with conditional resurfacing semantics.

Required behavior:

- incomplete + Due Date not passed -> show at Due Date;
- incomplete + Due Date passed + no Follow-Up -> remain represented against Due Date as overdue;
- incomplete + Due Date passed + Follow-Up -> show at Follow-Up position and retain overdue truth from original Due Date;
- completed items must not actively resurface because of Follow-Up;
- Work Block remains independently modeled for this release;
- do not mutate stored dates merely because the current date changes.

### Schedule presentation

Provide immediately understandable differentiation between:

1. Upcoming
2. Overdue without Follow-Up
3. Resurfaced overdue with Follow-Up

Preferred language includes:

- `Due Sep 10`
- `OVERDUE · Due Sep 10`
- `FOLLOW-UP · Overdue since Sep 10`

Do not rely on color alone.

Use shared semantic state so Month, Day, Week, and agenda presentations do not develop conflicting rules.

### Schedule navigation

Make previous / next navigation aware of active visible range:

- Day -> move one day;
- Week -> move one week;
- Month -> move one month;
- 3 Months -> move three months.

Keep selected date, visible range, month/year heading, and Today behavior synchronized under the canonical business timezone.

### Calendar-export isolation

Changing operational Schedule projection must not silently change the approved Deadline-centric ICS / Add-to-Calendar contract.

Inspect/refactor the projection boundary as needed so operational resurfacing and external calendar-event generation can evolve independently.

### Regression coverage

Replace the existing contract that requires separate Due and Follow-Up projections with explicit time-dependent tests covering at minimum:

- before Due Date;
- on Due Date;
- after Due Date with Follow-Up;
- after Follow-Up while still incomplete;
- overdue with no Follow-Up;
- completed item with Follow-Up;
- month/year boundary behavior;
- Day / Week / Month / 3 Months navigation;
- Today reset;
- prevention of simultaneous Due + Follow-Up Schedule duplication.

Prefer deterministic canonical functions that accept explicit date context rather than hiding system-clock dependence inside projection logic.

### Related Operations terminology

For the current Operations semantic-clarity pass:

- `Operations Queue` -> `Needs Action`
- `What is missing?` -> `Project Readiness`

`Needs Action` is intentionally provisional and may receive a broader product-strategy review after additional OHO usage and cross-business applicability evidence.

### Explicit non-goals

Do not include in this release unless separately approved:

- Work Block removal;
- database schema changes;
- automatic stored-date mutation;
- scheduled midnight jobs;
- speculative Project Readiness rules engine;
- AI;
- major Accounting redesign;
- full Operations prioritization redesign.

### Supersession of Earlier Follow-Up Backlog Disposition

Earlier backlog text under `Follow-Up / Deadline Integrity - Disposition`
described Follow-Up as an independent reminder date that could legitimately
precede Deadline.

That interpretation is preserved for historical traceability but is now
**SUPERSEDED**.

The current implementation direction is defined by
`Schedule Semantic Clarity + Navigation — 4.2 Candidate` and the corresponding
canonical decision record.

### Legacy Date Compatibility

Before create/edit validation is introduced, 4.2 Schedule projection must safely
handle existing records where:

`Follow-Up Date <= Due Date`

Such a Follow-Up value should not move an overdue item backward in time.

For operational projection, treat that value as unavailable for resurfacing and
keep the incomplete item represented against its original Due Date as overdue.

Add regression coverage for this case.

Do not mutate the stored record merely to satisfy projection behavior.

---

## P11 — Local QA Snapshot Refresh + Provenance

4.2A5 established that the current localhost Miniflare D1 was originally seeded
from the frozen August 5 recovery fixture and does not automatically refresh as
the live DEV workspace evolves.

Implement a safe local-only refresh workflow.

Requirements:

- accept an explicitly selected full JSON backup
- validate structure and relational integrity before mutation
- verify the target is local Miniflare D1
- refuse remote D1 targets
- preserve/archive existing local QA state before replacement
- import current records/actions/preferences/migration metadata
- handle attachment metadata without falsely asserting binary availability
- report source `exportedAt`, snapshot hash, import timestamp, and resulting
  counts
- leave `data/devoted-hq-backup.json` frozen by default
- never mutate DEV/production D1 or R2

The first implementation should prefer **metadata-only attachment refresh**.

Optional local R2 binary mirroring should remain a separately designed and
approved capability.

See:

`LOCAL-QA-DATA.md`

Origin:

4.2A5 Schedule QA investigation / OHO localhost testing.

---

## Post-4.2 Production Acceptance Findings

### P1 - Preserve operational status across completion reversal

**Priority:** HIGH

**Candidate release:** 4.2.1

**Source:** OHO Field Report 003, 2026-09-06

Current completion reversal can produce a lossy transition such as:

`Inbox -> Completed -> Not Started`

Required behavior:

Completion must be reversible without destroying the item's previous
operational status.

Examples include:

- `Inbox -> Completed -> Inbox`
- `Waiting -> Completed -> Waiting`
- `Ready -> Completed -> Ready`
- `Scheduled -> Completed -> Scheduled`
- `Blocked -> Completed -> Blocked`

#### Acceptance direction

- Determine all code paths capable of marking an item Completed.
- Determine all code paths capable of reversing completion.
- Determine whether current canonical data preserves enough information to
  restore the previous state.
- Do not solve this merely by replacing the `Not Started` fallback with
  `Inbox`.
- Prefer one canonical transition rule shared across UI surfaces.
- Define an explicit fallback for historical completed items whose previous
  status cannot be recovered.
- Preserve completion timestamps and related semantics correctly.
- Add regression coverage for multiple pre-completion statuses.
- Verify Dashboard, Task List, Record Row, and Item Drawer behavior.
- Do not introduce speculative workflow-state architecture beyond what the
  defect requires.

**Status:** OPEN / HIGH-PRIORITY INVESTIGATION

---

### P2 - Remove Work Block from active Schedule projection unless justified

**Priority:** MEDIUM

**Source:** OHO Field Report 003, 2026-09-06

Production inspection confirmed that a canonical item may appear once through
its Work Block and again through its Due/Follow-Up operational position.

This creates multiple calendar positions for one canonical item.

Current OHO direction:

- Due Date remains deadline truth.
- Follow-Up remains post-due resurfacing.
- Work Block is no longer materially used by OHO.
- Work Block is already a deprecation candidate.

#### Acceptance direction

Investigate whether active Schedule projection should ignore Work Block while
preserving existing stored Work Block data.

Keep these decisions separate:

1. whether Work Block appears in Schedule;
2. whether Work Block remains editable;
3. whether Work Block is hidden from the Item Drawer;
4. whether Work Block is formally deprecated;
5. whether historical Work Block data is ever migrated or removed.

Do not mutate production Work Block data merely to remove its Schedule
projection.

**Status:** OPEN / PRODUCT-MODEL INVESTIGATION

---

## September OHO Workflow Findings

Source:

`OHO Field Report 004 - September Workflow and Operations Observations`

### 4.2.1 - Completion-state investigation expansion

**Priority:** HIGH

Expand the existing 4.2.1 completion-state reversibility investigation to
include the 2026-09-02 Quick Add observation in which an item created with a
Completed status remained in the Incomplete Task Filter until the separate
completion control was used.

The investigation must determine whether:

- Status;
- completion metadata;
- Quick Add;
- Item Drawer editing;
- completion controls; and
- Task Filter classification

share one canonical completion transition or currently represent partially
independent mechanisms.

Do not assume a common root cause with the previously documented completion
reversal defect until source inspection confirms it.

**Status:** OPEN / 4.2.1 INVESTIGATION

---

### Due Date / Follow-Up entry validation

**Priority:** MEDIUM

4.2 established Follow-Up as post-due resurfacing.

Investigate UI/data validation requiring a valid Follow-Up to occur after its
Due Date.

Current defensive Schedule behavior for invalid legacy values should remain
separate from prospective entry validation.

Questions include:

- reject invalid entry;
- prevent selection;
- display validation feedback;
- treatment of existing invalid legacy records.

**Status:** OPEN / VALIDATION INVESTIGATION

---

### 4.3 - Operations semantics and classification

**Priority:** HIGH

Perform a deliberate Operations investigation before substantial Operations
redesign.

At minimum, establish current and intended relationships among:

- Projects;
- Project Status;
- Project Stage;
- Project Readiness Pipeline;
- Needs Action;
- Project Readiness;
- Deadline / Due Date;
- Follow-Up;
- linked actions;
- missing information;
- completion state.

Use the 2026-09-04 Knickerbocker Xeriscape observation as a concrete production
case.

The investigation should answer:

- Why does an item enter each Operations section?
- Why does it remain there?
- What removes it?
- Can OHO predict the behavior?
- Does the classification represent an operationally useful concept?
- Is any logic overfit to Devoted rather than modeled as a general capability?

Do not redesign Operations solely from terminology or one production example.

**Status:** OPEN / 4.3 CANDIDATE

---

### Operations summary navigation

**Priority:** MEDIUM

Investigate clearer navigation or drill-down from the Operations summary /
dashboard area.

OHO specifically suggested directional controls such as arrows.

Determine the semantic destination and user task before selecting the visual
control.

**Status:** OPEN / OPERATIONS UX

---

### Reference Tab operator-managed content

**Priority:** MEDIUM

Evolve References toward operator-maintained operational knowledge.

Candidate capability:

- create Reference content;
- view Reference content;
- edit/update Reference content;
- remove Reference content.

Do not assume all Reference information has identical security requirements.

Before allowing sensitive financial/account information, complete a Foundry
security/product review covering storage, authorization, exposure, backup,
export, and whether Devoted HQ should store that information at all.

**Status:** OPEN / FUTURE FEATURE

---

### Accounting framework review

**Priority:** STRATEGIC

Reassess Accounting within the broader Devoted HQ product thesis and Platform
Constitution.

Determine what Devoted HQ should own versus coordinate, summarize, link,
orchestrate, or leave to specialized financial systems.

Avoid incremental cosmetic redesign before the product boundary is understood.

**Status:** OPEN / FOUNDRY STRATEGIC REVIEW
