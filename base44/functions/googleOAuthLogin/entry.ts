import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Get Gmail connection (which has Google OAuth)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    
    // Get user info from Google using OAuth2 endpoint with profile scope
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo?alt=json', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API error:', response.status, errorText);
      throw new Error(`Failed to get Google user info: ${response.status}`);
    }
    
    const userInfo = await response.json();
    
    // Log success for debugging
    console.log('Successfully retrieved Google user info:', userInfo.email);
    
    return Response.json({
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      id: userInfo.id
    });
  } catch (error) {
    console.error('Error in googleOAuthLogin:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});