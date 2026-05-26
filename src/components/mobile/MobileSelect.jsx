import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Check } from "lucide-react";

/**
 * MobileSelect — on mobile renders a bottom Drawer, on desktop a standard Select popover.
 *
 * Props:
 *   value, onValueChange, placeholder, label, options: [{ value, label }]
 *   triggerClassName, disabled
 */
export default function MobileSelect({
  value,
  onValueChange,
  placeholder = "اختر...",
  label,
  options = [],
  triggerClassName = "",
  disabled = false,
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  if (isMobile) {
    return (
      <>
        {/* Trigger button styled like SelectTrigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className={`flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${triggerClassName}`}
        >
          <span className={selectedLabel ? "text-foreground" : "text-muted-foreground"}>
            {selectedLabel || placeholder}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-50"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent dir="rtl">
            {label && (
              <DrawerHeader>
                <DrawerTitle className="text-right">{label}</DrawerTitle>
              </DrawerHeader>
            )}
            <div className="pb-6 px-4 space-y-1 max-h-[60vh] overflow-y-auto">
              {options.map((opt) => (
                <button
                  key={opt.value ?? "__null__"}
                  type="button"
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors ${
                    value === opt.value
                      ? "bg-[#C9A66B]/10 text-[#C9A66B] font-medium"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                  onClick={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <Check className="w-4 h-4 text-[#C9A66B]" />}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: standard shadcn Select
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value ?? "__null__"} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}