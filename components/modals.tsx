"use client";

import { useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { formatWorkItemSummary } from "@/lib/canonical";
import type { Attachment, Preferences, WorkItem } from "@/lib/types";
import { EmptyState, Eyebrow, StatusPill } from "./ui";

const WORKSTREAMS = [
  "Accounting and Taxes",
  "HomeWorks and Customer Administration",
  "ADP and Payroll",
  "Estimates and Proposals",
  "Active Projects",
  "Leads and Follow-Up",
  "Fleet and Equipment",
  "Team and Training",
  "Social Media and Marketing",
  "Business Administration",
  "Systems and SOPs",
  "Other",
];

const WORK_STATUSES = ["Inbox", "Not Started", "Ready", "In Progress", "Waiting", "Blocked", "Scheduled", "Completed", "Cancelled", "Archived"];
const PROJECT_STAGES = ["New Lead", "Scope in Progress", "Estimate in Progress", "Proposal Sent", "Approved", "Ready for Field", "Active", "Closeout Needed", "Complete"];
const CONTENT_STAGES = ["Raw Idea", "Inbox", "Not Started", "Ready", "Scheduled", "Published", "Archived"];
const STATUSES = [...new Set([...WORK_STATUSES, ...PROJECT_STAGES, ...CONTENT_STAGES])];

function scheduleInputValue(value: string | null) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 16);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(parsed);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function ModalShell({ children, onClose, label, wide = false }: { children: React.ReactNode; onClose: () => void; label: string; wide?: boolean }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`modal-sheet ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={label}>{children}<button className="modal-close" onClick={onClose} aria-label={`Close ${label}`}>×</button></section></div>;
}

export function QuickAddModal({ initialKind = "task", onClose, onSaved }: { initialKind?: string; onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data.entries())) });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "The item could not be saved.");
      setSaving(false);
      return;
    }
    await onSaved();
    onClose();
  };
  const defaultStatus = initialKind === "project" ? "New Lead" : initialKind === "content_idea" ? "Raw Idea" : "Inbox";
  return <ModalShell onClose={onClose} label="Quick Add"><div className="modal-header"><Eyebrow>Capture once</Eyebrow><h2>Quick Add</h2><p>Get the rough thought into Devoted HQ now. You can refine it later.</p></div><form className="edit-form" onSubmit={submit}><label>Item type<select name="kind" defaultValue={initialKind}><option value="task">Task</option><option value="note">Quick note</option><option value="content_idea">Content idea</option><option value="project">Project</option><option value="accounting_exception">Accounting exception</option><option value="contact">Contact</option><option value="reference">Reference</option></select></label><label>Title<input name="title" autoFocus required placeholder="What needs to be remembered or done?" /></label><label className="full">Details<textarea name="body" placeholder="Paste rough notes, context, or the requested outcome…" /></label><label>Workstream<select name="workstream" defaultValue="Business Administration">{WORKSTREAMS.map((value) => <option key={value}>{value}</option>)}</select></label><label>Status / stage<select name="status" defaultValue={defaultStatus}>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label><label>Owner<input name="assignee" defaultValue="Greg" /></label><label>Priority<select name="priority" defaultValue="Normal"><option>Low</option><option>Normal</option><option>High</option><option>Critical</option></select></label><label>Work block<input name="scheduledAt" type="datetime-local" /></label><label>Due date<input name="dueDate" type="date" /></label><label>Follow-up date<input name="followUpDate" type="date" /></label><label>Waiting on<input name="waitingOn" placeholder="Person, asset, approval…" /></label><label>Effort (minutes)<input name="effortMinutes" type="number" min="1" /></label><label className="full">Tags<input name="tags" placeholder="Comma-separated" /></label>{error ? <p className="form-error full">{error}</p> : null}<div className="modal-actions full"><button className="button" type="button" onClick={onClose}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving…" : "Save master item"}</button></div></form></ModalShell>;
}

export function ItemDrawer({
  item,
  attachments,
  onClose,
  onPatch,
  onCopy,
  onExport,
  onRefresh,
}: {
  item: WorkItem;
  attachments: Attachment[];
  onClose: () => void;
  onPatch: (item: WorkItem, changes: Record<string, unknown>) => Promise<void>;
  onCopy: (text: string, label?: string) => Promise<boolean>;
  onExport: (format: string, ids?: string[]) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [draggingAttachment, setDraggingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [uploadNames, setUploadNames] = useState<string[]>([]);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [confirmAttachmentId, setConfirmAttachmentId] = useState<string | null>(null);
  const relatedAttachments = attachments.filter((attachment) => attachment.recordId === item.id && !attachment.archivedAt);
  const summary = formatWorkItemSummary(item);
  const lifecycleKind = item.kind === "project" || item.kind === "content_idea";
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const changes: Record<string, unknown> = {
      ...data,
      effortMinutes: data.effortMinutes ? Number(data.effortMinutes) : null,
    };
    if (lifecycleKind) {
      changes.executionCompletedAt =
        data.executionStatus === "Completed"
          ? item.completedAt ?? new Date().toISOString()
          : null;
    } else {
      changes.completedAt =
        data.status === "Completed"
          ? item.completedAt ?? new Date().toISOString()
          : null;
    }
    await onPatch(item, changes);
    setSaving(false);
    setEditing(false);
  };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: item.title, text: summary }); return; } catch { /* user cancelled or share unavailable */ }
    }
    await onCopy(summary, "Summary");
  };
  const email = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(`Devoted HQ - ${item.title}`)}&body=${encodeURIComponent(summary)}`;
  };
  const uploadFiles = async (files: File[]) => {
    if (!files.length || uploading) return;

    const oversized = files.filter((file) => file.size > 25 * 1024 * 1024);
    if (oversized.length) {
      setAttachmentError(
        `Each attachment must be 25 MB or smaller. Too large: ${oversized.map((file) => file.name).join(", ")}`,
      );
      return;
    }

    setUploading(true);
    setAttachmentError("");
    setUploadNames(files.map((file) => file.name));

    try {
      for (const file of files) {
        const data = new FormData();
        data.set("file", file);
        data.set("recordId", item.id);
        if (item.primaryActionId) data.set("actionId", item.primaryActionId);

        const response = await fetch("/api/attachments", {
          method: "POST",
          body: data,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? `Could not upload ${file.name}.`);
        }
      }

      await onRefresh();
    } catch (error) {
      setAttachmentError(
        error instanceof Error ? error.message : "One or more attachments could not be uploaded.",
      );
    } finally {
      setUploading(false);
      setUploadNames([]);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
    }
  };

  const selectAttachments = (files: FileList | null) => {
    if (!files) return;
    void uploadFiles(Array.from(files));
  };

  const dropAttachments = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDraggingAttachment(false);
    selectAttachments(event.dataTransfer.files);
  };
  const deleteAttachment = async (attachmentId: string) => {
    setDeletingAttachmentId(attachmentId);

    try {
      const response = await fetch("/api/attachments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: attachmentId }),
      });

      if (!response.ok) {
        console.error("Attachment deletion failed:", await response.text());
        return;
      }

      setConfirmAttachmentId(null);
      await onRefresh();
    } finally {
      setDeletingAttachmentId(null);
    }
  };
  const archive = async () => {
    await fetch("/api/records", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, mode: item.archivedAt ? "restore" : "archive" }) });
    await onRefresh();
    onClose();
  };
  const permanentDelete = async () => {
    if (deleteText !== "DELETE") return;
    await fetch("/api/records", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, mode: "permanent", confirmation: deleteText }) });
    await onRefresh();
    onClose();
  };

  return <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="item-drawer" role="dialog" aria-modal="true" aria-label={item.title}><button className="modal-close" onClick={onClose} aria-label="Close item">×</button><div className="drawer-header"><div className="card-topline"><span>{item.typeLabel}</span><StatusPill value={item.status} /></div><h2>{item.title}</h2><p>{item.workstream} · {item.assignee || "Owner not recorded"}</p></div><div className="drawer-commandbar">{item.generatedPrompt ? <button className="button primary" onClick={() => onCopy(item.generatedPrompt!, "Prompt")}>⧉ Copy prompt</button> : null}<button className="button" onClick={() => onCopy(summary, "Summary")}>Copy summary</button><button className="button" onClick={share}>Share</button><button className="button" onClick={email}>Email</button></div>{editing ? <form className="edit-form drawer-edit" onSubmit={save}><label className="full">Title<input name="title" defaultValue={item.title} required /></label><label className="full">Overview<textarea name="body" defaultValue={item.body} /></label>{item.kind === "project" ? <label>Project stage<select name="status" defaultValue={item.lifecycleStatus}>{PROJECT_STAGES.map((value) => <option key={value}>{value}</option>)}</select></label> : item.kind === "content_idea" ? <label>Content stage<select name="status" defaultValue={item.lifecycleStatus}>{CONTENT_STAGES.map((value) => <option key={value}>{value}</option>)}</select></label> : <label>Status<select name="status" defaultValue={item.status}>{WORK_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label>}{lifecycleKind ? <label>Work status<select name="executionStatus" defaultValue={item.status}>{WORK_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label> : null}<label>Workstream<select name="workstream" defaultValue={item.workstream}>{WORKSTREAMS.map((value) => <option key={value}>{value}</option>)}</select></label><label>Priority<select name="priority" defaultValue={item.priority}><option>Low</option><option>Normal</option><option>High</option><option>Critical</option></select></label><label>Owner<input name="assignee" defaultValue={item.assignee ?? "Greg"} /></label><label>Effort (minutes)<input name="effortMinutes" type="number" defaultValue={item.effortMinutes ?? ""} /></label><label>Work block<input name="scheduledAt" type="datetime-local" defaultValue={scheduleInputValue(item.scheduledAt)} /></label><label>Due date<input name="dueDate" type="date" defaultValue={item.dueDate ?? ""} /></label><label>Follow-up<input name="followUpDate" type="date" defaultValue={item.followUpDate ?? ""} /></label><label>Waiting on<input name="waitingOn" defaultValue={item.waitingOn ?? ""} /></label><label>Related URL<input name="relatedUrl" type="url" defaultValue={item.relatedUrl ?? ""} /></label><label className="full">Tags<input name="tags" defaultValue={item.tags.join(", ")} /></label><label className="full">Generated prompt<textarea className="prompt-editor" name="generatedPrompt" defaultValue={item.generatedPrompt ?? ""} /></label><div className="modal-actions full"><button type="button" className="button" onClick={() => setEditing(false)}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div></form> : <><section className="drawer-section"><div className="detail-grid"><div><span>Work status</span><strong>{item.status}</strong></div>{lifecycleKind ? <div><span>{item.kind === "project" ? "Project stage" : "Content stage"}</span><strong>{item.lifecycleStatus}</strong></div> : null}<div><span>Priority / impact</span><strong>{item.priority} / {item.impact}</strong></div><div><span>Work block</span><strong>{item.scheduledAt || "Not Recorded"}</strong></div><div><span>Deadline</span><strong>{item.dueDate || "Not Recorded"}</strong></div><div><span>Follow-up</span><strong>{item.followUpDate || "Not Recorded"}</strong></div><div><span>Waiting on</span><strong>{item.waitingOn || "Not Recorded"}</strong></div></div><button className="button" onClick={() => setEditing(true)}>Edit master item</button></section>{item.body ? <section className="drawer-section"><Eyebrow>Overview</Eyebrow><p className="preserve-lines">{item.body}</p></section> : null}{item.generatedPrompt ? <section className="drawer-section prompt-section"><div><Eyebrow>Generated prompt</Eyebrow><button className="text-button" onClick={() => onCopy(item.generatedPrompt!, "Prompt")}>⧉ Copy prompt</button></div><pre>{item.generatedPrompt}</pre></section> : null}</>}
      <section className="drawer-section attachment-section">
        <div className="attachment-heading">
          <Eyebrow>Attachments</Eyebrow>
          <span>{relatedAttachments.length} {relatedAttachments.length === 1 ? "file" : "files"}</span>
        </div>

        {relatedAttachments.length ? (
          <div className="attachment-list">
            {relatedAttachments.map((attachment) => (
              <div key={attachment.id} className="attachment-row">
                <div className="attachment-file-icon" aria-hidden="true">↗</div>
                <div className="attachment-file">
                  <strong>{attachment.fileName}</strong>
                  <span>
                    {Math.max(1, Math.round(attachment.sizeBytes / 1024))} KB
                    {attachment.available ? "" : " · Original file not restored"}
                  </span>
                </div>
                <div className={`attachment-actions ${confirmAttachmentId === attachment.id ? "confirming" : ""}`}>
                  {confirmAttachmentId === attachment.id ? (
                    <>
                      <button
                        type="button"
                        className="attachment-action"
                        disabled={deletingAttachmentId === attachment.id}
                        onClick={() => setConfirmAttachmentId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="attachment-action attachment-action-danger"
                        disabled={deletingAttachmentId === attachment.id}
                        onClick={() => deleteAttachment(attachment.id)}
                      >
                        {deletingAttachmentId === attachment.id ? "Deleting…" : "Delete"}
                      </button>
                    </>
                  ) : (
                    <>
                      {attachment.available ? (
                        <a
                          className="attachment-action"
                          href={`/api/attachments?id=${encodeURIComponent(attachment.id)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      ) : null}
                      <button
                        type="button"
                        className="attachment-action attachment-action-danger"
                        onClick={() => setConfirmAttachmentId(attachment.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No attachments yet.</p>
        )}

        <div
          className={`attachment-dropzone ${draggingAttachment ? "dragging" : ""} ${uploading ? "uploading" : ""}`}
          role="button"
          tabIndex={0}
          aria-label="Add attachments"
          onClick={() => !uploading && attachmentInputRef.current?.click()}
          onKeyDown={(event) => {
            if (!uploading && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              attachmentInputRef.current?.click();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!uploading) setDraggingAttachment(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) setDraggingAttachment(false);
          }}
          onDrop={dropAttachments}
        >
          <input
            ref={attachmentInputRef}
            className="attachment-file-input"
            type="file"
            multiple
            disabled={uploading}
            onChange={(event) => selectAttachments(event.currentTarget.files)}
          />
          <div className="attachment-drop-icon" aria-hidden="true">＋</div>
          <strong>
            {uploading
              ? `Uploading ${uploadNames.length} ${uploadNames.length === 1 ? "file" : "files"}…`
              : draggingAttachment
                ? "Drop files here"
                : "Drop files here or click to browse"}
          </strong>
          <span>Select multiple files at once · 25 MB maximum per file</span>
          {uploading && uploadNames.length ? (
            <small>{uploadNames.join(" · ")}</small>
          ) : null}
        </div>

        {attachmentError ? (
          <p className="attachment-error" role="alert">{attachmentError}</p>
        ) : null}
      </section>
      <section className="drawer-section export-actions"><Eyebrow>Export this item</Eyebrow><div className="button-row"><button onClick={() => onExport("pdf", [item.id])}>PDF</button><button onClick={() => onExport("ics", [item.id])}>Calendar</button><button onClick={() => onExport("txt", [item.id])}>TXT</button><button onClick={() => onExport("eml", [item.id])}>EML</button></div></section>
      <section className="drawer-section danger-zone"><button className="button" onClick={archive}>{item.archivedAt ? "Restore item" : "Archive item"}</button><button className="text-button danger" onClick={() => setDeleteMode(!deleteMode)}>Permanently delete…</button>{deleteMode ? <div><p>Type <strong>DELETE</strong> to remove this item, its primary action, and attachment metadata.</p><input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} /><button className="button danger-button" disabled={deleteText !== "DELETE"} onClick={permanentDelete}>Permanently delete</button></div> : null}</section></aside></div>;
}

export function SearchModal({ items, onClose, onOpen }: { items: WorkItem[]; onClose: () => void; onOpen: (item: WorkItem) => void }) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => query.trim() ? items.filter((item) => `${item.title} ${item.body} ${item.generatedPrompt ?? ""} ${item.workstream} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())).slice(0, 30) : [], [items, query]);
  return <ModalShell onClose={onClose} label="Global Search" wide><div className="search-dialog"><Eyebrow>Global search</Eyebrow><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks, projects, prompts, links, and references…" />{query && !matches.length ? <EmptyState title="No matching master items" text="Try a title, person, workstream, tag, or phrase from the body." /> : <div className="search-results">{matches.map((item) => <button key={item.id} onClick={() => { onOpen(item); onClose(); }}><span>{item.typeLabel}</span><strong>{item.title}</strong><small>{item.workstream} · {item.status}</small></button>)}</div>}</div></ModalShell>;
}

export function SettingsModal({ preferences, onClose, onSave }: { preferences: Preferences; onClose: () => void; onSave: (value: Partial<Preferences>) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); const data = new FormData(event.currentTarget); await onSave({ density: String(data.get("density")) as Preferences["density"], orange: String(data.get("orange")) }); setSaving(false); onClose(); };
  return <ModalShell onClose={onClose} label="Settings"><div className="modal-header"><Eyebrow>Workspace preferences</Eyebrow><h2>Devoted HQ settings</h2><p>Adjust the working density and primary safety-orange token.</p></div><form className="edit-form" onSubmit={submit}><label>Density<select name="density" defaultValue={preferences.density}><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select></label><label>Safety orange<input name="orange" type="color" defaultValue={preferences.orange} /></label><div className="ranking-preview full"><Eyebrow>Attention ranking</Eyebrow>{Object.entries(preferences.ranking).map(([label, value]) => <div key={label}><span>{label.replace(/([A-Z])/g, " $1")}</span><strong>{value}%</strong></div>)}</div><div className="modal-actions full"><button className="button" type="button" onClick={onClose}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving…" : "Save preferences"}</button></div></form></ModalShell>;
}

export function CopyFallbackModal({ text, onClose, onShare }: { text: string; onClose: () => void; onShare: () => void }) {
  return <ModalShell onClose={onClose} label="Copy fallback"><div className="modal-header"><Eyebrow>Manual copy</Eyebrow><h2>Select the complete text</h2><p>The browser did not confirm a clipboard write. The full payload is visible below.</p></div><textarea className="fallback-text" readOnly value={text} onFocus={(event) => event.currentTarget.select()} /><div className="modal-actions"><button className="button" onClick={(event) => { const textarea = (event.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement); textarea?.select(); }}>Select all</button><button className="button primary" onClick={onShare}>Share instead</button></div></ModalShell>;
}
