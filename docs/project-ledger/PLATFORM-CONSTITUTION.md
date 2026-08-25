# Devoted HQ Platform Constitution

## Purpose

This document defines the durable product and architectural principles governing
how Devoted HQ evolves.

Roadmaps describe where the product may go next.

The backlog records opportunities, defects, investigations, and future work.

Decisions record important choices and their rationale.

Governance defines who evaluates and approves those choices.

The Platform Constitution defines the boundaries within which those choices
should normally be made.

Its purpose is to prevent individually reasonable decisions from gradually
turning Devoted HQ into a product that violates its original strategy.

These principles are durable, but they are not immutable. They may be amended
deliberately through the process defined at the end of this document.

---

# I. Reference Customer

## 1. Devoted is the reference implementation, not the platform definition.

Devoted Landscaping is the first production customer, proving ground, and
reference implementation for Devoted HQ.

Capabilities should be built first against real Devoted problems and workflows
while being modeled generally enough to avoid unnecessary customer-specific
architectural coupling.

Devoted should influence what gets built first.

Devoted should not unnecessarily define what the platform is capable of being.

## 2. Operator value comes before platform elegance.

Architecture exists to support useful software.

An abstraction that makes the reference customer's workflow materially slower,
more confusing, or less useful is not successful merely because it is elegant.

When a valuable Operator request conflicts with sound platform architecture, the
Foundry should reconsider the implementation rather than automatically rejecting
the useful capability.

---

# II. One Platform

## 3. One production codebase. Never customer-specific forks.

Devoted HQ should maintain one production application codebase.

Legitimate differences between businesses should be expressed through mechanisms
such as:

- workspace configuration
- modules
- permissions
- integrations
- terminology
- branding
- data

They should not be solved by maintaining divergent customer-specific copies of
the application.

## 4. Configure the business instead of hard-coding the customer.

Branding, terminology, enabled capabilities, integrations, and legitimate
workspace differences should become configurable when reality demonstrates the
need.

Configuration should solve observed variation rather than hypothetical variation.

## 5. Canonical platform models should describe capabilities, not customer names.

Foundational schemas, APIs, reusable domain models, and architectural primitives
should describe the underlying platform concept.

Devoted-specific names and terminology should not leak unnecessarily into
canonical platform models.

---

# III. Abstraction Discipline

## 6. Model the capability more generally than the immediate pain.

Build for the real problem we actually have.

When naming and modeling the solution, identify the reusable capability beneath
that problem where doing so does not create unnecessary complexity.

The goal is not generic software for its own sake.

The goal is to avoid accidentally encoding a temporary example as a permanent
architectural definition.

## 7. Abstract only when reality justifies abstraction.

No speculative framework-building.

An abstraction should solve at least one real problem, such as:

- demonstrated duplication
- an observed variation between workflows
- a necessary architectural boundary
- a recurring implementation problem
- clearly justified future optionality at low present cost

Future possibility alone is not sufficient justification for substantial
present complexity.

## 8. Generality must not create user-facing complexity without corresponding value.

Platform flexibility should live beneath an interface that remains understandable
and efficient for the Operator.

A generalized architecture is not permission to expose generalized complexity to
the user.

---

# IV. Integration and Data Boundaries

## 9. Specialized systems remain specialized systems unless replacement creates genuine value.

Devoted HQ is not required to recreate every system used by the business.

Systems such as:

- CRM
- payroll
- calendar
- accounting
- cloud storage
- communications platforms

may remain specialized external systems when they perform their roles well.

Devoted HQ should coordinate those systems where coordination creates greater
operational value than replacement.

## 10. External vendors sit behind integration boundaries.

The platform should depend on capabilities and explicit contracts rather than
unnecessarily coupling core architecture to a particular vendor implementation.

Where practical, vendor-specific behavior should remain behind an integration
boundary.

## 11. External data does not silently become canonical internal data.

Information that is:

- imported
- synchronized
- retrieved
- inferred
- generated
- copied from another system

does not automatically become authoritative Devoted HQ state.

Transitions into canonical internal data should be deliberate and understandable.

## 12. AI-generated information does not silently become canonical operational truth.

AI may provide genuine leverage through capabilities such as:

- summarization
- recommendations
- classification
- prioritization
- retrieval
- drafting
- automation

But AI output should not become authoritative operational state merely because an
AI system produced it.

Authoritative mutations should cross explicit, appropriately controlled
boundaries.

Where deterministic software solves a workflow better, deterministic software
should be preferred.

---

# V. Workspace, Identity and Security

## 13. Every foundational data decision considers future workspace ownership and isolation.

Devoted HQ does not need speculative multi-tenant infrastructure before the
product earns that complexity.

However, foundational decisions involving:

- schemas
- records
- attachments
- integrations
- identities
- authorization
- ownership relationships

should consider whether they create unnecessary future barriers to safe workspace
isolation.

Avoid cheap decisions today that create dangerous or prohibitively expensive
tenant boundaries tomorrow.

## 14. Access is explicit.

As identity and collaboration capabilities grow, data ownership, authorization,
workspace membership, integration permissions, and sensitive operations should
be deliberate.

Security boundaries should not depend on accidental obscurity or assumptions
about who happens to be using the application today.

---

# VI. Presentation

## 15. UI consumes semantic platform concepts, not tenant-specific presentation assumptions.

Reusable components should consume semantic design concepts and configuration
rather than embedding unnecessary customer-specific presentation assumptions.

Examples include:

- semantic design tokens
- configurable branding
- reusable status treatments
- configurable terminology where justified

