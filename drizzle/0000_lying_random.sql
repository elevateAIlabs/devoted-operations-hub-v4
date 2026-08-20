CREATE TABLE `actions` (
	`id` text NOT NULL,
	`owner_email` text NOT NULL,
	`source_record_id` text NOT NULL,
	`auto_key` text NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Inbox' NOT NULL,
	`priority` text DEFAULT 'Normal' NOT NULL,
	`impact` text DEFAULT 'Normal' NOT NULL,
	`effort_minutes` integer,
	`assignee` text,
	`due_date` text,
	`scheduled_at` text,
	`follow_up_date` text,
	`waiting_on` text,
	`pinned` integer DEFAULT false NOT NULL,
	`archived_at` text,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`owner_email`, `id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `actions_owner_auto_key_idx` ON `actions` (`owner_email`,`auto_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `actions_owner_source_idx` ON `actions` (`owner_email`,`source_record_id`);--> statement-breakpoint
CREATE TABLE `activity_events` (
	`id` text NOT NULL,
	`owner_email` text NOT NULL,
	`record_id` text,
	`action` text NOT NULL,
	`detail_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`owner_email`, `id`)
);
--> statement-breakpoint
CREATE INDEX `activity_owner_created_idx` ON `activity_events` (`owner_email`,`created_at`);--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text NOT NULL,
	`owner_email` text NOT NULL,
	`record_id` text NOT NULL,
	`action_id` text,
	`file_name` text NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer DEFAULT 0 NOT NULL,
	`is_cover` integer DEFAULT false NOT NULL,
	`available` integer DEFAULT false NOT NULL,
	`storage_key` text,
	`archived_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`owner_email`, `id`)
);
--> statement-breakpoint
CREATE INDEX `attachments_owner_record_idx` ON `attachments` (`owner_email`,`record_id`);--> statement-breakpoint
CREATE TABLE `migration_history` (
	`id` text NOT NULL,
	`owner_email` text NOT NULL,
	`status` text NOT NULL,
	`before_record_count` integer DEFAULT 0 NOT NULL,
	`after_record_count` integer DEFAULT 0 NOT NULL,
	`preview_action_count` integer DEFAULT 0 NOT NULL,
	`created_action_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	PRIMARY KEY(`owner_email`, `id`)
);
--> statement-breakpoint
CREATE TABLE `preferences` (
	`owner_email` text PRIMARY KEY NOT NULL,
	`density` text DEFAULT 'compact' NOT NULL,
	`orange` text DEFAULT '#ff5a00' NOT NULL,
	`ranking_json` text DEFAULT '{}' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text NOT NULL,
	`owner_email` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Inbox' NOT NULL,
	`workstream` text DEFAULT 'Other' NOT NULL,
	`priority` text DEFAULT 'Normal' NOT NULL,
	`impact` text DEFAULT 'Normal' NOT NULL,
	`effort_minutes` integer,
	`assignee` text,
	`due_date` text,
	`scheduled_at` text,
	`follow_up_date` text,
	`waiting_on` text,
	`related_project_id` text,
	`related_url` text,
	`tags` text DEFAULT '' NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`archived_at` text,
	`completed_at` text,
	`carry_forward_count` integer DEFAULT 0 NOT NULL,
	`source_record_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`owner_email`, `id`)
);
--> statement-breakpoint
CREATE INDEX `records_owner_kind_idx` ON `records` (`owner_email`,`kind`);--> statement-breakpoint
CREATE INDEX `records_owner_status_idx` ON `records` (`owner_email`,`status`);--> statement-breakpoint
CREATE INDEX `records_owner_due_idx` ON `records` (`owner_email`,`due_date`);