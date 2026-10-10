# Base44 Migration Audit — 2026-10-10

## Scope and safety

This is a read-only snapshot of Base44 source entities, Supabase staging/operational tables, and the repository's migration inventory. Source counts are scoped to the entities listed below, not all 97 entity types. No production data was changed by this audit.

## Direct Base44 source inventory (queried 2026-10-10)

The Base44 app was queried directly through its entity-record API. These counts are the records returned by the source workspace at audit time (maximum query limit 500 per entity); they are not inferred from Supabase staging tables.

| Base44 entity | Source count | Notes |
|---|---:|---|
| `User` | 56 | Matches the 56-row Supabase migration map, but all map rows are still pending. |
| `Project` | 1 | The source title/description explicitly identify it as a demo project; exclude from production import unless the owner reclassifies it. |
| `Contract` | 1 | Linked to the demo project; staging status is `demo_excluded`. |
| `Proposal` | 4 | Linked to the demo project; all staging rows are `demo_excluded`. |
| `Review` | 3 | Requires source-by-source production/demo classification. |
| `Message` | 26 | Message content was not copied into this report; classify records before any migration. |
| `Conversation` | 22 | Separate from the `Message` entity; needs schema/relationship review. |
| `Engineer` | 17 | Staging marks 9 as real and 8 as non-real; verify identities and duplicates. |
| `Client` | 10 | Supabase staging contains 8, all marked non-real; reconcile the two-count difference and classify each source record. |
| `EngineeringFirm` | 6 | Staging contains 6, all marked non-real. |
| `Notification` | 47 | Supabase operational count was 31; these counts may include different dates or eligibility, so reconcile before importing. |
| `Transaction` | 2 | Both reference `test-project-001`; treat as test-related until proven otherwise. |
| `Invoice` | 1 | References `test-project-001`; treat as test-related until proven otherwise. |
| `Dispute` | 0 | No source records returned. |
| `ClientInteraction` | 0 | No source records returned. |
| `ProjectTask`, `ProjectMilestone`, `ProjectMilestone2`, `Document`, `ProjectRevision`, `ProjectWorkflow`, `Payment` | 0 each | No source records returned for these entity names. |

The direct source query changes the conclusion for the core entities: the small project/contract/proposal set visible in staging is the same size as Base44, and the one project is explicitly demo-labelled. This is not evidence that every one of the app's 97 entity types has been inventoried; the table above is a scoped source inventory for migration-critical entities.

## Additional source entity checks (2026-10-10)

A follow-up read-only source query confirmed these additional entity counts:

| Base44 entity | Returned records | Notes |
|---|---:|---|
| `AIAgentConversation` | 8 | Requires comparison with the Supabase admin AI conversation bridge. |
| `AIAssistantQueryLog` | 9 | No migration conclusion yet. |
| `AIChangeRequestLog` | 15 | No migration conclusion yet. |
| `Advertisement` | 3 | Compare against the platform advertising tables and classify source records. |
| `AgentAction` | 2 | No migration conclusion yet. |
| `AutomationRule` | 7 | Compare with the new automation implementation before disabling legacy workflows. |
| `AutomationRunLog` | 10 | Historical execution records; retention/migration decision needed. |
| `BIMModel` | 1 | Requires storage URL and metadata mapping review. |
| `ChatbotConversation` | 500 | Query reached the 500-record limit; this means **at least 500**, not an exact total. Full paginated count/export is required. |
| `ChatbotFAQ` | 7 | Compare with the new chatbot/knowledge base implementation. |
| `ConsultationAppointment` | 2 | Compare with Supabase `consultation_appointments`. |
| `EmailTemplate` | 11 | Compare with current email templates before migration. |

A subsequent batch was rate-limited by Base44. The remaining source entities have not been counted in this follow-up and must not be treated as zero. No data was written to Base44 or Supabase during these checks.

## CI status after report update

The report branch workflow run `38027336035` completed successfully: production build, ESLint, and Base44 reference audit all passed. This validates the branch build and static checks, not the runtime correctness of the migration or production data completeness.

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
