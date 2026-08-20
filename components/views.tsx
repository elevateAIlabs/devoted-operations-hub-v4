"use client";

import { useMemo, useState } from "react";
import { calendarCells, monthLabel } from "@/lib/calendar";
import { projectSchedule } from "@/lib/canonical";
import { resolveResources, selectResources } from "@/lib/resources";
import type { ScheduleProjection, WorkItem } from "@/lib/types";
import {
  EmptyState,
  Eyebrow,
  PageHeading,
  RecordCard,
  RecordRow,
  SectionHeading,
  StatusPill,
} from "./ui";

export type ViewProps = {
  items: WorkItem[];
  onOpen: (item: WorkItem) => void;
  onQuickAdd: (kind?: string) => void;
  onPatch: (item: WorkItem, changes: Record<string, unknown>) => Promise<void>;
  onCopy: (text: string, label?: string) => Promise<boolean>;
  onNavigate: (view: string) => void;
  onExport: (format: string, ids?: string[]) => Promise<void>;
};

const ACTIVE_KINDS = new Set(["task", "project", "content_idea", "accounting_exception"]);

function todayKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function isDone(item: WorkItem) {
  return item.status === "Completed" || item.status === "Archived" || Boolean(item.completedAt);
}

function completionChanges(item: WorkItem, complete: boolean) {
  if (item.kind === "project" || item.kind === "content_idea") {
    return {
      executionStatus: complete ? "Completed" : "Not Started",
      executionCompletedAt: complete ? new Date().toISOString() : null,
    };
  }
  return {
    status: complete ? "Completed" : "Not Started",
    completedAt: complete ? new Date().toISOString() : null,
  };
}

function actionable(items: WorkItem[]) {
  return items.filter(
    (item) =>
      !item.archivedAt &&
      (Boolean(item.primaryActionId) || ACTIVE_KINDS.has(item.kind)),
  );
}

function dueReason(item: WorkItem, today = todayKey()) {
  if (item.dueDate && item.dueDate < today) return "Shown because it is overdue.";
  if (item.followUpDate && item.followUpDate <= today && item.waitingOn) {
    return `Shown because its follow-up is due and it is waiting on ${item.waitingOn}.`;
  }
  if (item.waitingOn) return `Shown because progress depends on ${item.waitingOn}.`;
  if (item.priority === "High" || item.impact === "High") {
    return "Shown because it has high business impact.";
  }
  if (item.effortMinutes && item.effortMinutes <= 20) {
    return "Shown because it is a short, actionable open loop.";
  }
  return "Shown because it has an active next action.";
}

function attentionScore(item: WorkItem, today = todayKey()) {
  let score = item.pinned ? 100 : 0;
  if (item.dueDate && item.dueDate < today) score += 60;
  else if (item.dueDate === today) score += 50;
  if (item.followUpDate && item.followUpDate <= today) score += 35;
  if (item.waitingOn) score += 20;
  if (item.priority === "High") score += 25;
  if (item.impact === "High") score += 25;
  if (item.workstream === "Accounting and Taxes") score += 14;
  if (item.effortMinutes && item.effortMinutes <= 20) score += 8;
  score += Math.min(item.carryForwardCount * 5, 20);
  return score;
}

function formatLongDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function DashboardView(props: ViewProps) {
  const today = todayKey();
  const active = actionable(props.items).filter((item) => !isDone(item));
  const ranked = [...active].sort(
    (a, b) => attentionScore(b, today) - attentionScore(a, today),
  );
  const schedule = projectSchedule(active).filter((event) => event.date === today);
  const protect = ranked[0];
  const build = ranked.find(
    (item) => item.kind === "project" || item.kind === "content_idea" || item.impact === "High",
  );
  const complete = ranked.find((item) => item.effortMinutes && item.effortMinutes <= 30);
  const daily = [
    { label: "Protect", item: protect, tone: "dark" },
    { label: "Build", item: build, tone: "orange" },
    { label: "Complete", item: complete, tone: "green" },
  ].filter((entry, index, array) => entry.item && array.findIndex((x) => x.item?.id === entry.item?.id) === index);

  const highCycle = [
    ["Monthly Close", props.items.filter((item) => item.kind === "accounting_checklist" && !isDone(item)).length],
    ["Jobs & Estimates", props.items.filter((item) => item.kind === "project" && !isDone(item)).length],
    ["Waiting on Andrew", active.filter((item) => item.waitingOn?.toLowerCase().includes("andrew")).length],
    ["Payroll & Team", active.filter((item) => item.workstream === "ADP and Payroll").length],
    ["Content Queue", props.items.filter((item) => item.kind === "content_idea" && !isDone(item)).length],
  ] as const;

  return (
    <>
      <PageHeading
        eyebrow={formatLongDate().toUpperCase()}
        title="What needs attention now?"
        description="Due dates and scheduled work from every Devoted HQ module, ranked with a plain-language reason."
        action={<button className="button primary" onClick={() => props.onQuickAdd()}>Capture something</button>}
      />

      <div className="dashboard-primary-grid">
        <section className="panel attention-panel">
          <SectionHeading eyebrow="Attention now" title="Urgent and imminent work" action={<button className="text-button" onClick={() => props.onNavigate("tasks")}>View all actions →</button>} />
          <div className="stack-list">
            {ranked.slice(0, 5).map((item) => (
              <RecordRow
                key={item.id}
                item={item}
                onOpen={props.onOpen}
                onComplete={(value) => props.onPatch(value, completionChanges(value, true))}
                reason={dueReason(item, today)}
              />
            ))}
          </div>
        </section>

        <section className="panel today-panel">
          <SectionHeading eyebrow="Today's schedule" title={`${schedule.length} active item${schedule.length === 1 ? "" : "s"}`} />
          {schedule.length ? schedule.slice(0, 6).map((event) => (
            <button className="mini-schedule-row" key={`${event.date}-${event.item.id}`} onClick={() => props.onOpen(event.item)}>
              <span>{event.roles.join(" + ")}</span>
              <strong>{event.item.title}</strong>
              <small>{event.timeLabel ?? event.item.typeLabel}</small>
              <b>→</b>
            </button>
          )) : <EmptyState title="No dated work today" text="Use Quick Add or schedule an existing item." />}
          <button className="text-button align-right" onClick={() => props.onNavigate("schedule")}>Open Schedule →</button>
        </section>
      </div>

      <div className="dashboard-secondary-grid">
        <section className="panel">
          <SectionHeading eyebrow="Daily plan" title="Protect · Build · Complete" />
          {daily.length ? daily.map((entry) => (
            <button className="daily-row" key={entry.label} onClick={() => props.onOpen(entry.item!)}>
              <span className={`daily-label ${entry.tone}`}>{entry.label}</span>
              <span><strong>{entry.item!.title}</strong><small>{dueReason(entry.item!, today)}</small></span>
              <b>•••</b>
            </button>
          )) : <EmptyState title="Your Daily Plan is clear" text="New recommendations appear as work is captured." />}
        </section>
        <section className="panel">
          <SectionHeading eyebrow="Close the loop" title={`${ranked.filter((item) => item.dueDate && item.dueDate < today).length} items need a decision`} />
          {ranked.filter((item) => item.dueDate && item.dueDate < today).slice(0, 5).map((item) => (
            <button className="loop-row" key={item.id} onClick={() => props.onOpen(item)}>
              <i />
              <span><strong>{item.title}</strong><small>Overdue—complete or reschedule</small></span>
              <b>→</b>
            </button>
          ))}
        </section>
      </div>

      <section className="high-cycle-section">
        <SectionHeading eyebrow="High-cycle work" title="The workstreams that consume the most attention" />
        <div className="high-cycle-grid">
          {highCycle.map(([label, count], index) => (
            <button key={label} onClick={() => props.onNavigate(label === "Monthly Close" ? "accounting" : label === "Content Queue" ? "content" : "tasks")}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{label}</strong>
              <b>{count ? `${count} open record${count === 1 ? "" : "s"}` : "Not Recorded"}</b>
              <small>Open the underlying records →</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel quick-reference-panel">
        <SectionHeading eyebrow="Quick reference" title="Open the source system" />
        <div className="quick-link-grid">
          {selectResources(props.items, ["homeworks", "adp", "master-accounting", "comptroller", "google-drive", "website"]).map(({ label, item }) => item?.relatedUrl ? (
            <a key={label} href={item.relatedUrl} target="_blank" rel="noreferrer"><strong>{label}</strong><span>↗</span></a>
          ) : (
            <button key={label} disabled><strong>{label}</strong><span>Not configured</span></button>
          ))}
          <a href="tel:+15127572203"><strong>Call office</strong><span>↗</span></a>
          <a href="mailto:office@devotedlandscaping.com"><strong>Email office</strong><span>↗</span></a>
        </div>
      </section>
    </>
  );
}

const TASK_FILTERS = [
  "Today",
  "Next 3 Days",
  "This Week",
  "Overdue",
  "Waiting On",
  "Waiting on Andrew",
  "Blocked",
  "Recurring",
  "Unscheduled",
  "Completed",
  "Archived",
  "All",
];

function plusDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function TasksView(props: ViewProps) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const today = todayKey();
  const tasks = actionable(props.items).filter((item) => {
    const haystack = `${item.title} ${item.body} ${item.workstream} ${item.assignee}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (filter === "Archived") return Boolean(item.archivedAt);
    if (item.archivedAt) return false;
    if (filter === "Today") return item.dueDate === today || item.followUpDate === today || item.scheduledAt?.startsWith(today);
    if (filter === "Next 3 Days") return Boolean(item.dueDate && item.dueDate >= today && item.dueDate <= plusDays(today, 3));
    if (filter === "This Week") return Boolean(item.dueDate && item.dueDate >= today && item.dueDate <= plusDays(today, 7));
    if (filter === "Overdue") return Boolean(item.dueDate && item.dueDate < today && !isDone(item));
    if (filter === "Waiting On") return Boolean(item.waitingOn);
    if (filter === "Waiting on Andrew") return Boolean(item.waitingOn?.toLowerCase().includes("andrew"));
    if (filter === "Blocked") return item.status === "Blocked";
    if (filter === "Recurring") return item.kind === "recurring_template";
    if (filter === "Unscheduled") return !item.scheduledAt && !item.dueDate && !isDone(item);
    if (filter === "Completed") return isDone(item);
    if (filter === "All") return true;
    return !isDone(item);
  });
  const toggle = (item: WorkItem) => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]);

  return (
    <>
      <PageHeading
        eyebrow="Action system"
        title="Tasks & follow-through"
        description="Every operational commitment in one queue, with due dates, blockers, waiting-on logic, and export actions."
        action={<div className="button-row"><button className="button" onClick={() => { setSelecting(!selecting); setSelected([]); }}>{selecting ? "Cancel select" : "Select"}</button><button className="button primary" onClick={() => props.onQuickAdd("task")}>+ New task</button></div>}
      />
      <div className="task-toolbar">
        <div className="filter-pills">{TASK_FILTERS.map((value) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value}</button>)}</div>
        <input aria-label="Filter tasks" placeholder="Filter this view…" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      {selecting && selected.length ? (
        <div className="bulk-bar"><strong>{selected.length} selected</strong><button onClick={() => props.onExport("pdf", selected)}>Export PDF</button><button onClick={() => props.onExport("ics", selected)}>Calendar</button><button onClick={() => props.onExport("csv", selected)}>CSV</button></div>
      ) : null}
      <section className="panel task-list-panel">
        <div className="list-caption"><span>{filter}</span><span>{tasks.length} actions</span></div>
        {tasks.length ? tasks.map((item) => (
          <RecordRow
            key={item.id}
            item={item}
            onOpen={props.onOpen}
            onComplete={(value) => props.onPatch(value, completionChanges(value, !isDone(value)))}
            selected={selected.includes(item.id)}
            onSelect={selecting ? toggle : undefined}
          />
        )) : <EmptyState title="No items in this view" text="Change the filter or capture a new action." action={<button className="button primary" onClick={() => props.onQuickAdd("task")}>Add task</button>} />}
      </section>
    </>
  );
}

type CalendarMode = "Day" | "Week" | "Month" | "3 Months";

function projectionLabel(event: ScheduleProjection) {
  if (event.roles.length > 1) return event.roles.map((role) => role === "follow-up" ? "Follow-up" : role[0].toUpperCase() + role.slice(1)).join(" + ");
  const role = event.roles[0];
  return role === "work" && event.timeLabel ? event.timeLabel : role === "follow-up" ? "Follow-up" : "Due";
}

export function ScheduleView(props: ViewProps) {
  const now = new Date();
  const [year, setYear] = useState(Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric" }).format(now)));
  const [month, setMonth] = useState(Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "numeric" }).format(now)) - 1);
  const [mode, setMode] = useState<CalendarMode>("Month");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const projections = useMemo(() => projectSchedule(actionable(props.items)), [props.items]);
  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleProjection[]>();
    for (const event of projections) map.set(event.date, [...(map.get(event.date) ?? []), event]);
    return map;
  }, [projections]);
  const cells = calendarCells(year, month);
  const selectedAgenda = byDate.get(selectedDate) ?? [];
  const moveMonth = (delta: number) => {
    const date = new Date(Date.UTC(year, month + delta, 1));
    setYear(date.getUTCFullYear());
    setMonth(date.getUTCMonth());
  };

  return (
    <>
      <PageHeading
        eyebrow="Command calendar"
        title="Schedule"
        description="See work blocks, deadlines, and follow-ups without duplicating the underlying item. Dates stay linked to one master record."
        action={<button className="button primary" onClick={() => props.onQuickAdd("task")}>+ New task</button>}
      />
      <section className="panel calendar-panel">
        <div className="calendar-toolbar">
          <div className="calendar-nav"><button onClick={() => moveMonth(-1)} aria-label="Previous month">←</button><button onClick={() => { const d = new Date(); setYear(d.getFullYear()); setMonth(d.getMonth()); setSelectedDate(todayKey()); }}>Today</button><button onClick={() => moveMonth(1)} aria-label="Next month">→</button><strong>{monthLabel(year, month)}</strong></div>
          <div className="calendar-modes">{(["Day", "Week", "Month", "3 Months"] as CalendarMode[]).map((value) => <button key={value} className={mode === value ? "active" : ""} onClick={() => setMode(value)}>{value}</button>)}</div>
        </div>
        {mode === "Month" ? (
          <>
            <div className="weekday-grid">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="month-grid" data-calendar-month="true">
              {cells.map((cell) => {
                const events = byDate.get(cell.key) ?? [];
                const selected = cell.key === selectedDate;
                const today = cell.key === todayKey();
                return (
                  <button key={cell.key} className={`calendar-cell ${!cell.inMonth ? "adjacent" : ""} ${selected ? "selected" : ""} ${today ? "today" : ""}`} onClick={() => setSelectedDate(cell.key)}>
                    <span className="date-number">{cell.day}</span><span className="add-date">+</span>
                    <div className="calendar-events">
                      {events.slice(0, 3).map((event) => <span key={event.item.id}><b>{projectionLabel(event)}</b><em>{event.item.title}</em></span>)}
                      {events.length > 3 ? <small>+{events.length - 3} more</small> : null}
                    </div>
                    <span className="mobile-event-count">{events.length ? events.length === 1 ? "•" : events.length : ""}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : mode === "Day" ? (
          <Agenda dates={[selectedDate]} byDate={byDate} onOpen={props.onOpen} />
        ) : mode === "Week" ? (
          <Agenda dates={Array.from({ length: 7 }, (_, index) => plusDays(selectedDate, index))} byDate={byDate} onOpen={props.onOpen} />
        ) : (
          <div className="quarter-grid">{[0, 1, 2].map((offset) => { const d = new Date(Date.UTC(year, month + offset, 1)); const mini = calendarCells(d.getUTCFullYear(), d.getUTCMonth()); return <div className="mini-month" key={offset}><strong>{monthLabel(d.getUTCFullYear(), d.getUTCMonth())}</strong><div>{mini.map((cell) => <button key={cell.key} className={`${!cell.inMonth ? "adjacent" : ""} ${(byDate.get(cell.key)?.length ?? 0) ? "has-event" : ""}`} onClick={() => { setSelectedDate(cell.key); setYear(d.getUTCFullYear()); setMonth(d.getUTCMonth()); setMode("Month"); }}>{cell.day}</button>)}</div></div>; })}</div>
        )}
      </section>
      {mode === "Month" ? (
        <section className="panel selected-agenda">
          <SectionHeading eyebrow="Selected day" title={new Date(`${selectedDate}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })} />
          {selectedAgenda.length ? selectedAgenda.map((event) => <RecordRow key={event.item.id} item={event.item} onOpen={props.onOpen} reason={`${projectionLabel(event)} · one master item`} />) : <EmptyState title="Nothing scheduled" text="Choose another day or add a date to an item." />}
        </section>
      ) : null}
    </>
  );
}

