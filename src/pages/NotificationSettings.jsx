import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Bell, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export default function NotificationSettings() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    notification_preferences: {
      project_updates: true,
      contract_updates: true,
      payment_reminders: true,
      milestone_reminders: true,
      new_proposals: true,
      deadline_reminders: true,
      system_notifications: true
    },
    email_notifications: true,
    reminder_timing: {
      before_deadline_days: 3,
      payment_reminder_days: 5
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const [userSettings] = await base44.entities.NotificationSettings.filter({
      user_email: currentUser.email
    });

    if (userSettings) {
      setSettings({
        notification_preferences: userSettings.notification_preferences || settings.notification_preferences,
        email_notifications: userSettings.email_notifications ?? true,
        reminder_timing: userSettings.reminder_timing || settings.reminder_timing
      });
    }

    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);

    try {
      const [existingSettings] = await base44.entities.NotificationSettings.filter({
        user_email: user.email
      });

      if (existingSettings) {
        await base44.entities.NotificationSettings.update(existingSettings.id, {
          notification_preferences: settings.notification_preferences,
          email_notifications: settings.email_notifications,
          reminder_timing: settings.reminder_timing
        });
      } else {
        await base44.entities.NotificationSettings.create({
          user_email: user.email,
          notification_preferences: settings.notification_preferences,
          email_notifications: settings.email_notifications,
          reminder_timing: settings.reminder_timing
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("حدث خطأ أثناء حفظ الإعدادات");
    }

    setIsSaving(false);
  };

  const updatePreference = (key, value) => {
    setSettings({
      ...settings,
      notification_preferences: {
        ...settings.notification_preferences,
        [key]: value
      }
    });
  };

  const updateTiming = (key, value) => {
    setSettings({
      ...settings,
      reminder_timing: {
        ...settings.reminder_timing,
        [key]: parseInt(value) || 0
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A66B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#1a1a2e] flex items-center gap-3">
            <Bell className="w-8 h-8 text-[#C9A66B]" />
            إعدادات التنبيهات
          </h1>
          <p className="text-slate-600 mt-2">تخصيص تفضيلات التنبيهات والإشعارات</p>
        </motion.div>

        <div className="space-y-6">
          {/* Email Notifications Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>البريد الإلكتروني</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">إرسال تنبيهات عبر البريد الإلكتروني</Label>
                  <p className="text-sm text-slate-600 mt-1">
                    استقبال نسخة من التنبيهات على بريدك الإلكتروني
                  </p>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>أنواع التنبيهات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">تحديثات المشاريع</Label>
                  <p className="text-sm text-slate-600">تنبيهات عند تحديث حالة المشروع</p>
                </div>
                <Switch
                  checked={settings.notification_preferences.project_updates}
                  onCheckedChange={(checked) => updatePreference('project_updates', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">تحديثات العقود</Label>
                  <p className="text-sm text-slate-600">تنبيهات عند توقيع أو تعديل العقود</p>
                </div>
                <Switch
                  checked={settings.notification_preferences.contract_updates}
                  onCheckedChange={(checked) => updatePreference('contract_updates', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">تذكيرات الدفع</Label>
                  <p className="text-sm text-slate-600">تنبيهات عند اقتراب موعد الدفعات</p>
                </div>
                <Switch
                  checked={settings.notification_preferences.payment_reminders}
                  onCheckedChange={(checked) => updatePreference('payment_reminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">تذكيرات المراحل</Label>
                  <p className="text-sm text-slate-600">تنبيهات عند اقتراب موعد تسليم المراحل</p>
                </div>
                <Switch
                  checked={settings.notification_preferences.milestone_reminders}
                  onCheckedChange={(checked) => updatePreference('milestone_reminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">العروض الجديدة</Label>
                  <p className="text-sm text-slate-600">تنبيهات عند استلام عروض جديدة</p>
                </div>
                <Switch
                  checked={settings.notification_preferences.new_proposals}
                  onCheckedChange={(checked) => updatePreference('new_proposals', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">تذكيرات المواعيد النهائية</Label>
                  <p className="text-sm text-slate-600">تنبيهات عند اقتراب المواعيد النهائية</p>
                </div>
                <Switch
                  checked={settings.notification_preferences.deadline_reminders}
                  onCheckedChange={(checked) => updatePreference('deadline_reminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">تنبيهات النظام</Label>
                  <p className="text-sm text-slate-600">تحديثات وإشعارات النظام العامة</p>
                </div>
                <Switch
                  checked={settings.notification_preferences.system_notifications}
                  onCheckedChange={(checked) => updatePreference('system_notifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Timing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>توقيت التذكيرات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base mb-2 block">التذكير قبل الموعد النهائي</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.reminder_timing.before_deadline_days}
                    onChange={(e) => updateTiming('before_deadline_days', e.target.value)}
                    className="w-24"
                  />
                  <span className="text-slate-600">أيام قبل الموعد</span>
                </div>
              </div>

              <div>
                <Label className="text-base mb-2 block">تذكير الدفعات المستحقة</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.reminder_timing.payment_reminder_days}
                    onChange={(e) => updateTiming('payment_reminder_days', e.target.value)}
                    className="w-24"
                  />
                  <span className="text-slate-600">أيام قبل الاستحقاق</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white h-12"
          >
            {saved ? (
              <>
                <Check className="w-5 h-5 ml-2" />
                تم الحفظ بنجاح
              </>
            ) : isSaving ? (
              "جاري الحفظ..."
            ) : (
              <>
                <Save className="w-5 h-5 ml-2" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}