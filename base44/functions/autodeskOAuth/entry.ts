import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const CLIENT_ID = () => Deno.env.get("AUTODESK_CLIENT_ID");
const CLIENT_SECRET = () => Deno.env.get("AUTODESK_CLIENT_SECRET");
const SCOPES = 'data:read data:write viewables:read account:read';

// Store tokens per user in memory (use entity for persistence across restarts)
// We use base44 entities to persist tokens

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action, code, redirect_uri, refresh_token } = body;

        const clientId = CLIENT_ID();
        const clientSecret = CLIENT_SECRET();

        // ─── GET AUTH URL ────────────────────────────────────────
        if (action === 'get_auth_url') {
            const params = new URLSearchParams({
                response_type: 'code',
                client_id: clientId,
                redirect_uri,
                scope: SCOPES,
                state: user.id
            });
            const authUrl = `https://developer.api.autodesk.com/authentication/v2/authorize?${params.toString()}`;
            return Response.json({ auth_url: authUrl });
        }

        // ─── EXCHANGE CODE FOR TOKEN ─────────────────────────────
        if (action === 'exchange_code') {
            if (!code || !redirect_uri) {
                return Response.json({ error: 'Missing code or redirect_uri' }, { status: 400 });
            }

            const res = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri
                })
            });

            if (!res.ok) {
                const err = await res.text();
                console.error('Token exchange error:', err);
                return Response.json({ error: 'Token exchange failed', details: err }, { status: 400 });
            }

            const tokenData = await res.json();
            const expiresAt = Date.now() + (tokenData.expires_in * 1000);

            // Persist token in user record
            await base44.auth.updateMe({
                autodesk_access_token: tokenData.access_token,
                autodesk_refresh_token: tokenData.refresh_token,
                autodesk_token_expires_at: expiresAt
            });

            return Response.json({ success: true, expires_in: tokenData.expires_in });
        }

        // ─── REFRESH TOKEN ────────────────────────────────────────
        if (action === 'refresh_token') {
            const rt = refresh_token || user.autodesk_refresh_token;
            if (!rt) return Response.json({ error: 'No refresh token' }, { status: 400 });

            const res = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: rt
                })
            });

            if (!res.ok) {
                const err = await res.text();
                console.error('Refresh error:', err);
                return Response.json({ error: 'Refresh failed', details: err }, { status: 400 });
            }

            const tokenData = await res.json();
            const expiresAt = Date.now() + (tokenData.expires_in * 1000);

            await base44.auth.updateMe({
                autodesk_access_token: tokenData.access_token,
                autodesk_refresh_token: tokenData.refresh_token || rt,
                autodesk_token_expires_at: expiresAt
            });

            return Response.json({ success: true, access_token: tokenData.access_token });
        }

        // ─── GET VALID TOKEN (auto-refresh if needed) ─────────────
        if (action === 'get_valid_token') {
            const expiresAt = user.autodesk_token_expires_at || 0;
            const isExpired = Date.now() > expiresAt - 60000; // refresh 1 min before expiry

            if (!user.autodesk_access_token) {
                return Response.json({ error: 'not_connected' }, { status: 401 });
            }

            if (isExpired && user.autodesk_refresh_token) {
                // Auto refresh
                const res = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
                    },
                    body: new URLSearchParams({
                        grant_type: 'refresh_token',
                        refresh_token: user.autodesk_refresh_token
                    })
                });
                if (res.ok) {
                    const tokenData = await res.json();
                    const newExpiresAt = Date.now() + (tokenData.expires_in * 1000);
                    await base44.auth.updateMe({
                        autodesk_access_token: tokenData.access_token,
                        autodesk_refresh_token: tokenData.refresh_token || user.autodesk_refresh_token,
                        autodesk_token_expires_at: newExpiresAt
                    });
                    return Response.json({ access_token: tokenData.access_token });
                }
            }

            return Response.json({ access_token: user.autodesk_access_token });
        }

        // ─── DISCONNECT ───────────────────────────────────────────
        if (action === 'disconnect') {
            await base44.auth.updateMe({
                autodesk_access_token: null,
                autodesk_refresh_token: null,
                autodesk_token_expires_at: null
            });
            return Response.json({ success: true });
        }

        // ─── CHECK STATUS ──────────────────────────────────────────
        if (action === 'status') {
            const connected = !!user.autodesk_access_token;
            const expiresAt = user.autodesk_token_expires_at || 0;
            const isExpired = Date.now() > expiresAt - 60000;
            return Response.json({
                connected,
                expires_at: expiresAt,
                is_expired: isExpired,
                has_refresh: !!user.autodesk_refresh_token
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Autodesk OAuth error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});