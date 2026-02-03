import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, 
  Maximize2, Minimize2, Monitor, User, Volume2, VolumeX
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
  remoteStream
}) {
  const [callStatus, setCallStatus] = useState(isIncoming ? 'ringing' : 'connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);

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

  const handleEnd = () => {
    setCallStatus('ended');
    if (timerRef.current) clearInterval(timerRef.current);
    onEnd?.();
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
                <AvatarFallback className="bg-[#d4a574] text-white">
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
                    <AvatarFallback className="bg-[#d4a574] text-white text-4xl">
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
              <div className="absolute bottom-2 left-2">
                <Badge className="bg-black/50 text-white text-xs">أنت</Badge>
              </div>
            </motion.div>
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
                  >
                    {isSpeakerOff ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>

                  <Button
                    size="lg"
                    onClick={handleEnd}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 ml-4"
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