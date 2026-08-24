import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, 
  Maximize2, Minimize2, User, Volume2, VolumeX,
  Circle, MonitorUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function VideoCallWindow({ 
  callData, 
  isIncoming = false,
  onEnd,
  onAccept,
  onReject,
  localStream,
  remoteStream,
  onRecordingComplete
}) {
  const [callStatus, setCallStatus] = useState(isIncoming ? 'ringing' : 'connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const screenStreamRef = useRef(null);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      setCallStatus('connected');
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  }, [remoteStream]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !remoteVideoRef.current.muted;
      setIsSpeakerOff(!isSpeakerOff);
    }
  };

  const handleAccept = () => {
    setCallStatus('connecting');
    onAccept?.();
  };

  const handleReject = () => {
    setCallStatus('ended');
    onReject?.();
  };

  const handleEnd = async () => {
    // Stop recording if active
    if (isRecording) {
      await stopRecording();
    }
    
    // Stop screen sharing if active
    if (isScreenSharing) {
      stopScreenSharing();
    }
    
    setCallStatus('ended');
    if (timerRef.current) clearInterval(timerRef.current);
    onEnd?.();
  };

  const startRecording = async () => {
    try {
      // Create a combined stream with both local and remote audio/video
      const combinedStream = new MediaStream();
      
      if (localStream) {
        localStream.getTracks().forEach(track => combinedStream.addTrack(track));
      }
      
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => combinedStream.addTrack(track));
      }

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        await saveRecording(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('فشل بدء التسجيل. يرجى المحاولة مرة أخرى.');
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = async (blob) => {
    try {
      const file = new File(
        [blob],
        `call_recording_${Date.now()}.webm`,
        { type: 'video/webm' }
      );
      
      onRecordingComplete?.(file);
      
      // Also offer download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error saving recording:', error);
    }
  };

  const startScreenSharing = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always'
        },
        audio: false
      });

      screenStreamRef.current = screenStream;
      
      // Replace video track
      if (localStream) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = localStream.getVideoTracks()[0];
        
        // This would need to be passed from parent to update peer connection
        // For now, just update local display
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        videoTrack.onended = () => {
          stopScreenSharing();
        };
      }

      setIsScreenSharing(true);
    } catch (error) {
      console.error('Error starting screen share:', error);
      alert('فشل مشاركة الشاشة. يرجى المحاولة مرة أخرى.');
    }
  };

  const stopScreenSharing = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      
      // Restore camera stream
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    }
  };

  const statusConfig = {
    ringing: { color: 'bg-blue-500', text: 'مكالمة واردة...', icon: Phone },
    connecting: { color: 'bg-yellow-500', text: 'جاري الاتصال...', icon: Phone },
    connected: { color: 'bg-green-500', text: formatDuration(duration), icon: Phone },
    ended: { color: 'bg-red-500', text: 'انتهت المكالمة', icon: PhoneOff }
  };

  const status = statusConfig[callStatus] || statusConfig.connecting;
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <Card className={cn(
        "w-full max-w-4xl overflow-hidden shadow-2xl",
        isFullscreen && "max-w-full h-full"
      )}>
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-white/20">
                <AvatarImage src={callData?.avatar} />
                <AvatarFallback className="bg-[#C9A66B] text-white">
                  {callData?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{callData?.name}</h3>
                <Badge className={cn("text-xs", status.color)}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.text}
                </Badge>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-white hover:bg-white/10"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-slate-950 relative">
          <div className={cn(
            "relative",
            isFullscreen ? "h-[calc(100vh-180px)]" : "h-[500px]"
          )}>
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Placeholder when no remote stream */}
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="text-center">
                  <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-white/20">
                    <AvatarImage src={callData?.avatar} />
                    <AvatarFallback className="bg-[#C9A66B] text-white text-4xl">
                      {callData?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-white text-lg">
                    {callStatus === 'ringing' ? 'في انتظار الرد...' : 'جاري الاتصال...'}
                  </p>
                </div>
              </div>
            )}

            {/* Local Video (Picture-in-Picture) */}
            <motion.div
              drag
              dragMomentum={false}
              className="absolute top-4 right-4 w-48 h-36 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20 cursor-move"
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                  <User className="w-12 h-12 text-white/50" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                <Badge className="bg-black/50 text-white text-xs">أنت</Badge>
                {isScreenSharing && (
                  <Badge className="bg-blue-500 text-white text-xs flex items-center gap-1">
                    <MonitorUp className="w-3 h-3" />
                    شاشة
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* Recording Indicator */}
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-3 h-3 bg-white rounded-full"
                />
                <span className="text-sm font-medium">جاري التسجيل</span>
              </motion.div>
            )}
          </div>

          {/* Call Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
            <AnimatePresence>
              {callStatus === 'ringing' && isIncoming ? (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="flex items-center justify-center gap-4"
                >
                  <Button
                    size="lg"
                    onClick={handleReject}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleAccept}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full w-16 h-16"
                  >
                    <Phone className="w-6 h-6" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex items-center justify-center gap-3"
                >
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={toggleMute}
                    className={cn(
                      "rounded-full w-14 h-14 transition-all",
                      isMuted ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                    title={isMuted ? "تشغيل الميكروفون" : "كتم الميكروفون"}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={toggleVideo}
                    className={cn(
                      "rounded-full w-14 h-14 transition-all",
                      isVideoOff ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                    title={isVideoOff ? "تشغيل الفيديو" : "إيقاف الفيديو"}
                  >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={toggleSpeaker}
                    className={cn(
                      "rounded-full w-14 h-14 transition-all",
                      isSpeakerOff ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                    title={isSpeakerOff ? "تشغيل السماعة" : "كتم السماعة"}
                  >
                    {isSpeakerOff ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={isScreenSharing ? stopScreenSharing : startScreenSharing}
                    className={cn(
                      "rounded-full w-14 h-14 transition-all",
                      isScreenSharing ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                    title={isScreenSharing ? "إيقاف مشاركة الشاشة" : "مشاركة الشاشة"}
                  >
                    <MonitorUp className="w-5 h-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "rounded-full w-14 h-14 transition-all",
                      isRecording ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                    title={isRecording ? "إيقاف التسجيل" : "بدء التسجيل"}
                  >
                    <Circle className={cn("w-5 h-5", isRecording && "fill-white")} />
                  </Button>

                  <Button
                    size="lg"
                    onClick={handleEnd}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 ml-4"
                    title="إنهاء المكالمة"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}