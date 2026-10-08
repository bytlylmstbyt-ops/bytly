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
