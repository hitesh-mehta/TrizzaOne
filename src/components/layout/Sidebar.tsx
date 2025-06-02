
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  LayoutDashboard, 
  Leaf, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  History,
  Users
} from 'lucide-react';

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
  const isMobile = useIsMobile();

  const menuItems = [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      tourId: 'dashboard'
    },
    {
      id: 'predictions',
      label: t('predictions.title'),
      icon: BarChart3,
      tourId: 'predictions'
    },
    {
      id: 'order-history',
      label: t('orderHistory.title'),
      icon: History,
    },
    {
      id: 'community',
      label: t('community.title'),
      icon: Users,
      tourId: 'community'
    },
    {
      id: 'sustainability',
      label: t('nav.sustainability'),
      icon: Leaf,
      tourId: 'sustainability'
    },
    {
      id: 'feedback',
      label: t('nav.feedback'),
      icon: MessageSquare,
    },
  ];

  return (
    <div className={cn(
      "bg-sidebar-background border-r border-sidebar-border h-full flex flex-col transition-all duration-300",
      isMobile ? "w-64" : (collapsed ? "w-16" : "w-64")
    )}>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-sidebar-border flex items-center justify-between">
        {(!collapsed || isMobile) && (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-mintGreen flex items-center justify-center">
              <span className="font-bold text-xs sm:text-sm text-navy">T1</span>
            </div>
            <span className="font-semibold text-sidebar-foreground text-sm sm:text-base">{t('app.name')}</span>
          </div>
        )}
        
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-sidebar-accent rounded-md transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-sidebar-foreground" />
            ) : (
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 text-sidebar-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4">
        <ul className="space-y-1 sm:space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveItem(item.id)}
                  data-tour={item.tourId}
                  className={cn(
                    "w-full flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg transition-colors text-left text-sm sm:text-base",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  {(!collapsed || isMobile) && (
                    <span className="truncate">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
