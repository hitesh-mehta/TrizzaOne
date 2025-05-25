
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '@/components/layout/Sidebar';
import Dashboard from '@/components/dashboard/Dashboard';
import Predictions from '@/components/dashboard/Predictions';
import OrderHistory from '@/components/dashboard/OrderHistory';
import Sustainability from '@/components/dashboard/Sustainability';
import Feedback from '@/components/dashboard/Feedback';
import ProfileSettings from '@/components/settings/ProfileSettings';
import Botato from '@/components/chatbot/Botato';

const Index = () => {
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');

  const renderContent = () => {
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
        return <ProfileSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />
      
      <main className="flex-1 overflow-auto relative">
        {renderContent()}
        {activeItem !== 'feedback' && <Botato />}
      </main>
    </div>
  );
};

export default Index;
