import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * fetchDailyActiveUsers — يجلب بيانات المستخدمين النشطين اليومية من Google Analytics 4
 * ويخزنها في كيان AnalyticsDailyActiveUser.
 *
 * إذا لم يتم تمرير property_id، يبحث عن أول خاصية GA4 متاحة في الحساب.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    let propertyId = body.property_id;
    const days = body.days || 30;

    // الحصول على رمز OAuth من الموصل
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    // إذا لم يوجد property_id، ابحث عن الخصائص المتاحة
    let propertyName = '';
    if (!propertyId) {
      // 1) حاول جلب قائمة الخصائص من accountSummaries
      const acctRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const acctData = await acctRes.json();

      if (acctData.error) {
        console.error('GA accountSummaries error:', JSON.stringify(acctData.error));
        return Response.json({ error: `خطأ في الوصول لـ Google Analytics: ${acctData.error.message}` }, { status: 500 });
      }

      const summaries = acctData.accountSummaries || [];
      console.log(`GA accountSummaries: ${summaries.length} حساب(s)`);

      for (const acct of summaries) {
        if (acct.propertySummaries && acct.propertySummaries.length > 0) {
          const prop = acct.propertySummaries[0];
          propertyId = prop.property.replace('properties/', '');
          propertyName = prop.displayName || '';
          break;
        }
      }

      // 2) fallback: جرّب عرض الخصائص مباشرةً
      if (!propertyId) {
        console.log('No properties in accountSummaries, trying properties list...');
        const propRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/properties?pageSize=200', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const propData = await propRes.json();

        if (!propData.error && propData.properties && propData.properties.length > 0) {
          const prop = propData.properties[0];
          propertyId = prop.name.replace('properties/', '');
          propertyName = prop.displayName || '';
          console.log(`Found property via properties list: ${propertyName} (${propertyId})`);
        }
      }

      if (!propertyId) {
        return Response.json({
          error: 'لا توجد خصائص GA4 متاحة في حساب Google Analytics المتصل. تأكد من إعداد GA4 في Google Analytics (analytics.google.com) ثم أعد تشغيل الدالة. إذا كان لديك property_id محدد، مرّره في الحقل property_id.'
        }, { status: 404 });
      }
    }

    // حساب نطاق التاريخ
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const fmtDate = (d) => d.toISOString().split('T')[0];

    // استدعاء GA4 Data API
    const reportRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: fmtDate(startDate), endDate: fmtDate(endDate) }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' }
        ],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }]
      })
    });

    const reportData = await reportRes.json();

    if (reportData.error) {
      return Response.json({ error: reportData.error.message }, { status: 500 });
    }

    const rows = reportData.rows || [];
    let savedCount = 0;
    let updatedCount = 0;

    for (const row of rows) {
      const rawDate = row.dimensionValues[0].value; // YYYYMMDD
      // تحويل YYYYMMDD إلى YYYY-MM-DD
      const isoDate = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;

      const activeUsers = parseInt(row.metricValues[0].value, 10) || 0;
      const newUsers = parseInt(row.metricValues[1].value, 10) || 0;
      const sessions = parseInt(row.metricValues[2].value, 10) || 0;
      const pageViews = parseInt(row.metricValues[3].value, 10) || 0;

      // التحقق من وجود سجل لنفس اليوم
      const existing = await base44.asServiceRole.entities.AnalyticsDailyActiveUser.filter({
        date: isoDate,
        property_id: propertyId
      });

      if (existing && existing.length > 0) {
        // تحديث السجل الموجود
        await base44.asServiceRole.entities.AnalyticsDailyActiveUser.update(existing[0].id, {
          active_users: activeUsers,
          new_users: newUsers,
          sessions: sessions,
          page_views: pageViews
        });
        updatedCount++;
      } else {
        // إنشاء سجل جديد
        await base44.asServiceRole.entities.AnalyticsDailyActiveUser.create({
          date: isoDate,
          active_users: activeUsers,
          new_users: newUsers,
          sessions: sessions,
          page_views: pageViews,
          property_id: propertyId,
          property_name: propertyName
        });
        savedCount++;
      }
    }

    return Response.json({
      success: true,
      property_id: propertyId,
      property_name: propertyName,
      days_fetched: days,
      new_records: savedCount,
      updated_records: updatedCount,
      total_rows: rows.length
    });

  } catch (error) {
    console.error('fetchDailyActiveUsers error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});