import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    // Get engineers, clients, consultants, firms, legal consultants to find who completed registration
    const [engineers, clients, consultants, firms, legalConsultants] = await Promise.all([
      base44.asServiceRole.entities.Engineer.list(),
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Consultant.list(),
      base44.asServiceRole.entities.EngineeringFirm.list(),
      base44.asServiceRole.entities.LegalConsultant.list(),
    ]);

    // Collect emails of users who completed registration
    const completedEmails = new Set([
      ...engineers.map(e => e.email),
      ...clients.map(c => c.email),
      ...consultants.map(c => c.email),
      ...firms.map(f => f.email),
      ...legalConsultants.map(l => l.email),
    ]);

    // Find users who haven't completed registration
    const incompleteUsers = allUsers.filter(u => !completedEmails.has(u.email));

    let sentCount = 0;
    let failedCount = 0;

    for (const user of incompleteUsers) {
      try {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: 'مل تسجيلك وانضم لعائلة بيتلي',
          body: `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; background-color: #f9f9f9; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); display: inline-block; padding: 15px 30px; border-radius: 8px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">بيتلي – لمسة بيت</h1>
      </div>
    </div>

    <!-- Greeting -->
    <h2 style="color: #6B5D4F; margin-bottom: 20px; font-size: 20px;">مرحباً بك،</h2>
    
    <p style="color: #4A4A4A; line-height: 1.8; font-size: 16px; margin-bottom: 15px;">
      لقد لاحظنا اهتمامك بالتسجيل معنا في منصة <strong>بيتلي – لمسة بيت</strong>، لكن يبدو أنك لم تُكمل عملية التسجيل بعد.
    </p>

    <p style="color: #4A4A4A; line-height: 1.8; font-size: 16px; margin-bottom: 25px;">
      نحن هنا لنذكّرك بأن باب التسجيل ما زال مفتوحاً، ويسعدنا جداً انضمامك إلينا!
    </p>

    <!-- Benefits Section -->
    <div style="background-color: #F5F0EB; border-right: 4px solid #C9A66B; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="color: #6B5D4F; margin-top: 0; margin-bottom: 15px; font-size: 18px;">✨ لماذا تكمل التسجيل الآن؟</h3>
      <ul style="color: #4A4A4A; line-height: 2; font-size: 15px; padding-right: 20px; margin: 0;">
        <li>كن من أوائل المستخدمين واستفد من الميزات الحصرية</li>
        <li>تواصل مباشر مع نخبة من المهندسين والاستشاريين</li>
        <li>أسعار خاصة للمستخدمين الأوائل</li>
        <li>دعم مباشر من فريقنا لمساعدتك في كل خطوة</li>
      </ul>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://mybytly.com/register" 
         style="display: inline-block; background: linear-gradient(135deg, #6B5D4F 0%, #C9A66B 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(107, 93, 79, 0.3);">
        أكمل تسجيلك الآن
      </a>
    </div>

    <!-- Alternative Link -->
    <p style="text-align: center; color: #888; font-size: 14px; margin: 20px 0;">
      أو انسخ الرابط: 
      <a href="https://mybytly.com/register" style="color: #C9A66B; text-decoration: none;">https://mybytly.com/register</a>
    </p>

    <!-- Footer -->
    <div style="border-top: 1px solid #E0E0E0; margin-top: 30px; padding-top: 20px; text-align: center;">
      <p style="color: #6B5D4F; font-size: 16px; margin: 0 0 10px 0;">نحن في انتظارك!</p>
      <p style="color: #888; font-size: 14px; margin: 0;">فريق بيتلي – لمسة بيت</p>
      
      <div style="margin-top: 20px;">
        <a href="mailto:info@mybytly.com" style="color: #C9A66B; text-decoration: none; margin: 0 10px; font-size: 14px;">📧 info@mybytly.com</a>
        <span style="color: #E0E0E0;">|</span>
        <a href="https://mybytly.com" style="color: #C9A66B; text-decoration: none; margin: 0 10px; font-size: 14px;">🌐 mybytly.com</a>
      </div>
    </div>

  </div>
</div>
          `,
        });
        sentCount++;
        console.log(`Email sent to ${user.email}`);
      } catch (error) {
        failedCount++;
        console.error(`Failed to send to ${user.email}:`, error.message);
      }
    }

    return Response.json({
      success: true,
      message: `تم إرسال ${sentCount} بريد إلكتروني، فشل ${failedCount}`,
      sentCount,
      failedCount,
      totalUsers: incompleteUsers.length,
    });

  } catch (error) {
    console.error('Error sending emails:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});