function Agenda({ dates, byDate, onOpen }: { dates: string[]; byDate: Map<string, ScheduleProjection[]>; onOpen: (item: WorkItem) => void }) {
  return <div className="agenda-grid">{dates.map((date) => <section key={date}><h3>{new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</h3>{(byDate.get(date) ?? []).map((event) => <button key={event.item.id} onClick={() => onOpen(event.item)}><StatusPill value={projectionLabel(event)} /><strong>{event.item.title}</strong><small>{event.timeLabel ?? event.item.status}</small></button>)}</section>)}</div>;
}

export function OperationsView(props: ViewProps) {
  const projects = props.items.filter((item) => item.kind === "project" && !item.archivedAt);
  const operations = actionable(props.items).filter((item) => ["Estimates and Proposals", "Active Projects", "Leads and Follow-Up", "Fleet and Equipment", "ADP and Payroll", "HomeWorks and Customer Administration"].includes(item.workstream) && !isDone(item));
  const stages = ["New Lead", "Scope in Progress", "Estimate in Progress", "Proposal Sent", "Approved", "Ready for Field", "Active", "Closeout Needed", "Complete"];
  return (
    <>
      <PageHeading eyebrow="Field coordination" title="Operations" description="Move estimates, projects, payroll issues, fleet follow-up, and field readiness forward without recreating HomeWorks." action={<button className="button primary" onClick={() => props.onQuickAdd("project")}>+ New project</button>} />
      <section className="panel">
        <SectionHeading eyebrow="Jobs & estimates" title="Project readiness pipeline" />
        <div className="pipeline-scroll">{stages.map((stage) => { const matches = projects.filter((item) => item.lifecycleStatus === stage); return <div className="pipeline-column" key={stage}><header><strong>{stage}</strong><span>{matches.length}</span></header>{matches.map((item) => <button key={item.id} onClick={() => props.onOpen(item)}><strong>{item.title}</strong><small>{item.assignee || "Owner not recorded"} · {item.dueDate || "No deadline"}</small></button>)}{!matches.length ? <small>Nothing here yet.</small> : null}</div>; })}</div>
      </section>
      <div className="operations-grid">
        <section className="panel"><SectionHeading eyebrow="Open loops" title="Operations queue" />{operations.length ? operations.slice(0, 8).map((item) => <RecordRow key={item.id} item={item} onOpen={props.onOpen} />) : <EmptyState title="No open operations items" text="Capture a lead, project, payroll issue, or fleet follow-up." />}</section>
        <section className="panel"><SectionHeading eyebrow="Readiness" title="What is missing?" />{projects.map((item) => <button className="readiness-card" key={item.id} onClick={() => props.onOpen(item)}><strong>{item.title}</strong><span>Stage: {item.lifecycleStatus}</span><span>Next: {item.body ? item.body.split("\n")[0] : "Needs information"}</span><b>{item.waitingOn ? `Waiting on ${item.waitingOn}` : item.dueDate ? `Due ${item.dueDate}` : "Deadline not recorded"}</b></button>)}</section>
      </div>
    </>
  );
}

export function AccountingView(props: ViewProps) {
  const period = props.items.find((item) => item.kind === "accounting_period");
  const checklist = props.items.filter((item) => item.kind === "accounting_checklist" && (!period || item.relatedProjectId === period.id));
  const completed = checklist.filter(isDone).length;
  const percentage = checklist.length ? Math.round((completed / checklist.length) * 100) : 0;
  const exceptions = props.items.filter((item) => item.kind === "accounting_exception" && !item.archivedAt);
  const resources = selectResources(props.items, [
    "master-accounting",
    "homeworks",
    "adp",
    "amex",
    "wex",
    "sheffield",
    "comptroller",
  ]);
  return (
    <>
      <PageHeading
        eyebrow="D.A.I.S.Y."
        title="Accounting & monthly close"
        description="Collect statements, reconcile accounts, close the books, and record exceptions from one place."
        action={<details className="quick-links-menu"><summary>Monthly close quick links ▾</summary><div>{resources.map(({ label, item }, index) => item?.relatedUrl ? <a key={label} href={item.relatedUrl} target="_blank" rel="noreferrer"><span>{index === 0 ? "Primary" : "Open"}</span><strong>{label}</strong><b>↗</b></a> : <button key={label} disabled><span>Not configured</span><strong>{label}</strong></button>)}<button onClick={() => props.onNavigate("reference")}><span>Reference Hub</span><strong>All Resources</strong><b>→</b></button></div></details>}
      />
      <section className="accounting-hero">
        <div><Eyebrow>Current period</Eyebrow><h2>{period?.title ?? "Month not recorded"}</h2><StatusPill value={period?.status ?? "Not Started"} /></div>
        <div className="accounting-progress"><strong>{percentage}% <span>sources reviewed</span></strong><div><i style={{ width: `${percentage}%` }} /></div><small>{completed} of {checklist.length} checklist items complete</small></div>
        <div><Eyebrow>Next action</Eyebrow><strong>{checklist.find((item) => !isDone(item))?.title ?? "Review and close the month"}</strong><button onClick={() => period && props.onOpen(period)}>Review & close month</button></div>
      </section>
      <section>
        <SectionHeading eyebrow="Collect → reconcile → close" title="Monthly checklist" action={<button className="button" onClick={() => window.print()}>Print checklist</button>} />
        <div className="accounting-checklist">{checklist.map((item) => <button key={item.id} className={isDone(item) ? "done" : ""} onClick={() => props.onPatch(item, isDone(item) ? { status: "Not Started", completedAt: null } : { status: "Completed", completedAt: new Date().toISOString() })}><span>{isDone(item) ? "✓" : ""}</span><strong>{item.title}</strong><small>{isDone(item) ? "Reviewed" : "Needs review"}</small><b onClick={(event) => { event.stopPropagation(); props.onOpen(item); }}>Details</b></button>)}</div>
      </section>
      <section>
        <SectionHeading eyebrow="Exceptions + CPA questions" title="Items that cannot be silently resolved" action={<button className="button primary" onClick={() => props.onQuickAdd("accounting_exception")}>+ Add exception</button>} />
        <div className="panel">{exceptions.length ? exceptions.map((item) => <RecordRow key={item.id} item={item} onOpen={props.onOpen} />) : <EmptyState title="No open exceptions recorded" text="Missing receipts and disputed methodology belong here until explicitly resolved." />}</div>
      </section>
    </>
  );
}

export function ContentView(props: ViewProps) {
  const ideas = props.items.filter((item) => item.kind === "content_idea" && !item.archivedAt);
  const prompts = props.items.filter((item) => item.generatedPrompt && !item.archivedAt);
  const columns = [
    ["Raw idea", ideas.filter((item) => ["Raw Idea", "Inbox", "Not Started"].includes(item.lifecycleStatus))],
    ["Prompt Ready", ideas.filter((item) => item.generatedPrompt || item.lifecycleStatus === "Ready")],
    ["Scheduled", ideas.filter((item) => item.lifecycleStatus === "Scheduled" || Boolean(item.scheduledAt))],
  ] as [string, WorkItem[]][];
  return (
    <>
      <PageHeading eyebrow="Content studio" title="Turn rough ideas into executable prompts" description="Develop the project story once, preserve the facts, and carry a copy-ready brief into a separate ChatGPT conversation." action={<button className="button primary" onClick={() => props.onNavigate("tools")}>Open Idea-to-Prompt Studio</button>} />
      <section>
        <SectionHeading eyebrow="Pipeline" title={`${ideas.length} content ideas`} action={<button className="button" onClick={() => props.onQuickAdd("content_idea")}>+ Raw idea</button>} />
        <div className="content-pipeline">{columns.map(([title, matches]) => <div key={title}><header><strong>{title}</strong><span>{matches.length}</span></header>{matches.map((item) => <button key={item.id} onClick={() => props.onOpen(item)}><strong>{item.title}</strong><small>{item.waitingOn ? `Waiting on ${item.waitingOn}` : item.lifecycleStatus}</small></button>)}{!matches.length ? <small>Nothing here yet.</small> : null}</div>)}</div>
      </section>
      <section>
        <SectionHeading eyebrow="Saved results" title="Generated prompts" />
        <div className="prompt-card-grid">{prompts.map((item) => <RecordCard key={item.id} item={item} onOpen={props.onOpen}><div className="prompt-card-actions"><button onClick={() => props.onCopy(item.generatedPrompt!, "Prompt")}>⧉ Copy prompt</button><button onClick={() => props.onExport("txt", [item.id])}>Download TXT</button></div></RecordCard>)}</div>
      </section>
    </>
  );
}

const REFERENCE_FILTERS = ["All", "Contact", "Link", "Reference", "Recurring Template", "Needs Verification", "Archived"];

export function ReferenceView(props: ViewProps) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const resources = resolveResources(props.items);
  const refs = props.items.filter((item) => {
    if (!["contact", "link", "reference", "recurring_template"].includes(item.kind)) return false;
    if (filter === "Archived") return Boolean(item.archivedAt);
    if (item.archivedAt) return false;
    if (filter === "Needs Verification" && !item.status.includes("Needs")) return false;
    if (
      filter === "Recurring Template" &&
      item.kind !== "recurring_template"
    ) {
      return false;
    }
    if (
      !["All", "Needs Verification", "Recurring Template"].includes(filter) &&
      item.typeLabel !== filter
    ) {
      return false;
    }
    return `${item.title} ${item.body} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
  });
  const generateTemplate = async (item: WorkItem) => {
    await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "task", title: item.title, body: item.body, workstream: item.workstream, status: "Not Started", tags: `${item.tags.join(",")},generated-from-template` }) });
    window.dispatchEvent(new CustomEvent("devoted-refresh"));
  };
  return (
    <>
      <PageHeading eyebrow="Reference hub" title="Find it once. Keep it verified." description="Contacts, addresses, system links, estimating defaults, and reusable routines—with verification status attached." action={<button className="button primary" onClick={() => props.onQuickAdd("reference")}>+ Add reference</button>} />
      <section className="panel resource-directory"><SectionHeading eyebrow="Shared resource registry" title="Business systems & close links" /><div>{resources.map(({ key, label, item }) => item?.relatedUrl ? <a key={key} href={item.relatedUrl} target="_blank" rel="noreferrer"><span>Configured</span><strong>{label}</strong><b>↗</b></a> : <button key={key} disabled><span>Not configured</span><strong>{label}</strong></button>)}</div></section>
      <div className="reference-toolbar"><div className="filter-pills">{REFERENCE_FILTERS.map((value) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value}</button>)}</div><input placeholder="Search reference hub…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <div className="reference-grid">{refs.map((item) => <RecordCard key={item.id} item={item} onOpen={props.onOpen}><div className="reference-actions"><button onClick={() => props.onOpen(item)}>Edit</button><button onClick={() => props.onCopy(`${item.title}\n${item.body}\n${item.relatedUrl ?? ""}`, "Reference")}>Copy</button>{item.relatedUrl ? <a href={item.relatedUrl} target="_blank" rel="noreferrer">Open ↗</a> : null}{item.kind === "recurring_template" ? <button onClick={() => generateTemplate(item)}>Generate task</button> : null}</div></RecordCard>)}</div>
    </>
  );
}

export function ReviewView(props: ViewProps) {
  const active = actionable(props.items).filter((item) => !isDone(item) && !item.archivedAt);
  const today = todayKey();
  const overdue = active.filter((item) => item.dueDate && item.dueDate < today);
  const waiting = active.filter((item) => item.waitingOn);
  const accounting = props.items.filter((item) => item.kind === "accounting_checklist" && !isDone(item));
  const content = props.items.filter((item) => item.kind === "content_idea" && !isDone(item));
  const recommended = [...active].sort((a, b) => attentionScore(b) - attentionScore(a)).slice(0, 3);
  const cards: [string, string, WorkItem | undefined][] = [
    ["Most important unfinished item", overdue[0]?.title ?? active[0]?.title ?? "Not Recorded", overdue[0] ?? active[0]],
    ["Highest-risk open loop", overdue[0]?.title ?? "Not Recorded", overdue[0]],
    ["Current accounting bottleneck", accounting[0]?.title ?? "Not Recorded", accounting[0]],
    ["Waiting-on follow-up", waiting[0]?.title ?? "Not Recorded", waiting[0]],
    ["Closest content opportunity", content[0]?.title ?? "Not Recorded", content[0]],
  ];
  return (
    <>
      <PageHeading eyebrow="Weekly operating review" title="Finish the week with fewer open loops" description="A practical brief built from the current master items—not a second set of tasks." action={<button className="button" onClick={() => window.print()}>Print review</button>} />
      <div className="review-metrics"><div><span>{active.length}</span><strong>Open actions</strong></div><div><span>{overdue.length}</span><strong>Overdue</strong></div><div><span>{waiting.length}</span><strong>Waiting on</strong></div><div><span>{accounting.length}</span><strong>Close items open</strong></div></div>
      <section className="panel"><SectionHeading eyebrow="Review brief" title="What deserves a decision" /><div className="review-card-grid">{cards.map(([label, value, item]) => <button key={label} disabled={!item} onClick={() => item && props.onOpen(item)}><span>{label}</span><strong>{value}</strong><b>{item ? "Open item →" : "Add verified work when it exists"}</b></button>)}</div></section>
      <section className="panel"><SectionHeading eyebrow="Next week" title="Recommended Protect · Build · Complete" />{recommended.map((item, index) => <RecordRow key={item.id} item={item} onOpen={props.onOpen} reason={`${["Protect", "Build", "Complete"][index]} — ${dueReason(item)}`} />)}</section>
      <section className="review-questions"><SectionHeading eyebrow="Ten-minute check" title="Questions worth answering" /><div>{["What was completed?", "What remains open?", "What are we waiting on?", "What is blocking revenue?", "Which estimate or project needs action?", "Are payroll issues unresolved?", "What should be delegated, postponed, or eliminated?"].map((question) => <label key={question}><input type="checkbox" />{question}</label>)}</div></section>
    </>
  );
}
