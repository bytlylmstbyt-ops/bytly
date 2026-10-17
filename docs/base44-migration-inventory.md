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

## Direct Base44 source verification — 2026-10-12

The live Base44 app `بيتلي -BYTLY` (app ID `69741d7bf3195aeab86a1582`) was queried directly with the entity API. This replaces the earlier assumption that a separate export is the only way to establish the current Project/Contract inventory.

| Base44 entity | Live records returned | Finding |
|---|---:|---|
| `Project` | 1 | The only record is titled “مشروع تجريبي — فيلا سكنية بالرياض”; its description says it is a test project for offer comparison |
| `Proposal` | 4 | All 4 reference that same test project; their staged statuses are `demo_excluded` |
| `Contract` | 1 | Contract `BYT-42330476` references the same test project; its staged status is `demo_excluded` |
| `User` | 56 | 56 source user records are present; do not treat these as automatically linked Supabase Auth users |

The test Project has a confusing `is_sample = false` flag, but its title and description explicitly identify it as a test project, and its staging row is `demo_excluded`. For migration safety, the explicit content, linked proposals/contract, and staging exclusion take precedence over that contradictory flag.

### Migration decision after querying the live source

- The current live Base44 `Project` and `Contract` entities do not contain any additional non-demo records beyond the single test project and its related test offers/contract returned by these queries.
- Therefore, **do not bulk-import Project, Proposal, or Contract staging data**. There are no verified real project/contract records in this source snapshot to migrate into the empty target tables.
- The remaining real migration work is user/profile identity reconciliation (the source has 56 users while the mapping table has 48 pending), plus checking other business entities individually for real records and confirming the app's pages work against Supabase.
- This is a point-in-time source inventory, not proof that no historical data exists in backups or exports outside the current Base44 entities. If an external archive exists, compare it separately before retiring Base44.

## Additional business-entity source scan — 2026-10-12

Additional live Base44 entity queries were performed for operational records:

| Entity | Source records | Assessment |
|---|---:|---|
| `Engineer` | 17 | Includes 9 non-demo records represented in the target engineers table; also includes duplicates/test accounts |
| `EngineeringFirm` | 6 | The matching target records are explicitly marked `is_real = false`; do not treat as verified real firms |
| `Contractor` | 0 | No current source records returned |
| `Supplier` | 0 | No current source records returned |
| `LegalConsultant` | 0 | No current source records returned |
| `QuoteRequest` | 0 | No current source records returned |
| `Payment` | 0 | No current source records returned |
| `Invoice` | 1 | `INV-TEST-001` references `test-project-001` and is test data; do not migrate |
| `PermitApplication` | 1 | A real-looking application for the owner account exists; it references Base44-hosted DWG/PDF files and a Stripe test-session ID |
| `Advertisement` | 3 | All three currently have matching target rows by Base44 ID |
| `Dispute` | 0 | No current source records returned |
| `WithdrawalRequest` | 0 | No current source records returned |
| `ReadyMadeDesign` | 0 | No current source records returned |
| `SurveyorProfile` | 0 | No current source records returned |
| `MarketContract` | 0 | No current source records returned |
| `DesignPurchase` | 0 | No current source records returned |

### Permit application decision

The permit application should **not** be marked fully migrated yet. Its client email matches an existing Supabase profile, but its `project_id` and `engineer_id` are empty, and its ownership-deed image, DWG drawings, and soil-report PDF are hosted on Base44. Copying the database row alone would preserve a runtime dependency on Base44 file hosting. It also contains a Stripe test-session ID and pending payment status. Migrate it only after copying and validating the files in Supabase Storage, preserving metadata and ownership, and ensuring test payment identifiers remain inert. No payment or permit status was changed.

### Ads decision

The three source advertisements are already represented in `public.advertisements` with matching `base44_id` values. No duplicate insert is needed. Their current destination URLs point to `https://bytly.com`; verify that this is the intended production domain before considering ad migration complete.

### Identity and duplicate-profile caution

The source Engineer entity contains two records for the same engineer email with different Base44 IDs/statuses, and it contains platform/demo profiles. Keep stable Base44 IDs as migration keys and deduplicate only after confirming ownership and intended account status. Email alone is not sufficient to merge profiles or grant access.
