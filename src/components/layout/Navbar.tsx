
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LanguageSelector from '@/components/settings/LanguageSelector';
import ThemeToggle from '@/components/settings/ThemeToggle';
import { LogOut, User, Settings } from 'lucide-react';

interface NavbarProps {
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const { t } = useTranslation();
  const userEmail = JSON.parse(localStorage.getItem('trizzaone_user') || '{"email": "user@example.com"}').email;
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <div className="h-16 border-b border-border flex items-center justify-between px-4">
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
              <AvatarFallback className="bg-mintGreen text-navy">{userInitial}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col space-y-1 p-2">
              <p className="font-medium leading-none">{userEmail}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t('nav.settings')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Navbar;
