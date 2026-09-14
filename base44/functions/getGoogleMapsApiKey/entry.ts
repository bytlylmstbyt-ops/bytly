import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * getGoogleMapsApiKey — Returns the Google Maps JavaScript API key from environment variables.
 * Used by frontend components (e.g. LocationPicker) to avoid hardcoding the key in client-side code.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    return Response.json({ api_key: apiKey });
  } catch (error) {
    console.error('getGoogleMapsApiKey error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});