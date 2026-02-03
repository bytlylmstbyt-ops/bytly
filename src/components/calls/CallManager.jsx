import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import VideoCallWindow from './VideoCallWindow';
import { toast } from 'sonner';

export default function CallManager({ conversationId, currentUserEmail, recipientData }) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callData, setCallData] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const peerConnectionRef = useRef(null);
  const iceCandidatesQueue = useRef([]);

  // WebRTC Configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    // Subscribe to call signals
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create' && event.data?.conversation_id === conversationId) {
        handleIncomingSignal(event.data);
      }
    });

    return () => {
      unsubscribe();
      cleanup();
    };
  }, [conversationId]);

  const handleIncomingSignal = async (message) => {
    if (!message.content?.startsWith('__CALL_SIGNAL__')) return;

    try {
      const signal = JSON.parse(message.content.replace('__CALL_SIGNAL__', ''));
      
      switch (signal.type) {
        case 'offer':
          if (message.sender_email !== currentUserEmail) {
            setIsIncomingCall(true);
            setCallData({
              name: message.sender_name,
              avatar: null,
              offer: signal.offer
            });
          }
          break;
          
        case 'answer':
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(signal.answer)
            );
            // Process queued ICE candidates
            while (iceCandidatesQueue.current.length > 0) {
              const candidate = iceCandidatesQueue.current.shift();
              await peerConnectionRef.current.addIceCandidate(candidate);
            }
          }
          break;
          
        case 'ice-candidate':
          if (peerConnectionRef.current) {
            const candidate = new RTCIceCandidate(signal.candidate);
            if (peerConnectionRef.current.remoteDescription) {
              await peerConnectionRef.current.addIceCandidate(candidate);
            } else {
              iceCandidatesQueue.current.push(candidate);
            }
          }
          break;
          
        case 'end':
          handleCallEnd();
          break;
      }
    } catch (error) {
      console.error('Error handling call signal:', error);
    }
  };

  const initializeCall = async (isVideo = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });
      
      setLocalStream(stream);
      
      const peerConnection = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = peerConnection;

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({
            type: 'ice-candidate',
            candidate: event.candidate
          });
        }
      };

      return peerConnection;
    } catch (error) {
      console.error('Error initializing call:', error);
      toast.error('فشل الوصول للكاميرا/الميكروفون');
      throw error;
    }
  };

  const startCall = async (isVideo = true) => {
    try {
      const peerConnection = await initializeCall(isVideo);
      
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo
      });
      
      await peerConnection.setLocalDescription(offer);
      
      await sendSignal({
        type: 'offer',
        offer: offer
      });

      setIsCallActive(true);
      setCallData({
        name: recipientData?.name || 'مستخدم',
        avatar: recipientData?.avatar,
        isVideo
      });
      
      toast.success('جاري الاتصال...');
    } catch (error) {
      console.error('Error starting call:', error);
      cleanup();
    }
  };

  const acceptCall = async () => {
    try {
      const peerConnection = await initializeCall(true);
      
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(callData.offer)
      );
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      await sendSignal({
        type: 'answer',
        answer: answer
      });

      setIsIncomingCall(false);
      setIsCallActive(true);
      
      // Process queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        await peerConnection.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('Error accepting call:', error);
      rejectCall();
    }
  };

  const rejectCall = async () => {
    await sendSignal({ type: 'end' });
    setIsIncomingCall(false);
    setCallData(null);
    toast.info('تم رفض المكالمة');
  };

  const endCall = async () => {
    await sendSignal({ type: 'end' });
    handleCallEnd();
    toast.info('انتهت المكالمة');
  };

  const handleCallEnd = () => {
    cleanup();
    setIsCallActive(false);
    setIsIncomingCall(false);
    setCallData(null);
  };

  const sendSignal = async (signal) => {
    try {
      const user = await base44.auth.me();
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: currentUserEmail,
        sender_name: user.full_name,
        sender_role: 'user',
        content: `__CALL_SIGNAL__${JSON.stringify(signal)}`,
        is_system_message: true
      });
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setRemoteStream(null);
    iceCandidatesQueue.current = [];
  };

  return {
    isCallActive,
    isIncomingCall,
    callData,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    VideoCallWindow: isCallActive || isIncomingCall ? (
      <VideoCallWindow
        callData={callData}
        isIncoming={isIncomingCall}
        localStream={localStream}
        remoteStream={remoteStream}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
      />
    ) : null
  };
}