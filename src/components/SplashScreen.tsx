
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        onComplete();
      }, 500); // Fade out time
    }, 2500); // Show splash for 2.5 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 bg-navy flex items-center justify-center z-50 transition-opacity duration-500 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      <div className="text-center">
        <div className="mb-4 relative">
          <div className="h-24 w-24 md:h-32 md:w-32 mx-auto relative animate-scale-up">
            <div className="absolute inset-0 bg-mintGreen rounded-full opacity-20 animate-pulse-light"></div>
            <div className="absolute inset-3 bg-mintGreen rounded-full opacity-40 animate-pulse-light" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute inset-6 bg-mintGreen rounded-full opacity-60 animate-pulse-light" style={{ animationDelay: '1s' }}></div>
            <div className="absolute inset-9 bg-mintGreen rounded-full opacity-80 animate-pulse-light" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl md:text-3xl font-bold text-white">T1</span>
            </div>
          </div>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="h-1 w-16 bg-coral rounded animate-pulse-light"></div>
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mt-6">{t('app.name')}</h1>
        <p className="text-mintGreen mt-2 tracking-wide">{t('app.tagline')}</p>
      </div>
    </div>
  );
};

export default SplashScreen;
