#!/usr/bin/env python3

from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_D1_DIR = (
    PROJECT_ROOT
    / ".wrangler"
    / "state"
    / "v3"
    / "d1"
    / "miniflare-D1DatabaseObject"
)
SNAPSHOT_ROOT = PROJECT_ROOT / ".local-qa-snapshots"


RECORD_COLUMNS = [
    "id",
    "owner_email",
    "kind",
    "title",
    "body",
    "status",
    "workstream",
    "priority",
    "impact",
    "effort_minutes",
    "assignee",
    "due_date",
    "scheduled_at",
    "follow_up_date",
    "waiting_on",
    "related_project_id",
    "related_url",
    "tags",
    "metadata_json",
    "pinned",
    "archived_at",
    "completed_at",
    "carry_forward_count",
    "source_record_id",
    "created_at",
    "updated_at",
]

ACTION_COLUMNS = [
    "id",
    "owner_email",
    "source_record_id",
    "auto_key",
    "title",
    "body",
    "status",
    "priority",
    "impact",
    "effort_minutes",
    "assignee",
    "due_date",
    "scheduled_at",
    "follow_up_date",
    "waiting_on",
    "pinned",
    "archived_at",
    "completed_at",
    "created_at",
    "updated_at",
]

ATTACHMENT_COLUMNS = [
    "id",
    "owner_email",
    "record_id",
    "action_id",
    "file_name",
    "caption",
    "content_type",
    "size_bytes",
    "is_cover",
    "available",
    "storage_key",
    "archived_at",
    "created_at",
    "updated_at",
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def camel(row: dict[str, Any], name: str, default: Any = None) -> Any:
    return row.get(name, default)


def boolean_int(value: Any) -> int:
    return 1 if value is True or value == 1 else 0


def locate_local_d1(explicit: str | None) -> Path:
    if explicit:
        target = Path(explicit).expanduser().resolve()
        local_root = DEFAULT_D1_DIR.resolve()

        try:
            target.relative_to(local_root)
        except ValueError as exc:
            raise RuntimeError(
                f"Refusing non-local D1 target outside {local_root}: {target}"
            ) from exc

        if not target.is_file():
            raise RuntimeError(f"Local D1 target does not exist: {target}")

        return target

    candidates = sorted(
        path.resolve()
        for path in DEFAULT_D1_DIR.glob("*.sqlite")
        if path.name != "metadata.sqlite"
    )

    if len(candidates) != 1:
        raise RuntimeError(
            "Expected exactly one project-local Miniflare D1 database; "
            f"found {len(candidates)}: {candidates}"
        )

    return candidates[0]


def read_snapshot(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    if not isinstance(data, dict):
        raise RuntimeError("Snapshot root must be a JSON object.")

    required = ["records", "actions", "attachments", "preferences"]
    for key in required:
        if key not in data:
            raise RuntimeError(f"Snapshot missing required key: {key}")

    for key in ["records", "actions", "attachments"]:
        if not isinstance(data[key], list):
            raise RuntimeError(f"Snapshot key '{key}' must contain a list.")

    if not isinstance(data["preferences"], dict):
        raise RuntimeError("Snapshot preferences must be an object.")

    return data


def duplicates(values: list[str]) -> list[str]:
    seen: set[str] = set()
    repeated: set[str] = set()

    for value in values:
        if value in seen:
            repeated.add(value)
        seen.add(value)

    return sorted(repeated)


def validate_snapshot(data: dict[str, Any]) -> dict[str, Any]:
    records = data["records"]
    actions = data["actions"]
    attachments = data["attachments"]

    record_ids = [str(row.get("id", "")) for row in records]
    action_ids = [str(row.get("id", "")) for row in actions]
    attachment_ids = [str(row.get("id", "")) for row in attachments]

    if any(not value for value in record_ids):
        raise RuntimeError("One or more records are missing IDs.")
    if any(not value for value in action_ids):
        raise RuntimeError("One or more actions are missing IDs.")
    if any(not value for value in attachment_ids):
        raise RuntimeError("One or more attachments are missing IDs.")

    duplicate_records = duplicates(record_ids)
    duplicate_actions = duplicates(action_ids)
    duplicate_attachments = duplicates(attachment_ids)

    if duplicate_records:
        raise RuntimeError(f"Duplicate record IDs: {duplicate_records}")
    if duplicate_actions:
        raise RuntimeError(f"Duplicate action IDs: {duplicate_actions}")
    if duplicate_attachments:
        raise RuntimeError(f"Duplicate attachment IDs: {duplicate_attachments}")

    record_set = set(record_ids)
    action_set = set(action_ids)

    orphan_actions = [
        row.get("id")
        for row in actions
        if row.get("sourceRecordId") not in record_set
    ]

    orphan_record_attachments = [
        row.get("id")
        for row in attachments
        if row.get("recordId") not in record_set
    ]

    orphan_action_attachments = [
        row.get("id")
        for row in attachments
        if row.get("actionId") and row.get("actionId") not in action_set
    ]

    if orphan_actions:
        raise RuntimeError(f"Actions with missing parent records: {orphan_actions}")

    if orphan_record_attachments:
        raise RuntimeError(
            "Attachments with missing parent records: "
            f"{orphan_record_attachments}"
        )

    if orphan_action_attachments:
        raise RuntimeError(
            "Attachments with missing referenced actions: "
            f"{orphan_action_attachments}"
        )

    owners = {
        row.get("ownerEmail")
        for collection in [records, actions, attachments]
        for row in collection
        if row.get("ownerEmail")
    }

    if len(owners) > 1:
        raise RuntimeError(f"Snapshot contains multiple owners: {sorted(owners)}")

    return {
        "records": len(records),
        "actions": len(actions),
        "attachments": len(attachments),
        "owner": next(iter(owners), None),
        "exportedAt": data.get("exportedAt"),
    }


def current_counts(conn: sqlite3.Connection) -> dict[str, int]:
    result: dict[str, int] = {}

    for table in [
        "records",
        "actions",
        "attachments",
        "preferences",
        "migration_history",
        "activity_events",
    ]:
        result[table] = int(
            conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        )

    return result


def make_snapshot(
    db_path: Path,
    source_json: Path,
    source_hash: str,
) -> Path:
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    destination = SNAPSHOT_ROOT / f"{stamp}-pre-local-qa-refresh"
    destination.mkdir(parents=True, exist_ok=False)

    backup_path = destination / "local-qa.sqlite"

    source_conn = sqlite3.connect(db_path)
    backup_conn = sqlite3.connect(backup_path)

    try:
        source_conn.backup(backup_conn)
    finally:
        backup_conn.close()
        source_conn.close()

    counts_conn = sqlite3.connect(backup_path)
    try:
        counts = current_counts(counts_conn)
    finally:
        counts_conn.close()

    manifest = destination / "MANIFEST.txt"
    manifest.write_text(
        "\n".join(
            [
                "Devoted HQ Local QA Snapshot",
                "============================",
                "",
                "Purpose:",
                "Automatic pre-refresh local QA preservation point",
                "",
                f"Created: {utc_now()}",
                f"Local D1 source: {db_path}",
                f"Preserved SQLite SHA-256: {sha256(backup_path)}",
                "",
                "Preserved counts:",
                *(f"{key}={value}" for key, value in counts.items()),
                "",
                f"Refresh source JSON: {source_json}",
                f"Refresh source SHA-256: {source_hash}",
                "",
                "No remote D1 or R2 mutation is part of this snapshot.",
                "",
            ]
        ),
        encoding="utf-8",
    )

    return destination


def record_values(row: dict[str, Any]) -> list[Any]:
    return [
        camel(row, "id"),
        camel(row, "ownerEmail"),
        camel(row, "kind"),
        camel(row, "title"),
        camel(row, "body", "") or "",
        camel(row, "status", "Inbox") or "Inbox",
        camel(row, "workstream", "Other") or "Other",
        camel(row, "priority", "Normal") or "Normal",
        camel(row, "impact", "Normal") or "Normal",
        camel(row, "effortMinutes"),
        camel(row, "assignee"),
        camel(row, "dueDate"),
        camel(row, "scheduledAt"),
        camel(row, "followUpDate"),
        camel(row, "waitingOn"),
        camel(row, "relatedProjectId"),
        camel(row, "relatedUrl"),
        camel(row, "tags", "") or "",
        camel(row, "metadataJson", "{}") or "{}",
        boolean_int(camel(row, "pinned", False)),
        camel(row, "archivedAt"),
        camel(row, "completedAt"),
        camel(row, "carryForwardCount", 0) or 0,
        camel(row, "sourceRecordId"),
        camel(row, "createdAt") or utc_now(),
        camel(row, "updatedAt") or utc_now(),
    ]


def action_values(row: dict[str, Any]) -> list[Any]:
    return [
        camel(row, "id"),
        camel(row, "ownerEmail"),
        camel(row, "sourceRecordId"),
        camel(row, "autoKey"),
        camel(row, "title"),
        camel(row, "body", "") or "",
        camel(row, "status", "Inbox") or "Inbox",
        camel(row, "priority", "Normal") or "Normal",
        camel(row, "impact", "Normal") or "Normal",
        camel(row, "effortMinutes"),
        camel(row, "assignee"),
        camel(row, "dueDate"),
        camel(row, "scheduledAt"),
        camel(row, "followUpDate"),
        camel(row, "waitingOn"),
        boolean_int(camel(row, "pinned", False)),
        camel(row, "archivedAt"),
        camel(row, "completedAt"),
        camel(row, "createdAt") or utc_now(),
        camel(row, "updatedAt") or utc_now(),
    ]


def attachment_values(row: dict[str, Any]) -> list[Any]:
    # Metadata-only local refresh:
    # production storage keys do not prove local binary availability.
    return [
        camel(row, "id"),
        camel(row, "ownerEmail"),
        camel(row, "recordId"),
        camel(row, "actionId"),
        camel(row, "fileName"),
        camel(row, "caption", "") or "",
        camel(row, "contentType"),
        camel(row, "sizeBytes", 0) or 0,
        boolean_int(camel(row, "isCover", False)),
        0,
        None,
        camel(row, "archivedAt"),
        camel(row, "createdAt") or utc_now(),
        camel(row, "updatedAt") or utc_now(),
    ]


def insert_many(
    conn: sqlite3.Connection,
    table: str,
    columns: list[str],
    values: list[list[Any]],
) -> None:
    placeholders = ", ".join("?" for _ in columns)
    column_sql = ", ".join(columns)

    conn.executemany(
        f"INSERT INTO {table} ({column_sql}) VALUES ({placeholders})",
        values,
    )


def apply_refresh(
    db_path: Path,
    data: dict[str, Any],
    source_path: Path,
    source_hash: str,
) -> dict[str, int]:
    conn = sqlite3.connect(db_path)

    try:
        conn.execute("PRAGMA foreign_keys = ON")

        with conn:
            conn.execute("DELETE FROM activity_events")
            conn.execute("DELETE FROM attachments")
            conn.execute("DELETE FROM actions")
            conn.execute("DELETE FROM migration_history")
            conn.execute("DELETE FROM preferences")
            conn.execute("DELETE FROM records")

            insert_many(
                conn,
                "records",
                RECORD_COLUMNS,
                [record_values(row) for row in data["records"]],
            )

            insert_many(
                conn,
                "actions",
                ACTION_COLUMNS,
                [action_values(row) for row in data["actions"]],
            )

            insert_many(
                conn,
                "attachments",
                ATTACHMENT_COLUMNS,
                [attachment_values(row) for row in data["attachments"]],
            )

            preferences = data["preferences"]
            owner = (
                next(
                    (
                        row.get("ownerEmail")
                        for row in data["records"]
                        if row.get("ownerEmail")
                    ),
                    None,
                )
                or next(
                    (
                        row.get("ownerEmail")
                        for row in data["actions"]
                        if row.get("ownerEmail")
                    ),
                    None,
                )
            )

            if not owner:
                raise RuntimeError(
                    "Unable to determine ownerEmail from snapshot."
                )

            ranking = preferences.get("ranking", {})

            conn.execute(
                """
                INSERT INTO preferences (
                    owner_email,
                    density,
                    orange,
                    ranking_json,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (
                    owner,
                    preferences.get("density", "compact"),
                    preferences.get("orange", "#ff5a00"),
                    json.dumps(ranking, separators=(",", ":")),
                    utc_now(),
                ),
            )

            migration = data.get("migration")

            if migration:
                conn.execute(
                    """
                    INSERT INTO migration_history (
                        id,
                        owner_email,
                        status,
                        before_record_count,
                        after_record_count,
                        preview_action_count,
                        created_action_count,
                        created_at,
                        completed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        migration.get("id"),
                        owner,
                        migration.get("status"),
                        migration.get("beforeRecordCount", 0),
                        migration.get("afterRecordCount", 0),
                        migration.get("previewActionCount", 0),
                        migration.get("createdActionCount", 0),
                        migration.get("createdAt") or utc_now(),
                        migration.get("completedAt"),
                    ),
                )

            conn.execute(
                """
                INSERT INTO activity_events (
                    id,
                    owner_email,
                    record_id,
                    action,
                    detail_json,
                    created_at
                ) VALUES (?, ?, NULL, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()),
                    owner,
                    "local_qa_snapshot_refreshed",
                    json.dumps(
                        {
                            "sourcePath": str(source_path),
                            "sourceSha256": source_hash,
                            "sourceExportedAt": data.get("exportedAt"),
                            "records": len(data["records"]),
                            "actions": len(data["actions"]),
                            "attachments": len(data["attachments"]),
                            "attachmentMode": "metadata-only-unavailable",
                        },
                        separators=(",", ":"),
                    ),
                    utc_now(),
                ),
            )

        return current_counts(conn)

    finally:
        conn.close()


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Refresh Devoted HQ's project-local Miniflare QA D1 from an "
            "explicit full JSON backup. This tool never invokes Wrangler "
            "and never targets remote D1/R2."
        )
    )

    parser.add_argument(
        "snapshot",
        help="Path to a Devoted HQ full JSON backup.",
    )

    parser.add_argument(
        "--db",
        help=(
            "Optional explicit local Miniflare SQLite path. Must reside under "
            ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/."
        ),
    )

    parser.add_argument(
        "--expected-sha256",
        help="Expected SHA-256 of the selected snapshot.",
    )

    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually replace local QA application data.",
    )

    args = parser.parse_args()

    source_path = Path(args.snapshot).expanduser().resolve()

    if not source_path.is_file():
        raise RuntimeError(f"Snapshot not found: {source_path}")

    source_hash = sha256(source_path)

    if args.expected_sha256 and source_hash != args.expected_sha256.lower():
        raise RuntimeError(
            "Snapshot SHA-256 mismatch.\n"
            f"Expected: {args.expected_sha256.lower()}\n"
            f"Actual:   {source_hash}"
        )

    db_path = locate_local_d1(args.db)
    data = read_snapshot(source_path)
    audit = validate_snapshot(data)

    conn = sqlite3.connect(db_path)
    try:
        before = current_counts(conn)
    finally:
        conn.close()

    print("Devoted HQ Local QA Refresh")
    print("============================")
    print()
    print(f"Mode: {'APPLY' if args.apply else 'DRY RUN'}")
    print(f"Source: {source_path}")
    print(f"Source SHA-256: {source_hash}")
    print(f"Source exportedAt: {audit['exportedAt']}")
    print(f"Target local D1: {db_path}")
    print()
    print("Validated source counts:")
    print(f"  records={audit['records']}")
    print(f"  actions={audit['actions']}")
    print(f"  attachments={audit['attachments']}")
    print(f"  owner={audit['owner']}")
    print()
    print("Current local counts:")
    for key, value in before.items():
        print(f"  {key}={value}")
    print()
    print("Attachment policy:")
    print("  metadata imported")
    print("  available forced to false")
    print("  storage_key cleared locally")
    print("  local R2 left untouched")
    print()

    if not args.apply:
        print("DRY RUN COMPLETE.")
        print("No database changes were made.")
        return 0

    if not args.expected_sha256:
        raise RuntimeError(
            "--expected-sha256 is required when --apply is used."
        )

    snapshot_dir = make_snapshot(
        db_path,
        source_path,
        source_hash,
    )

    print(f"Pre-refresh snapshot: {snapshot_dir}")

    after = apply_refresh(
        db_path,
        data,
        source_path,
        source_hash,
    )

    print()
    print("Refresh complete.")
    print("Resulting local counts:")
    for key, value in after.items():
        print(f"  {key}={value}")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
