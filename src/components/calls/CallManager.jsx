import React from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CallManager({ conversationId, currentUserEmail, recipientData }) {
  const getJitsiRoomId = () => `bytly-${conversationId?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`;

  const sendSystemMessage = async (content) => {
    const user = await base44.auth.me();
    const message = await base44.entities.Message.create({
      conversation_id: conversationId,
      sender_email: currentUserEmail,
      sender_name: user.full_name,
      sender_role: 'user',
      content,
      is_system_message: true
    });
    await base44.entities.Conversation.update(conversationId, {
      last_message: content.split('\n')[0].slice(0, 100),
      last_message_date: new Date().toISOString()
    });
    return message;
  };

  const startCall = async (isVideo = true) => {
    const roomId = getJitsiRoomId();
    const callUrl = `https://meet.jit.si/${roomId}${isVideo ? '' : '#config.startWithVideoMuted=true'}`;
    const callType = isVideo ? 'فيديو' : 'صوتية';
    try {
      await sendSystemMessage(`📞 دعوة مكالمة ${callType}\n\nانضم للمكالمة عبر الرابط:\n${callUrl}`);
      toast.success(`جاري بدء مكالمة ${callType}...`);
      if (recipientData?.phone) {
        base44.functions.invoke('sendWhatsappNotification', {
          type: isVideo ? 'video_call' : 'voice_call',
          to_phone: recipientData.phone,
          to_name: recipientData.name || recipientData.full_name || '',
          meeting_link: callUrl,
        }).catch(e => console.error('WhatsApp call notify error:', e));
      }
    } catch (error) {
      console.error('Error sending call invite:', error);
      toast.error('تعذر إرسال دعوة المكالمة');
    }
    window.open(callUrl, '_blank', 'width=900,height=700,scrollbars=no,resizable=yes');
  };

  const createGoogleMeet = async () => {
    const meetCreateUrl = 'https://meet.google.com/new';
    const meetWindow = window.open(meetCreateUrl, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
    if (!meetWindow) {
      toast.error('تعذر فتح Google Meet. اسمحي بالنوافذ المنبثقة ثم حاولي مرة أخرى.');
      return;
    }

    toast.success('تم فتح Google Meet. أنشئي الاجتماع ثم انسخي رابط الاجتماع.');

    window.setTimeout(async () => {
      const link = window.prompt('بعد إنشاء الاجتماع في Google Meet، الصقي هنا رابط الاجتماع (meet.google.com/...) لإرساله للمشاركين:');
      if (!link) return;
      const normalized = link.trim();
      if (!/^https:\/\/meet\.google\.com\/[a-z0-9-]+(?:[/?#].*)?$/i.test(normalized)) {
        toast.error('رابط Google Meet غير صالح. استخدمي رابطًا يبدأ بـ https://meet.google.com/');
        return;
      }
      try {
        await sendSystemMessage(`📅 دعوة اجتماع Google Meet\n\nانضم للاجتماع عبر الرابط:\n${normalized}`);
        toast.success('تم إرسال رابط Google Meet داخل المحادثة');
      } catch (error) {
        console.error('Error sending Google Meet link:', error);
        toast.error('تعذر إرسال رابط Google Meet');
      }
    }, 1200);
  };

  const GoogleMeetButton = () => (
    <button
      type="button"
      onClick={createGoogleMeet}
      className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
      title="إنشاء اجتماع Google Meet"
    >
      <span aria-hidden="true">📅</span>
      Google Meet
    </button>
  );

  return {
    isCallActive: false,
    isIncomingCall: false,
    callData: null,
    localStream: null,
    remoteStream: null,
    startCall,
    createGoogleMeet,
    GoogleMeetButton,
    acceptCall: () => {},
    rejectCall: () => {},
    endCall: () => {},
    VideoCallWindow: <GoogleMeetButton />
  };
}
