"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BootstrapPayload, WorkItem } from "@/lib/types";
import {
  AccountingView,
  ContentView,
  DashboardView,
  OperationsView,
  ReferenceView,
  ReviewView,
  ScheduleView,
  TasksView,
  type ViewProps,
} from "@/components/views";
import { ToolsView } from "@/components/tools-view";
import {
  CopyFallbackModal,
  ItemDrawer,
  QuickAddModal,
  SearchModal,
  SettingsModal,
} from "@/components/modals";

const NAV = [
  ["dashboard", "Dashboard"],
  ["tasks", "Tasks"],
  ["schedule", "Schedule"],
  ["operations", "Operations"],
  ["accounting", "Accounting"],
  ["content", "Content"],
  ["reference", "Reference"],
  ["tools", "Tools"],
  ["review", "Review"],
] as const;

type ViewKey = (typeof NAV)[number][0];

function viewFromLocation(): ViewKey {
  if (typeof window === "undefined") return "dashboard";
  const candidate = window.location.hash.replace(/^#\/?/, "") as ViewKey;
  return NAV.some(([key]) => key === candidate) ? candidate : "dashboard";
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DevotedApp() {
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<ViewKey>(() => viewFromLocation());
  const [taskFilter, setTaskFilter] = useState("Incomplete");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quickAddKind, setQuickAddKind] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [mobileMore, setMobileMore] = useState(false);
  const [toast, setToast] = useState("");
  const [fallbackText, setFallbackText] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/bootstrap", { cache: "no-store" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? "Devoted HQ could not load its workspace data.");
    }
    const payload = (await response.json()) as BootstrapPayload;
    setData(payload);
    setError("");
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refresh().catch((caught) =>
        setError(caught instanceof Error ? caught.message : String(caught)),
      );
    });
    const onHash = () => setView(viewFromLocation());
    const onRefresh = () => refresh().catch((caught) => setError(String(caught)));
    window.addEventListener("hashchange", onHash);
    window.addEventListener("devoted-refresh", onRefresh);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("devoted-refresh", onRefresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigate = (target: string, nextTaskFilter?: string) => {
    const next = target as ViewKey;
    if (!NAV.some(([key]) => key === next)) return;

    if (next === "tasks" && nextTaskFilter) {
      setTaskFilter(nextTaskFilter);
    }

    setView(next);
    window.location.hash = `/${next}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileMore(false);
  };

  const copyText = useCallback(async (text: string, label = "Text") => {
    let success = false;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(text);
      success = true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      try { success = document.execCommand("copy"); } catch { success = false; }
      textarea.remove();
    }
    if (success) setToast(`✓ ${label} copied`);
    else setFallbackText(text);
    return success;
  }, []);

  const downloadExport = useCallback(async (format: string, ids?: string[]) => {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, ids }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setToast(payload.error ?? "Export failed");
      return;
    }
    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? `devoted-hq-export.${format}`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast(`${format.toUpperCase()} export ready`);
    setExportOpen(false);
  }, []);

  const patchItem = useCallback(async (item: WorkItem, changes: Record<string, unknown>) => {
    const response = await fetch("/api/records", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        primaryActionId: item.primaryActionId,
        ...changes,
      }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setToast(payload.error ?? "The item could not be updated");
      return;
    }
    await refresh();
    setToast("Master item updated");
  }, [refresh]);

  const selectedItem = useMemo(
    () => data?.workItems.find((item) => item.id === selectedId) ?? null,
    [data, selectedId],
  );

  if (error && !data) {
    return <main className="fatal-state"><div className="brand-mark">D</div><h1>Devoted HQ needs attention</h1><p>{error}</p><button className="button primary" onClick={() => refresh().catch((caught) => setError(String(caught)))}>Retry</button></main>;
  }
  if (!data) {
    return <main className="loading-state"><div className="brand-mark">D</div><strong>Restoring Devoted HQ…</strong><span>Loading the August 5 master records</span></main>;
  }

  const viewProps: ViewProps = {
    items: data.workItems,
    onOpen: (item) => setSelectedId(item.id),
    onQuickAdd: (kind = "task") => setQuickAddKind(kind),
    onPatch: patchItem,
    onCopy: copyText,
    onNavigate: navigate,
    onExport: downloadExport,
    taskFilter,
    onTaskFilterChange: setTaskFilter,
  };
  const openActions = data.workItems.filter((item) => item.primaryActionId && !item.archivedAt && item.status !== "Completed").length;
  const close = data.workItems.find((item) => item.kind === "accounting_period");

  return (
    <div className={`devoted-shell density-${data.preferences.density}`} style={{ "--orange": data.preferences.orange } as React.CSSProperties}>
      <aside className="sidebar">
        <button className="sidebar-brand" onClick={() => navigate("dashboard")}>
          <span className="brand-mark">D</span>
          <span><strong>DEVOTED</strong><small>HQ · OPERATIONS</small></span>
        </button>
        <nav>{NAV.map(([key, label], index) => <button key={key} className={view === key ? "active" : ""} onClick={() => navigate(key)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong>{key === "tasks" && openActions ? <b>{openActions}</b> : null}</button>)}</nav>
      </aside>

      <header className="topbar">
        <button className="search-trigger" onClick={() => setSearchOpen(true)}><span>⌕</span><span>Search tasks, projects, notes, contacts…</span><kbd>⌘ K</kbd></button>
        <div className="topbar-actions"><span className="close-status">Close: {close?.status ?? "Not Started"}</span><button onClick={() => navigate("tasks")}>Action Center</button><div className="export-menu"><button onClick={() => setExportOpen(!exportOpen)}>Export</button>{exportOpen ? <div><button onClick={() => downloadExport("json")}>Full JSON backup</button><button onClick={() => downloadExport("csv")}>Filtered CSV</button><button onClick={() => downloadExport("ics")}>Batch calendar (.ics)</button><button onClick={() => downloadExport("pdf")}>PDF packet</button></div> : null}</div><button className="primary" onClick={() => setQuickAddKind("task")}>+ Quick Add</button><button className="avatar" onClick={() => setSettingsOpen(true)} aria-label="Open settings">{initials(data.owner.displayName)}</button></div>
      </header>

      <main className="workspace-main">
        {view === "dashboard" ? <DashboardView {...viewProps} /> : null}
        {view === "tasks" ? <TasksView {...viewProps} /> : null}
        {view === "schedule" ? <ScheduleView {...viewProps} /> : null}
        {view === "operations" ? <OperationsView {...viewProps} /> : null}
        {view === "accounting" ? <AccountingView {...viewProps} /> : null}
        {view === "content" ? <ContentView {...viewProps} /> : null}
        {view === "reference" ? <ReferenceView {...viewProps} /> : null}
        {view === "tools" ? <ToolsView {...viewProps} /> : null}
        {view === "review" ? <ReviewView {...viewProps} /> : null}
        <footer className="workspace-footer">Live owner-scoped master items · {data.integrity.sourceRecordCount} source records · {data.integrity.primaryActionCount} primary actions · {data.integrity.canonicalItemCount} canonical items</footer>
      </main>

      <nav className="mobile-nav">
        {NAV.slice(0, 5).map(([key, label]) => <button key={key} className={view === key ? "active" : ""} onClick={() => navigate(key)}><span>{key === "dashboard" ? "⌂" : key === "tasks" ? "✓" : key === "schedule" ? "□" : key === "operations" ? "◆" : "$"}</span><small>{label}</small></button>)}
        <button className={mobileMore ? "active" : ""} onClick={() => setMobileMore(!mobileMore)}><span>•••</span><small>More</small></button>
      </nav>
      <button className="mobile-quick-add" onClick={() => setQuickAddKind("task")} aria-label="Quick Add">+</button>
      {mobileMore ? <div className="mobile-more-menu">{NAV.slice(5).map(([key, label]) => <button key={key} onClick={() => navigate(key)}>{label}<span>→</span></button>)}<button onClick={() => setSearchOpen(true)}>Search<span>⌕</span></button><button onClick={() => setSettingsOpen(true)}>Settings<span>⚙</span></button></div> : null}

      {selectedItem ? <ItemDrawer item={selectedItem} attachments={data.attachments} onClose={() => setSelectedId(null)} onPatch={patchItem} onCopy={copyText} onExport={downloadExport} onRefresh={refresh} /> : null}
      {quickAddKind ? <QuickAddModal initialKind={quickAddKind} onClose={() => setQuickAddKind(null)} onSaved={refresh} /> : null}
      {searchOpen ? <SearchModal items={data.workItems} onClose={() => setSearchOpen(false)} onOpen={(item) => setSelectedId(item.id)} /> : null}
      {settingsOpen ? <SettingsModal preferences={data.preferences} onClose={() => setSettingsOpen(false)} onSave={async (value) => { await fetch("/api/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) }); await refresh(); }} /> : null}
      {fallbackText ? <CopyFallbackModal text={fallbackText} onClose={() => setFallbackText("")} onShare={() => { if (navigator.share) navigator.share({ text: fallbackText }); }} /> : null}
      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </div>
  );
}
