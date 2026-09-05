# Devoted HQ 4.2 Release Candidate Acceptance

## Status

**LOCALHOST RELEASE-CANDIDATE ACCEPTANCE IN PROGRESS**

Cloudflare deployment is not yet authorized.

This acceptance pass evaluates the integrated Devoted HQ 4.2 release against the
realistic localhost QA dataset refreshed from the audited August 29 DEV export.

---

## Canonical Release Candidate

Current canonical Git commit:

`b580ddc contain schedule density and long titles`

The integrated 4.2 release candidate includes:

### 4.2A1 — Schedule Semantic Engine

Commit:

`9bb4af0 implement schedule follow-up resurfacing semantics`

Introduced:

- one active Due / Follow-Up operational Schedule position
- original Due Date remains deadline truth
- valid post-deadline Follow-Up can resurface incomplete work
- invalid legacy Follow-Up dates do not move work backward
- completed items do not actively resurface
- external calendar-export semantics remain isolated

### 4.2A2 — Schedule UI + Timeframe Navigation

Commit:

`211af63 improve schedule states and timeframe navigation`

Introduced:

- Upcoming / Overdue / Follow-Up Schedule presentation
- overdue-since-original-deadline explanation
- Day navigation by one day
- Week navigation by one week
- Month navigation by one month
- 3 Months navigation by three months
- Today synchronization

### 4.2A3 — Operations Terminology

Commit:

`9452430 clarify operations terminology`

Introduced terminology updates:

- Operations Queue -> Needs Action
- Open loops -> Open work
- What is missing? -> Project Readiness

No classification or database behavior changed.

### 4.2A4 — Calendar Week Semantics

Commit:

`38f0481 use calendar weeks in schedule view`

Week means:

**Sunday through Saturday calendar week containing the selected date**

Cross-month calendar weeks are supported.

### 4.2A5 — Local QA Data Integrity

Canonical implementation commit:

`01b0466 add local QA snapshot refresh workflow`

Introduced:

- frozen regression fixture remains separate from mutable localhost QA data
- explicit local-only snapshot refresh utility
- dry-run validation
- audited SHA-256 apply gate
- automatic local rollback snapshot
- attachment metadata-only refresh mode
- local attachment binaries remain intentionally unavailable unless separately mirrored
- no remote D1/R2 mutation path

The active localhost QA environment was successfully refreshed from the audited
August 29 DEV export.

Current localhost QA source counts:

- 105 records
- 44 actions
- 16 attachment metadata records

### 4.2A6 — Schedule Density + Text Containment

Commit:

`b580ddc contain schedule density and long titles`

Visual acceptance confirmed:

- long titles remain contained within Day / Week columns
- Month cells render no more than two complete event previews
- additional events appear through `+N more`
- clicking/selecting a Month date continues to expose the complete date workload below
- realistic local QA dataset remained intact

---

# OHO Localhost Release-Candidate Pass

## Purpose

This is not a code-review exercise.

OHO should use localhost as an operator and determine whether Devoted HQ 4.2
behaves coherently against realistic Devoted Landscaping data.

The governing question is:

**Can OHO trust what the system is showing and use it naturally without having
to mentally compensate for confusing behavior?**

---

## Environment

Target:

`http://localhost:5173`

Expected local QA dataset:

- records: 105
- actions: 44
- attachments: 16 metadata records
- attachment binaries: intentionally unavailable locally

Production DEV data must not be mutated during this acceptance pass.

---

# OHO Acceptance Checklist

## 1. Overall Smoke Test

Navigate naturally through:

- Dashboard
- Tasks
- Schedule
- Operations
- Accounting
- Content
- Reference
- Tools
- Review

Look for:

- blank screens
- runtime errors
- broken layouts
- unexpected navigation
- obviously stale data
- contradictory information

---

## 2. Schedule — Month

Inspect crowded dates, especially dates around:

- August 27
- August 28
- August 31
- September 1
- September 2
- September 3

Confirm:

- no event card is partially clipped in a broken-looking state
- maximum two complete previews appear per Month cell
- additional workload appears as `+N more`
- titles remain contained
- selecting a date exposes the full date workload below
- selected date highlighting behaves correctly
- adjacent-month dates remain understandable

---

## 3. Schedule — Week

Confirm:

