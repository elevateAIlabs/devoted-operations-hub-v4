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

---

# Development and Release Governance

## Canonical Development Loop

Meaningful Devoted HQ product changes should normally progress through:

1. OHO observation or identified problem
2. Foundry Review
3. approved bounded scope
4. controlled implementation on an appropriate Git branch
5. local validation
6. diff and architecture review
7. Foundry Gate
8. commit and merge to `main`
9. push to GitHub
10. production build
11. controlled deployment
12. production acceptance testing
13. backlog / decision / release / acceptance ledger update
14. release closure

The process may be proportionally simplified for trivial documentation or
low-risk maintenance changes.

## Post-Release Observation Principle

A successful production deployment does not automatically require immediate
development of the next release.

After meaningful releases, normal Operator use should be allowed to expose
real workflow friction before subsequent scope is locked.

Production-breaking defects remain exceptions and may require immediate
intervention.

## Observation Before Implementation

Operator observations should normally enter the sequence:

**OHO Observation -> Foundry Triage -> Backlog / Decision -> Release Candidate**

An observation is not automatically a feature requirement.

This protects the product from reactive implementation while preserving
valuable operational findings.

## Reference-Implementation Productization Rule

Devoted Landscaping remains the reference implementation.

Reusable product capabilities should preferably emerge from problems proven in
the reference implementation rather than from speculative assumptions about
future customers.

The strategic progression is:

**prove value -> identify reusable primitive -> generalize sensibly -> consider productization**

not:

**predict hypothetical SaaS requirements -> build infrastructure -> search for a problem**

## AI / Automation Principle

AI should not be added merely because a workflow can technically contain AI.

The Foundry should prefer deterministic implementation when it is simpler,
more reliable, easier to test, and sufficient for the job.

AI and automation should be introduced when they provide material operational
leverage that deterministic software does not provide as effectively.

# Platform Constitution Adoption

## Constitutional Status

Following the 4.1 production release and establishment of the canonical Foundry,
Devoted HQ formally adopted a Platform Constitution.

Canonical document:

`docs/project-ledger/PLATFORM-CONSTITUTION.md`

The Constitution preserves and updates the original architectural and product
principles that guided Devoted HQ's transition from a Devoted-specific
application toward a potentially configurable operating platform.

## Purpose

The Constitution exists above ordinary implementation decisions.

It defines durable constraints intended to prevent a sequence of individually
reasonable decisions from collectively causing architectural or product drift.

Roadmaps may change.

Backlog priority may change.

Infrastructure may change.

Implementations may change.

The Constitution defines the principles those changes should normally continue
to satisfy.

## Governing Product Thesis

Devoted HQ is treated as an operational coordination layer rather than a system
that must replace every specialized business application.

Its role is to know:

- what needs attention
- why it matters
- where supporting information lives
- what is waiting on whom
- what happens next

Devoted Landscaping remains the reference implementation and proving ground, but
not the architectural definition of the platform.

## Constitutional Review

Material changes to the Platform Constitution require:

- explicit Foundry Review
- documented rationale
- consideration of architectural and product implications
- FHO approval
- preservation of historical rationale through Git

Constitutional principles should not be modified incidentally during unrelated
feature development.

## Foundry Verdict

**APPROVED AND CANONIZED**

The Platform Constitution becomes part of the durable Devoted HQ project ledger.

---

# Post-4.1 Field Evidence and Export Decisions

## Production Evidence vs Product Conclusions

Real-world production observations should be preserved separately from the
conclusions later drawn from them.

Canonical responsibilities:

- `FIELD-REPORTS.md` records observed real-world production evidence.
- `BACKLOG.md` records possible future action and investigation.
- `DECISIONS.md` records approved product, architecture, and governance choices.
- `RELEASES.md` records what shipped.
- release acceptance documents record whether a release met its approved
  acceptance criteria.

A Field Report does not automatically create a requirement.

It provides evidence the Foundry may use when deciding what deserves action.

## Export UX Principle

Export functionality should be designed around the user's intended outcome
rather than exposing implementation file formats as the primary interaction when
a clearer user-oriented action exists.

PDF and TXT may legitimately remain file/document exports.

Calendar export is different because the typical user goal is to add the work
item to a calendar rather than merely possess an ICS file.

The user-facing capability should therefore move toward **Add to Calendar** while
retaining standards-based ICS interoperability where useful.

## Calendar Event Date Rule

For the initial Add-to-Calendar capability, `Deadline` is the sole canonical
source for the generated calendar-event date.

Because Deadline currently represents a date rather than a date/time:

- generated events default to all-day
- Devoted HQ does not infer a time
- Devoted HQ does not infer a duration
- Follow-up does not silently substitute for Deadline
- Work Block does not determine calendar-event timing

Where supported, the destination calendar may allow the user to modify the event
before or after saving.

If no Deadline exists, another date field should not be silently substituted.

