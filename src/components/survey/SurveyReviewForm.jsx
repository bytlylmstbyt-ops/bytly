import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Star, Send } from 'lucide-react';

export default function SurveyReviewForm({ requestId, surveyorId, surveyorName, clientId, onSubmitted, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [qualityRating, setQualityRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (rating === 0) { setError('يرجى اختيار تقييم عام'); return; }
    setSubmitting(true);
    setError('');
    try {
      await base44.functions.invoke('surveyEngine', {
        action: 'review',
        request_id: requestId,
        surveyor_id: surveyorId,
        client_id: clientId,
        rating,
        quality_rating: qualityRating,
        delivery_rating: deliveryRating,
        communication_rating: communicationRating,
        comment
      });
      onSubmitted?.();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const StarRow = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} type="button" onClick={() => onChange(s)} className="p-0.5">
            <Star className={`w-4 h-4 ${s <= value ? 'fill-[#C9A66B] text-[#C9A66B]' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-[#FDF8F0] to-white border border-[#C9A66B]/30 rounded-lg p-4 space-y-4">
      <div className="text-center">
        <h4 className="font-bold text-[#4A3F35]">قيّم أداء المساح</h4>
        <p className="text-xs text-gray-500 mt-1">{surveyorName}</p>
      </div>

      {/* Overall Rating */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-gray-600">التقييم العام</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(s => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHoveredStar(s)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setRating(s)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star className={`w-8 h-8 ${s <= (hoveredStar || rating) ? 'fill-[#C9A66B] text-[#C9A66B]' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="text-sm font-bold text-[#C9A66B]">
            {rating === 1 ? 'سيئ' : rating === 2 ? 'مقبول' : rating === 3 ? 'جيد' : rating === 4 ? 'جيد جداً' : 'ممتاز'}
          </span>
        )}
      </div>

      {/* Detailed Ratings */}
      <div className="space-y-2 bg-white rounded-lg p-3 border border-gray-100">
        <StarRow label="دقة الرفع المساحي" value={qualityRating} onChange={setQualityRating} />
        <StarRow label="جودة الملفات المخرجة" value={deliveryRating} onChange={setDeliveryRating} />
        <StarRow label="الالتزام بالوقت والتواصل" value={communicationRating} onChange={setCommunicationRating} />
      </div>

      {/* Comment */}
      <Input
        placeholder="اكتب تعليقك عن تجربتك مع المساح (اختياري)..."
        value={comment}
        onChange={e => setComment(e.target.value)}
        className="text-sm"
      />

      {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={submit} disabled={submitting || rating === 0} className="flex-1 bg-[#4A3F35] hover:bg-[#3A2F25] text-white gap-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          إرسال التقييم
        </Button>
        {onClose && (
          <Button variant="outline" onClick={onClose} className="gap-1">لاحقاً</Button>
        )}
      </div>
    </div>
  );
}