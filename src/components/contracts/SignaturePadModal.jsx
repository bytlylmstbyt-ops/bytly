import React, { useRef, useState, useEffect } from "react";
import { PenLine, Trash2, CheckCircle2, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";

/**
 * SignaturePadModal
 * Props:
 *   party       - "client" | "engineer"
 *   contractNum - string رقم العقد
 *   onConfirm   - fn(dataUrl) → void  (يُستدعى بعد التأكيد)
 *   onCancel    - fn()
 */
export default function SignaturePadModal({ party, contractNum, onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  const label = party === "client" ? "العميل" : "المهندس";

  // ضبط حجم canvas عند الفتح
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function startDraw(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
    setHasStrokes(true);
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw(e) {
    e.preventDefault();
    setDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  }

  async function handleConfirm() {
    if (!hasStrokes || !agreed) return;
    setSaving(true);
    const dataUrl = canvasRef.current.toDataURL("image/png");
    await onConfirm(dataUrl);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* رأس */}
        <div className="bg-gradient-to-l from-[#4A3F35] to-[#6B5D4F] text-white px-5 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenLine className="w-5 h-5 text-[#C9A66B]" />
            <div>
              <p className="font-bold text-sm">التوقيع الإلكتروني — {label}</p>
              <p className="text-white/60 text-xs">عقد رقم: {contractNum || "—"}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* تعليمات */}
          <p className="text-xs text-slate-500 text-center">
            ارسم توقيعك داخل المنطقة أدناه باستخدام الماوس أو إصبعك
          </p>

          {/* لوحة التوقيع */}
          <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden" style={{ height: 180 }}>
            <canvas
              ref={canvasRef}
              className="w-full h-full touch-none cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            {!hasStrokes && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-slate-300 text-sm font-medium select-none">✍ ضع توقيعك هنا</p>
              </div>
            )}
            {/* زر مسح */}
            {hasStrokes && (
              <button
                onClick={clearCanvas}
                className="absolute top-2 left-2 bg-white border border-slate-200 text-slate-500 hover:text-red-500 p-1.5 rounded-lg shadow-sm transition-colors"
                title="مسح التوقيع"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* إشعار قانوني + خانة الموافقة */}
          <div
            onClick={() => setAgreed(a => !a)}
            className={`cursor-pointer rounded-xl border-2 p-3 transition-colors ${agreed ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${agreed ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                {agreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                أقرّ بأن توقيعي الإلكتروني أعلاه يُعدّ موافقة قانونية ملزمة على جميع بنود هذا العقد،
                وأن هذه العملية موثقة بالتاريخ والوقت <span className="font-semibold text-slate-700">{moment().format("DD/MM/YYYY - HH:mm")}</span> في سجل الامتثال.
              </p>
            </div>
          </div>

          {/* أزرار */}
          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              disabled={!hasStrokes || !agreed || saving}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 gap-2"
            >
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> جارٍ الحفظ...</>
                : <><Shield className="w-4 h-4" /> تأكيد التوقيع وتوثيقه</>
              }
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">إلغاء</Button>
          </div>
        </div>
      </div>
    </div>
  );
}