import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * fetchMarketingAnalytics — يجلب بيانات تسويقية من Google Analytics 4:
 * - عدد الجلسات حسب المصدر/الوسيط (source/medium)
 * - الجلسات حسب التاريخ (للاتجاه الزمني)
 * - أهم الصفحات المقصودة
 * - الزوار حسب قناة الاستحواذ
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const days = body.days || 30;
    let propertyId = body.property_id;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    // ابحث عن property_id إن لم يُمرر
    let propertyName = '';
    if (!propertyId) {
      const acctRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const acctData = await acctRes.json();
      if (acctData.error) {
        return Response.json({ error: `GA error: ${acctData.error.message}` }, { status: 500 });
      }
      const summaries = acctData.accountSummaries || [];
      for (const acct of summaries) {
        if (acct.propertySummaries && acct.propertySummaries.length > 0) {
          const prop = acct.propertySummaries[0];
          propertyId = prop.property.replace('properties/', '');
          propertyName = prop.displayName || '';
          break;
        }
      }
      if (!propertyId) {
        return Response.json({ error: 'لا توجد خصائص GA4 متاحة' }, { status: 404 });
      }
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const fmtDate = (d) => d.toISOString().split('T')[0];

    // 1) الجلسات حسب المصدر/الوسيط
    const sourceRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: fmtDate(startDate), endDate: fmtDate(endDate) }],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 20
      })
    });
    const sourceData = await sourceRes.json();
    if (sourceData.error) return Response.json({ error: sourceData.error.message }, { status: 500 });

    const sources = (sourceData.rows || []).map(row => ({
      source: row.dimensionValues[0].value,
      medium: row.dimensionValues[1].value,
      sessions: parseInt(row.metricValues[0].value, 10) || 0,
      users: parseInt(row.metricValues[1].value, 10) || 0,
      pageViews: parseInt(row.metricValues[2].value, 10) || 0,
    }));

    // 2) الجلسات حسب التاريخ (للاتجاه الزمني)
    const trendRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: fmtDate(startDate), endDate: fmtDate(endDate) }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'newUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }]
      })
    });
    const trendData = await trendRes.json();
    const trend = (trendData.rows || []).map(row => {
      const raw = row.dimensionValues[0].value;
      const iso = `${raw.substring(0, 4)}-${raw.substring(4, 6)}-${raw.substring(6, 8)}`;
      return {
        date: iso,
        sessions: parseInt(row.metricValues[0].value, 10) || 0,
        activeUsers: parseInt(row.metricValues[1].value, 10) || 0,
        newUsers: parseInt(row.metricValues[2].value, 10) || 0,
      };
    });

    // 3) أهم الصفحات المقصودة
    const pagesRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: fmtDate(startDate), endDate: fmtDate(endDate) }],
        dimensions: [{ name: 'landingPagePlusQueryString' }],
        metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }, { name: 'averageSessionDuration' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 10
      })
    });
    const pagesData = await pagesRes.json();
    const topPages = (pagesData.rows || []).map(row => ({
      page: row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value, 10) || 0,
      pageViews: parseInt(row.metricValues[1].value, 10) || 0,
      avgSessionDuration: Math.round(parseFloat(row.metricValues[2].value) || 0),
    }));

    // ملخص
    const totalSessions = sources.reduce((s, r) => s + r.sessions, 0);
    const totalUsers = sources.reduce((s, r) => s + r.users, 0);
    const totalPageViews = sources.reduce((s, r) => s + r.pageViews, 0);

    return Response.json({
      success: true,
      property_id: propertyId,
      property_name: propertyName,
      days,
      summary: {
        totalSessions,
        totalUsers,
        totalPageViews,
        avgSessionsPerDay: trend.length > 0 ? Math.round(totalSessions / trend.length) : 0,
      },
      sources,
      trend,
      topPages,
    });
  } catch (error) {
    console.error('fetchMarketingAnalytics error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}