- Week represents Sunday through Saturday
- heading matches the visible seven-day range
- previous arrow moves exactly one week backward
- next arrow moves exactly one week forward
- cross-month weeks behave correctly
- event population changes with the visible week
- long task titles remain inside their column
- Follow-Up / Overdue / Work Block states are understandable

---

## 4. Schedule — Day

Confirm:

- previous moves exactly one day
- next moves exactly one day
- Today returns to the current date
- long titles remain contained
- displayed work corresponds to the selected day

---

## 5. Schedule — 3 Months

Confirm:

- previous / next moves three months at a time
- dates containing work remain visibly identifiable
- selecting a mini-calendar date transitions coherently into Month view

---

## 6. Due / Follow-Up Semantics

Look for real examples where possible.

Confirm the product meaning feels correct:

### Upcoming

Before deadline:

`Due [date]`

### Overdue

After missed deadline with no valid resurfacing:

`OVERDUE`

with original Due Date retained.

### Follow-Up resurfacing

An incomplete overdue item with a valid later Follow-Up should appear later while
still communicating that the original deadline was missed.

It should not appear as though Follow-Up erased the overdue state.

### Completed work

Completed work should not continue actively resurfacing as Due / Follow-Up work.

### Duplicate prevention

The same master work item should not appear as simultaneous independent Due and
Follow-Up copies merely because both dates exist.

---

## 7. Dashboard / Tasks / Schedule Consistency

Pick several recognizable real work items.

Compare them across:

- Dashboard
- Tasks
- Schedule
- item drawer

Look for contradictions in:

- status
- completion
- Due Date
- Follow-Up
- overdue meaning
- title
- ownership / assignment

Different views may emphasize different information.

They should not tell incompatible stories about the same work.

---

## 8. Tasks

Confirm normal use still feels intact:

- Incomplete filter
- Due Today
- Overdue
- Next 10 Days
- This Week
- search
- opening task detail

Look for:

- incorrect counts
- obviously missing work
- completed items appearing as incomplete
- archived behavior leaking into active workload
- strange date semantics

---

## 9. Operations

Confirm terminology feels understandable:

- Needs Action
- Project Readiness
- Project readiness pipeline

For Projects, remember:

- lifecycle stage answers where the Project is in its business lifecycle
- execution status answers the state of current actionable work

Look for situations where the interface makes those concepts appear contradictory.

---

## 10. Attachments

Localhost currently contains attachment metadata but intentionally does not
mirror production R2 binaries.

Expected local behavior:

- attachment references may appear
- files should not falsely appear locally available
- no production R2 storage reference should magically become usable locally

This is expected QA behavior, not a release defect.

Unexpected attachment crashes or misleading availability states should still be
reported.

---

## 11. Editing / Interaction Regression Sniff Test

Without making risky or valuable changes, exercise ordinary interactions such as:

- opening item detail
- navigating between sections
- search
- filters
- switching Schedule modes
- selecting dates
- opening crowded-day agenda items

Only perform edits or completion changes against disposable QA candidates.

Do not deliberately alter important operational records merely for acceptance
testing.

---

# Observation Classification

Every finding should be placed into one of three buckets.

## RELEASE BLOCKER

Examples:

- data corruption
- incorrect canonical semantics
- crashes
- major missing workload
- navigation materially showing the wrong date/range
- duplicate work that changes operational meaning
- broken UI that prevents practical use
- production-data safety concern

A release blocker stops Cloudflare deployment.

---

## 4.2 POLISH CANDIDATE

Examples:

- awkward spacing
- truncation that remains understandable
- confusing wording
- unnecessary click
- visual hierarchy issue
- minor interaction friction

Capture it.

Do not automatically stop release.

---

## FUTURE BACKLOG

Examples:

- desirable new capability
- broader redesign
- feature idea
- workflow improvement unrelated to a regression
- Accounting strategy work
- Work Block redesign/deprecation
- recurrence redesign

These belong in future Foundry planning unless they reveal a release defect.

---

# OHO Acceptance Principle

OHO should not deliberately torture every control.

Use Devoted HQ naturally.

The strongest evidence is whether 4.2 survives realistic operator use against a
realistic workload without requiring explanation from the implementation team.

If something causes the reaction:

- "Why is this here?"
- "Where did that go?"
- "Why does this view disagree with the other one?"
- "Why did that date move?"
- "Why is this overdue here but not there?"
- "Why do I need to know how the code works to understand this?"

capture it.

That reaction is useful product evidence even if the implementation is
technically functioning.

---

## Deployment Gate

