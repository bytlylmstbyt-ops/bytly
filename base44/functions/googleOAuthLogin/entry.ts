import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get the Google connection (uses the authorized googlecalendar connector)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");
    
    // Use the token to get user info from Google
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
      success: true,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    });
  } catch (error) {
    return Response.json({ 
      error: error.message,
      details: 'Google OAuth connection failed. Please check OAuth credentials.'
    }, { status: 500 });
  }
});