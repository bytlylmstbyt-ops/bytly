import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventType, data } = await req.json();

    // Authorization: admins may notify about any registration; regular users may only
    // trigger registration notifications for their own account (data.email must match caller).
    const targetEmail = data && data.email ? String(data.email) : '';
    if (user.role !== 'admin' && targetEmail !== user.email) {
      return Response.json({ error: 'Forbidden: can only notify for your own registration' }, { status: 403 });
    }

    // Helper function to send email
    const sendEmail = async (to: string, subject: string, body: string) => {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to,
        subject,
        body
      });
    };

    // Handle new engineer registration
    if (eventType === "engineer_registered") {
      const { full_name, email, user_type, specialization } = data;

      // Send welcome email to engineer
      await sendEmail(
        email,
        "مرحباً بك في منصة بتلي - مهندس",
        `أهلاً بك ${full_name}،\n\nتم تسجيل حسابك بنجاح في منصة بتلي.\n\nتخصصك: ${specialization || user_type}\n\nفريق بتلي`
      );

      // Notify admins
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
      for (const admin of admins) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: admin.email,
          title: "تسجيل مهندس جديد",
          message: `تم تسجيل المهندس ${full_name} (${email}) بنجاح`,
          type: "system",
          priority: "medium",
          description: `نوع المهندس: ${user_type}`
        });
      }

      return Response.json({ success: true, message: "Engineer registration notifications sent" });
    }

    // Handle new client registration
    if (eventType === "client_registered") {
      const { full_name, email } = data;

      // Send welcome email to client
      await sendEmail(
        email,
        "مرحباً بك في منصة بتلي - عميل",
        `أهلاً بك ${full_name}،\n\nتم تسجيل حسابك بنجاح في منصة بتلي.\n\nفريق بتلي`
      );

      // Notify admins
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
      for (const admin of admins) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: admin.email,
          title: "تسجيل عميل جديد",
          message: `تم تسجيل العميل ${full_name} (${email}) بنجاح`,
          type: "system",
          priority: "medium",
          description: "عميل جديد انضم للمنصة"
        });
      }

      return Response.json({ success: true, message: "Client registration notifications sent" });
    }

    // Handle new firm registration
    if (eventType === "firm_registered") {
      const { company_name, email, commercial_registration } = data;

      // Send welcome email to firm
      await sendEmail(
        email,
        "مرحباً بك في منصة بتلي - شركة",
        `أهلاً بك في منصة بتلي،\n\nتم تسجيل شركة ${company_name} بنجاح.\n\nالسجل التجاري: ${commercial_registration}\n\nفريق بتلي`
      );

      // Notify admins
      const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
      for (const admin of admins) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: admin.email,
          title: "تسجيل شركة جديدة",
          message: `تم تسجيل شركة ${company_name} (${email}) بنجاح`,
          type: "system",
          priority: "high",
          description: `السجل التجاري: ${commercial_registration}`
        });
      }

      return Response.json({ success: true, message: "Firm registration notifications sent" });
    }

    return Response.json({ error: "Unknown event type" }, { status: 400 });
  } catch (error) {
    console.error("Error in notifyNewRegistration:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});