Meaning should remain distinct from any particular customer's colors, logo, or
branding.

## 16. Product generalization must remain understandable to ordinary users.

A reusable platform concept that only its architect understands has failed.

Terminology, interaction patterns, and configuration should remain understandable
to the people expected to operate the software.

The Sofia Test applies:

> Would somebody who isn't Greg understand this?

---

# VII. Production Engineering

## 17. Production releases must be controlled, reproducible, observable, and recoverable where practical.

Every material release should have:

- an identifiable source state
- a controlled deployment path
- appropriate validation
- observable production behavior
- a reasonable recovery strategy appropriate to its risk

Deployment infrastructure may evolve.

The principle should survive the tooling.

The desired operational outcome remains:

> Make production deployments boring.

## 18. Material behavior changes require appropriate acceptance criteria and regression protection.

Testing depth should scale with risk.

Material behavior changes should have explicit acceptance criteria and
appropriate regression protection before being considered complete.

A release is not complete merely because the build succeeded.

## 19. Production data is sacred.

Development convenience does not justify casually:

- replacing
- mutating
- normalizing
- importing over
- deleting
- rebuilding

production state.

Production data operations should be explicit, reviewed, bounded, and recoverable
where practical.

Code deployment and production-data mutation are separate classes of operation.

---

# VIII. Product and Infrastructure Economics

## 20. Devoted receives useful capabilities first and serves as the proving ground.

Devoted HQ should earn generalization through real production experience.

The reference customer receives useful capabilities first.

Observed reality should then inform which capabilities deserve broader
configuration, abstraction, or productization.

## 21. Do not build SaaS infrastructure until the product earns the complexity.

Future commercialization is architectural context.

It is not permission to prematurely build:

- speculative tenant infrastructure
- elaborate billing systems
- hypothetical enterprise controls
- unnecessary configuration frameworks
- expensive scale architecture

Build those capabilities when actual product requirements justify them.

## 22. Preserve the approximately $0 incremental-cost constraint until real value justifies breaking it.

Devoted HQ is currently bootstrapped.

Incremental infrastructure cost is therefore an architectural input, not an
afterthought.

Prefer solutions compatible with the current approximately $0 incremental-cost
operating model when they satisfy the product need.

A paid service or architectural cost may be adopted when its measurable value,
risk reduction, operational leverage, or required capability justifies the
expense.

Cost avoidance should not become an excuse for unsafe or fundamentally
inadequate architecture.

---

# IX. Governing Product Thesis

Devoted HQ is not defined primarily as landscaping-management software.

Its emerging product thesis is broader:

> Devoted HQ is the coordination layer that knows what needs attention, why it
> matters, where the supporting information lives, what is waiting on whom, and
> what happens next.

The platform should coordinate specialized systems rather than reflexively
attempting to replace all of them.

The underlying problem is organizational fragmentation:

- CRM in one system
- calendar in another
- payroll elsewhere
- accounting exceptions scattered across workflows
- files distributed across storage systems
- follow-ups vulnerable to memory
- operational context divided among tools and people

Devoted HQ should become the operational coordination layer across those
responsibilities.

That thesis may travel across industries because the underlying problem is not
unique to landscaping.

---

# X. North-Star Rules

When architectural or product direction becomes unclear, return to these rules:

1. Build for the pain we actually have.
2. Model the capability more generally than the pain.
3. Configure the business instead of hard-coding it.
4. Abstract only when reality justifies abstraction.
5. Keep one production codebase.
6. Make Devoted the reference customer and proving ground.
7. Use specialized systems rather than reflexively rebuilding them.
8. Protect explicit canonical-data boundaries.
9. Preserve future workspace isolation without prematurely building SaaS infrastructure.
10. Keep the Operator experience simple even when the architecture becomes more capable.
11. Make production deployments boring.
12. Do not build SaaS infrastructure until the product earns the complexity.
13. Preserve approximately $0 incremental cost until breaking that constraint creates justified value.

---

# XI. Constitutional Tests

Meaningful product and architectural decisions should be evaluated against two
standing tests.

## Operator Test

> Does this actually make Devoted better?

## Platform Test

> Did we solve it without unnecessarily coupling the solution to Devoted?

A strong Devoted HQ decision should normally pass both.

When the tests appear to conflict, the Foundry should examine the implementation,
scope, timing, and abstraction rather than treating either test as automatically
dispositive.

---

# XII. Constitutional Amendment Rule

The Platform Constitution is durable, not immutable.

A principle may be:

- amended
- superseded
- added
- removed

when experience demonstrates that the Constitution itself should evolve.

However, constitutional changes should be deliberate.

A material constitutional amendment requires:

1. an explicit Foundry Review
2. identification of the principle being changed
3. the reason reality now justifies the change
4. consideration of product and architectural consequences
5. FHO approval
6. preservation of the historical rationale through Git and the project ledger

The Constitution should not drift through incidental edits made during unrelated
feature work.

---

# Foundry Adoption

This Platform Constitution was reconstructed from the original Devoted HQ
platform principles and updated through Foundry review after the 4.1 release.

The updated Constitution incorporates the standing perspectives of:

- FHO / Founder Hat
- OHO / Operator Hat
- Ev / Product & Strategy
- Marcus / Architecture
- Priya / UX
- Raf / QA & Reliability
- Nadia / Security, Identity & Data
- Owen / Cloud & DevOps
- Sofia / Customer Experience & Vertical SaaS
- Theo / Commercial & Growth
- Maya / Applied AI & Automation

The Constitution exists to preserve strategic coherence while allowing the
product to evolve through evidence.

It should constrain drift, not learning.
