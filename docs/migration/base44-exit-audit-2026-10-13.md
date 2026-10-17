# Bytly Base44 Exit Audit — 2026-10-13

## Verified repository state

- Default branch tree: 989 tracked files.
- Legacy root `base44/`: 321 files, including 139 legacy function entrypoints and 97 entity schemas.
- `src/api/base44Client.js` is still in active source and exports `base44` as a compatibility adapter. It routes only explicitly handled operations; unknown functions fail with `وظيفة غير مرحّلة إلى Supabase`.
- `package.json` does not include `@base44/sdk`; the static CI gate reports no SDK import or `base44.com` endpoint. However, the gate scans only `src`, `api`, and `supabase/functions`; it does not count the root `base44/` archive as runtime dependency and does not fail on remaining compatibility calls.
- The repository tree includes 216 source page files under `src/pages/` (file count is not proof of each route's runtime correctness).
- Current CI run 38426202342 passed the Base44 reference audit, ESLint, and production build. Vercel preview for commit `c11e4e36c4759e14f912778dfedc922dcb119715` reached READY.

## Verified Supabase migration backlog

- `base44_user_migration_map`: 8 rows marked `linked`, 48 marked `pending` (56 total).
- Migration staging row counts: projects 1; clients 8; contracts 1; engineers 17; firms 6; messages 26; proposals 4; reviews 3 (66 rows total).
- Edge Function `base44-user-migration-sync` remains ACTIVE, uses JWT validation, and explicitly checks that the caller's profile role is `admin`. Do not retire it until pending mappings and staged data have been reconciled or waived.

## Release gates

1. Reconcile/export pending user mappings and staged rows; retain staging data until row-level validation and foreign-key checks pass.
2. Enumerate all imports of `src/api/base44Client.js`, calls to `base44.functions.invoke`, entity/auth/integration adapter usage, and any fallback to unsupported functions. Replace each active call with a tested Supabase implementation or remove dead code.
3. Move any needed Base44 schemas/functions to a clearly labeled migration archive or Git tag before deleting them from the default branch. Confirm no runtime import references them.
4. Add automated route smoke tests and role-specific tests for all page routes, plus end-to-end checks for authentication, project create/edit, proposals/contracts, chat/notifications, registration documents, file upload/download, wallet/escrow, Moyasar sandbox, meetings, and admin pages.
5. Retire the migration Edge Function only after the 48 pending mappings are resolved and no caller remains.
6. Final static scan must show no Base44 runtime adapter imports or unsupported-function fallback; CI and production deployment must pass; publish a page/workflow pass-fail matrix.

## Safety notes

- No production data or storage objects were deleted during this audit.
- No wallet purchase or real-money operation was executed.
- A green lint/build and absence of the Base44 SDK do not prove all pages are functional or that all Base44 migration debt is gone.
