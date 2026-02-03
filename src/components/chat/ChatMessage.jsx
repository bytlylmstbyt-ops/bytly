import React, { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Image as ImageIcon, Trash2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import AudioPlayer from "./AudioPlayer";

export default function ChatMessage({
  message,
  isOwn,
  showAvatar,
  onDelete,
  onEdit,
  senderData
}) {
  const [showActions, setShowActions] = useState(false);

  const getFileIcon = (type) => {
    if (type?.includes("image")) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3 group mb-4", isOwn ? "flex-row-reverse" : "flex-row")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAvatar ? (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={senderData?.profile_image} />
          <AvatarFallback className="text-xs bg-[#d4a574] text-white">
            {message.sender_name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        {showAvatar && (
          <span className="text-xs font-medium text-slate-600">
            {message.sender_name}
          </span>
        )}

        {/* Message Content */}
        <div
          className={cn(
            "rounded-lg px-4 py-2.5 max-w-xs lg:max-w-md break-words",
            isOwn
              ? "bg-[#d4a574] text-white rounded-br-none"
              : "bg-slate-100 text-slate-900 rounded-bl-none"
          )}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>

          {/* Attachments */}
          {message.attachments?.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((file, idx) => (
                file.isVoice ? (
                  <AudioPlayer
                    key={idx}
                    audioUrl={file.url}
                    duration={file.duration}
                    isOwn={isOwn}
                  />
                ) : (
                  <a
                    key={idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2 p-2 rounded transition-colors",
                      isOwn
                        ? "bg-white/20 hover:bg-white/30"
                        : "bg-white hover:bg-slate-50"
                    )}
                  >
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-medium truncate", isOwn ? "text-white" : "text-slate-900")}>
                        {file.name}
                      </p>
                      <p className={cn("text-xs", isOwn ? "text-white/70" : "text-slate-600")}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Download className={cn("w-4 h-4 flex-shrink-0", isOwn ? "text-white" : "text-slate-600")} />
                  </a>
                )
              ))}
            </div>
          )}

          {/* Edited Badge */}
          {message.edited_at && (
            <p className={cn("text-xs mt-1", isOwn ? "text-white/70" : "text-slate-500")}>
              (عُدّلت)
            </p>
          )}
        </div>

        {/* Message Time */}
        <span className="text-xs text-slate-500 mt-1">
          {new Date(message.created_date).toLocaleTimeString("ar-SA", {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </span>

        {/* Read Status */}
        {isOwn && message.read_by?.length > 0 && (
          <span className="text-xs text-slate-500">
            ✓ {message.read_by.length}
          </span>
        )}

        {/* Actions */}
        {showActions && isOwn && (
          <div className="flex gap-1 mt-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onEdit?.(message)}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-600 hover:bg-red-50"
              onClick={() => onDelete?.(message.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}