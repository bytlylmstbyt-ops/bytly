import React from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CallManager({ conversationId, currentUserEmail, recipientData }) {

  const getJitsiRoomId = () => {
    // Use conversationId as unique room identifier (sanitized)
    return `bytly-${conversationId?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`;
  };

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
    // Google Meet generates the actual room URL after the user opens its
    // authenticated "new meeting" flow. The app must not invent a meet URL.
    const meetCreateUrl = 'https://meet.google.com/new';

    try {
      await sendSystemMessage(
        '📅 دعوة اجتماع Google Meet\n\nتم فتح إنشاء اجتماع Google Meet. بعد إنشاء الاجتماع، انسخ رابط الاجتماع وأرسله هنا للمشاركين.'
      );
      toast.success('تم فتح إنشاء اجتماع Google Meet');
    } catch (error) {
      console.error('Error creating Google Meet invite:', error);
      toast.error('تعذر إرسال إشعار الاجتماع');
    }

    window.open(meetCreateUrl, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
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
