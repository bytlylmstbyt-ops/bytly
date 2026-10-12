# Base44 Migration Inventory

Status: 2026-10-08

Bytly production is running on Vercel + Supabase. This directory is retained temporarily as a migration/archive reference.

## Confirmed no longer used by the current application
- @base44/sdk dependency
- Direct Base44 API calls from the current application
- Base44 Google Meet creation path
- Base44 Calendar Manager path

## Retained intentionally
The `base44/` directory contains historical entity definitions, functions, workflows, and connector configuration. It is NOT deleted yet because it documents prior behavior and may contain business rules that still need to be reproduced or verified in Supabase.

## Google migration status
- Google OAuth tokens: Supabase `integration_connections`
- Google Calendar/Meet: Supabase Edge Function `google-service`
- Google Drive: Supabase `google-service`
- Google Sheets: Supabase `google-service`
- Legacy Drive/Sheets functions remain archived until each equivalent workflow is verified.

## Deletion rule
Do not delete a Base44 file solely because it has no direct UI import. Before deletion, verify:
1. No current application import/reference.
2. No Vercel/server route invokes it.
3. No Supabase workflow/cron depends on its behavior.
4. Its business logic has an equivalent tested implementation, or it is confirmed obsolete.

## Current decision
Keep `base44/` intact. Continue migration by behavior, then remove obsolete files in small, reviewable commits.

## Live Supabase verification — 2026-10-12

This snapshot was checked against the connected Supabase project after the adapter fixes. It is a read-only audit; no production rows were changed.

### Core table counts

| Table | Rows observed | Interpretation |
|---|---:|---|
| `projects` | 0 | No active project rows in the target table |
| `project_offers` | 0 | No active offer rows in the target table |
| `project_contracts` | 0 | No active contract rows in the target table |
| `project_status_sync` | 1 | The one record is a demo villa project and must not be imported into production |
| `base44_project_migration_staging` | 1 | Its status is `demo_excluded` |
| `base44_contract_migration_staging` | 1 | A staged Base44 record exists; inspect and verify provenance before any import |
| `clients` | 13 | Existing target client rows |
| `engineers` | 19 | Existing target engineer rows |
| `engineering_firms` | 6 | Existing target firm rows |

### Staging/source inventory

- Client staging: 8 rows; all 8 are marked `is_real = false`.
- Firm staging: 6 rows; all 6 are marked `is_real = false`.
- Engineer staging: 17 rows; 9 are marked real and 8 are marked non-real.
- The 9 real engineer staging IDs all already match rows in `public.engineers`; none of those 9 are missing from the target table.
- Proposal staging: 4 rows; review source project and identity links before import.
- Contract staging: 1 row; do not infer that it is safe to import without validating the linked project, parties, and business status.
- Review staging: 3 rows; message staging: 26 rows. Their production import status has not been established by this audit.

### User identity mapping

- `base44_user_migration_map`: 56 rows, of which 8 are `linked` and 48 are `pending`.
- `base44_user_identity_map`: 14 rows: 4 real entries marked `base44_account_confirmed_no_supabase_auth`, 2 real entries marked `needs_supabase_auth_link`, and 8 non-real entries marked `pending`.
- Do not create accounts, attach IDs, or mark mappings complete automatically. Verify account ownership and a valid Supabase Auth identity first.


- Linkage audit: all 4 staged proposals and the 1 staged contract reference the one staged project record. Because that project is `demo_excluded`, these linked proposal/contract records must also remain excluded unless independent source evidence proves otherwise. The 3 staged reviews did not link to that project in this check.

### Decision / safe next action

The current live staging inventory does **not** provide evidence for a safe bulk import of projects/contracts: the only staged project is explicitly excluded demo data, and the client/firm staging sets are all non-real. Preserve the staging records as audit evidence. Next, retrieve a verified source export from the old system or the owner-approved archive, reconcile stable IDs and real-user identity mappings, and then prepare a reviewed, idempotent migration plan. Do not fabricate records, import demo data, or enable live financial operations to make pages appear populated.
