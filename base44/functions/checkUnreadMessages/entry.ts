import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const serviceBase44 = base44.asServiceRole;

    // جلب الرسائل التي أُرسلت منذ أكثر من دقيقتين ولم تُقرأ بعد
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const messages = await serviceBase44.entities.Message.filter({
      is_read: false,
      is_system_message: false,
    }, '-created_date', 100);

    // فلتر الرسائل التي تجاوزت دقيقتين ولم يُرسل تنبيه واتساب لها
    const oldUnread = messages.filter(m => {
      const msgTime = new Date(m.created_date).getTime();
      const now = Date.now();
      const age = now - msgTime;
      // بين دقيقتين وخمس دقائق (لتجنب إعادة الإرسال)
      return age >= 2 * 60 * 1000 && age <= 5 * 60 * 1000;
    });

    if (oldUnread.length === 0) {
      return Response.json({ success: true, sent: 0 });
    }

    let sentCount = 0;

    for (const msg of oldUnread) {
      // جلب بيانات المحادثة لمعرفة المشاركين
      const conversations = await serviceBase44.entities.Conversation.filter({ id: msg.conversation_id });
      if (!conversations || conversations.length === 0) continue;
      const conv = conversations[0];

      // المشاركون الآخرون (غير المرسل)
      const recipients = (conv.participants || []).filter(p => p !== msg.sender_email);

      for (const recipientEmail of recipients) {
        // جلب بيانات المستخدم للحصول على رقم هاتفه
        const users = await serviceBase44.entities.User.filter({ email: recipientEmail });
        const engineers = await serviceBase44.entities.Engineer.filter({ email: recipientEmail });
        const clients = await serviceBase44.entities.Client.filter({ email: recipientEmail });

        let phone = null;
        let name = recipientEmail;

        if (engineers.length > 0 && engineers[0].phone) {
          phone = engineers[0].phone;
          name = engineers[0].full_name || name;
        } else if (clients.length > 0 && clients[0].phone) {
          phone = clients[0].phone;
          name = clients[0].full_name || name;
        }

        if (!phone) {
          console.log(`No phone for ${recipientEmail}, skipping`);
          continue;
        }

        // إرسال تنبيه واتساب
        await base44.asServiceRole.functions.invoke('sendWhatsappNotification', {
          type: "new_message",
          to_phone: phone,
          to_name: name,
          sender_name: msg.sender_name || msg.sender_email,
          conversation_id: msg.conversation_id,
        });

        sentCount++;
      }
    }

    console.log(`WhatsApp unread notifications sent: ${sentCount}`);
    return Response.json({ success: true, sent: sentCount });

  } catch (error) {
    console.error("checkUnreadMessages error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});