import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star, X, Send, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { toast } from "react-hot-toast";

export default function PreLaunchSurveyModal({ open, onClose, sourcePage = "home" }) {
  const { t, isRTL } = useLanguage();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    respondent_name: "",
    respondent_email: "",
    user_role: "",
    primary_need: "",
    biggest_challenge: "",
    platform_interest: "",
    concept_rating: 0,
    willing_to_pay: "",
    additional_comments: ""
  });

  const tr = (key) => t(`survey.${key}`);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!formData.user_role || !formData.platform_interest) {
      toast.error(tr("requiredFieldsError"));
      return;
    }

    setSubmitting(true);
    try {
      const user = await base44.auth.isAuthenticated() ? await base44.auth.me() : null;
      const payload = {
        ...formData,
        respondent_email: formData.respondent_email || user?.email || "",
        respondent_name: formData.respondent_name || user?.full_name || "",
        source_page: sourcePage,
        description: `استطلاع من ${formData.respondent_name || user?.full_name || "زائر"} - الدور: ${formData.user_role}`
      };

      await base44.entities.SurveyResponse.create(payload);
      toast.success(tr("thankYouMessage"));
      handleClose();
    } catch (error) {
      console.error("Survey submission error:", error);
      toast.error(tr("submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      respondent_name: "",
      respondent_email: "",
      user_role: "",
      primary_need: "",
      biggest_challenge: "",
      platform_interest: "",
      concept_rating: 0,
      willing_to_pay: "",
      additional_comments: ""
    });
    onClose();
  };

  const roleOptions = [
    { value: "homeowner", label: tr("roles.homeowner"), icon: "🏠" },
    { value: "investor", label: tr("roles.investor"), icon: "💼" },
    { value: "engineer", label: tr("roles.engineer"), icon: "📐" },
    { value: "contractor", label: tr("roles.contractor"), icon: "🏗️" },
    { value: "other", label: tr("roles.other"), icon: "👤" },
  ];

  const needOptions = [
    { value: "interior_design", label: tr("needs.interior_design"), icon: "🎨" },
    { value: "architecture", label: tr("needs.architecture"), icon: "🏛️" },
    { value: "civil_engineering", label: tr("needs.civil_engineering"), icon: "📏" },
    { value: "surveying", label: tr("needs.surveying"), icon: "📍" },
    { value: "building_permit", label: tr("needs.building_permit"), icon: "📋" },
    { value: "construction_tracking", label: tr("needs.construction_tracking"), icon: "🏗️" },
    { value: "other", label: tr("needs.other"), icon: "✨" },
  ];

  const interestOptions = [
    { value: "very_interested", label: tr("interest.very_interested") },
    { value: "interested", label: tr("interest.interested") },
    { value: "maybe", label: tr("interest.maybe") },
    { value: "not_interested", label: tr("interest.not_interested") },
  ];

  const paymentOptions = [
    { value: "yes", label: tr("payment.yes") },
    { value: "after_trial", label: tr("payment.after_trial") },
    { value: "depends", label: tr("payment.depends") },
    { value: "no", label: tr("payment.no") },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#1a1a2e]">
                {tr("title")}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                {tr("subtitle")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-[#C9A66B]" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Identity & Need */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-semibold text-[#1a1a2e] mb-3 block">
                {tr("userRoleQuestion")} <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange("user_role", opt.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right ${
                      formData.user_role === opt.value
                        ? "border-[#C9A66B] bg-amber-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-sm font-medium text-[#1a1a2e]">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-[#1a1a2e] mb-3 block">
                {tr("primaryNeedQuestion")}
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {needOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange("primary_need", opt.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right ${
                      formData.primary_need === opt.value
                        ? "border-[#C9A66B] bg-amber-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-sm font-medium text-[#1a1a2e]">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                disabled={!formData.user_role}
                className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
              >
                {tr("next")}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Challenges & Interest */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-semibold text-[#1a1a2e] mb-2 block">
                {tr("biggestChallengeQuestion")}
              </Label>
              <Textarea
                value={formData.biggest_challenge}
                onChange={(e) => handleChange("biggest_challenge", e.target.value)}
                placeholder={tr("biggestChallengePlaceholder")}
                rows={3}
                className="resize-none"
                autoComplete="off"
                enterKeyHint="next"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-[#1a1a2e] mb-3 block">
                {tr("platformInterestQuestion")} <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={formData.platform_interest}
                onValueChange={(v) => handleChange("platform_interest", v)}
                className="space-y-2"
              >
                {interestOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.value} id={`interest-${opt.value}`} />
                    <Label htmlFor={`interest-${opt.value}`} className="text-sm font-medium cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-semibold text-[#1a1a2e] mb-3 block">
                {tr("conceptRatingQuestion")}
              </Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleChange("concept_rating", star)}
                    className="p-1"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= formData.concept_rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                {tr("back")}
              </Button>
              <Button
                onClick={handleNext}
                disabled={!formData.platform_interest}
                className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
              >
                {tr("next")}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Contact & Comments */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-semibold text-[#1a1a2e] mb-3 block">
                {tr("willingToPayQuestion")}
              </Label>
              <RadioGroup
                value={formData.willing_to_pay}
                onValueChange={(v) => handleChange("willing_to_pay", v)}
                className="space-y-2"
              >
                {paymentOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.value} id={`payment-${opt.value}`} />
                    <Label htmlFor={`payment-${opt.value}`} className="text-sm font-medium cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-semibold text-[#1a1a2e] mb-2 block">
                {tr("additionalCommentsQuestion")}
              </Label>
              <Textarea
                value={formData.additional_comments}
                onChange={(e) => handleChange("additional_comments", e.target.value)}
                placeholder={tr("additionalCommentsPlaceholder")}
                rows={3}
                className="resize-none"
                autoComplete="off"
                enterKeyHint="next"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">{tr("nameLabel")}</Label>
                <Input
                  value={formData.respondent_name}
                  onChange={(e) => handleChange("respondent_name", e.target.value)}
                  placeholder={tr("namePlaceholder")}
                  autoComplete="name"
                  inputMode="text"
                  enterKeyHint="next"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">{tr("emailLabel")}</Label>
                <Input
                  type="email"
                  value={formData.respondent_email}
                  onChange={(e) => handleChange("respondent_email", e.target.value)}
                  placeholder={tr("emailPlaceholder")}
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="done"
                />
              </div>
            </div>

            <p className="text-xs text-slate-400">{tr("privacyNote")}</p>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                {tr("back")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {tr("submit")}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}