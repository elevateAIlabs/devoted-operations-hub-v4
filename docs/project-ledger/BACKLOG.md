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
