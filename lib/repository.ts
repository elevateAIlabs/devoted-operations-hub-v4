import { and, desc, eq, inArray } from "drizzle-orm";
import seedBackup from "@/data/devoted-hq-backup.json";
import { getDb } from "@/db";
import {
  actions,
  activityEvents,
  attachments,
  migrationHistory,
  preferences,
  records,
} from "@/db/schema";
import type {
  ActionItem,
  Attachment,
  DevotedRecord,
  MigrationSummary,
  Preferences,
} from "./types";

type SeedBackup = {
  exportedAt: string;
  records: DevotedRecord[];
  actions: ActionItem[];
  attachments: Attachment[];
  preferences: Preferences;
  migration: MigrationSummary | null;
};

const SEED = seedBackup as SeedBackup;

const DEFAULT_RANKING: Preferences["ranking"] = {
  urgency: 25,
  consequence: 25,
  blocking: 20,
  revenueCompliance: 15,
  staleness: 10,
  effortFit: 5,
};

function chunks<T>(values: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function now() {
  return new Date().toISOString();
}

function normalizeNullable(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeEffortMinutes(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function actionTitle(record: Pick<DevotedRecord, "kind" | "title">) {
  if (record.kind === "project" || record.kind === "content_idea") {
    return `Next action: ${record.title}`;
  }
  return record.title;
}

function isActionableKind(kind: string) {
  return ["task", "project", "content_idea", "accounting_exception"].includes(kind);
}

async function logActivity(
  ownerEmail: string,
  recordId: string | null,
  action: string,
  detail: Record<string, unknown> = {},
) {
  const db = getDb();
  await db.insert(activityEvents).values({
    id: crypto.randomUUID(),
    ownerEmail,
    recordId,
    action,
    detailJson: JSON.stringify(detail),
    createdAt: now(),
  });
}

export async function ensureSeeded(ownerEmail: string) {
  const db = getDb();
  const existing = await db
    .select({ id: records.id })
    .from(records)
    .where(eq(records.ownerEmail, ownerEmail))
    .limit(1);
  if (existing.length) return;

  // The recovered V3 export belongs to the first authorized workspace owner.
  // Once any owner-scoped data exists, another authenticated identity receives
  // an empty workspace rather than a duplicate of Greg's private backup.
  const workspaceAlreadyClaimed = await db
    .select({ ownerEmail: records.ownerEmail })
    .from(records)
    .limit(1);
  if (workspaceAlreadyClaimed.length) return;

  const seededRecords = SEED.records.map((record) => ({ ...record, ownerEmail }));
  const seededActions = SEED.actions.map((action) => ({ ...action, ownerEmail }));
  const seededAttachments = SEED.attachments.map((attachment) => ({
    ...attachment,
    ownerEmail,
    available: false,
  }));

  // D1 limits a prepared statement to 100 bound parameters. Keep seed
  // batches below that ceiling (records have 26 persisted columns).
  for (const batch of chunks(seededRecords, 3)) {
    await db.insert(records).values(batch).onConflictDoNothing();
  }
  for (const batch of chunks(seededActions, 4)) {
    await db.insert(actions).values(batch).onConflictDoNothing();
  }
  for (const batch of chunks(seededAttachments, 6)) {
    await db.insert(attachments).values(batch).onConflictDoNothing();
  }

  await db
    .insert(preferences)
    .values({
      ownerEmail,
      density: SEED.preferences.density,
      orange: SEED.preferences.orange,
      rankingJson: JSON.stringify(SEED.preferences.ranking),
      updatedAt: now(),
    })
    .onConflictDoNothing();

  if (SEED.migration) {
    await db
      .insert(migrationHistory)
      .values({ ...SEED.migration, ownerEmail })
      .onConflictDoNothing();
  }
  await logActivity(ownerEmail, null, "seed_imported", {
    exportedAt: SEED.exportedAt,
    records: seededRecords.length,
    actions: seededActions.length,
    attachments: seededAttachments.length,
  });
}

export async function loadWorkspace(ownerEmail: string) {
  await ensureSeeded(ownerEmail);
  const db = getDb();
  const [recordRows, actionRows, attachmentRows, preferenceRows, migrationRows] =
    await Promise.all([
      db.select().from(records).where(eq(records.ownerEmail, ownerEmail)),
      db.select().from(actions).where(eq(actions.ownerEmail, ownerEmail)),
      db.select().from(attachments).where(eq(attachments.ownerEmail, ownerEmail)),
      db.select().from(preferences).where(eq(preferences.ownerEmail, ownerEmail)).limit(1),
      db
        .select()
        .from(migrationHistory)
        .where(eq(migrationHistory.ownerEmail, ownerEmail))
        .orderBy(desc(migrationHistory.createdAt))
        .limit(1),
    ]);

  const preference = preferenceRows[0];
  return {
    exportedAt: SEED.exportedAt,
    records: recordRows as DevotedRecord[],
    actions: actionRows as ActionItem[],
    attachments: attachmentRows as Attachment[],
    preferences: {
      density: preference?.density === "comfortable" ? "comfortable" : "compact",
      orange: preference?.orange ?? "#ff5a00",
      ranking: preference
        ? (JSON.parse(preference.rankingJson) as Preferences["ranking"])
        : DEFAULT_RANKING,
    } satisfies Preferences,
    migration: (migrationRows[0] ?? null) as MigrationSummary | null,
  };
}

export async function createRecord(
  ownerEmail: string,
  input: Partial<DevotedRecord> & { title: string; generatedPrompt?: string | null },
) {
  const db = getDb();
  const timestamp = now();
  const id = input.id ?? crypto.randomUUID();
  let metadata: Record<string, unknown> = {};
  try {
    metadata = JSON.parse(input.metadataJson ?? "{}");
  } catch {
    metadata = {};
  }
  if (input.generatedPrompt) metadata.generatedPrompt = input.generatedPrompt;

  const record: DevotedRecord = {
    id,
    ownerEmail,
    kind: input.kind ?? "task",
    title: input.title.trim(),
    body: input.body?.trim() ?? "",
    status: input.status ?? "Inbox",
    workstream: input.workstream ?? "Business Administration",
    priority: input.priority ?? "Normal",
    impact: input.impact ?? "Normal",
    effortMinutes: normalizeEffortMinutes(input.effortMinutes),
    assignee: input.assignee ?? "Greg",
    dueDate: normalizeNullable(input.dueDate),
    scheduledAt: normalizeNullable(input.scheduledAt),
    followUpDate: normalizeNullable(input.followUpDate),
    waitingOn: normalizeNullable(input.waitingOn),
    relatedProjectId: normalizeNullable(input.relatedProjectId),
    relatedUrl: normalizeNullable(input.relatedUrl),
    tags: input.tags ?? "",
    metadataJson: JSON.stringify(metadata),
    pinned: input.pinned ?? false,
    archivedAt: null,
    completedAt: null,
    carryForwardCount: 0,
    sourceRecordId: normalizeNullable(input.sourceRecordId),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(records).values(record);
  if (isActionableKind(record.kind)) {
    const executionStatus =
      record.kind === "project" || record.kind === "content_idea"
        ? "Not Started"
        : record.status;
    await db.insert(actions).values({
      id: crypto.randomUUID(),
      ownerEmail,
      sourceRecordId: record.id,
      autoKey: `primary:${record.id}`,
      title: actionTitle(record),
      body: record.body,
      status: executionStatus,
      priority: record.priority,
      impact: record.impact,
      effortMinutes: record.effortMinutes,
      assignee: record.assignee,
      dueDate: record.dueDate,
      scheduledAt: record.scheduledAt,
      followUpDate: record.followUpDate,
      waitingOn: record.waitingOn,
      pinned: record.pinned,
      archivedAt: null,
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
  await logActivity(ownerEmail, record.id, "record_created", { kind: record.kind });
  return record;
}

const RECORD_PATCH_KEYS = [
  "kind",
  "title",
  "body",
  "status",
  "workstream",
  "priority",
  "impact",
  "effortMinutes",
  "assignee",
  "dueDate",
  "scheduledAt",
  "followUpDate",
  "waitingOn",
  "relatedProjectId",
  "relatedUrl",
  "tags",
  "metadataJson",
  "pinned",
  "archivedAt",
  "completedAt",
] as const;

export async function updateRecord(
  ownerEmail: string,
  id: string,
  input: Partial<DevotedRecord> & {
    generatedPrompt?: string | null;
    primaryActionId?: string | null;
    executionStatus?: string | null;
    executionCompletedAt?: string | null;
  },
) {
  const db = getDb();
  const existingRows = await db
    .select()
    .from(records)
    .where(and(eq(records.ownerEmail, ownerEmail), eq(records.id, id)))
    .limit(1);
  const existing = existingRows[0];
  if (!existing) return null;

  const patch: Record<string, unknown> = { updatedAt: now() };
  for (const key of RECORD_PATCH_KEYS) {
    if (!(key in input)) continue;
    if (key === "effortMinutes") {
      patch[key] = normalizeEffortMinutes(input[key]);
    } else if (
      [
        "assignee",
        "dueDate",
        "scheduledAt",
        "followUpDate",
        "waitingOn",
        "relatedProjectId",
        "relatedUrl",
        "archivedAt",
        "completedAt",
      ].includes(key)
    ) {
      patch[key] = normalizeNullable(input[key]);
    } else {
      patch[key] = input[key];
    }
  }
  if ("generatedPrompt" in input) {
    let metadata: Record<string, unknown> = {};
    try {
      metadata = JSON.parse((input.metadataJson ?? existing.metadataJson) || "{}");
    } catch {
      metadata = {};
    }
    if (input.generatedPrompt) metadata.generatedPrompt = input.generatedPrompt;
    else delete metadata.generatedPrompt;
    patch.metadataJson = JSON.stringify(metadata);
  }

  await db
    .update(records)
    .set(patch)
    .where(and(eq(records.ownerEmail, ownerEmail), eq(records.id, id)));

  const merged = { ...existing, ...patch } as DevotedRecord;
  const requestedActionId = normalizeNullable(input.primaryActionId);
  const primaryRows = requestedActionId
    ? await db
        .select()
        .from(actions)
        .where(and(eq(actions.ownerEmail, ownerEmail), eq(actions.id, requestedActionId)))
        .limit(1)
    : await db
        .select()
        .from(actions)
        .where(and(eq(actions.ownerEmail, ownerEmail), eq(actions.sourceRecordId, id)))
        .limit(1);
  let primary: ActionItem | undefined = primaryRows[0] as
    | ActionItem
    | undefined;
  if (primary && primary.sourceRecordId !== id) {
    const executionRows = await db
      .select({ kind: records.kind, sourceRecordId: records.sourceRecordId })
      .from(records)
      .where(
        and(
          eq(records.ownerEmail, ownerEmail),
          eq(records.id, primary.sourceRecordId),
        ),
      )
      .limit(1);
    const execution = executionRows[0];
    const promptRows = execution?.sourceRecordId
      ? await db
          .select({ kind: records.kind, sourceRecordId: records.sourceRecordId })
          .from(records)
          .where(
            and(
              eq(records.ownerEmail, ownerEmail),
              eq(records.id, execution.sourceRecordId),
            ),
          )
          .limit(1)
      : [];
    const prompt = promptRows[0];
    const validLegacyChain =
      execution?.kind === "task" &&
      prompt?.kind === "generated_prompt" &&
      prompt.sourceRecordId === id;
    if (!validLegacyChain) primary = undefined;
  }
  if (primary || isActionableKind(merged.kind)) {
    const lifecycleKind =
      merged.kind === "project" || merged.kind === "content_idea";
    const hasExecutionStatus = "executionStatus" in input;
    const hasExecutionCompletedAt = "executionCompletedAt" in input;
    const actionStatus = hasExecutionStatus
      ? normalizeNullable(input.executionStatus) ?? "Not Started"
      : lifecycleKind
        ? primary?.status ?? "Not Started"
        : merged.status;
    const actionCompletedAt = hasExecutionCompletedAt
      ? normalizeNullable(input.executionCompletedAt)
      : lifecycleKind
        ? primary?.completedAt ?? null
        : merged.completedAt;
    const legacyExecution = primary && primary.sourceRecordId !== id;
    const actionPatch = {
      title: legacyExecution ? primary!.title : actionTitle(merged),
      body: legacyExecution ? primary!.body : merged.body,
      status: actionStatus,
      priority: merged.priority,
      impact: merged.impact,
      effortMinutes: merged.effortMinutes,
      assignee: merged.assignee,
      dueDate: merged.dueDate,
      scheduledAt: merged.scheduledAt,
      followUpDate: merged.followUpDate,
      waitingOn: merged.waitingOn,
      pinned: merged.pinned,
      archivedAt: merged.archivedAt,
      completedAt: actionCompletedAt,
      updatedAt: now(),
    };
    if (primary) {
      await db
        .update(actions)
        .set(actionPatch)
        .where(and(eq(actions.ownerEmail, ownerEmail), eq(actions.id, primary.id)));
    } else {
      await db.insert(actions).values({
        id: crypto.randomUUID(),
        ownerEmail,
        sourceRecordId: id,
        autoKey: `primary:${id}`,
        ...actionPatch,
        createdAt: now(),
      });
    }
  }

  await logActivity(ownerEmail, id, "record_updated", { fields: Object.keys(input) });
  return merged;
}

export async function updateAction(
  ownerEmail: string,
  id: string,
  input: Partial<ActionItem>,
) {
  const db = getDb();
  const rows = await db
    .select()
    .from(actions)
    .where(and(eq(actions.ownerEmail, ownerEmail), eq(actions.id, id)))
    .limit(1);
  const existing = rows[0];
  if (!existing) return null;
  const allowed = [
    "title",
    "body",
    "status",
    "priority",
    "impact",
    "effortMinutes",
    "assignee",
    "dueDate",
    "scheduledAt",
    "followUpDate",
    "waitingOn",
    "pinned",
    "archivedAt",
    "completedAt",
  ] as const;
  const patch: Record<string, unknown> = { updatedAt: now() };
  for (const key of allowed) {
    if (!(key in input)) continue;
    if (key === "effortMinutes") {
      patch[key] = normalizeEffortMinutes(input[key]);
    } else if (
      [
        "assignee",
        "dueDate",
        "scheduledAt",
        "followUpDate",
        "waitingOn",
        "archivedAt",
        "completedAt",
      ].includes(key)
    ) {
      patch[key] = normalizeNullable(input[key]);
    } else {
      patch[key] = input[key];
    }
  }
  await db
    .update(actions)
    .set(patch)
    .where(and(eq(actions.ownerEmail, ownerEmail), eq(actions.id, id)));

  const recordPatch: Record<string, unknown> = { updatedAt: now() };
  for (const key of [
    "status",
    "priority",
    "impact",
    "effortMinutes",
    "assignee",
    "dueDate",
    "scheduledAt",
    "followUpDate",
    "waitingOn",
    "pinned",
    "archivedAt",
    "completedAt",
  ] as const) {
    if (key in input) recordPatch[key] = input[key];
  }
  await db
    .update(records)
    .set(recordPatch)
    .where(
      and(
        eq(records.ownerEmail, ownerEmail),
        eq(records.id, existing.sourceRecordId),
      ),
    );
  await logActivity(ownerEmail, existing.sourceRecordId, "action_updated", {
    actionId: id,
    fields: Object.keys(input),
  });
  return { ...existing, ...patch };
}

export async function updatePreferences(
  ownerEmail: string,
  input: Partial<Preferences>,
) {
  const db = getDb();
  const current = await loadWorkspace(ownerEmail);
  const next: Preferences = {
    density: input.density ?? current.preferences.density,
    orange: input.orange ?? current.preferences.orange,
    ranking: { ...current.preferences.ranking, ...(input.ranking ?? {}) },
  };
  await db
    .insert(preferences)
    .values({
      ownerEmail,
      density: next.density,
      orange: next.orange,
      rankingJson: JSON.stringify(next.ranking),
      updatedAt: now(),
    })
    .onConflictDoUpdate({
      target: preferences.ownerEmail,
      set: {
        density: next.density,
        orange: next.orange,
        rankingJson: JSON.stringify(next.ranking),
        updatedAt: now(),
      },
    });
  return next;
}

export async function permanentlyDeleteRecord(ownerEmail: string, id: string) {
  const db = getDb();
  const promptRows = await db
    .select({ id: records.id })
    .from(records)
    .where(
      and(
        eq(records.ownerEmail, ownerEmail),
        eq(records.kind, "generated_prompt"),
        eq(records.sourceRecordId, id),
      ),
    );
  const promptIds = promptRows.map((row) => row.id);
  const executionRows = promptIds.length
    ? await db
        .select({ id: records.id })
        .from(records)
        .where(
          and(
            eq(records.ownerEmail, ownerEmail),
            eq(records.kind, "task"),
            inArray(records.sourceRecordId, promptIds),
          ),
        )
    : [];
  const relatedRecordIds = [
    id,
    ...promptIds,
    ...executionRows.map((row) => row.id),
  ];
  await db
    .delete(attachments)
    .where(
      and(
        eq(attachments.ownerEmail, ownerEmail),
        inArray(attachments.recordId, relatedRecordIds),
      ),
    );
  await db
    .delete(actions)
    .where(
      and(
        eq(actions.ownerEmail, ownerEmail),
        inArray(actions.sourceRecordId, relatedRecordIds),
      ),
    );
  await db
    .delete(records)
    .where(
      and(
        eq(records.ownerEmail, ownerEmail),
        inArray(records.id, relatedRecordIds),
      ),
    );
  await logActivity(ownerEmail, id, "record_permanently_deleted");
}
