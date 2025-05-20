
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BarChart3, MessageCircle, Home, Leaf, Menu } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  activeItem: string;
  setActiveItem: (item: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, 
  setCollapsed, 
  activeItem, 
  setActiveItem 
}) => {
  const { t } = useTranslation();

  const navigationItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: Home },
    { id: 'forecast', label: t('nav.forecast'), icon: BarChart3 },
    { id: 'sustainability', label: t('nav.sustainability'), icon: Leaf },
    { id: 'feedback', label: t('nav.feedback'), icon: MessageCircle },
  ];

  return (
    <div 
      className={cn(
        'h-screen bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center h-16 px-4 border-b border-border">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {!collapsed && (
          <div className="ml-2 flex items-center flex-1">
            <div className="w-8 h-8 rounded-full bg-mintGreen flex items-center justify-center">
              <span className="font-bold text-navy">T1</span>
            </div>
            <span className="ml-2 font-semibold text-lg">TrizzaOne</span>
          </div>
        )}
      </div>
      
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Button
                  variant={activeItem === item.id ? "default" : "ghost"}
                  className={cn(
                    'w-full justify-start',
                    activeItem === item.id ? 'bg-mintGreen hover:bg-mintGreen/90 text-navy' : '',
                    collapsed ? 'justify-center px-0' : 'px-3'
                  )}
                  onClick={() => setActiveItem(item.id)}
                >
                  <Icon className={cn('h-5 w-5', collapsed ? 'mx-auto' : 'mr-2')} />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-border">
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center">
            &copy; 2025 TrizzaOne
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
