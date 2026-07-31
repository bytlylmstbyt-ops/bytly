import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Images, Plus, X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

export default function PortfolioStep({ portfolioItems, setPortfolioItems }) {
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const addItem = () => {
    setPortfolioItems([...portfolioItems, { title: "", description: "", images: [] }]);
  };

  const removeItem = (index) => {
    setPortfolioItems(portfolioItems.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setPortfolioItems(portfolioItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleImageUpload = async (index, e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";
    if (!files.length) return;

    setUploadingIndex(index);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      setPortfolioItems(portfolioItems.map((item, i) =>
        i === index ? { ...item, images: [...item.images, ...uploadedUrls] } : item
      ));
    } catch (err) {
      toast.error("تعذر رفع الصورة. حاول مرة أخرى.");
      console.error("Portfolio upload error:", err);
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeImage = (itemIndex, imageIndex) => {
    setPortfolioItems(portfolioItems.map((item, i) =>
      i === itemIndex
        ? { ...item, images: item.images.filter((_, j) => j !== imageIndex) }
        : item
    ));
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Images className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">اعرض أعمالك السابقة</p>
          <p>أضف صوراً لمشاريعك السابقة مع وصف مختصر لكل عمل لتعزيز ثقة العملاء بخبرتك. هذه الخطوة اختيارية لكنها موصى بها بشدة.</p>
        </div>
      </div>

      {portfolioItems.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Images className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm mb-4">لم تضف أي أعمال بعد. ابدأ الآن لتعزيز ملفك!</p>
        </div>
      )}

      {portfolioItems.map((item, index) => (
        <div key={index} className="border rounded-xl p-4 space-y-3 relative">
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="absolute top-3 left-3 p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-2">
            <Label>عنوان العمل</Label>
            <Input
              value={item.title}
              onChange={(e) => updateItem(index, "title", e.target.value)}
              placeholder="مثال: تصميم فيلا سكنية - الرياض"
            />
          </div>

          <div className="space-y-2">
            <Label>وصف مختصر</Label>
            <Textarea
              value={item.description}
              onChange={(e) => updateItem(index, "description", e.target.value)}
              placeholder="اكتب وصفاً مختصراً عن هذا العمل..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>صور العمل</Label>
            {item.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {item.images.map((img, imgIndex) => (
                  <div key={imgIndex} className="relative group">
                    <img src={img} alt="" className="w-full h-24 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeImage(index, imgIndex)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg py-4 cursor-pointer hover:border-[#C9A66B] transition-colors ${uploadingIndex === index ? "pointer-events-none" : ""}`}>
              {uploadingIndex === index ? (
                <>
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  <span className="text-sm text-slate-500">جارٍ الرفع...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">رفع صور</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImageUpload(index, e)}
                disabled={uploadingIndex !== null}
              />
            </label>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        className="w-full border-dashed gap-2"
      >
        <Plus className="w-4 h-4" />
        إضافة عمل سابق
      </Button>
    </div>
  );
}