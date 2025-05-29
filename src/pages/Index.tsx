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
import Community from '@/components/dashboard/Community';
import Footer from '@/components/layout/Footer';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FoodModel3D from '@/components/3d/FoodModel3D';
import Predictions from '@/components/dashboard/Predictions';
import OrderHistory from '@/components/dashboard/OrderHistory';
import ProfileSettings from '@/components/settings/ProfileSettings';
import Botato from '@/components/chatbot/Botato';
import WelcomeTour from '@/components/tour/WelcomeTour';
import { useTour } from '@/hooks/useTour';
import { useIsMobile } from '@/hooks/use-mobile';
import { HelpCircle, Menu, X } from 'lucide-react';

// Import language configuration
import '@/i18n';

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showTour, startTour, closeTour, completeTour } = useTour();
  const isMobile = useIsMobile();
  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);

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
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  // Handle sidebar item selection on mobile
  const handleSidebarItemSelect = (item: string) => {
    setActiveItem(item);
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
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
      case 'community':
        return <Community />;
      case 'sustainability':
        return <Sustainability />;
      case 'feedback':
        return <Feedback />;
      case 'profile':
        return <ProfileSettings />;
      default:
        return <Dashboard />;
    }
  };

  // If still loading auth state, show a simple spinner
  if (isLoading && !showSplash) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full border-4 border-t-transparent border-mintGreen animate-spin"></div>
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
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-mintGreen/5 via-background to-coral/5"></div>
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="absolute top-10 sm:top-20 right-8 sm:right-32 opacity-20 sm:opacity-30 scale-50 sm:scale-75 animate-float -z-10">
                <FoodModel3D type="burger" rotate={true} size={80} />
              </div>
              <div className="absolute bottom-16 sm:bottom-32 left-4 sm:left-16 opacity-20 sm:opacity-30 scale-50 sm:scale-75 animate-bounce-slow -z-10">
                <FoodModel3D type="donut" rotate={true} size={60} />
              </div>
              <div className="absolute top-1/2 left-1/4 opacity-10 sm:opacity-20 scale-25 sm:scale-50 animate-pulse -z-10">
                <FoodModel3D type="pizza" rotate={true} size={50} />
              </div>
            </div>
            
            <Card className="w-full max-w-lg mx-auto backdrop-blur-md bg-background/95 border-mintGreen/20 shadow-2xl relative z-10">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-mintGreen to-coral flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
                  <span className="font-bold text-lg sm:text-2xl text-white">T1</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-foreground bg-gradient-to-r from-mintGreen to-coral bg-clip-text text-transparent">
                  {t('app.welcomeTitle')}
                </h1>
                <p className="mb-6 sm:mb-8 text-base sm:text-lg text-muted-foreground font-medium">
                  {t('app.welcomeDesc')}
                </p>
                <button 
                  onClick={() => navigate('/auth')}
                  className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-mintGreen to-coral text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-none outline-none focus:ring-2 focus:ring-mintGreen/50 text-sm sm:text-base"
                >
                  {t('auth.getStarted')} ✨
                </button>
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
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
          {/* Mobile overlay */}
          {isMobile && mobileSidebarOpen && (
            <div 
              className="mobile-overlay"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          {/* Mobile menu button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 lg:hidden bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          
          <div className={`${isMobile ? 'mobile-sidebar' : ''} ${isMobile && mobileSidebarOpen ? 'open' : ''}`}>
            <Sidebar 
              collapsed={isMobile ? false : sidebarCollapsed} 
              setCollapsed={setSidebarCollapsed}
              activeItem={activeItem}
              setActiveItem={handleSidebarItemSelect}
            />
          </div>
          
          <div className="flex flex-col flex-1 overflow-hidden">
            <Navbar onLogout={handleLogout} onNavigate={handleNavbarNavigation} />
            
            <div className="flex-1 overflow-auto bg-background">
              <div className="relative min-h-full flex flex-col">
                {/* 3D animation background - hidden on mobile for performance */}
                <div className="mobile-hidden absolute right-10 top-6 opacity-10 -z-20 pointer-events-none">
                  <FoodModel3D 
                    type={activeItem === 'dashboard' ? 'plate' : 
                          activeItem === 'sustainability' ? 'donut' : 
                          activeItem === 'order-history' ? 'burger' : 'burger'}
                    size={200}
                    rotate={true}
                  />
                </div>
                
                {/* Tour Button */}
                <div className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-50">
                  <Button
                    onClick={startTour}
                    variant="outline"
                    size="sm"
                    className="bg-background/80 backdrop-blur-sm border-mintGreen/50 hover:bg-mintGreen/10 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                  >
                    <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{t('tour.needTour')}</span>
                    <span className="sm:hidden">Help</span>
                  </Button>
                </div>
                
                <div className="flex-1 relative z-10">
                  {renderActiveContent()}
                </div>
                <Footer />
              </div>
            </div>
          </div>
          
          {/* Botato Chatbot */}
          <div data-tour="chatbot">
            <Botato 
              isOpen={chatbotOpen} 
              onToggle={() => setChatbotOpen(!chatbotOpen)} 
            />
          </div>
          
          {/* Welcome Tour */}
          <WelcomeTour 
            isOpen={showTour}
            onClose={closeTour}
            onComplete={completeTour}
          />
        </div>
      )}
    </ThemeProvider>
  );
};

export default Index;
