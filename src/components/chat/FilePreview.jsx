import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Image as ImageIcon, Download, Eye, X,
  CheckCircle, AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FilePreview({ attachment, onMarkOfficial, canMarkOfficial }) {
  const [showPreview, setShowPreview] = useState(false);

  const getFileIcon = (type) => {
    if (type?.includes('image')) return <ImageIcon className="w-5 h-5" />;
    if (type?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <FileText className="w-5 h-5" />;
  };

  const isImage = attachment.type?.includes('image');
  const isPDF = attachment.type?.includes('pdf') || attachment.name?.endsWith('.pdf');
  const isCAD = attachment.name?.match(/\.(dwg|dxf|dwf)$/i);

  return (
    <>
      <Card className="p-3 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getFileIcon(attachment.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.name}</p>
              <p className="text-xs text-slate-500">
                {(attachment.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {attachment.is_official && (
              <Badge className="bg-green-100 text-green-700 text-xs">
                <CheckCircle className="w-3 h-3 ml-1" />
                مستند رسمي
              </Badge>
            )}
            
            {(isImage || isPDF) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}

            <a href={attachment.url} download target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost">
                <Download className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>

        {canMarkOfficial && !attachment.is_official && (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2 text-xs"
            onClick={() => onMarkOfficial(attachment)}
          >
            وضع علامة كمستند رسمي
          </Button>
        )}
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{attachment.name}</span>
              <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[70vh]">
            {isImage && (
              <img
                src={attachment.url}
                alt={attachment.name}
                className="w-full h-auto rounded-lg"
              />
            )}
            
            {isPDF && (
              <iframe
                src={attachment.url}
                className="w-full h-[70vh] rounded-lg border"
                title={attachment.name}
              />
            )}

            {isCAD && (
              <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-lg">
                <FileText className="w-16 h-16 text-slate-400 mb-4" />
                <p className="text-sm text-slate-600 mb-2">ملف CAD - {attachment.name}</p>
                <a href={attachment.url} download>
                  <Button>
                    <Download className="w-4 h-4 ml-2" />
                    تحميل للمعاينة
                  </Button>
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}