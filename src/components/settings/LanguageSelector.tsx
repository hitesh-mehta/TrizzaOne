
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  isInNavbar?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ isInNavbar = false }) => {
  const { t, i18n } = useTranslation();
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
  ];

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    localStorage.setItem('trizzaone_language', value);
  };

  const getCurrentLanguageName = () => {
    const currentLang = languages.find(lang => lang.code === i18n.language);
    return currentLang ? currentLang.name : 'English';
  };

  return isInNavbar ? (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-10 h-10 p-0 justify-center bg-transparent border-none">
        <Globe className="h-5 w-5" />
      </SelectTrigger>
      <SelectContent align="end" className="bg-background/95 backdrop-blur-sm border-mintGreen/20">
        {languages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            {language.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <div className="w-full max-w-xs">
      <p className="text-sm font-medium mb-2">{t('language.select')}</p>
      <Select value={i18n.language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={getCurrentLanguageName()} />
        </SelectTrigger>
        <SelectContent className="bg-background/95 backdrop-blur-sm border-mintGreen/20">
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              {language.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