Cloudflare deployment remains prohibited until:

1. OHO completes the integrated localhost release-candidate pass.
2. release blockers are zero or explicitly resolved.
3. Foundry reviews any material findings.
4. canonical Git main remains clean and synchronized.
5. final automated validation passes.
6. production D1/R2 preservation is reconfirmed.


---

## Canonical UI/UX Language

4.2 acceptance observations should use the terminology defined in:

`docs/project-ledger/UI-UX-TERMINOLOGY.md`

Examples include:

- Schedule Card
- Calendar Cell
- Overflow Count
- Selected Day Agenda
- Weekly Agenda
- Agenda Section
- Record Row
- Item Drawer

Until further notice, nuanced terms should include a brief plain-English
parenthetical explanation when first introduced during OHO / Foundry discussion.

This terminology requirement changes communication only. It does not alter
Schedule behavior or implementation semantics.


---

## 4.2A7 — Weekly Agenda OHO Acceptance

**Status:** OHO VISUAL ACCEPTANCE PASSED

**Date:** 2026-09-05

OHO performed localhost visual acceptance of the 4.2A7 Weekly Agenda
implementation against the realistic August 29 QA dataset.

Canonical terminology applies.

### Accepted Behavior

The **Week Calendar** *(Sunday-through-Saturday calendar area)* remains visible
and continues to display its existing **Schedule Cards**
*(task boxes inside the calendar)*.

A **Weekly Agenda** *(full task list for the visible week)* now appears below
the Week Calendar.

The Weekly Agenda:

- represents the complete canonical Schedule workload for the visible week;
- follows the same Sunday-through-Saturday range displayed by Week View;
- groups work into **Agenda Sections** *(one date grouping inside the Agenda)*;
- displays individual work items as **Record Rows**
  *(individual items in the list)*;
- opens the existing **Item Drawer**
  *(right-side full item details panel)* when a Record Row is selected.

OHO specifically confirmed that:

1. the Weekly Agenda appears below Week View as expected; and
2. selecting a Record Row from the Weekly Agenda opens the Item Drawer as
   expected.

### Preserved Behavior

4.2A7 does not change:

- Schedule projection semantics;
- Due Date meaning;
- Follow-Up meaning;
- Work Block meaning;
- Sunday-through-Saturday Week boundaries;
- Month View;
- the **Selected Day Agenda** *(task list for one selected date)*;
- D1;
- R2;
- database schema;
- ICS / calendar-export behavior.

### Separate Finding

The previously observed intermittent Schedule View reset from Week View back to
Month View remains a separate investigation.

That behavior was deliberately excluded from 4.2A7 scope.

### Disposition

**A7 implementation:** ACCEPTED

**Release blocker introduced by A7:** None observed

**Cloudflare deployment authorized by this acceptance alone:** No

The integrated 4.2 localhost release-candidate acceptance remains in progress.


---

## Schedule View Reset Investigation

**Status:** MONITOR / NOT CURRENTLY REPRODUCIBLE / NON-BLOCKING

**Date:** 2026-09-05

During the beginning of the 4.2 localhost acceptance session, OHO observed the
**Schedule View** *(main Schedule screen)* apparently returning from Week View
to Month View approximately two times without intentionally selecting Month
View.

OHO subsequently attempted to reproduce the behavior through normal and
aggressive interface interaction but could not reproduce it again.

A narrow read-only source inspection was performed after 4.2A7 became
canonical.

### Read-Only Findings

The inspection found:

- Schedule mode is local React state;
- Schedule mode initializes to Month when ScheduleView mounts;
- the **View Selector** *(Day / Week / Month / 3 Months controls)* is the normal
  path for changing Schedule mode;
- only one explicit non-selector `setMode("Month")` exists;
- that explicit Month transition belongs to the intentional 3 Months Calendar
  interaction when selecting a mini-calendar date;
- no Schedule-specific effect forces Month View;
- no timer, router refresh, reload handler, or data-refresh callback was found
  directly changing Schedule mode;
- no suspicious React key was found forcing ScheduleView to remount.

### Important Behavior

Because Schedule mode currently initializes as Month when ScheduleView mounts,
a genuine component remount will return the Schedule interface to Month View.

This means a reset to Month can legitimately occur after conditions such as:

- a true browser reload;
- leaving Schedule and later remounting Schedule;
- development-time component remount behavior such as localhost Fast Refresh.

Schedule mode persistence across full remounts or browser reloads is not
currently a 4.2 product requirement.

