import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CallManager({ conversationId, currentUserEmail, recipientData }) {

  const getJitsiRoomId = () => {
    // Use conversationId as unique room identifier (sanitized)
    return `bytly-${conversationId?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`;
  };

  const startCall = async (isVideo = true) => {
    const roomId = getJitsiRoomId();
    const callUrl = `https://meet.jit.si/${roomId}${isVideo ? '' : '#config.startWithVideoMuted=true'}`;
    const callType = isVideo ? 'فيديو' : 'صوتية';

    // Send invite message to the conversation
    try {
      const user = await base44.auth.me();
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: currentUserEmail,
        sender_name: user.full_name,
        sender_role: 'user',
        content: `📞 دعوة مكالمة ${callType}\n\nانضم للمكالمة عبر الرابط:\n${callUrl}`,
        is_system_message: true
      });
      toast.success(`جاري بدء مكالمة ${callType}...`);

      // إرسال تنبيه واتساب للطرف الآخر
      if (recipientData?.phone) {
        base44.functions.invoke('sendWhatsappNotification', {
          type: "video_call",
          to_phone: recipientData.phone,
          to_name: recipientData.name || recipientData.full_name || "",
          meeting_link: callUrl,
        }).catch(e => console.error('WhatsApp call notify error:', e));
      }
    } catch (error) {
      console.error('Error sending call invite:', error);
    }

    // Open Jitsi call in new window
    window.open(callUrl, '_blank', 'width=900,height=700,scrollbars=no,resizable=yes');
  };

  return {
    isCallActive: false,
    isIncomingCall: false,
    callData: null,
    localStream: null,
    remoteStream: null,
    startCall,
    acceptCall: () => {},
    rejectCall: () => {},
    endCall: () => {},
    VideoCallWindow: null
  };
}