"use client";

import type { ReactNode } from "react";
import type { WorkItem } from "@/lib/types";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action ? <div className="page-heading-action">{action}</div> : null}
    </header>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  const key = value.toLowerCase();
  const tone =
    key.includes("complete") || key.includes("confirmed") || key.includes("closed")
      ? "success"
      : key.includes("overdue") || key.includes("blocked") || key.includes("risk")
        ? "danger"
        : key.includes("needs") || key.includes("waiting") || key.includes("collect")
          ? "warning"
          : "neutral";
  return <span className={`status-pill status-${tone}`}>{value}</span>;
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-plus">+</span>
      <strong>{title}</strong>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function RecordRow({
  item,
  onOpen,
  onComplete,
  selected,
  onSelect,
  reason,
}: {
  item: WorkItem;
  onOpen: (item: WorkItem) => void;
  onComplete?: (item: WorkItem) => void;
  selected?: boolean;
  onSelect?: (item: WorkItem) => void;
  reason?: string;
}) {
  const complete = item.status === "Completed" || Boolean(item.completedAt);
  return (
    <article
      className={`record-row ${onSelect || onComplete ? "has-control" : ""} ${
        complete ? "is-complete" : ""
      }`}
    >
      {onSelect ? (
        <button
          className={`round-check ${selected ? "selected" : ""}`}
          aria-label={selected ? `Deselect ${item.title}` : `Select ${item.title}`}
          onClick={() => onSelect(item)}
        >
          {selected ? "✓" : ""}
        </button>
      ) : onComplete ? (
        <button
          className={`round-check ${complete ? "selected" : ""}`}
          aria-label={complete ? `${item.title} is complete` : `Complete ${item.title}`}
          onClick={() => onComplete(item)}
        >
          {complete ? "✓" : ""}
        </button>
      ) : null}
      <button className="record-row-main" onClick={() => onOpen(item)}>
        <strong>{item.title}</strong>
        <span>
          {item.typeLabel} · {item.assignee || "Owner not recorded"}
          {item.waitingOn ? ` · Waiting on ${item.waitingOn}` : ""}
          {item.dueDate ? ` · ${item.dueDate}` : ""}
        </span>
        {reason ? <small>{reason}</small> : null}
      </button>
      <StatusPill value={item.status || "Not Recorded"} />
      <button className="icon-button" aria-label={`Open actions for ${item.title}`} onClick={() => onOpen(item)}>
        •••
      </button>
    </article>
  );
}

export function RecordCard({
  item,
  onOpen,
  children,
}: {
  item: WorkItem;
  onOpen: (item: WorkItem) => void;
  children?: ReactNode;
}) {
  return (
    <article className="record-card">
      <div className="card-topline">
        <span>{item.typeLabel}</span>
        <StatusPill value={item.status || "Not Recorded"} />
        <button className="icon-button" onClick={() => onOpen(item)} aria-label={`Open ${item.title}`}>
          •••
        </button>
      </div>
      <button className="card-open" onClick={() => onOpen(item)}>
        <h3>{item.title}</h3>
        {item.body ? <p>{item.body}</p> : null}
      </button>
      {children}
    </article>
  );
}
