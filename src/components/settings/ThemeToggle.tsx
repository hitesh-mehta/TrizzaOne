
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

interface ThemeToggleProps {
  isInNavbar?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isInNavbar = false }) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return isInNavbar ? (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 p-0"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  ) : (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">
        {theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="h-10 w-10"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
    </div>
  );
};

export default ThemeToggle;
