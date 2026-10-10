# Base44 Migration Audit — 2026-10-10

## Scope and safety

This is a read-only snapshot of the current Supabase staging and operational tables, plus the repository's migration inventory. Counts below describe records currently in Supabase; they are **not** a complete export/count of the source Base44 workspace. No production data was changed by this audit.

## Operational tables

At audit time, these operational tables were empty:
- `projects`: 0
- `project_contracts`: 0
- `project_offers`: 0
- `project_files`: 0
- `project_tasks`: 0
- `project_milestones`: 0
- `project_reviews`: 0

Other observed counts:
- `profiles`: 15
- `engineers`: 18
- `clients`: 13
- `notifications`: 31
- `wallet_transactions`: 3
- `project_status_sync`: 1

These are table row counts, not proof that all rows are production/real records.

## Staging tables

- `base44_project_migration_staging`: 1 row, status `review_pending`, source entity `Project`.
- `base44_contract_migration_staging`: 1 row, status `demo_excluded`.
- `base44_proposal_migration_staging`: 4 rows, all status `demo_excluded`.
- `base44_review_migration_staging`: 3 rows, source `base44`; production/demo status not yet verified.
- `base44_message_migration_staging`: 26 rows, source `base44`; production/demo status not yet verified.
- `base44_engineer_migration_staging`: 17 rows: 9 marked `is_real=true`, 8 marked `is_real=false`.
- `base44_client_migration_staging`: 8 rows, all marked `is_real=false`.
- `base44_firm_migration_staging`: 6 rows, all marked `is_real=false`.

Identity reconciliation:
- `base44_user_identity_map`: 14 rows — 8 `pending`, 2 `needs_supabase_auth_link`, 4 `base44_account_confirmed_no_supabase_auth`.
- `base44_user_migration_map`: 56 rows, all `pending`.

## Findings

1. The live schema has operational tables for projects, contracts, offers, files, tasks, milestones and reviews, but they were empty at this snapshot.
2. The staging data is not a reliable source-of-truth export of all Base44 records. Some staging rows are explicitly marked demo-only, and client/firm staging rows are all marked non-real.
3. Engineer staging contains 9 rows marked real. They still require identity/duplicate checks and comparison against operational `engineers` before any import.
4. User identity migration is not complete: the 56-row migration map is pending, and 14 identity-map records need resolution.
5. `project_status_sync` is a separate legacy status-sync table, not proof that full projects, offers, contracts, files, payment history or related records have been migrated.

## Required next steps before data migration

1. Obtain a complete export or authenticated source-side inventory from Base44 for Projects, Contracts, Offers, Reviews, Messages, Files, Tasks and identity mappings.
2. Classify every source record as production, test/demo, duplicate, or orphaned. Do not infer this from missing/null `migrated_at` alone.
3. Match Base44 user IDs to Supabase Auth users and profiles; resolve pending/auth-link records before importing dependent rows.
4. Prepare a dry-run mapping report with source count, eligible count, skipped/demo count, matched foreign keys, duplicate count and validation errors.
5. Import in dependency order in a non-production/test environment, verify row counts and foreign-key relationships, then schedule production migration.
6. Keep the `base44/` archive and compatibility code until each replacement path has passed functional tests and data reconciliation.

## Percentage reporting rule

Do not publish a single migration percentage from code references or staging counts alone. Report separate measures:
- code-path migration by feature and verified runtime fallback status;
- data migration by source entity, based on complete source counts;
- authentication identity reconciliation;
- end-to-end tests passed.

A global percentage is defensible only after these measures have a documented weighting and a complete source inventory.
