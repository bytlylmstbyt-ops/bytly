import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { secrets } from 'base44:runtime';

// Lightweight test endpoints per integration type.
// For connectors: use the OAuth accessToken to hit a simple API.
// For secrets: use the API key directly.
const TEST_ENDPOINTS = {
  stripe: (token) => ({
    url: 'https://api.stripe.com/v1/balance',
    headers: { Authorization: `Bearer ${token}` },
  }),
  google_analytics: (token) => ({
    url: 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + encodeURIComponent(token),
    headers: {},
  }),
  instagram: (token) => ({
    url: 'https://graph.instagram.com/me',
    headers: { Authorization: `Bearer ${token}` },
  }),
  tiktok: (token) => ({
    url: 'https://open.tiktokapis.com/v2/user/info/',
    headers: { Authorization: `Bearer ${token}` },
  }),
  googlecalendar: (token) => ({
    url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList/primary',
    headers: { Authorization: `Bearer ${token}` },
  }),
  gmail: (token) => ({
    url: 'https://gmail.googleapis.com/gmail/v1/users/me/profile',
    headers: { Authorization: `Bearer ${token}` },
  }),
  linkedin: (token) => ({
    url: 'https://api.linkedin.com/v2/userinfo',
    headers: { Authorization: `Bearer ${token}` },
  }),
  googledrive: (token) => ({
    url: 'https://www.googleapis.com/drive/v3/about?fields=user',
    headers: { Authorization: `Bearer ${token}` },
  }),
  googlesheets: (token) => ({
    url: 'https://www.googleapis.com/drive/v3/about?fields=user',
    headers: { Authorization: `Bearer ${token}` },
  }),
  googlemeet: (token) => ({
    url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList/primary',
    headers: { Authorization: `Bearer ${token}` },
  }),
  square: (token) => ({
    // Square Merchants API — lightweight read endpoint
    url: 'https://connect.squareup.com/v2/merchants/me',
    headers: { Authorization: `Bearer ${token}`, 'Square-Version': '2024-08-21' },
  }),
};

const SECRET_KEYS = {
  stripe: 'STRIPE_SECRET_KEY',
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { integration_type } = body;
    if (!integration_type) {
      return Response.json({ error: 'integration_type is required' }, { status: 400 });
    }

    const builder = TEST_ENDPOINTS[integration_type];
    if (!builder) {
      return Response.json({ error: 'Unknown integration type' }, { status: 400 });
    }

    // Get the token/secret
    let token;
    if (SECRET_KEYS[integration_type]) {
      token = secrets.get(SECRET_KEYS[integration_type]);
      if (!token) {
        return Response.json({ ok: false, error: 'Secret not configured', status: 'disconnected' });
      }
    } else {
      // OAuth connector
      const conn = await base44.asServiceRole.connectors.getConnection(integration_type);
      token = conn?.accessToken;
      if (!token) {
        return Response.json({ ok: false, error: 'No OAuth token found', status: 'disconnected' });
      }
    }

    const { url, headers } = builder(token);
    const res = await fetch(url, { headers });
    const ok = res.ok;

    if (ok) {
      return Response.json({
        ok: true,
        status: 'connected',
        http_status: res.status,
        message: 'Connection test succeeded',
      });
    }

    // Non-OK response
    let detail = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      detail = errBody?.error?.message || errBody?.message || detail;
    } catch (_) { /* response had no JSON body */ }

    const needsReauth = res.status === 401 || res.status === 403;
    return Response.json({
      ok: false,
      status: needsReauth ? 'needs_reauth' : 'error',
      http_status: res.status,
      error: detail,
    });
  } catch (error) {
    console.error('testIntegration error:', error);
    return Response.json({ ok: false, error: error.message, status: 'error' }, { status: 500 });
  }
}