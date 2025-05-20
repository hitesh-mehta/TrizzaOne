
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from '@/hooks/useTheme';
import SplashScreen from '@/components/SplashScreen';
import LoginForm from '@/components/auth/LoginForm';
import LanguageSetupScreen from '@/components/settings/LanguageSetupScreen';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import Dashboard from '@/components/dashboard/Dashboard';
import Forecast from '@/components/dashboard/Forecast';
import Sustainability from '@/components/dashboard/Sustainability';
import Feedback from '@/components/dashboard/Feedback';

// Import language configuration
import '@/i18n';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');

  // Check localStorage for authentication and setup status
  useEffect(() => {
    const user = localStorage.getItem('trizzaone_user');
    const setup = localStorage.getItem('trizzaone_setup_complete');
    
    if (user) {
      setIsAuthenticated(true);
    }
    
    if (setup === 'true') {
      setSetupComplete(true);
    }
  }, []);

  // Handle login
  const handleLogin = () => {
    setIsAuthenticated(true);
  };
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('trizzaone_user');
    setIsAuthenticated(false);
  };
  
  // Handle setup completion
  const handleSetupComplete = () => {
    setSetupComplete(true);
  };
  
  // Render active content based on selected sidebar item
  const renderActiveContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return <Dashboard />;
      case 'forecast':
        return <Forecast />;
      case 'sustainability':
        return <Sustainability />;
      case 'feedback':
        return <Feedback />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
      
      {!showSplash && !isAuthenticated && (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <LoginForm onLogin={handleLogin} />
        </div>
      )}
      
      {!showSplash && isAuthenticated && !setupComplete && (
        <LanguageSetupScreen onComplete={handleSetupComplete} />
      )}
      
      {!showSplash && isAuthenticated && setupComplete && (
        <div className="flex h-screen overflow-hidden">
          <Sidebar 
            collapsed={sidebarCollapsed} 
            setCollapsed={setSidebarCollapsed}
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
          
          <div className="flex flex-col flex-1 overflow-hidden">
            <Navbar onLogout={handleLogout} />
            
            <div className="flex-1 overflow-auto">
              {renderActiveContent()}
            </div>
          </div>
        </div>
      )}
    </ThemeProvider>
  );
};

export default Index;
