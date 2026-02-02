import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const today = new Date();
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(today.getDate() + 15);

    const results = {
      engineers_notified: 0,
      clients_notified: 0,
      firms_notified: 0
    };

    // Check engineers
    const engineers = await base44.asServiceRole.entities.Engineer.filter({
      subscription_type: "free_trial",
      is_subscription_active: true,
      notification_sent_15_days: false
    });

    for (const engineer of engineers) {
      if (engineer.trial_end_date) {
        const trialEndDate = new Date(engineer.trial_end_date);
        const daysUntilExpiry = Math.floor((trialEndDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 15 && daysUntilExpiry > 0) {
          // Send notification
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: engineer.email,
            from_name: "بيتلي",
            subject: "⚠️ فترة الوصول المجاني تنتهي قريباً",
            body: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d97706;">عزيزي ${engineer.full_name},</h2>
                <p>نود أن نذكرك بأن فترة الوصول المبكر المجاني ستنتهي خلال ${daysUntilExpiry} يوم.</p>
                <p><strong>تاريخ الانتهاء:</strong> ${new Date(engineer.trial_end_date).toLocaleDateString('ar-SA')}</p>
                <p>للحفاظ على:</p>
                <ul>
                  <li>✅ ظهورك في قائمة المصممين</li>
                  <li>✅ قدرتك على تقديم عروض على المشاريع</li>
                  <li>✅ الوصول إلى لوحة التحكم ومحفظتك</li>
                </ul>
                <p><strong>اشترك الآن</strong> للاستمرار في الاستفادة من جميع المزايا.</p>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="${Deno.env.get('APP_URL') || 'https://app.base44.com'}/subscription" 
                     style="background: linear-gradient(to right, #d97706, #f59e0b); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                    اشترك الآن
                  </a>
                </div>
              </div>
            `
          });

          // Mark notification as sent
          await base44.asServiceRole.entities.Engineer.update(engineer.id, {
            notification_sent_15_days: true
          });

          results.engineers_notified++;
        }
      }
    }

    // Check clients
    const clients = await base44.asServiceRole.entities.Client.filter({
      subscription_type: "free_trial",
      is_subscription_active: true,
      notification_sent_15_days: false
    });

    for (const client of clients) {
      if (client.trial_end_date) {
        const trialEndDate = new Date(client.trial_end_date);
        const daysUntilExpiry = Math.floor((trialEndDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 15 && daysUntilExpiry > 0) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: client.email,
            from_name: "بيتلي",
            subject: "⚠️ فترة الوصول المجاني تنتهي قريباً",
            body: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d97706;">عزيزي ${client.full_name},</h2>
                <p>فترة الوصول المبكر المجاني ستنتهي خلال ${daysUntilExpiry} يوم.</p>
                <p>اشترك الآن للاستمرار في نشر المشاريع وإدارة محفظتك.</p>
              </div>
            `
          });

          await base44.asServiceRole.entities.Client.update(client.id, {
            notification_sent_15_days: true
          });

          results.clients_notified++;
        }
      }
    }

    // Check firms
    const firms = await base44.asServiceRole.entities.EngineeringFirm.filter({
      subscription_type: "free_trial",
      is_subscription_active: true,
      notification_sent_15_days: false
    });

    for (const firm of firms) {
      if (firm.trial_end_date) {
        const trialEndDate = new Date(firm.trial_end_date);
        const daysUntilExpiry = Math.floor((trialEndDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 15 && daysUntilExpiry > 0) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: firm.email,
            from_name: "بيتلي",
            subject: "⚠️ فترة الوصول المجاني تنتهي قريباً",
            body: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d97706;">عزيزي ${firm.company_name},</h2>
                <p>فترة الوصول المبكر المجاني ستنتهي خلال ${daysUntilExpiry} يوم.</p>
                <p>اشترك الآن للاستمرار في مراجعة المشاريع وتقديم خدماتكم الاستشارية.</p>
              </div>
            `
          });

          await base44.asServiceRole.entities.EngineeringFirm.update(firm.id, {
            notification_sent_15_days: true
          });

          results.firms_notified++;
        }
      }
    }

    console.log('Trial expiry check completed:', results);

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error checking trial expiry:', error);
    return Response.json({ 
      error: 'Failed to check trial expiry',
      details: error.message 
    }, { status: 500 });
  }
});