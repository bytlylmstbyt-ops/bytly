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

## Source-to-target count reconciliation (follow-up 2026-10-10)

A fresh read-only count comparison was run after inspecting the current Supabase tables. Counts below are current observations, not proof that records are identical; IDs, timestamps, ownership, and content still need row-level matching.

| Base44 entity | Base44 count | Supabase candidate table | Supabase count | Reconciliation |
|---|---:|---|---:|---|
| `Portfolio` | 12 | `public.portfolios` | 6 | 6-record difference; compare source IDs, classify demos, and migrate only eligible missing records. |
| `MarketEntity` | 10 | `public.developer_investor_management` | 10 | Counts match; verify row-level identity and fields before calling it complete. |
| `Notification` | 47 | `public.notifications` | 35 | 12-record difference; compare eligibility, read state, user mapping, and dates. |
| `AutomationRule` | 7 | `public.automation_rules` | 7 | Counts match; compare rule IDs/actions and whether the new scheduler executes them correctly. |
| `AutomationRunLog` | 10 | `public.automation_run_logs` | 29 | Supabase has 19 more rows; likely includes new-system runs. Compare source IDs and timestamps rather than deleting anything. |
| `Project` | 1 | `public.projects` | 0 | Source project is explicitly demo-labelled; staging remains `review_pending`. Keep excluded from production until classification is signed off. |
| `Contract` | 1 | `public.project_contracts` | 0 | Source contract is tied to the demo project; staging says `demo_excluded`. |
| `Proposal` | 4 | `public.project_offers` | 0 | All source proposals are tied to the demo project and staging says `demo_excluded`. |
| `NotificationSettings` | 6 | No confirmed one-to-one target in this count query | — | Locate/verify the corresponding settings storage and ownership model. |
| `Portfolio` records | 12 | — | — | The count mismatch is a concrete follow-up item; do not infer that exactly six real portfolios are missing until row-level classification. |

Current operational table counts also show: `profiles=16`, `projects=0`, `project_offers=0`, `project_contracts=0`, `messages=0`, `conversations=0`, `project_reviews=0`, `invoices=0`, `portfolios=6`, `notifications=35`, `automation_rules=7`, `automation_run_logs=29`, `advertisements=3`, `advertisers=0`, `permit_applications=0`, and `consultation_appointments=0`. Counts can change as the app is used; they are not a substitute for source-ID reconciliation.

## Latest CI evidence

The latest workflow run available for the audit branch at the time of this follow-up was `38027610217`, completed with conclusion `success`. This confirms the branch's configured CI checks passed at that commit. The authentication change PR #10 also has a successful CI run (`38026707647`) but remains open and unmerged; runtime sign-in testing and review are still required.

## Row-level verification: portfolios and notification preferences (2026-10-10)

### Portfolios
The source `Portfolio` entity contains 12 records. Row-level inspection shows:
- 3 records use `engineer_id="placeholder"` and were created on 2026-06-30.
- 6 records use sample engineer IDs (`sample_engineer_1` through `sample_engineer_6`) and were created on 2026-01-30.
- 3 records use `engineer_id="ahmed.alharbi@bytly.com"` and were created on 2026-01-30.

The 6 rows currently in `public.portfolios` use synthetic `base44_id` values (`showcase-villa-01`, `showcase-interior-01`, etc.), have `engineer_id IS NULL`, and do not preserve the 12 source Base44 record IDs. Although some titles are similar to source sample entries, the target rows cannot be counted as verified source-record migration. Treat them as showcase/seed data until an explicit ID-level mapping is established. **Portfolio migration status: not verified; source-to-target ID matches demonstrated by this check: 0/12.** This is a matching-evidence result, not proof that none of the underlying content was reused.

### Notification settings
Base44 contains 6 `NotificationSettings` records for individual emails. The Supabase public table inventory returned no obvious one-to-one notification-settings table. Do not drop these preferences; locate the intended new storage model or document that preferences are not yet migrated. User emails were intentionally not copied into this audit report.

### Notifications
Base44 has 47 `Notification` records. The latest Supabase operational query returned 35 rows, but these include newer registration notices and repeated notification types for the same entity. Since the schemas differ (`recipient_email/is_read/related_project_id` in Base44 versus `user_id/read_at/entity_type/entity_id` in Supabase), count-only comparison is not valid. A safe migration needs email-to-Supabase-user mapping, source-ID preservation or an explicit mapping table, test-notification filtering, and deduplication rules. **Notification migration status: partial/uncertain; 0 of 47 source records were proven to match by source ID in this check.**

## Runtime compatibility-layer audit (main branch snapshot 2026-10-10)

Read-only review of `src/api/base44Client.js` and active project pages found:

