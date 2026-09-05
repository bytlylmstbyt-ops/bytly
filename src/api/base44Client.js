import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token } = appParams;

// Base44 is still the backend for existing users during the migration to Supabase.
// In production, let the SDK use its hosted Base44 backend. Passing an empty
// serverUrl makes an external Vercel-hosted SPA treat /api as a local route.
const base44Config = {
  appId,
  token,
  requiresAuth: false,
  ...(import.meta.env.DEV ? { serverUrl: 'http://localhost:4400' } : {}),
};

export const base44 = createClient(base44Config);
