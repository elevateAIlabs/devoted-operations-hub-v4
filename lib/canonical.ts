import type {
  ActionItem,
  Attachment,
  DevotedRecord,
  ScheduleProjection,
  ScheduleRole,
  WorkItem,
} from "./types";

const TYPE_LABELS: Record<string, string> = {
  accounting_checklist: "Accounting item",
  accounting_exception: "Accounting exception",
  accounting_period: "Accounting period",
  contact: "Contact",
  content_idea: "Content idea",
  generated_prompt: "Generated prompt",
  link: "Link",
  note: "Note",
  project: "Project",
  recurring_template: "Recurring template",
  reference: "Reference",
  task: "Task",
};

const ACTIONABLE_KINDS = new Set([
  "task",
  "project",
  "content_idea",
  "accounting_exception",
]);

export function isWorkItemDone(item: WorkItem): boolean {
  return (
    item.status === "Completed" ||
    item.status === "Archived" ||
    Boolean(item.completedAt)
  );
}

export function isActionableWorkItem(item: WorkItem): boolean {
  return (
    !item.archivedAt &&
    (Boolean(item.primaryActionId) || ACTIONABLE_KINDS.has(item.kind))
  );
}

function parseMetadata(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function splitTags(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function overlayExecution<T>(
  actionValue: T | null | undefined,
  executionValue: T | null | undefined,
  masterValue: T,
): T {
  if (actionValue !== null && actionValue !== undefined) return actionValue;
  if (executionValue !== null && executionValue !== undefined) return executionValue;
  return masterValue;
}

export function canonicalizeRecords(
  records: DevotedRecord[],
  actions: ActionItem[],
): WorkItem[] {
  const recordById = new Map(records.map((record) => [record.id, record]));
  const actionBySource = new Map<string, ActionItem>();
  for (const action of actions) {
    const existing = actionBySource.get(action.sourceRecordId);
    if (!existing || action.updatedAt > existing.updatedAt) {
      actionBySource.set(action.sourceRecordId, action);
    }
  }

  const promptBySource = new Map<string, DevotedRecord>();
  for (const record of records) {
    if (record.kind !== "generated_prompt" || !record.sourceRecordId) continue;
    if (!recordById.has(record.sourceRecordId)) continue;
    const existing = promptBySource.get(record.sourceRecordId);
    if (!existing || record.updatedAt > existing.updatedAt) {
      promptBySource.set(record.sourceRecordId, record);
    }
  }

  // V3 could automatically create this chain for one content idea:
  // content idea -> generated prompt -> task -> primary action. V4 keeps the
  // data intact but presents the whole chain as the original content idea.
  const executionByPrompt = new Map<string, DevotedRecord>();
  for (const record of records) {
    if (record.kind !== "task" || !record.sourceRecordId) continue;
    const prompt = recordById.get(record.sourceRecordId);
    if (
      prompt?.kind !== "generated_prompt" ||
      !prompt.sourceRecordId ||
      !recordById.has(prompt.sourceRecordId)
    ) {
      continue;
    }
    const existing = executionByPrompt.get(prompt.id);
    if (!existing || record.updatedAt > existing.updatedAt) {
      executionByPrompt.set(prompt.id, record);
    }
  }

  const suppressedRecordIds = new Set<string>();
  for (const prompt of promptBySource.values()) {
    suppressedRecordIds.add(prompt.id);
    const execution = executionByPrompt.get(prompt.id);
    if (execution) suppressedRecordIds.add(execution.id);
  }

  return records
    .filter((record) => !suppressedRecordIds.has(record.id))
    .map((record) => {
      const prompt = promptBySource.get(record.id) ?? null;
      const execution = prompt ? executionByPrompt.get(prompt.id) ?? null : null;
      const action =
        (execution ? actionBySource.get(execution.id) : null) ??
        actionBySource.get(record.id) ??
        null;
      const metadata = parseMetadata(record.metadataJson);
      const embeddedPrompt =
        typeof metadata.generatedPrompt === "string"
          ? metadata.generatedPrompt
          : null;
      return {
        id: record.id,
        masterRecordId: record.id,
        kind: record.kind,
        typeLabel: TYPE_LABELS[record.kind] ?? record.kind.replaceAll("_", " "),
        title: record.title,
        body: record.body,
        generatedPrompt:
          embeddedPrompt ??
          prompt?.body ??
          (record.kind === "generated_prompt" ? record.body : null),
        lifecycleStatus: record.status,
        status: overlayExecution(action?.status, execution?.status, record.status),
        workstream: record.workstream,
        priority: overlayExecution(action?.priority, execution?.priority, record.priority),
        impact: overlayExecution(action?.impact, execution?.impact, record.impact),
        effortMinutes: overlayExecution(
          action?.effortMinutes,
          execution?.effortMinutes,
          record.effortMinutes,
        ),
        assignee: overlayExecution(action?.assignee, execution?.assignee, record.assignee),
        dueDate: overlayExecution(action?.dueDate, execution?.dueDate, record.dueDate),
        scheduledAt: overlayExecution(
          action?.scheduledAt,
          execution?.scheduledAt,
          record.scheduledAt,
        ),
        followUpDate: overlayExecution(
          action?.followUpDate,
          execution?.followUpDate,
          record.followUpDate,
        ),
        waitingOn: overlayExecution(action?.waitingOn, execution?.waitingOn, record.waitingOn),
        relatedProjectId: record.relatedProjectId,
        relatedUrl: record.relatedUrl,
        tags: splitTags(record.tags),
        metadata,
        pinned: action?.pinned ?? execution?.pinned ?? record.pinned,
        archivedAt: overlayExecution(
          action?.archivedAt,
          execution?.archivedAt,
          record.archivedAt,
        ),
        completedAt: overlayExecution(
          action?.completedAt,
          execution?.completedAt,
          record.completedAt,
        ),
        carryForwardCount: record.carryForwardCount,
        createdAt: record.createdAt,
        updatedAt: [record.updatedAt, execution?.updatedAt, action?.updatedAt]
          .filter((value): value is string => Boolean(value))
          .sort()
          .at(-1)!,
        primaryActionId: action?.id ?? null,
        sourceRecord: record,
        primaryAction: action,
      } satisfies WorkItem;
    });
}

function chicagoDateParts(value: string): {
  date: string;
  time: string | null;
} {
  const localMatch = value.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/,
  );
  if (localMatch) {
    const hour = Number(localMatch[2]);
    const minute = localMatch[3];
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return {
      date: localMatch[1],
      time: `${displayHour}:${minute} ${period}`,
    };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: value.slice(0, 10), time: null };
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
  const parts = formatter.formatToParts(parsed);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  const date = `${part("year")}-${part("month")}-${part("day")}`;
  const time = `${part("hour")}:${part("minute")} ${part("dayPeriod")}`.trim();
  return { date, time: time || null };
}

export function projectSchedule(items: WorkItem[]): ScheduleProjection[] {
  const projections = new Map<
    string,
    { date: string; item: WorkItem; roles: Set<ScheduleRole>; timeLabel: string | null }
  >();

  const add = (
    item: WorkItem,
    date: string | null,
    role: ScheduleRole,
    timeLabel: string | null = null,
  ) => {
    if (!date) return;
    const normalizedDate = date.slice(0, 10);
    const key = `${normalizedDate}:${item.id}`;
    const existing = projections.get(key);
    if (existing) {
      existing.roles.add(role);
      if (!existing.timeLabel && timeLabel) existing.timeLabel = timeLabel;
      return;
    }
    projections.set(key, {
      date: normalizedDate,
      item,
      roles: new Set([role]),
      timeLabel,
    });
  };

  for (const item of items) {
    if (item.archivedAt) continue;
    if (item.scheduledAt) {
      const scheduled = chicagoDateParts(item.scheduledAt);
      add(item, scheduled.date, "work", scheduled.time);
    }
    add(item, item.dueDate, "due");
    add(item, item.followUpDate, "follow-up");
  }

  return [...projections.values()]
    .map((projection) => ({
      ...projection,
      roles: [...projection.roles],
    }))
    .sort((a, b) =>
      a.date === b.date
        ? a.item.title.localeCompare(b.item.title)
        : a.date.localeCompare(b.date),
    );
}

export type DashboardSummary = {
  incomplete: WorkItem[];
  dueToday: WorkItem[];
  overdue: WorkItem[];
  dueNext10Days: WorkItem[];
  recentlyCompleted: WorkItem[];
};

function shiftDateKey(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function dashboardSummary(
  items: WorkItem[],
  today: string,
): DashboardSummary {
  // WorkItems should already be canonical, but de-duplicate by id here so
  // every metric is guaranteed to count one master item at most once.
  const uniqueItems = [...new Map(items.map((item) => [item.id, item])).values()];

  const openActionable = uniqueItems.filter(
    (item) => isActionableWorkItem(item) && !isWorkItemDone(item),
  );

  const next10DaysEnd = shiftDateKey(today, 10);
  const sevenDayCompletionStart = shiftDateKey(today, -6);

  return {
    // This is the complete live actionable workload: one canonical item,
    // not archived, and not completed.
    incomplete: openActionable,

    dueToday: openActionable.filter((item) => item.dueDate === today),

    overdue: openActionable.filter(
      (item) => Boolean(item.dueDate && item.dueDate < today),
    ),

    // Deliberately excludes today so this planning horizon does not
    // overlap Due Today.
    dueNext10Days: openActionable.filter(
      (item) =>
        Boolean(
          item.dueDate &&
            item.dueDate > today &&
            item.dueDate <= next10DaysEnd,
        ),
    ),

    recentlyCompleted: uniqueItems.filter((item) => {
      if (item.archivedAt || !item.completedAt) return false;
      const completedDate = chicagoDateParts(item.completedAt).date;
      return (
        completedDate >= sevenDayCompletionStart &&
        completedDate <= today
      );
    }),
  };
}

export function integritySummary(
  records: DevotedRecord[],
  actions: ActionItem[],
  attachments: Attachment[],
) {
  const recordIds = new Set(records.map((record) => record.id));
  const actionIds = new Set(actions.map((action) => action.id));
  const keys = new Set<string>();
  let duplicatePrimaryActionKeys = 0;
  for (const action of actions) {
    if (keys.has(action.autoKey)) duplicatePrimaryActionKeys += 1;
    keys.add(action.autoKey);
  }
  return {
    sourceRecordCount: records.length,
    primaryActionCount: actions.length,
    canonicalItemCount: canonicalizeRecords(records, actions).length,
    duplicatePrimaryActionKeys,
    orphanActions: actions.filter((action) => !recordIds.has(action.sourceRecordId)).length,
    orphanAttachments: attachments.filter(
      (attachment) =>
        !recordIds.has(attachment.recordId) ||
        (attachment.actionId !== null && !actionIds.has(attachment.actionId)),
    ).length,
    unavailableAttachmentFiles: attachments.filter(
      (attachment) => attachment.available === false,
    ).length,
  };
}

export function formatWorkItemSummary(item: WorkItem): string {
  const model = workItemCopyModel(item);
  const rows = [
    model.title,
    ...model.metadata,
    ...model.schedule,
    model.nextAction ? `Next action: ${model.nextAction}` : null,
    model.overview ? `\nOverview\n${model.overview}` : null,
    model.generatedPrompt
      ? `\nGENERATED PROMPT\n${model.generatedPrompt}`
      : null,
  ].filter(Boolean);
  return rows.join("\n");
}

export type WorkItemCopyModel = {
  title: string;
  metadata: string[];
  schedule: string[];
  nextAction: string | null;
  overview: string | null;
  generatedPrompt: string | null;
};

export function workItemCopyModel(item: WorkItem): WorkItemCopyModel {
  const lifecycleLabel =
    item.kind === "project"
      ? "Project stage"
      : item.kind === "content_idea"
        ? "Content stage"
        : "Lifecycle status";
  const metadata = [
    `Record type: ${item.typeLabel}`,
    `Status: ${item.status || "Not Recorded"}`,
    item.lifecycleStatus !== item.status
      ? `${lifecycleLabel}: ${item.lifecycleStatus || "Not Recorded"}`
      : null,
    `Priority: ${item.priority || "Not Recorded"}`,
    `Owner: ${item.assignee || "Not Recorded"}`,
    `Workstream: ${item.workstream || "Not Recorded"}`,
  ].filter((value): value is string => Boolean(value));
  const schedule = [
    item.scheduledAt ? `Work block: ${item.scheduledAt}` : null,
    item.dueDate ? `Deadline: ${item.dueDate}` : null,
    item.followUpDate ? `Follow-up: ${item.followUpDate}` : null,
    item.waitingOn ? `Waiting on: ${item.waitingOn}` : null,
  ].filter((value): value is string => Boolean(value));
  const rawNextAction = item.primaryAction?.title?.trim() || null;
  const nextAction = rawNextAction
    ? rawNextAction.replace(/^Next action:\s*/i, "")
    : item.status === "Completed"
      ? null
      : item.title;
  return {
    title: item.title,
    metadata,
    schedule,
    nextAction,
    overview: item.body.trim() || null,
    generatedPrompt: item.generatedPrompt?.trim() || null,
  };
}
