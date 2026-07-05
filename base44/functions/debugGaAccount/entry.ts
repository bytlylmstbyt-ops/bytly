import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * debugGaAccount — دالة تشخيص تعرض بالضبط ما يحتويه حساب Google Analytics المتصل:
 * الحسابات، الخصائص (GA4 و UA)، تيارات البيانات.
 * للمدير فقط.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    const result = {
      connected_email: user.email,
      account_summaries: [],
      accounts_raw: null,
      properties_per_account: [],
      errors: []
    };

    // 1) accountSummaries
    const acctRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const acctData = await acctRes.json();

    if (acctData.error) {
      result.errors.push({ step: 'accountSummaries', error: acctData.error });
    } else {
      result.account_summaries = (acctData.accountSummaries || []).map(a => ({
        account_name: a.displayName,
        account_id: a.account,
        properties: (a.propertySummaries || []).map(p => ({
          name: p.displayName,
          property: p.property,
          property_type: p.propertyType
        }))
      }));
    }

    // 2) قائمة الحسابات
    const accountsRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accounts?pageSize=200', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const accountsData = await accountsRes.json();

    if (accountsData.error) {
      result.errors.push({ step: 'accounts', error: accountsData.error });
    } else {
      result.accounts_raw = {
        count: (accountsData.accounts || []).length,
        accounts: (accountsData.accounts || []).map(a => ({ name: a.name, displayName: a.displayName }))
      };

      // 3) خصائص كل حساب
      for (const acct of (accountsData.accounts || [])) {
        const propRes = await fetch(
          `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${acct.name}&pageSize=200`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        const propData = await propRes.json();

        if (propData.error) {
          result.properties_per_account.push({
            account: acct.displayName,
            error: propData.error.message
          });
        } else {
          result.properties_per_account.push({
            account: acct.displayName,
            properties: (propData.properties || []).map(p => ({
              name: p.displayName,
              property_id: p.name,
              property_type: p.propertyType,
              industry: p.industryCategory,
              time_zone: p.timeZone,
              currency: p.currencyCode
            }))
          });
        }
      }
    }

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error('debugGaAccount error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});