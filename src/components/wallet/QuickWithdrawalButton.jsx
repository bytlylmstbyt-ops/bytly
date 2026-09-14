import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Wallet2, Zap } from "lucide-react";
import WithdrawalForm from "./WithdrawalForm";

export default function QuickWithdrawalButton({ engineer, onSuccess }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white gap-2 shadow-md"
        onClick={() => setOpen(true)}
      >
        <Zap className="w-4 h-4" />
        سحب الأرباح
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#4A3F35]">
              <Wallet2 className="w-5 h-5 text-[#C9A66B]" />
              طلب سحب الأرباح
            </DialogTitle>
            <DialogDescription>
              الرصيد المتاح للسحب: {engineer?.available_balance?.toLocaleString("ar-SA") || 0} ريال
            </DialogDescription>
          </DialogHeader>
          <WithdrawalForm
            engineer={engineer}
            onSuccess={() => {
              if (onSuccess) onSuccess();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}