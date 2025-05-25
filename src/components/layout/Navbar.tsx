
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, LogOut, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from '../settings/ThemeToggle';
import LanguageSelector from '../settings/LanguageSelector';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface NavbarProps {
  onLogout: () => void;
  onNavigate?: (item: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout, onNavigate }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        // Set avatar URL from user metadata or generate a default one
        const userAvatarUrl = currentUser.user_metadata?.avatar_url || 
                             currentUser.user_metadata?.picture ||
                             `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.email}`;
        setAvatarUrl(userAvatarUrl);
      }
    };

    getCurrentUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const userAvatarUrl = session.user.user_metadata?.avatar_url || 
                               session.user.user_metadata?.picture ||
                               `https://api.dicebear.com/7.x/initials/svg?seed=${session.user.email}`;
          setAvatarUrl(userAvatarUrl);
        } else {
          setUser(null);
          setAvatarUrl('');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || 
           user?.user_metadata?.name || 
           user?.email?.split('@')[0] || 
           'User';
  };

  const handleProfileClick = () => {
    if (onNavigate) {
      onNavigate('profile');
    }
  };

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-foreground">
            {t('app.dashboard', 'Dashboard')}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-coral">
              3
            </Badge>
          </Button>
          
          {/* Language Selector */}
          <LanguageSelector isInNavbar={true} />
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-mintGreen/20">
                  <AvatarImage 
                    src={avatarUrl} 
                    alt={getUserDisplayName()}
                    className="object-cover"
                    onError={() => {
                      // Fallback if image fails to load
                      setAvatarUrl('');
                    }}
                  />
                  <AvatarFallback className="bg-mintGreen/10 text-mintGreen font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background/95 backdrop-blur-sm border-mintGreen/20" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                <span>{t('nav.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('auth.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
