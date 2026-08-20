export type RecordKind =
  | "accounting_checklist"
  | "accounting_exception"
  | "accounting_period"
  | "contact"
  | "content_idea"
  | "generated_prompt"
  | "link"
  | "note"
  | "project"
  | "recurring_template"
  | "reference"
  | "task"
  | string;

export type DevotedRecord = {
  id: string;
  ownerEmail: string;
  kind: RecordKind;
  title: string;
  body: string;
  status: string;
  workstream: string;
  priority: string;
  impact: string;
  effortMinutes: number | null;
  assignee: string | null;
  dueDate: string | null;
  scheduledAt: string | null;
  followUpDate: string | null;
  waitingOn: string | null;
  relatedProjectId: string | null;
  relatedUrl: string | null;
  tags: string;
  metadataJson: string;
  pinned: boolean;
  archivedAt: string | null;
  completedAt: string | null;
  carryForwardCount: number;
  sourceRecordId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ActionItem = {
  id: string;
  ownerEmail: string;
  sourceRecordId: string;
  autoKey: string;
  title: string;
  body: string;
  status: string;
  priority: string;
  impact: string;
  effortMinutes: number | null;
  assignee: string | null;
  dueDate: string | null;
  scheduledAt: string | null;
  followUpDate: string | null;
  waitingOn: string | null;
  pinned: boolean;
  archivedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Attachment = {
  id: string;
  recordId: string;
  actionId: string | null;
  fileName: string;
  caption: string;
  contentType: string;
  sizeBytes: number;
  isCover: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  available?: boolean;
  storageKey?: string | null;
};

export type Preferences = {
  density: "compact" | "comfortable";
  orange: string;
  ranking: {
    urgency: number;
    consequence: number;
    blocking: number;
    revenueCompliance: number;
    staleness: number;
    effortFit: number;
  };
};

export type MigrationSummary = {
  id: string;
  status: string;
  beforeRecordCount: number;
  afterRecordCount: number;
  previewActionCount: number;
  createdActionCount: number;
  createdAt: string;
  completedAt: string | null;
};

export type WorkItem = {
  id: string;
  masterRecordId: string;
  kind: RecordKind;
  typeLabel: string;
  title: string;
  body: string;
  generatedPrompt: string | null;
  lifecycleStatus: string;
  status: string;
  workstream: string;
  priority: string;
  impact: string;
  effortMinutes: number | null;
  assignee: string | null;
  dueDate: string | null;
  scheduledAt: string | null;
  followUpDate: string | null;
  waitingOn: string | null;
  relatedProjectId: string | null;
  relatedUrl: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  pinned: boolean;
  archivedAt: string | null;
  completedAt: string | null;
  carryForwardCount: number;
  createdAt: string;
  updatedAt: string;
  primaryActionId: string | null;
  sourceRecord: DevotedRecord;
  primaryAction: ActionItem | null;
};

export type ScheduleRole = "work" | "due" | "follow-up";

export type ScheduleProjection = {
  date: string;
  item: WorkItem;
  roles: ScheduleRole[];
  timeLabel: string | null;
};

export type BootstrapPayload = {
  exportedAt: string;
  owner: { email: string; displayName: string };
  records: DevotedRecord[];
  actions: ActionItem[];
  attachments: Attachment[];
  preferences: Preferences;
  migration: MigrationSummary | null;
  workItems: WorkItem[];
  integrity: {
    sourceRecordCount: number;
    primaryActionCount: number;
    canonicalItemCount: number;
    duplicatePrimaryActionKeys: number;
    orphanActions: number;
    orphanAttachments: number;
    unavailableAttachmentFiles: number;
  };
};
