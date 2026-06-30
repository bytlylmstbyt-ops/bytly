import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get Gmail connection (which has Google OAuth)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    
    // Get user info from Google
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get Google user info');
    }
    
    const userInfo = await response.json();
    
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