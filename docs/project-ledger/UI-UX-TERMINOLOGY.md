# Devoted HQ Canonical UI/UX Terminology

## Status

**CANONICAL**

This document defines the human-facing vocabulary used when discussing,
designing, testing, documenting, and reviewing the Devoted HQ user interface.

The purpose is to give FHO, OHO, SK, The Foundry, acceptance documentation,
field reports, backlog discussions, and future implementation work a shared
language for describing the product.

---

## Governing Language Rule

Product discussions, OHO field reports, Foundry decisions, SK implementation
instructions, acceptance tests, backlog entries, and release documentation
should use the canonical terminology defined here.

Until further notice, when a canonical term is less obvious or carries a
specific Devoted HQ meaning, its first use in a discussion or instruction should
include a very brief plain-English explanation in parentheses.

Examples:

- **Schedule Card** *(task box inside the calendar)*
- **Calendar Cell** *(one date box in Month View)*
- **Weekly Agenda** *(full task list for the visible week)*
- **Record Row** *(one item in a list)*
- **Item Drawer** *(right-side full item details panel)*
- **Status Pill** *(small state label such as OVERDUE)*
- **Overflow Count** *(the +N more indicator)*

The explanation should remain short and useful. It is a learning aid, not a
second specification.

---

## Product Language vs. Code Language

This vocabulary is authoritative for human product communication.

Internal React component names, function names, CSS classes, database fields,
and other implementation identifiers do not need to be renamed merely to match
the product vocabulary.

A code identifier may differ from the canonical product term as long as the
product behavior remains clear and maintainable.

Do not perform code-renaming work solely to make internal identifiers mirror
this document.

---

# Canonical Vocabulary

## Tab

One of the main destinations in Devoted HQ navigation.

Examples:

- Dashboard Tab
- Tasks Tab
- Schedule Tab
- Operations Tab
- Accounting Tab
- Content Tab
- Reference Tab
- Tools Tab
- Review Tab

Example usage:

> Go to the Schedule Tab.

---

## View

The main screen shown after opening a Tab, or a major display mode within that
screen.

Examples:

- Schedule View
- Day View
- Week View
- Month View
- 3 Months View

Example usage:

> The Week View correctly displays Sunday through Saturday.

---

## Page Header

The large title area near the top of a Tab containing the page title,
description, and any primary page action.

Example usage:

> The Schedule Page Header contains the Schedule title and New Task action.

---

## Toolbar

A group of controls positioned together above or around the primary content.

The Schedule Toolbar contains date navigation and the Schedule View Selector.

Example usage:

> The Schedule Toolbar remains visible above the calendar.

---

## View Selector

The control group used to switch between major display modes within a View.

In Schedule, the View Selector contains:

- Day
- Week
- Month
- 3 Months

Example usage:

> Select Week using the Schedule View Selector.

---

## Range Navigation

The controls used to move the visible Schedule time period backward or forward.

This includes:

- previous arrow
- Today
- next arrow
- visible date or date-range label

Example usage:

> Week Range Navigation should move exactly one calendar week.

---

## Calendar

The overall date-based visual area in Schedule.

Canonical variants include:

- Day Calendar
- Week Calendar
- Month Calendar
- 3 Months Calendar

Example usage:

> The Week Calendar displays the Sunday-through-Saturday workload.

---

## Calendar Cell

*(one date box in Month View)*

One individual date box inside the Month Calendar.

A Calendar Cell may contain Schedule Cards and an Overflow Count.

Example usage:

> The September 2 Calendar Cell contains two Schedule Cards and a +3 more
> Overflow Count.

---

## Schedule Card

*(task box inside the calendar)*

A visible representation of one scheduled work projection inside a Calendar.

Schedule Card is preferred over "Calendar Card."

A Schedule Card may communicate semantic states such as:

- DUE
- OVERDUE
- FOLLOW-UP
- WORK

Selecting a Schedule Card may open the Item Drawer.

Example usage:

> The Follow-Up Schedule Card stays contained within its Week Calendar column.

