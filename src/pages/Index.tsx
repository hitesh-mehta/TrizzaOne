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
import { Card, CardContent } from "@/components/ui/card";
import FoodModel3D from '@/components/3d/FoodModel3D';
import Predictions from '@/components/dashboard/Predictions';
import OrderHistory from '@/components/dashboard/OrderHistory';
import ProfileSettings from '@/components/settings/ProfileSettings';

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

  // Handle navigation from navbar
  const handleNavbarNavigation = (item: string) => {
    setActiveItem(item);
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
      case 'profile':
      case 'settings':
        return <ProfileSettings />;
      default:
        return <Dashboard />;
    }
  };

  // If still loading auth state, show a simple spinner
  if (isLoading && !showSplash) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
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
        <div className="min-h-screen flex flex-col bg-background">
          <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-mintGreen/5 via-background to-coral/5"></div>
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="absolute top-20 right-32 opacity-30 scale-75 animate-float -z-10">
                <FoodModel3D type="burger" rotate={true} size={120} />
              </div>
              <div className="absolute bottom-32 left-16 opacity-30 scale-75 animate-bounce-slow -z-10">
                <FoodModel3D type="donut" rotate={true} size={100} />
              </div>
              <div className="absolute top-1/2 left-1/4 opacity-20 scale-50 animate-pulse -z-10">
                <FoodModel3D type="pizza" rotate={true} size={80} />
              </div>
            </div>
            
            <Card className="w-full max-w-lg mx-auto backdrop-blur-md bg-background/95 border-mintGreen/20 shadow-2xl relative z-10">
              <CardContent className="p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-mintGreen to-coral flex items-center justify-center mb-6 shadow-lg">
                  <span className="font-bold text-2xl text-white">T1</span>
                </div>
                <h1 className="text-4xl font-bold mb-4 text-foreground bg-gradient-to-r from-mintGreen to-coral bg-clip-text text-transparent">
                  {t('app.welcomeTitle')}
                </h1>
                <p className="mb-8 text-lg text-muted-foreground font-medium">
                  {t('app.welcomeDesc')}
                </p>
                <button 
                  onClick={() => navigate('/auth')}
                  className="w-full px-8 py-4 bg-gradient-to-r from-mintGreen to-coral text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-none outline-none focus:ring-2 focus:ring-mintGreen/50"
                >
                  {t('auth.getStarted')} ✨
                </button>
                <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                  <span>🏢 {t('facility.kitchen')}</span>
                  <span>📊 {t('nav.dashboard')}</span>
                  <span>🌱 {t('nav.sustainability')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <Footer />
        </div>
      )}
      
      {!showSplash && session && !setupComplete && (
        <LanguageSetupScreen onComplete={handleSetupComplete} />
      )}
      
      {!showSplash && session && setupComplete && (
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar 
            collapsed={sidebarCollapsed} 
            setCollapsed={setSidebarCollapsed}
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
          
          <div className="flex flex-col flex-1 overflow-hidden">
            <Navbar onLogout={handleLogout} onNavigate={handleNavbarNavigation} />
            
            <div className="flex-1 overflow-auto bg-background">
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
