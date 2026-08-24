import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function MarketContactModal({ entity, open, onClose }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    await base44.entities.Lead.create({
      name: `طلب عبر سوق المطورين`,
      notes: `طلب تواصل مع: ${entity.name} (${entity.entity_type === "developer" ? "مطور عقاري" : "مستثمر"}) - المنطقة: ${entity.region}\n\nعنوان الطلب: ${title}\n\nتفاصيل الطلب:\n${message}`,
      project_type: entity.project_types?.join("، ") || "",
      source: "other",
      status: "new",
    });

    setLoading(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    setTitle("");
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" dir="rtl">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle>تواصل مع {entity.name} عبر بيتلي</DialogTitle>
              <DialogDescription>
                <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2 text-sm">
                  <Shield className="w-4 h-4 shrink-0" />
                  لضمان حقوقك المالية وتوثيق العقود، يتم التواصل بإشراف منصة بيتلي فقط.
                </span>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <Label htmlFor="title" className="mb-2 block">عنوان الطلب أو المشروع</Label>
                <Input
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: تصميم مجمع سكني في الرياض"
                />
              </div>
              <div>
                <Label htmlFor="msg" className="mb-2 block">تفاصيل وميزانية المشروع التقريبية</Label>
                <Textarea
                  id="msg"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب هنا تفاصيل طلبك ليتم التنسيق مع المطور مباشرة..."
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-[#4a3c31] hover:bg-[#3a2e24]" disabled={loading}>
                  {loading ? "جاري الإرسال..." : "إرسال الطلب للمنصة"}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                  إلغاء
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
            <h3 className="text-lg font-bold text-[#4a3c31]">تم استلام طلبك بنجاح!</h3>
            <p className="text-sm text-muted-foreground">
              سيقوم فريق بيتلي بالتنسيق بينك وبين الجهة وإبلاغك بالتفاصيل قريباً.
            </p>
            <Button onClick={handleClose} className="w-full mt-2 bg-[#c9a66b] hover:bg-[#b8935a]">
              حسناً
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}