---

## Overflow Count

*(the +N more indicator)*

The indicator used when a Month Calendar Cell contains more work than should be
shown as complete Schedule Cards.

Example:

`+3 more`

The Overflow Count communicates additional workload without rendering clipped
or partial Schedule Cards.

Example usage:

> The Calendar Cell shows two complete Schedule Cards and a +3 more Overflow
> Count.

---

## Agenda

A list of work associated with a specific visible time period and displayed
outside the Calendar itself.

Agenda is the parent concept for more specific agenda types.

Canonical agenda types currently include:

- Selected Day Agenda
- Weekly Agenda

---

## Selected Day Agenda

*(task list for one selected date)*

The complete Schedule workload shown below Month View for the Calendar Cell the
user selected.

Example usage:

> Selecting September 2 populates the Selected Day Agenda below the Month
> Calendar.

---

## Weekly Agenda

*(full task list for the visible week)*

The complete Schedule workload for the currently displayed
Sunday-through-Saturday Week View.

The Weekly Agenda appears below the Week Calendar.

The Weekly Agenda should use the same canonical Schedule projections as the Week
Calendar and should not invent a separate scheduling interpretation.

Example usage:

> The Weekly Agenda for Aug 30 through Sep 5 contains the complete projected
> workload for that visible week.

---

## Agenda Section

*(one date grouping inside an Agenda)*

A date-based grouping within an Agenda.

For example, a Weekly Agenda may contain separate Agenda Sections for Monday,
Tuesday, Wednesday, and other dates containing work.

Example usage:

> Wednesday, September 2 is an Agenda Section within the Weekly Agenda.

---

## Record Row

*(one item in a list)*

One individual work-item entry displayed in a list.

Record Rows are used throughout Devoted HQ and may appear inside an Agenda or
another list-oriented Panel.

Selecting a Record Row may open the Item Drawer.

Example usage:

> Select the QSEHRA Record Row in the Weekly Agenda.

---

## Item Drawer

*(right-side full item details panel)*

The detailed interface opened for one individual Devoted HQ item.

Item Drawer is the canonical term.

Do not use "Task Detail View" as the general name because the drawer can display
many kinds of items, including Tasks, Projects, content items, references, and
other canonical records.

Example usage:

> Selecting the Record Row opens the Item Drawer.

---

## Item Detail

The information displayed inside the Item Drawer.

Item Detail is content.

Item Drawer is the interface container that displays that content.

Example usage:

> The Item Detail shows Deadline, Follow-Up, status, and attachments.

---

## Detail Field

One labeled value or editable field inside Item Detail.

Examples include:

- Work Status
- Deadline
- Follow-Up
- Waiting On

Example usage:

> The Deadline Detail Field shows September 9.

---

## Status Pill

*(small state label such as OVERDUE)*

A compact visual label communicating state, type, or semantic meaning.

Examples may include:

- FOLLOW-UP
- OVERDUE
- DUE
- Not Started

Example usage:

> The Schedule Card uses an OVERDUE Status Pill.

---

## Panel

A visually grouped container holding a related section of page content.

Examples:

- Selected Day Agenda Panel
- Needs Action Panel
- Project Readiness Panel

Example usage:

> The Selected Day Agenda Panel appears below the Month Calendar.

---

## Dashboard Card

One summary or metric card on the Dashboard.

Current examples include:

- Incomplete
- Due Today
- Overdue
- Due Next 10 Days

Example usage:

> Selecting the Overdue Dashboard Card opens the corresponding workload.

---

## Task List

The primary list of work displayed in the Tasks Tab.

Example usage:

> The Overdue Task Filter changes the contents of the Task List.

---

## Task Filter

A control that changes which items are visible in the Task List.

Current examples include:

- Incomplete
- Due Today
- Overdue
- Next 10 Days
- This Week
- Completed
- All

Example usage:

> Select the This Week Task Filter.

---

## Project Readiness Pipeline

The stage-based horizontal Project lifecycle area in the Operations Tab.

It answers:

