import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  User, Mail, Phone, MapPin, Camera, Save, 
  Loader2, Shield, Bell, Lock, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function Settings() {
  const { t, language } = useLanguage();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    in_app_notifications: true,
    notification_preferences: {
      project_updates: true,
      contract_updates: true,
      payment_reminders: true,
      milestone_reminders: true,
      new_proposals: true,
      deadline_reminders: true,
      system_notifications: true,
      dispute_updates: true,
      new_messages: true,
      review_requests: true
    }
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const [engineerData, clientData] = await Promise.all([
      base44.entities.Engineer.filter({ email: currentUser.email }),
      base44.entities.Client.filter({ email: currentUser.email })
    ]);

    if (engineerData.length > 0) {
      setUserType("engineer");
      setProfile(engineerData[0]);
      setFormData(engineerData[0]);
    } else if (clientData.length > 0) {
      setUserType("client");
      setProfile(clientData[0]);
      setFormData(clientData[0]);
    }

    // Load notification settings
    const notifSettings = await base44.entities.NotificationSettings.filter({
      user_email: currentUser.email
    });
    
    if (notifSettings.length > 0) {
      setNotificationSettings({
        email_notifications: notifSettings[0].email_notifications ?? true,
        in_app_notifications: notifSettings[0].in_app_notifications ?? true,
        notification_preferences: notifSettings[0].notification_preferences || {
          project_updates: true,
          contract_updates: true,
          payment_reminders: true,
          milestone_reminders: true,
          new_proposals: true,
          deadline_reminders: true,
          system_notifications: true,
          dispute_updates: true,
          new_messages: true,
          review_requests: true
        }
      });
    }

    setIsLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSaving(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleInputChange("profile_image", file_url);
    setIsSaving(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const entityType = userType === "engineer" ? "Engineer" : "Client";
      await base44.entities[entityType].update(profile.id, formData);
      
      // Save notification settings
      const existingSettings = await base44.entities.NotificationSettings.filter({
        user_email: user.email
      });
      
      if (existingSettings.length > 0) {
        await base44.entities.NotificationSettings.update(existingSettings[0].id, notificationSettings);
      } else {
        await base44.entities.NotificationSettings.create({
          user_email: user.email,
          ...notificationSettings
        });
      }
      
      toast.success(t('settings.profile.saveSuccess'));
    } catch (error) {
      console.error("Error:", error);
      toast.error(t('settings.profile.saveError'));
    } finally {
      setIsSaving(false);
      loadUserData();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4a574]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]">{t('settings.title')}</h1>
          <p className="text-slate-500">{t('settings.subtitle')}</p>
        </motion.div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              {t('settings.tabs.profile')}
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              {t('settings.tabs.security')}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              {t('settings.tabs.notifications')}
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              {t('settings.tabs.email')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>{t('settings.profile.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                      <AvatarImage src={formData.profile_image} />
                      <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#d4a574] text-white text-2xl">
                        {formData.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#d4a574] text-white flex items-center justify-center cursor-pointer hover:bg-[#c9a227] transition-colors">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{formData.full_name}</h3>
                    <p className="text-slate-500">{formData.email}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">{t('settings.profile.fullName')}</Label>
                    <div className="relative">
                      <User className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`} />
                      <Input
                        id="full_name"
                        value={formData.full_name || ""}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        className={language === 'ar' ? 'pr-10' : 'pl-10'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('settings.profile.phone')}</Label>
                    <div className="relative">
                      <Phone className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`} />
                      <Input
                        id="phone"
                        value={formData.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className={language === 'ar' ? 'pr-10' : 'pl-10'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">{t('settings.profile.country')}</Label>
                    <div className="relative">
                      <MapPin className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`} />
                      <Input
                        id="country"
                        value={formData.country || ""}
                        onChange={(e) => handleInputChange("country", e.target.value)}
                        className={language === 'ar' ? 'pr-10' : 'pl-10'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">{t('settings.profile.city')}</Label>
                    <Input
                      id="city"
                      value={formData.city || ""}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                    />
                  </div>
                </div>

                {userType === "engineer" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="specialization">{t('settings.profile.specialization')}</Label>
                      <Input
                        id="specialization"
                        value={formData.specialization || ""}
                        onChange={(e) => handleInputChange("specialization", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">{t('settings.profile.bio')}</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio || ""}
                        onChange={(e) => handleInputChange("bio", e.target.value)}
                        rows={4}
                      />
                    </div>
                  </>
                )}

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full md:w-auto bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin ml-2" />
                      {t('settings.profile.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 ml-2" />
                      {t('settings.profile.saveChanges')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>{t('settings.security.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Lock className="w-5 h-5 text-slate-600" />
                    <h3 className="font-medium">{t('settings.security.changePassword')}</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">
                    {t('settings.security.changePasswordDesc')}
                  </p>
                  <Button variant="outline">{t('settings.security.changePassword')}</Button>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-slate-600" />
                      <div>
                        <h3 className="font-medium">{t('settings.security.twoFactor')}</h3>
                        <p className="text-sm text-slate-500">{t('settings.security.twoFactorDesc')}</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>{t('settings.notifications.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <h3 className="font-medium">{t('settings.notifications.inApp')}</h3>
                    <p className="text-sm text-slate-500">{t('settings.notifications.inAppDesc')}</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.in_app_notifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ 
                      ...prev, 
                      in_app_notifications: checked 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <h3 className="font-medium">{t('settings.notifications.email')}</h3>
                    <p className="text-sm text-slate-500">{t('settings.notifications.emailDesc')}</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.email_notifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ 
                      ...prev, 
                      email_notifications: checked 
                    }))}
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">{t('settings.notifications.customize')}</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'project_updates', label: t('settings.notifications.types.projectUpdates') },
                      { key: 'contract_updates', label: t('settings.notifications.types.contractUpdates') },
                      { key: 'payment_reminders', label: t('settings.notifications.types.paymentReminders') },
                      { key: 'milestone_reminders', label: t('settings.notifications.types.milestoneReminders') },
                      { key: 'new_proposals', label: t('settings.notifications.types.newProposals') },
                      { key: 'deadline_reminders', label: t('settings.notifications.types.deadlineReminders') },
                      { key: 'dispute_updates', label: t('settings.notifications.types.disputeUpdates') },
                      { key: 'new_messages', label: t('settings.notifications.types.newMessages') },
                      { key: 'review_requests', label: t('settings.notifications.types.reviewRequests') },
                      { key: 'system_notifications', label: t('settings.notifications.types.systemNotifications') }
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                        <span className="text-sm">{item.label}</span>
                        <Switch 
                          checked={notificationSettings.notification_preferences[item.key]}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({ 
                            ...prev, 
                            notification_preferences: {
                              ...prev.notification_preferences,
                              [item.key]: checked
                            }
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#C9A66B]" />
                  {t('settings.emailSettings.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{t('settings.emailSettings.enableAlerts')}</p>
                      <p className="text-sm text-slate-500">{t('settings.emailSettings.enableAlertsDesc')}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.email_notifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ 
                      ...prev, 
                      email_notifications: checked 
                    }))}
                  />
                </div>

                {user?.role === 'admin' && (
                  <div className="p-5 rounded-lg border-2 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6B5D4F] to-[#C9A66B] flex items-center justify-center">
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <p className="font-semibold text-amber-900">{t('settings.emailSettings.adminEmail')}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-amber-300 mb-4">
                      <p className="text-sm text-slate-600 mb-2">{t('settings.emailSettings.adminEmailUsed')}</p>
                      <p className="font-mono text-[#6B5D4F] font-bold text-lg">info@mybytly.com</p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-slate-700 font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {t('settings.emailSettings.enabledTypes')}
                      </p>
                      <ul className="space-y-2 text-sm text-slate-600 mr-6">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A66B]"></span>
                          {t('settings.emailSettings.newEngineer')}
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A66B]"></span>
                          {t('settings.emailSettings.certificateUpload')}
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A66B]"></span>
                          {t('settings.emailSettings.newChatbot')}
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">{t('settings.emailSettings.emailIdentity')}</p>
                      <p className="text-blue-700">
                        {t('settings.emailSettings.emailIdentityDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-[#1a1a2e] to-[#d4a574] text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin ml-2" />
                      {t('settings.profile.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 ml-2" />
                      {t('settings.profile.saveChanges')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}