
import React from 'react';
import { useTranslation } from 'react-i18next';
import FacilityMap from './FacilityMap';
import StatCards from './StatCards';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">{t('nav.dashboard')}</h2>
        <p className="text-muted-foreground">{t('dashboard.quickStats')}</p>
      </div>
      
      <StatCards />
      
      <FacilityMap />
    </div>
  );
};

export default Dashboard;