### Current Disposition

No unintended Schedule-mode mutation path was identified.

The behavior is therefore classified:

**MONITOR / NOT CURRENTLY REPRODUCIBLE / NOT A RELEASE BLOCKER**

No application-code change is authorized from this finding alone.

### Reopen Condition

Reopen this investigation if OHO reproduces the reset during stable localhost
use while all of the following are true:

- OHO remains on the Schedule Tab;
- no browser refresh occurs;
- SK is not modifying source code;
- localhost Fast Refresh is not occurring;
- OHO did not select Month through the View Selector;
- OHO did not select a date from the 3 Months Calendar.

If reproduced under those conditions, capture the immediately preceding user
interaction and treat it as new release-candidate evidence.


---

## 4.2 Cross-View Operational Consistency Acceptance

**Status:** OHO VISUAL ACCEPTANCE PASSED

**Date:** 2026-09-05

OHO performed an integrated localhost acceptance pass across the core
operational surfaces using the refreshed local QA dataset.

The confirmed local QA universe remained:

- 105 source records;
- 44 primary actions;
- 16 attachment metadata rows.

The acceptance pass focused on consistency between the **Tasks Tab**, the
**Schedule View** *(main Schedule screen)*, the **Week Calendar**, the
**Weekly Agenda** *(full task list for the visible week)*, **Record Rows**
*(individual items in a list)*, and the **Item Drawer**
*(right-side full item details panel)*.

### Follow-Up Resurfacing

The record:

`Create & Update Pending Email Templates in HomeWorks`

had the following underlying operational data:

- Deadline: 2026-09-01;
- Follow-Up: 2026-09-05;
- incomplete status.

OHO visually confirmed:

- the Week Calendar displays the item on September 5;
- its **Schedule Card** *(task box inside the calendar)* is identified as
  FOLLOW-UP;
- the Schedule Card communicates `Overdue since Sep 1`;
- the Weekly Agenda places the corresponding Record Row under Saturday,
  September 5;
- the Weekly Agenda communicates `FOLLOW-UP · Overdue since Sep 1`;
- selecting the Record Row opens the existing Item Drawer;
- the Item Drawer preserves Deadline `2026-09-01`;
- the Item Drawer preserves Follow-Up `2026-09-05`;
- the same item remains present in the Tasks Tab under the Overdue filter.

This confirms the intended 4.2 semantic contract:

**Follow-Up changes where incomplete work operationally resurfaces without
rewriting its authoritative Deadline or removing its overdue status.**

### Plain Overdue Control

The record:

`Find Comparable 16' Landscape Trailer In Immediate Area`

had:

- Deadline: 2026-09-03;
- no Follow-Up;
- incomplete status.

OHO visually confirmed that it remains positioned on September 3 and is
presented as OVERDUE rather than FOLLOW-UP.

### Single-Position Follow-Up Control

The record:

`INVOICE ALL SEPT RECURRING CLIENTS`

had:

- Deadline: 2026-09-01;
- Follow-Up: 2026-09-02;
- incomplete status.

OHO visually confirmed:

- the item operationally appears on September 2 as FOLLOW-UP;
- it communicates `Overdue since Sep 1`;
- no second independent Due representation was observed on September 1.

This confirms the intended single-position operational projection and guards
against simultaneous Due and Follow-Up duplication.

### Completed-Work Control

The completed record:

`Prepare & Submit 2025 Tax P&L Packet to CPA`

contained historical Deadline and Follow-Up data.

OHO confirmed that the completed item did not actively project into the Week
Calendar or Weekly Agenda merely because those historical dates remained on
the record.

### Week Calendar and Weekly Agenda Consistency

For the tested visible week, OHO visually confirmed that the Schedule Cards
displayed in the Week Calendar were represented by corresponding Record Rows
in the Weekly Agenda on the same operational dates.

No obvious:

- orphaned Schedule Card;
- duplicate operational projection;
- date disagreement;
- Follow-Up / Deadline contradiction;
- completed-item resurfacing

was observed during this acceptance pass.

### Item Drawer Consistency

The Item Drawer opened successfully from the Weekly Agenda and preserved the
canonical record data used to derive the Schedule presentation.

The tested long-content Item Drawer also remained usable through its Overview,
Attachments, and item-level export areas.

### Tasks and Schedule Consistency

