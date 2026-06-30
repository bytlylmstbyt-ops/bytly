import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check if user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        error: 'Unauthorized',
        details: 'User must be logged in first'
      }, { status: 401 });
    }
    
    // Get the Google connection using the new workspace connector
    const connectorId = "6a43fb8c45f2e8f7a5d30b8b";
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId);
    
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
    console.error('Google OAuth Error:', error);
    return Response.json({ 
      error: error.message,
      details: 'Google OAuth connection failed. Please connect your Google account first.'
    }, { status: 500 });
  }
});