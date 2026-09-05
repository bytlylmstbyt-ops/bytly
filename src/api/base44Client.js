import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token } = appParams;

// Base44 remains the backend for existing users during the Supabase migration.
// The Vercel-hosted SPA must use the actual hosted Bytly Base44 app URL for both
// API requests and OAuth. This value is public configuration, not a secret.
const base44BackendUrl = import.meta.env.DEV
  ? 'http://localhost:4400'
  : (import.meta.env.VITE_BASE44_APP_BASE_URL || 'https://bytly.base44.app');

const base44Config = {
  appId,
  token,
  requiresAuth: false,
  serverUrl: base44BackendUrl,
  appBaseUrl: base44BackendUrl,
};

export const base44 = createClient(base44Config);
