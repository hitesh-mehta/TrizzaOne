
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import LanguageSelector from '@/components/settings/LanguageSelector';
import ThemeToggle from '@/components/settings/ThemeToggle';
import { LogOut, User, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";

interface NavbarProps {
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        // Get session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error fetching session:", sessionError);
          return;
        }
        
        if (!sessionData.session?.user) return;
        
        // Set email from auth
        setUserEmail(sessionData.session.user.email || '');
        
        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', sessionData.session.user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else if (profileData) {
          setFirstName(profileData.first_name || '');
          setLastName(profileData.last_name || '');
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getUserInfo();
  }, []);

  // Get initials from first and last name
  const getNameInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (lastName) {
      return lastName.substring(0, 2).toUpperCase();
    }
    // Fallback to email initials if no name is set
    if (!userEmail) return 'T1';
    const emailPart = userEmail.split('@')[0];
    if (emailPart.length >= 2) {
      return emailPart.substring(0, 2).toUpperCase();
    }
    return emailPart.charAt(0).toUpperCase() + '1';
  };
  
  // Get display name
  const getDisplayName = () => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    return userEmail;
  };

  const handleUpdateProfile = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        throw new Error('No authenticated user found');
      }

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: sessionData.session.user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      setShowProfile(false);
    } catch (error: any) {
      console.error('Profile update failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-16 border-b border-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center">
        {/* Left side - empty for now */}
      </div>
      
      <div className="flex items-center space-x-2">
        <LanguageSelector isInNavbar />
        <ThemeToggle isInNavbar />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-mintGreen text-white font-semibold">
                {isLoading ? '...' : getNameInitials()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
            <div className="flex flex-col space-y-1 p-2">
              <p className="font-medium leading-none text-popover-foreground">{isLoading ? 'Loading...' : getDisplayName()}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            
            <Dialog open={showProfile} onOpenChange={setShowProfile}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-popover-foreground">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('nav.profile')}</span>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="bg-background border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Profile Settings</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Update your profile information here.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-first-name" className="text-foreground">First Name</Label>
                      <Input
                        id="profile-first-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-last-name" className="text-foreground">Last Name</Label>
                      <Input
                        id="profile-last-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email" className="text-foreground">Email</Label>
                    <Input
                      id="profile-email"
                      value={userEmail}
                      disabled
                      className="bg-muted border-border text-muted-foreground"
                    />
                  </div>
                  <Button 
                    onClick={handleUpdateProfile} 
                    className="w-full"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Updating...' : 'Update Profile'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-popover-foreground">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('nav.settings')}</span>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="bg-background border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Application Settings</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Customize your app preferences.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-foreground">Language</Label>
                    <LanguageSelector />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Theme</Label>
                    <ThemeToggle />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-popover-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('nav.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Navbar;
