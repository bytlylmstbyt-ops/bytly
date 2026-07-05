import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * fetchRealtimeVisitors — يجلب الزوار المباشرين الآن من Google Analytics Realtime API
 * + المستخدمين المسجلين النشطين في آخر 3 دقائق (مع إيميلاتهم).
 * للمدير فقط.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // ── 1) Google Analytics Realtime ──
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    // اكتشاف propertyId (نفس منطق fetchDailyActiveUsers)
    let propertyId = null;
    let propertyName = '';

    const acctRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const acctData = await acctRes.json();

    if (!acctData.error) {
      for (const acct of (acctData.accountSummaries || [])) {
        if (acct.propertySummaries && acct.propertySummaries.length > 0) {
          const prop = acct.propertySummaries[0];
          propertyId = prop.property.replace('properties/', '');
          propertyName = prop.displayName || '';
          break;
        }
      }
    }

    let gaData = { active_users: 0, pages: [], sources: [], cities: [] };

    if (propertyId) {
      const realtimeUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`;

      // إجمالي الزوار النشطين
      const totalRes = await fetch(realtimeUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: [{ name: 'activeUsers' }] })
      });
      const totalData = await totalRes.json();
      if (!totalData.error) {
        gaData.active_users = totalData.rows?.[0]?.metricValues?.[0]?.value
          ? parseInt(totalData.rows[0].metricValues[0].value, 10)
          : 0;
      }

      // حسب الصفحة
      const pagesRes = await fetch(realtimeUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimensions: [{ name: 'unifiedScreenPage' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 10
        })
      });
      const pagesData = await pagesRes.json();
      if (!pagesData.error) {
        gaData.pages = (pagesData.rows || []).map(r => ({
          page: r.dimensionValues[0].value,
          users: parseInt(r.metricValues[0].value, 10)
        }));
      }

      // حسب مصدر الزيارة
      const srcRes = await fetch(realtimeUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 10
        })
      });
      const srcData = await srcRes.json();
      if (!srcData.error) {
        gaData.sources = (srcData.rows || []).map(r => ({
          source: r.dimensionValues[0].value || 'مباشر',
          users: parseInt(r.metricValues[0].value, 10)
        }));
      }

      // حسب المدينة
      const cityRes = await fetch(realtimeUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimensions: [{ name: 'city' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 10
        })
      });
      const cityData = await cityRes.json();
      if (!cityData.error) {
        gaData.cities = (cityData.rows || []).map(r => ({
          city: r.dimensionValues[0].value || 'غير معروف',
          users: parseInt(r.metricValues[0].value, 10)
        }));
      }
    }

    // ── 2) المستخدمون المسجلون النشطون (آخر 3 دقائق) ──
    const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const activeUsers = await base44.asServiceRole.entities.UserActivity.list('-last_active_at', 100);
    const loggedInActive = (activeUsers || [])
      .filter(u => u.last_active_at && new Date(u.last_active_at) >= new Date(threeMinAgo))
      .map(u => ({
        email: u.user_email,
        name: u.user_name,
        current_page: u.current_page || '',
        last_active_at: u.last_active_at
      }));

    return Response.json({
      ga: gaData,
      property_name: propertyName,
      logged_in_users: loggedInActive,
      logged_in_count: loggedInActive.length
    });
  } catch (error) {
    console.error('fetchRealtimeVisitors error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});