OHO confirmed that a record operationally resurfaced on its Follow-Up date in
Schedule can simultaneously remain in the Tasks Overdue filter when its
authoritative Deadline has passed.

This is intentional behavior and represents two compatible operational
questions:

- Schedule: where should the incomplete work resurface now?
- Tasks / Overdue: has the authoritative Deadline been missed?

### Disposition

**Core Tasks / Schedule / Weekly Agenda / Item Drawer cross-view consistency:**
PASSED

**Release blocker identified by this acceptance pass:** None

**Application-code change required:** No

**Cloudflare deployment authorized by this acceptance alone:** No

The integrated 4.2 localhost release-candidate acceptance should continue into
the remaining product surfaces before the final Foundry deployment gate.


---

## 4.2 Current-Architecture Test Gate Correction

**Status:** TEST-HARNESS CORRECTION / NO APPLICATION BEHAVIOR CHANGE

**Date:** 2026-09-05

During the final 4.2 **Deployment Gate**
*(final validation before production deployment)*, the canonical contract tests
and production Next.js build passed, but the repository-level `npm test`
command subsequently attempted to execute two older integration tests:

- `tests/rendered-html.test.mjs`
- `tests/owner-isolation.test.mjs`

Both tests import:

`dist/server/index.js`

Read-only investigation confirmed that the current Devoted HQ deployment
architecture no longer produces that artifact.

The canonical Cloudflare application now uses:

- Next.js production output;
- OpenNext for Cloudflare;
- `.open-next/worker.js` as the Worker entrypoint;
- `wrangler.json` as the explicit Cloudflare deployment configuration.

The historical `dist/server/index.js` tests therefore exercise a superseded
Vinext / Sites-era packaged artifact rather than the current deployment
artifact.

### Decision

The two historical tests are preserved in the repository but removed from the
default `npm test` gate.

They remain executable through:

`npm run test:legacy-dist`

The canonical `npm test` command now validates the active application
architecture through:

1. the Devoted HQ contract suites; and
2. the production Next.js build.

The 4.2 pre-deployment process separately continues to require:

- OpenNext Cloudflare build;
- existence of `.open-next/worker.js`;
- Wrangler deployment dry-run;
- canonical Git synchronization;
- frozen regression-fixture verification;
- local QA data-integrity verification.

### Important Scope Boundary

This correction does **not**:

- delete the historical integration tests;
- claim that their behavioral concerns are unimportant;
- rewrite them to target OpenNext;
- change application code;
- change the **Schedule View** *(main Schedule screen)*;
- change the **Weekly Agenda** *(full task list for the visible week)*;
- change the **Item Drawer** *(right-side full item details panel)*;
- mutate D1;
- mutate R2;
- change database schema;
- deploy Cloudflare.

Owner-isolation coverage should later receive a deliberate OpenNext-native
integration-test replacement rather than a blind import-path substitution.

### Release Disposition

The missing `dist/server/index.js` artifact is classified as a legacy
test-harness mismatch, not a 4.2 application regression.

The corrected test gate must pass in full before the Foundry production
deployment decision.


### Confirmed Wrangler Configuration Redirect

A subsequent read-only deployment inspection confirmed that the local file:

`.wrangler/deploy/config.json`

contains a redirected configuration path targeting:

`dist/server/wrangler.json`

The current repository does not contain:

- `dist/`;
- `dist/server/`; or
- `dist/server/wrangler.json`.

That redirect belongs to the superseded packaged-artifact architecture.

The canonical root:

`wrangler.json`

remains present and explicitly targets:

`.open-next/worker.js`

An explicit Wrangler dry-run using:

`npx wrangler deploy --config wrangler.json --dry-run`

completed successfully.

Wrangler recognized the expected current production bindings:

- D1: `devotedhq-db-v4`;
- R2: `devotedhq-r2-v4`;
- Assets: `ASSETS`.

### Canonical Deployment Rule

For the current OpenNext architecture, 4.2 deployment validation and production
deployment must explicitly use:

`--config wrangler.json`

This prevents stale local Wrangler redirect metadata from selecting a
superseded deployment configuration.

The stale `.wrangler/deploy/config.json` file is local runtime metadata and is
not being deleted or modified as part of this release correction.

### Disposition

The earlier Wrangler dry-run failure is classified as:

**STALE LOCAL DEPLOYMENT CONFIGURATION / NOT AN APPLICATION REGRESSION**

The explicit canonical Wrangler configuration passed dry-run validation.

No application behavior changed.
