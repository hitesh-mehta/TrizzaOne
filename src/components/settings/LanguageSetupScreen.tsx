
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import LanguageSelector from './LanguageSelector';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun } from 'lucide-react';

interface LanguageSetupScreenProps {
  onComplete: () => void;
}

const LanguageSetupScreen: React.FC<LanguageSetupScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    setIsLoading(true);
    localStorage.setItem('trizzaone_setup_complete', 'true');
    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      onComplete();
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md neumorphic-card border-mintGreen/10">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t('language.select')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="py-4">
            <LanguageSelector />
          </div>
          
          <div className="py-4">
            <p className="text-sm font-medium mb-4">{t('theme.dark')}</p>
            <div className="flex justify-center space-x-4">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex-1 py-6"
              >
                <Sun className="mr-2 h-5 w-5" />
                {t('theme.light')}
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex-1 py-6"
              >
                <Moon className="mr-2 h-5 w-5" />
                {t('theme.dark')}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleContinue} 
            className="w-full bg-mintGreen hover:bg-mintGreen/90 text-navy" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-t-transparent border-navy rounded-full animate-spin mr-2"></div>
                <span>Loading...</span>
              </div>
            ) : (
              t('buttons.save')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LanguageSetupScreen;
