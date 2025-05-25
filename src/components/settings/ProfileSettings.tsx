
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { User, Settings, Bell, Shield, Palette } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import { Switch } from "@/components/ui/switch";
import type { User as SupabaseUser } from '@supabase/supabase-js';

const ProfileSettings = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    avatar_url: ''
  });
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        setProfile({
          full_name: currentUser.user_metadata?.full_name || '',
          email: currentUser.email || '',
          avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || ''
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: t('error', 'Error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        }
      });

      if (error) throw error;

      toast({
        title: t('success', 'Success'),
        description: t('profileUpdated', 'Profile updated successfully'),
      });
    } catch (error: any) {
      toast({
        title: t('error', 'Error updating profile'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: t('success', 'Success'),
        description: t('passwordUpdated', 'Password updated successfully'),
      });
    } catch (error: any) {
      toast({
        title: t('error', 'Error updating password'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getUserInitials = () => {
    if (!profile.full_name && !profile.email) return 'U';
    const name = profile.full_name || profile.email;
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-mintGreen animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('nav.profile', 'Profile & Settings')}</h1>
        <p className="text-muted-foreground">{t('manageAccountSettings', 'Manage your account settings and preferences')}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('nav.profile', 'Profile')}
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('account', 'Account')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t('preferences', 'Preferences')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('notifications', 'Notifications')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profileInformation', 'Profile Information')}</CardTitle>
              <CardDescription>{t('updateProfileDesc', 'Update your account profile information')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20 border-2 border-mintGreen/20">
                  <AvatarImage 
                    src={profile.avatar_url} 
                    alt={profile.full_name || profile.email}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-mintGreen/10 text-mintGreen font-semibold text-lg">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="font-medium">{t('profilePicture', 'Profile Picture')}</h3>
                  <p className="text-sm text-muted-foreground">{t('profilePictureDesc', 'This will be displayed on your profile')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('auth.firstName', 'Full Name')}</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder={t('enterFullName', 'Enter your full name')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email', 'Email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">{t('avatarUrl', 'Avatar URL')}</Label>
                <Input
                  id="avatarUrl"
                  value={profile.avatar_url}
                  onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                  placeholder={t('enterAvatarUrl', 'Enter avatar URL')}
                />
              </div>

              <Button 
                onClick={handleProfileUpdate} 
                disabled={saving}
                className="bg-mintGreen hover:bg-mintGreen/90"
              >
                {saving ? t('saving', 'Saving...') : t('buttons.save', 'Save Changes')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('accountSecurity', 'Account Security')}</CardTitle>
              <CardDescription>{t('manageAccountSecurity', 'Manage your account security settings')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t('changePassword', 'Change Password')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t('currentPassword', 'Current Password')}</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder={t('enterCurrentPassword', 'Enter current password')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('newPassword', 'New Password')}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder={t('enterNewPassword', 'Enter new password')}
                    />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  disabled={saving}
                  onClick={() => {
                    const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement)?.value;
                    const newPassword = (document.getElementById('newPassword') as HTMLInputElement)?.value;
                    if (currentPassword && newPassword) {
                      handlePasswordChange(currentPassword, newPassword);
                    }
                  }}
                >
                  {t('updatePassword', 'Update Password')}
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium text-red-600">{t('dangerZone', 'Danger Zone')}</h3>
                <p className="text-sm text-muted-foreground">{t('dangerZoneDesc', 'Permanently delete your account and all associated data')}</p>
                <Button variant="destructive" size="sm">
                  {t('deleteAccount', 'Delete Account')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('preferences', 'Preferences')}</CardTitle>
              <CardDescription>{t('customizeAppearance', 'Customize your app appearance and language')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">{t('appearance', 'Appearance')}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('theme.dark', 'Theme')}</Label>
                    <p className="text-sm text-muted-foreground">{t('chooseTheme', 'Choose your preferred theme')}</p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">{t('language.select', 'Language')}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('interfaceLanguage', 'Interface Language')}</Label>
                    <p className="text-sm text-muted-foreground">{t('selectLanguageDesc', 'Choose your preferred language')}</p>
                  </div>
                  <LanguageSelector />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('notifications', 'Notification Settings')}</CardTitle>
              <CardDescription>{t('manageNotificationPrefs', 'Manage how you receive notifications')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('emailNotifications', 'Email Notifications')}</Label>
                    <p className="text-sm text-muted-foreground">{t('receiveEmailUpdates', 'Receive important updates via email')}</p>
                  </div>
                  <Switch
                    checked={notifications.email_notifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email_notifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('pushNotifications', 'Push Notifications')}</Label>
                    <p className="text-sm text-muted-foreground">{t('receivePushAlerts', 'Receive push notifications for alerts')}</p>
                  </div>
                  <Switch
                    checked={notifications.push_notifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push_notifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('marketingEmails', 'Marketing Emails')}</Label>
                    <p className="text-sm text-muted-foreground">{t('receiveMarketingUpdates', 'Receive promotional emails and updates')}</p>
                  </div>
                  <Switch
                    checked={notifications.marketing_emails}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, marketing_emails: checked })}
                  />
                </div>
              </div>

              <Button className="bg-mintGreen hover:bg-mintGreen/90">
                {t('saveNotificationSettings', 'Save Notification Settings')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileSettings;
