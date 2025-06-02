import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  TrendingUp,
  Leaf,
  MessageSquare,
  Settings,
  Menu,
  X,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: BarChart3, label: t('nav.dashboard'), path: '/' },
    { id: 'forecast', icon: TrendingUp, label: t('nav.forecast'), path: '/forecast' },
    { id: 'sustainability', icon: Leaf, label: t('nav.sustainability'), path: '/sustainability' },
    { id: 'community', icon: Users, label: t('nav.community'), path: '/community' },
    { id: 'feedback', icon: MessageSquare, label: t('nav.feedback'), path: '/feedback' },
    { id: 'profile', icon: Settings, label: t('nav.profile'), path: '/profile' },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-background/80 backdrop-blur-sm border"
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-background/95 backdrop-blur-sm border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-4">
          <div className="mb-8 pt-12 lg:pt-4">
            <h2 className="text-xl font-bold text-foreground">TrizzaOne</h2>
            <p className="text-sm text-muted-foreground">SmartOps Center</p>
          </div>
          
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left",
                    isActive && "bg-muted text-foreground"
                  )}
                  onClick={() => handleNavigation(item.path)}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
