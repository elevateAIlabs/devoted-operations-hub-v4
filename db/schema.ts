import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const records = sqliteTable(
  "records",
  {
    id: text("id").notNull(),
    ownerEmail: text("owner_email").notNull(),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    status: text("status").notNull().default("Inbox"),
    workstream: text("workstream").notNull().default("Other"),
    priority: text("priority").notNull().default("Normal"),
    impact: text("impact").notNull().default("Normal"),
    effortMinutes: integer("effort_minutes"),
    assignee: text("assignee"),
    dueDate: text("due_date"),
    scheduledAt: text("scheduled_at"),
    followUpDate: text("follow_up_date"),
    waitingOn: text("waiting_on"),
    relatedProjectId: text("related_project_id"),
    relatedUrl: text("related_url"),
    tags: text("tags").notNull().default(""),
    metadataJson: text("metadata_json").notNull().default("{}"),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    archivedAt: text("archived_at"),
    completedAt: text("completed_at"),
    carryForwardCount: integer("carry_forward_count").notNull().default(0),
    sourceRecordId: text("source_record_id"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.ownerEmail, table.id] }),
    index("records_owner_kind_idx").on(table.ownerEmail, table.kind),
    index("records_owner_status_idx").on(table.ownerEmail, table.status),
    index("records_owner_due_idx").on(table.ownerEmail, table.dueDate),
  ],
);

export const actions = sqliteTable(
  "actions",
  {
    id: text("id").notNull(),
    ownerEmail: text("owner_email").notNull(),
    sourceRecordId: text("source_record_id").notNull(),
    autoKey: text("auto_key").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    status: text("status").notNull().default("Inbox"),
    priority: text("priority").notNull().default("Normal"),
    impact: text("impact").notNull().default("Normal"),
    effortMinutes: integer("effort_minutes"),
    assignee: text("assignee"),
    dueDate: text("due_date"),
    scheduledAt: text("scheduled_at"),
    followUpDate: text("follow_up_date"),
    waitingOn: text("waiting_on"),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    archivedAt: text("archived_at"),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.ownerEmail, table.id] }),
    uniqueIndex("actions_owner_auto_key_idx").on(table.ownerEmail, table.autoKey),
    uniqueIndex("actions_owner_source_idx").on(table.ownerEmail, table.sourceRecordId),
  ],
);

export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id").notNull(),
    ownerEmail: text("owner_email").notNull(),
    recordId: text("record_id").notNull(),
    actionId: text("action_id"),
    fileName: text("file_name").notNull(),
    caption: text("caption").notNull().default(""),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull().default(0),
    isCover: integer("is_cover", { mode: "boolean" }).notNull().default(false),
    available: integer("available", { mode: "boolean" }).notNull().default(false),
    storageKey: text("storage_key"),
    archivedAt: text("archived_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.ownerEmail, table.id] }),
    index("attachments_owner_record_idx").on(table.ownerEmail, table.recordId),
  ],
);

export const preferences = sqliteTable("preferences", {
  ownerEmail: text("owner_email").primaryKey(),
  density: text("density").notNull().default("compact"),
  orange: text("orange").notNull().default("#ff5a00"),
  rankingJson: text("ranking_json").notNull().default("{}"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const migrationHistory = sqliteTable(
  "migration_history",
  {
    id: text("id").notNull(),
    ownerEmail: text("owner_email").notNull(),
    status: text("status").notNull(),
    beforeRecordCount: integer("before_record_count").notNull().default(0),
    afterRecordCount: integer("after_record_count").notNull().default(0),
    previewActionCount: integer("preview_action_count").notNull().default(0),
    createdActionCount: integer("created_action_count").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    completedAt: text("completed_at"),
  },
  (table) => [primaryKey({ columns: [table.ownerEmail, table.id] })],
);

export const activityEvents = sqliteTable(
  "activity_events",
  {
    id: text("id").notNull(),
    ownerEmail: text("owner_email").notNull(),
    recordId: text("record_id"),
    action: text("action").notNull(),
    detailJson: text("detail_json").notNull().default("{}"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.ownerEmail, table.id] }),
    index("activity_owner_created_idx").on(table.ownerEmail, table.createdAt),
  ],
);
