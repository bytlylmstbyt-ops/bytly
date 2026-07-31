import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Paperclip, X, Video, Phone } from "lucide-react";
import { motion } from "framer-motion";
import VoiceRecorder from "./VoiceRecorder";

export default function ChatInput({ onMessageSend, onVideoCall, onVoiceCall, disabled = false }) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            url: file_url,
            size: file.size,
            type: file.type
          }
        ]);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return;

    setSending(true);
    try {
      await onMessageSend({
        content: message,
        attachments
      });
      setMessage("");
      setAttachments([]);
    } finally {
      setSending(false);
    }
  };

  const handleVoiceSend = async ({ audioFile, duration }) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
      
      await onMessageSend({
        content: "🎤 رسالة صوتية",
        attachments: [{
          name: audioFile.name,
          url: file_url,
          size: audioFile.size,
          type: audioFile.type,
          duration: duration,
          isVoice: true
        }]
      });
    } catch (error) {
      console.error("Error sending voice message:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="border-t bg-white p-4 space-y-3">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg"
            >
              <Paperclip className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-700">{file.name}</span>
              <button
                onClick={() => handleRemoveAttachment(idx)}
                className="ml-2 hover:bg-slate-200 rounded p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالة..."
            disabled={disabled || uploading || sending}
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
            disabled={disabled || uploading || sending}
          />

          {onVideoCall && (
            <Button
              variant="outline"
              size="icon"
              onClick={onVideoCall}
              disabled={disabled}
              title="مكالمة فيديو"
              className="hover:bg-blue-50 hover:text-blue-600"
            >
              <Video className="w-4 h-4" />
            </Button>
          )}

          {onVoiceCall && (
            <Button
              variant="outline"
              size="icon"
              onClick={onVoiceCall}
              disabled={disabled}
              title="مكالمة صوتية"
              className="hover:bg-green-50 hover:text-green-600"
            >
              <Phone className="w-4 h-4" />
            </Button>
          )}

          <VoiceRecorder
            onSend={handleVoiceSend}
            disabled={disabled || uploading || sending}
          />

          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading || sending}
            title="إضافة ملف"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>

          <Button
            onClick={handleSendMessage}
            disabled={disabled || uploading || sending || (!message.trim() && attachments.length === 0)}
            className="bg-[#C9A66B] hover:bg-[#c89864] text-white"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}