> Where is this Project in its business lifecycle?

Example usage:

> The Project appears in the Active Pipeline Column of the Project Readiness
> Pipeline.

---

## Pipeline Column

One lifecycle-stage column inside the Project Readiness Pipeline.

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

Example usage:

> Move the Project from Approved to the Ready for Field Pipeline Column.

---

## Needs Action

The named Operations section containing operational work that currently
requires action.

Needs Action is a specific product section, not a generic synonym for every
incomplete item in Devoted HQ.

Example usage:

> The payroll issue appears in Needs Action.

---

## Project Readiness

The named Operations section providing readiness/context information for
Projects.

Project Readiness is distinct from the Project Readiness Pipeline.

The Project Readiness Pipeline communicates lifecycle stage.

Project Readiness communicates supporting readiness/context.

Example usage:

> Project Readiness indicates that the Project is waiting on customer
> information.

---

## Quick Add

The global control used to rapidly create a new item.

Example usage:

> Use Quick Add to create a Task.

---

## Search Bar

The global search control used to locate Devoted HQ information.

Example usage:

> Search for the customer using the Search Bar.

---

# Important Distinctions

## Schedule Card vs. Record Row vs. Item Drawer

These terms describe three different levels of interaction.

**Schedule Card**
= a work-item representation inside a Calendar.

**Record Row**
= a work-item representation inside a list.

**Item Drawer**
= the detailed interface for one individual item.

Typical interaction:

**Schedule Card or Record Row -> Item Drawer**

---

## Calendar Cell vs. Schedule Card

A Calendar Cell is the date container.

A Schedule Card is an item displayed inside that date container.

Typical Month hierarchy:

**Month Calendar -> Calendar Cell -> Schedule Card**

---

## Selected Day Agenda vs. Weekly Agenda

A Selected Day Agenda represents one selected date.

A Weekly Agenda represents the entire visible Sunday-through-Saturday week.

Month View uses the Selected Day Agenda.

Week View uses the Weekly Agenda.

---

## Item Drawer vs. Item Detail

The Item Drawer is the interface container.

Item Detail is the information inside that container.

---

# Canonical Schedule Interaction Vocabulary

The preferred conceptual hierarchy for discussing Schedule is:

**Schedule Tab -> Schedule View -> Calendar -> Calendar Cell / Schedule Card -> Agenda -> Record Row -> Item Drawer**

Not every Schedule mode uses every level.

For example:

### Month View

**Schedule Tab -> Month View -> Month Calendar -> Calendar Cell -> Schedule Card**

Selecting a Calendar Cell exposes:

**Selected Day Agenda -> Record Row -> Item Drawer**

### Week View

**Schedule Tab -> Week View -> Week Calendar -> Schedule Card**

The complete visible-week workload is represented below by:

**Weekly Agenda -> Agenda Section -> Record Row -> Item Drawer**

---

# 4.2A7 Canonical Requirement

The Week View retains its existing Week Calendar and Schedule Cards.

Below the Week Calendar, Devoted HQ will provide a **Weekly Agenda**
*(full task list for the visible Sunday-through-Saturday week)*.

The Weekly Agenda will contain date-based **Agenda Sections**
*(one date grouping inside the Agenda)*.

Each Agenda Section will contain **Record Rows**
*(individual items in the list)* representing the canonical Schedule projections
for that date.

Selecting a Record Row may open the existing **Item Drawer**
*(right-side full item details panel)*.

Existing Schedule Cards remain available and may continue opening the Item
Drawer.

Month View and its **Selected Day Agenda**
*(task list for one selected date)* remain unchanged.

4.2A7 does not change:

- Schedule projection semantics
- Due Date meaning
- Follow-Up meaning
- Work Block meaning
- Week boundaries
- D1
- R2
- database schema
- external calendar/export semantics

---

# Maintenance

New UI/UX terminology should be added deliberately when a durable new product
concept is introduced.

Do not create new names merely because implementation details changed.

When terminology is replaced, record the replacement and preserve enough
history to understand older release notes and field reports.