## Calendar Authentication Direction

The initial calendar-handoff investigation should prefer a zero-auth,
user-confirmed workflow when that workflow can satisfy the product requirement.

OAuth, calendar-write permissions, stored calendar credentials, or equivalent
authenticated integration infrastructure should not be introduced merely to
avoid downloading an ICS file.

Authenticated calendar integration may be reconsidered if future requirements
demonstrate that direct calendar writing or synchronization provides sufficient
value to justify the additional complexity and security surface.

## Work Block and New Capabilities

Work Block is a deprecation candidate based on OHO production experience.

New calendar-export architecture should not be designed around Work Block.

This decision does not authorize Work Block removal.

Existing dependencies should be audited before any destructive deprecation step.

---

# Project, Operations and Follow-Up Semantics

These decisions follow the read-only source inspection prompted by OHO Field
Report 002.

## Project Stage and Work Status

Projects retain two independent but related state dimensions.

### Project Stage

Project Stage describes the Project's position in its business lifecycle.

Examples include:

- New Lead
- Scope in Progress
- Estimate in Progress
- Proposal Sent
- Approved
- Ready for Field
- Active
- Closeout Needed
- Complete

### Work Status

Work Status describes the execution state of the Project's current actionable
work.

Project Stage and Work Status should not be collapsed into one field merely to
simplify presentation.

The distinction represents useful operational information.

## Project Completion

Completing the current actionable work does not automatically mean the entire
Project lifecycle is complete.

A Project may therefore have completed execution work without automatically
moving its Project Stage to `Complete`.

Any future automation connecting the two states must be justified by explicit
workflow evidence rather than inferred merely from similar terminology.

## Operations Project Readiness Pipeline

The Project Readiness Pipeline remains lifecycle-oriented.

Its primary question is:

**Where is each Project in its lifecycle?**

Project Stage / `lifecycleStatus` is the appropriate classification dimension for
that pipeline.

## Follow-Up Date

Follow-Up Date is defined as:

**The date on which Devoted HQ should bring an item back to the operator's
attention for a check-in, reminder, or subsequent action.**

Follow-Up may legitimately occur:

- before Deadline
- on Deadline
- after Deadline

Therefore Devoted HQ should not establish a general invariant requiring
Follow-Up to be greater than or equal to Deadline.

This supersedes the earlier candidate `Follow-Up >= Deadline` rule recorded for
investigation in OHO Field Report 002.

The historical candidate remains in the ledger as part of the reasoning trail.

## Operations Semantic Honesty

User-facing labels should describe what the underlying product behavior actually
does.

The current Operations Queue and `What is missing?` labels require refinement
because their names imply behavior not fully represented by the current
implementation.

A terminology change may be appropriate before introducing substantially more
complex underlying behavior.

## Readiness Diagnostic Discipline

Devoted HQ should not create a complex Project-readiness rules engine merely to
justify the existing `What is missing?` label.

If true readiness diagnostics later demonstrate meaningful OHO value, they
should be designed as an explicit product capability with defined rules and
acceptance criteria.

Until then, simpler and more truthful presentation is preferred.

## Schedule Follow-Up Resurfacing Semantics — 2026-08-28

### Status

Accepted by FHO/OHO following Foundry review and read-only implementation inspection.

This decision clarifies and supersedes any earlier interpretation that treated Follow-Up as a general pre-deadline check-in date.

### Canonical meaning of Due Date

Due Date / Deadline remains the authoritative date by which actionable work is expected to be completed.

For Schedule and overdue semantics, an incomplete item becomes overdue after its Due Date has passed under the application's canonical business-date/timezone rules.

The Due Date remains the source of overdue truth even when a Follow-Up Date exists.

### Canonical meaning of Follow-Up Date

Follow-Up Date is a post-deadline resurfacing instruction for incomplete work.

Its purpose is to ensure that an item that was not completed by its Due Date is deliberately brought back to the operator's attention on a later date rather than falling through the cracks.

Follow-Up does not replace or rewrite the original Due Date.

A resurfaced item remains overdue because its original Due Date has passed.

### Single active Due / Follow-Up Schedule position

The Devoted HQ Schedule should not simultaneously display separate Due and Follow-Up occurrences for the same incomplete item.

For the Due / Follow-Up relationship, an incomplete item has one effective Schedule position at a time:

1. Before or on its Due Date, display it on the Due Date.
2. After its Due Date, if no Follow-Up Date exists, leave it represented on its original Due Date as overdue.
3. After its Due Date, if a Follow-Up Date exists, use the Follow-Up Date as its effective resurfacing position while preserving the original Due Date as the source of overdue truth.
4. Completion prevents active Follow-Up resurfacing.
5. Work Block / scheduled work is a separate semantic concept and is not redefined by this decision.

This is projection behavior. It does not mutate the stored Due Date or Follow-Up Date when time passes.

