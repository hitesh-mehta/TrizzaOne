
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import SplashScreen from '@/components/SplashScreen';
import LanguageSetupScreen from '@/components/settings/LanguageSetupScreen';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import Dashboard from '@/components/dashboard/Dashboard';
import Sustainability from '@/components/dashboard/Sustainability';
import Feedback from '@/components/dashboard/Feedback';
import Footer from '@/components/layout/Footer';
import { useToast } from "@/components/ui/use-toast";
import FoodModel3D from '@/components/3d/FoodModel3D';
import Predictions from '@/components/dashboard/Predictions';
import OrderHistory from '@/components/dashboard/OrderHistory';

// Import language configuration
import '@/i18n';

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');

  // Check for authentication and setup status
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setIsLoading(false);
    });

    // Check if setup is complete
    const setup = localStorage.getItem('trizzaone_setup_complete');
    if (setup === 'true') {
      setSetupComplete(true);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: t('auth.logoutSuccess'),
        description: t('auth.logoutSuccessDesc'),
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: t('auth.logoutError'),
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // Handle setup completion
  const handleSetupComplete = () => {
    setSetupComplete(true);
    localStorage.setItem('trizzaone_setup_complete', 'true');
  };
  
  // Render active content based on selected sidebar item
  const renderActiveContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return <Dashboard />;
      case 'predictions':
        return <Predictions />;
      case 'order-history':
        return <OrderHistory />;
      case 'sustainability':
        return <Sustainability />;
      case 'feedback':
        return <Feedback />;
      default:
        return <Dashboard />;
    }
  };

  // If still loading auth state, show a simple spinner
  if (isLoading && !showSplash) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-mintGreen animate-spin"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
      
      {!showSplash && !session && (
        <div className="min-h-screen flex flex-col">
          <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-background via-purple-50/30 to-mintGreen/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,107,107,0.1),transparent_50%)]"></div>
            <div className="absolute -z-10 top-0 left-0 w-full h-full pointer-events-none">
              <div className="absolute top-10 right-40 opacity-60 scale-75 sm:scale-100 animate-float -z-10">
                <FoodModel3D type="burger" rotate={true} size={150} />
              </div>
              <div className="absolute bottom-20 left-10 opacity-60 scale-75 sm:scale-100 animate-bounce-slow -z-10">
                <FoodModel3D type="donut" rotate={true} size={130} />
              </div>
              <div className="absolute top-1/2 left-1/4 opacity-40 scale-50 animate-pulse -z-10">
                <FoodModel3D type="pizza" rotate={true} size={100} />
              </div>
            </div>
            
            <div className="text-center max-w-md mx-auto glass-card p-8 rounded-xl backdrop-blur-md bg-background/90 border border-mintGreen/30 shadow-2xl transform hover:scale-105 transition-all duration-300 relative z-10">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-mintGreen to-coral flex items-center justify-center mb-6 shadow-lg animate-pulse">
                <span className="font-bold text-3xl text-white">T1</span>
              </div>
              <h1 className="text-5xl font-bold mb-4 text-foreground animate-fade-in">
                {t('app.welcomeTitle')}
              </h1>
              <p className="mb-8 text-lg text-muted-foreground animate-fade-in delay-100 font-medium">{t('app.welcomeDesc')}</p>
              <button 
                onClick={() => navigate('/auth')}
                className="px-8 py-4 bg-gradient-to-r from-mintGreen to-coral text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 animate-fade-in delay-200"
              >
                {t('auth.getStarted')} ✨
              </button>
            </div>
          </div>
          <Footer />
        </div>
      )}
      
      {!showSplash && session && !setupComplete && (
        <LanguageSetupScreen onComplete={handleSetupComplete} />
      )}
      
      {!showSplash && session && setupComplete && (
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
              <div className="relative min-h-full flex flex-col">
                {/* 3D animation background - now with lower z-index */}
                <div className="absolute right-10 top-6 opacity-10 -z-20 pointer-events-none">
                  <FoodModel3D 
                    type={activeItem === 'dashboard' ? 'plate' : 
                          activeItem === 'sustainability' ? 'donut' : 
                          activeItem === 'order-history' ? 'burger' : 'burger'}
                    size={200}
                    rotate={true}
                  />
                </div>
                <div className="flex-1 relative z-10">
                  {renderActiveContent()}
                </div>
                <Footer />
              </div>
            </div>
          </div>
        </div>
      )}
    </ThemeProvider>
  );
};

export default Index;