- The current `base44Client.js` does **not** import `@base44/sdk`; it constructs a compatibility object backed by Supabase. This supports the conclusion that the inspected client is not directly making Base44 SDK API calls.
- `src/pages/Projects.jsx` and `src/pages/ProjectDetails.jsx` still use the legacy `base44.entities.*` interface, but key paths are routed through the compatibility layer to Supabase tables.
- Explicit Supabase mappings observed in the file include `Project -> projects`, `Contract -> project_contracts`, `Proposal -> project_offers`, `Review -> project_reviews`, `Notification -> notifications`, `Transaction -> wallet_transactions`, `Engineer -> engineers`, `Client -> clients`, `Portfolio.create -> portfolios`, `PlatformSettings -> platform_settings`, `PermitApplication -> permit_applications`, `ConsultationAppointment -> consultation_appointments`, `ProjectTask -> project_tasks`, and `ProjectMilestone -> project_milestones`. AI calls route through the Gemini client; admin AI conversation history routes to `admin_ai_conversations`; file uploads route to Supabase Storage.
- This remains a **compatibility layer**, not complete removal of the legacy interface. The generic proxy converts unhandled entity names from CamelCase to singular snake_case (e.g. `NotificationSettings -> notification_settings`), but no corresponding notification-settings table was found in the public table inventory. Such calls can fail at runtime unless explicitly mapped.
- `legacyFunctions.invoke` throws `وظيفة غير مرحّلة إلى Supabase` for function names without a specific handler. Specific handlers observed include `createContractFromProposal`, `bookReviewMeeting`, `createMeetCall`, and `linkedinService`; unrecognized function invocations are therefore a remaining risk.
- Several wrappers intentionally return an empty array when a Supabase query errors or returns no rows (notably project/contract/engineer/client reads). This can hide schema/mapping problems as “no data”; empty tables alone cannot prove successful migration.

### Code migration assessment
- **Direct SDK dependency in inspected client:** not present in current `main` snapshot.
- **Legacy compatibility interface usage:** still present in feature pages.
- **Explicitly mapped key paths:** several mapped, but not all 97 entities/functions are proven covered.
- **Runtime independence from Base44:** not yet proven end-to-end. Require a call-site inventory, explicit mapping registry, tests for every active entity/function, and a test run with any Base44 network access blocked.

## Critical runtime call-site audit (main snapshot 2026-10-10)

A targeted review of active pages and the compatibility layer found three concrete blockers that should be fixed before claiming Base44-independent runtime behavior.

### 1. Notification real-time subscription is not implemented in the bridge
- `src/pages/Notifications.jsx` calls `base44.entities.Notification.subscribe(...)` during page initialization.
- The generic entity adapter in `src/api/base44Client.js` implements `filter/list/get/create/update/delete`, but does not implement `subscribe`.
- The notification-specific adapter overrides filter/create/update but also does not implement `subscribe`.
- Therefore this call can fail at runtime (the returned entity's `subscribe` is undefined), and the notification page may not receive real-time updates. Implement Supabase Realtime subscription scoped to the authenticated user's `user_id`, map the event payload into the page's expected shape, and add cleanup tests.

### 2. Notification settings use an unverified generic table mapping
- `src/pages/Settings.jsx` reads, creates, and updates `base44.entities.NotificationSettings`.
- The generic proxy maps this name to `notification_settings`, but the current public Supabase table inventory did not show that table.
- Base44 has 6 settings records. Until a real target table or an explicit supported settings model exists, loading/saving these preferences may fail. Implement the target schema plus row-level security, or explicitly map to an existing verified preference store; test read/create/update for an authenticated user.

### 3. Account deletion is currently wired to a deliberately unsupported function
- `src/pages/Settings.jsx` calls `base44.functions.invoke('deleteAccount', ...)`.
- The compatibility layer's default `legacyFunctions.invoke` always throws `وظيفة غير مرحّلة إلى Supabase`; the inspected function dispatch has no `deleteAccount` handler.
- The UI's `finally` block then logs out and redirects to `/login` even when deletion failed. This can make the user believe the account was deleted while it remains present.
- Do **not** add a client-side direct delete or use the service-role key in the browser. Implement a secured server-side Supabase Edge Function/API with authenticated-user checks, clear deletion policy for related records/storage, audit logging, and only log out/redirect after confirmed success. Until then, disable or relabel the destructive action and show a clear unavailable message.

### Priority order
P0: Fix misleading account-deletion flow (security/trust and destructive action semantics).
P1: Implement and test Notification Realtime subscription.
P1: Implement and test notification preferences persistence.
P2: Continue full active call-site inventory and block Base44 network access in staging to detect unhandled routes.

These are source-code findings from a static review; no destructive account action was executed and no production data was changed. They are not yet fixed by this audit commit.

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
