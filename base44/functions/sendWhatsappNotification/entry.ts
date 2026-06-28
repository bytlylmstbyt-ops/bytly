import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const WHATSAPP_API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN");
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

async function sendWhatsApp(toPhone, message) {
  // Normalize phone: remove spaces/dashes, ensure starts with country code
  const phone = toPhone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
  
  const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WHATSAPP_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message }
    })
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("WhatsApp API error:", JSON.stringify(data));
    throw new Error(data.error?.message || "WhatsApp send failed");
  }
  return data;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { type, to_phone, to_name, sender_name, conversation_id, contract_id, meeting_link } = body;

    if (!to_phone) {
      return Response.json({ error: "to_phone is required" }, { status: 400 });
    }

    const APP_URL = "https://mybytly.com";
    const FACEBOOK_PAGE = "https://www.facebook.com/profile.php?id=61587162083581";
    let message = "";

    if (type === "new_message") {
      const chatUrl = `${APP_URL}/Messages?conversation=${conversation_id}`;
      message = `🔔 *Bytly - رسالة جديدة*\n\nمرحباً ${to_name || ""}،\nلديك رسالة جديدة من *${sender_name}*.\n\n👉 اضغط هنا للرد:\n${chatUrl}\n\n🌐 ${APP_URL}`;
    
    } else if (type === "video_call") {
      message = `📹 *Bytly - مكالمة فيديو*\n\nمرحباً ${to_name || ""}،\nتمت دعوتك لمكالمة فيديو عبر Bytly.\n\n🔗 رابط الاجتماع:\n${meeting_link}\n\n🌐 ${APP_URL}`;
    
    } else if (type === "new_contract") {
      const contractUrl = `${APP_URL}/Contract?id=${contract_id}`;
      message = `📄 *Bytly - عقد جديد*\n\nمرحباً ${to_name || ""}،\nتم إصدار عقدك الجديد بنجاح ✅\n\nيمكنك مراجعته الآن عبر الرابط التالي:\n${contractUrl}\n\n🌐 ${APP_URL}`;
    
    } else {
      return Response.json({ error: "Unknown notification type" }, { status: 400 });
    }

    const result = await sendWhatsApp(to_phone, message);
    console.log(`WhatsApp [${type}] sent to ${to_phone}`);
    return Response.json({ success: true, result });

  } catch (error) {
    console.error("sendWhatsappNotification error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});