
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Leaf, 
  MessageSquare, 
  User,
  ChevronLeft,
  ChevronRight
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

  const menuItems = [
    {
      id: 'dashboard',
      icon: BarChart3,
      label: t('nav.dashboard'),
      tourId: 'dashboard'
    },
    {
      id: 'predictions',
      icon: TrendingUp,
      label: t('nav.predictions'),
      tourId: 'predictions'
    },
    {
      id: 'order-history',
      icon: Clock,
      label: t('nav.orderHistory')
    },
    {
      id: 'sustainability',
      icon: Leaf,
      label: t('nav.sustainability'),
      tourId: 'sustainability'
    },
    {
      id: 'feedback',
      icon: MessageSquare,
      label: t('nav.feedback')
    },
    {
      id: 'profile',
      icon: User,
      label: t('nav.profile')
    }
  ];

  return (
    <div className={cn(
      "h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out relative",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-slate-600 dark:text-slate-400" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-slate-600 dark:text-slate-400" />
        )}
      </button>

      {/* Logo/Header */}
      <div className="p-6">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-mintGreen to-coral flex items-center justify-center">
            <span className="font-bold text-white text-sm">T1</span>
          </div>
          {!collapsed && (
            <div className="ml-3">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Trizza One
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('facility.kitchen')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              data-tour={item.tourId}
              className={cn(
                "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                activeItem === item.id
                  ? "bg-gradient-to-r from-mintGreen/20 to-coral/20 text-mintGreen border border-mintGreen/30 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0",
                activeItem === item.id ? "text-mintGreen" : ""
              )} />
              {!collapsed && (
                <span className="ml-3 truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      {!collapsed && (
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gradient-to-r from-mintGreen/10 to-coral/10 rounded-lg p-4 border border-mintGreen/20">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-mintGreen to-coral flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {t('chatbot.assistant')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('chatbot.status')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
