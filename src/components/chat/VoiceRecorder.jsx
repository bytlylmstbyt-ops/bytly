import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceRecorder({ onSend, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [sending, setSending] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('لا يمكن الوصول للميكروفون. يرجى التأكد من الأذونات.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setRecordedBlob(null);
    setDuration(0);
    chunksRef.current = [];
  };

  const handleSend = async () => {
    if (!recordedBlob) return;
    
    setSending(true);
    try {
      // Convert blob to file
      const audioFile = new File(
        [recordedBlob], 
        `voice_message_${Date.now()}.webm`, 
        { type: 'audio/webm' }
      );
      
      await onSend({
        audioFile,
        duration
      });
      
      // Reset
      setRecordedBlob(null);
      setDuration(0);
      chunksRef.current = [];
    } catch (error) {
      console.error('Error sending voice message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        {!isRecording && !recordedBlob && (
          <motion.div
            key="record-button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={startRecording}
              disabled={disabled}
              title="تسجيل رسالة صوتية"
              className="relative"
            >
              <Mic className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {isRecording && (
          <motion.div
            key="recording"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-3 h-3 bg-red-500 rounded-full"
              />
              <span className="text-sm font-mono text-red-700">
                {formatDuration(duration)}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={stopRecording}
              className="text-red-700 hover:bg-red-100"
            >
              <Square className="w-4 h-4 mr-1" />
              إيقاف
            </Button>
          </motion.div>
        )}

        {recordedBlob && !isRecording && (
          <motion.div
            key="recorded"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
          >
            <span className="text-sm text-green-700 font-mono">
              🎤 {formatDuration(duration)}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelRecording}
              disabled={sending}
              className="h-8 w-8 text-red-600 hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1" />
                  إرسال
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}