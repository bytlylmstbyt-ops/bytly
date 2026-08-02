import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  MoreVertical, Eye, Pencil, CheckCircle2, XCircle, Pause, Play, Trash2,
  FileCheck, FileX, FolderGit2, ScrollText, Wallet, Send, History,
} from "lucide-react";
import ProviderDetailsDialog from "./ProviderDetailsDialog";
import ProviderRelatedDialog from "./ProviderRelatedDialog";

const STATUS_LABEL = { approved: "معتمد", pending: "معلق", rejected: "موقوف/مرفوض" };

export default function ProviderActionsMenu({
  provider, providerKey, nameField, isAdmin, onUpdate, onDelete,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [relatedTab, setRelatedTab] = useState(null);
  const [relatedOpen, setRelatedOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const hasAvailable = "is_available" in provider;
  const isActive = provider.status === "approved" && provider.is_available !== false;
  const isSuspended = provider.is_available === false;

  const patchAndToast = async (patch, msg) => {
    setBusy(true);
    try {
      const updated = await base44.entities[providerKey].update(provider.id, patch);
      onUpdate({ ...provider, ...patch });
      toast({ title: msg || "تم التحديث" });
    } catch (e) {
      toast({ variant: "destructive", title: "تعذّر التنفيذ", description: e.message });
    } finally { setBusy(false); }
  };

  const activate = () => patchAndToast(
    { status: "approved", verification_date: new Date().toISOString(), ...(hasAvailable ? { is_available: true } : {}) },
    "تم تفعيل الحساب"
  );
  const deactivate = () => patchAndToast({ status: "rejected" }, "تم إيقاف الحساب");
  const suspend = () => patchAndToast(
    hasAvailable ? { is_available: false } : { status: "rejected" },
    "تم التعليق المؤقت"
  );
  const reactivate = () => patchAndToast(
    isSuspended ? { is_available: true } : { status: "approved" },
    "تمت إعادة التفعيل"
  );
  const verify = (val) => patchAndToast(
    { is_verified: val, verification_date: val ? new Date().toISOString() : null },
    val ? "تم اعتماد التحقق" : "تم رفض التحقق"
  );

  const handleDelete = async () => {
    setBusy(true);
    try {
      await base44.entities[providerKey].delete(provider.id);
      onDelete(provider.id);
      toast({ title: "تم حذف الحساب" });
      setDeleteOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "تعذّر الحذف", description: e.message });
    } finally { setBusy(false); }
  };

  const openRelated = (tab) => { setRelatedTab(tab); setRelatedOpen(true); };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" disabled={busy}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setDetailsOpen(true)}>
            <Eye className="w-4 h-4 ml-2" /> عرض التفاصيل
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="w-4 h-4 ml-2" /> تعديل البيانات
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {isAdmin && provider.status !== "approved" && (
            <DropdownMenuItem onClick={activate}>
              <CheckCircle2 className="w-4 h-4 ml-2 text-green-600" /> تفعيل الحساب
            </DropdownMenuItem>
          )}
          {isAdmin && isActive && (
            <>
              <DropdownMenuItem onClick={deactivate}>
                <XCircle className="w-4 h-4 ml-2 text-red-600" /> إيقاف الحساب
              </DropdownMenuItem>
              <DropdownMenuItem onClick={suspend}>
                <Pause className="w-4 h-4 ml-2 text-amber-600" /> تعليق مؤقت
              </DropdownMenuItem>
            </>
          )}
          {isAdmin && (provider.status === "rejected" || isSuspended) && (
            <DropdownMenuItem onClick={reactivate}>
              <Play className="w-4 h-4 ml-2 text-green-600" /> إعادة التفعيل
            </DropdownMenuItem>
          )}
          {isAdmin && <DropdownMenuSeparator />}
          {isAdmin && !provider.is_verified && (
            <DropdownMenuItem onClick={() => verify(true)}>
              <FileCheck className="w-4 h-4 ml-2 text-green-600" /> اعتماد التحقق
            </DropdownMenuItem>
          )}
          {isAdmin && provider.is_verified && (
            <DropdownMenuItem onClick={() => verify(false)}>
              <FileX className="w-4 h-4 ml-2 text-amber-600" /> رفض التحقق
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openRelated("projects")}>
            <FolderGit2 className="w-4 h-4 ml-2" /> المشاريع المرتبطة
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openRelated("contracts")}>
            <ScrollText className="w-4 h-4 ml-2" /> العقود
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openRelated("payments")}>
            <Wallet className="w-4 h-4 ml-2" /> المدفوعات والمحفظة
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openRelated("activity")}>
            <History className="w-4 h-4 ml-2" /> سجل النشاط
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setNotifyOpen(true)}>
            <Send className="w-4 h-4 ml-2" /> إرسال إشعار / رسالة
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="w-4 h-4 ml-2" /> حذف الحساب
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ProviderDetailsDialog
        provider={provider} providerKey={providerKey} nameField={nameField}
        open={detailsOpen} onOpenChange={setDetailsOpen} editMode={false}
      />
      <ProviderDetailsDialog
        provider={provider} providerKey={providerKey} nameField={nameField}
        open={editOpen} onOpenChange={setEditOpen} editMode={true} onUpdated={onUpdate}
      />
      <ProviderRelatedDialog
        provider={provider} providerKey={providerKey} nameField={nameField}
        open={relatedOpen} onOpenChange={setRelatedOpen} initialTab={relatedTab}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد حذف الحساب</DialogTitle>
            <DialogDescription>
              سيتم حذف حساب «{provider[nameField]}» نهائيًا. لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={busy}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busy}>
              {busy ? "جارٍ الحذف..." : "تأكيد الحذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotifyDialog
        open={notifyOpen} onOpenChange={setNotifyOpen} provider={provider}
      />
    </>
  );
}

function NotifyDialog({ open, onOpenChange, provider }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const send = async () => {
    if (!title.trim() || !message.trim()) return;
    setBusy(true);
    try {
      await base44.entities.Notification.create({
        recipient_email: provider.email, title, message, type: "system",
        is_read: false, priority: "high",
      });
      if (sendEmail) {
        try {
          await base44.integrations.Core.SendEmail({
            to: provider.email, subject: `${title} - بايتلي`,
            body: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#6B5D4F">${title}</h2><p>${message}</p><hr style="border:none;border-top:1px solid #eee;margin-top:24px"><p style="color:#aaa;font-size:12px">بايتلي - منصة الهندسة والاستشارات</p></div>`,
          });
        } catch { /* best-effort */ }
      }
      toast({ title: "تم إرسال الإشعار بنجاح" });
      setTitle(""); setMessage(""); onOpenChange(false);
    } catch (e) {
      toast({ variant: "destructive", title: "تعذّر الإرسال", description: e.message });
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إرسال إشعار / رسالة</DialogTitle>
          <DialogDescription>سيصل الإشعار إلى {provider.email} داخل التطبيق{sendEmail ? " والبريد الإلكتروني" : ""}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>عنوان الإشعار</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الإشعار" />
          </div>
          <div>
            <Label>نص الرسالة</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="نص الرسالة" rows={4} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={sendEmail} onCheckedChange={setSendEmail} />
            إرسال نسخة عبر البريد الإلكتروني
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>إلغاء</Button>
          <Button onClick={send} disabled={busy || !title.trim() || !message.trim()}>
            {busy ? "جارٍ الإرسال..." : "إرسال"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}