### Schedule presentation states

The Schedule UI should clearly distinguish at least these three operator states:

#### Upcoming

Incomplete and the Due Date has not passed.

Example:

Irrigation Repair
Due Sep 10

#### Overdue without Follow-Up

Incomplete, the Due Date has passed, and no Follow-Up Date is set.

Example:

🔴 Irrigation Repair
OVERDUE · Due Sep 10

#### Resurfaced overdue

Incomplete, the Due Date has passed, and a Follow-Up Date exists.

The item is presented at its effective Follow-Up Schedule position while remaining overdue from its original Due Date.

Example:

🔴 Irrigation Repair
FOLLOW-UP · Overdue since Sep 10

The UI must not rely on color alone to communicate these states. Textual and/or structural semantic indicators must remain available for accessibility and immediate comprehension.

### Shared semantic rendering

Month, Day, Week, selected-day agenda, and other Schedule presentations should derive their labels from shared Schedule semantics rather than independently recreating Due / Follow-Up logic in each renderer.

### Calendar export boundary

Operational Schedule resurfacing semantics must not silently redefine external calendar-export semantics.

ICS / Add-to-Calendar behavior remains governed by the separately approved calendar-export contract in which Deadline is the canonical initial calendar-event date.

The operational Schedule projection and external calendar-event projection may therefore require separate canonical helpers or adapters.

### Validation

This decision defines product meaning but does not yet authorize destructive normalization or silent mutation of existing records.

Before enforcing creation/edit validation for Due Date and Follow-Up Date relationships, existing data must be inspected for compatibility and the Foundry must explicitly approve the validation behavior.

### Foundry rationale

The previous Schedule projected Due Date and Follow-Up Date independently, causing the same master item to appear twice.

FHO/OHO clarified that Follow-Up was originally intended as a safety net after an incomplete item passes its deadline.

The revised model preserves one master item, one authoritative deadline, one effective Due / Follow-Up Schedule position, and a visible explanation for why overdue work has resurfaced.

### Supersession Note — Earlier Follow-Up Interpretation

Earlier project-ledger analysis concluded that Follow-Up could generally function
as a pre-deadline check-back date and therefore rejected a proposed
`Follow-Up >= Deadline` constraint.

That interpretation is retained in Git as part of the historical reasoning
record, but it is now **SUPERSEDED** by the FHO/OHO clarification documented in
`Schedule Follow-Up Resurfacing Semantics — 2026-08-28`.

Current canonical product meaning is:

- Due Date is the authoritative deadline.
- Follow-Up is a post-deadline resurfacing instruction for incomplete work.
- Follow-Up does not remove or cure overdue state.
- Schedule should not simultaneously project separate Due and Follow-Up
  occurrences for the same incomplete item.

### Legacy Follow-Up Compatibility Rule

Validation of stored Due Date and Follow-Up Date relationships is not yet
authorized.

Until validation is explicitly approved, operational Schedule projection must
remain safe when encountering legacy or inconsistent records.

If an incomplete item has both dates and:

`Follow-Up Date <= Due Date`

the Follow-Up Date must not be used as the post-deadline resurfacing position.

For Schedule purposes, that record should behave as though no valid resurfacing
date exists:

- the original Due Date remains authoritative;
- once that Due Date passes, the item remains represented as overdue against the
  original Due Date;
- stored production data is not silently modified.

This compatibility rule protects Schedule behavior without rewriting historical
data.

---

# 4.2A5 Decision — Frozen Regression Fixture vs Refreshable Local QA Data

**Status:** APPROVED

**Date:** 2026-08-29

## Decision

Devoted HQ will treat the repository recovery fixture and the mutable localhost
QA dataset as separate architectural concepts.

`data/devoted-hq-backup.json` remains a stable historical/regression fixture.

Realistic localhost testing should instead be supported by an explicit
local-only snapshot-refresh workflow using a separately exported and audited
full JSON backup.

An already-populated local Miniflare D1 must not be expected to refresh merely
because the repository seed file changes.

## Rationale

4.2 Schedule testing showed that stale local data can create false defect
signals when the implementation is tested against a materially older
operational workload.

At the same time, continuously replacing the deterministic repository fixture
with current production data would weaken regression reproducibility and blur
the boundary between source control and operational data.

Separating these concepts provides both:

- deterministic regression coverage
- realistic current-workload QA

## Attachment Boundary

JSON backup preserves attachment metadata, not attachment binaries.

Attachment metadata refresh and local R2 binary mirroring are therefore
different operations.

Local attachment metadata must not report a file as available unless the binary
actually exists in local QA storage.

## Safety Boundary

The local refresh workflow must never mutate remote D1 or R2.

Production deployment, Git changes, schema migration, local QA refresh, and
attachment mirroring remain separately gated operations.

See:

`LOCAL-QA-DATA.md`
