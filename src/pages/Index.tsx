
import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Dashboard from '@/components/dashboard/Dashboard';
import Forecast from '@/components/dashboard/Forecast';
import Sustainability from '@/components/dashboard/Sustainability';
import Community from '@/components/dashboard/Community';
import Feedback from '@/components/dashboard/Feedback';
import ProfileSettings from '@/components/settings/ProfileSettings';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import SplashScreen from '@/components/SplashScreen';
import WelcomeTour from '@/components/tour/WelcomeTour';
import { useTour } from '@/hooks/useTour';

const Index = () => {
  const { t } = useTranslation();
  const [showSplash, setShowSplash] = useState(true);
  const { showTour, startTour, closeTour, completeTour, skipTour } = useTour();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleLogout = () => {
    // Handle logout logic here if needed
    console.log('Logout requested');
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-blue-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,160,180,0.3),transparent_70%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(255,180,120,0.2),transparent_70%)]"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col">
        <Navbar onLogout={handleLogout} />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/forecast" element={<Forecast />} />
              <Route path="/sustainability" element={<Sustainability />} />
              <Route path="/community" element={<Community />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/profile" element={<ProfileSettings />} />
            </Routes>
          </main>
        </div>
        <Footer />
      </div>
      
      {showTour && (
        <WelcomeTour 
          isOpen={showTour}
          onClose={closeTour}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
    </div>
  );
};

export default Index;
