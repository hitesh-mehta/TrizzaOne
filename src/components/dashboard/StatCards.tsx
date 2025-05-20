
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Utensils, Zap, MessageSquare, Leaf } from 'lucide-react';

const StatCards: React.FC = () => {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('dashboard.foodWaste'),
      value: '8.2',
      unit: 'kg',
      change: '-12%',
      trend: 'positive', // positive means decreasing waste (good)
      icon: Utensils,
      color: 'text-coral',
      bgColor: 'bg-coral/10',
    },
    {
      title: t('dashboard.energySaved'),
      value: '15',
      unit: '%',
      change: '+3%',
      trend: 'positive',
      icon: Zap,
      color: 'text-mintGreen',
      bgColor: 'bg-mintGreen/10',
    },
    {
      title: t('dashboard.activeComplaints'),
      value: '3',
      unit: '',
      change: '-2',
      trend: 'positive', // positive means decreasing complaints (good)
      icon: MessageSquare,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: t('dashboard.sustainability'),
      value: '86',
      unit: '/100',
      change: '+4',
      trend: 'positive',
      icon: Leaf,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="neumorphic-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <div className="flex items-baseline mt-1">
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                  <span className="text-sm ml-1">{stat.unit}</span>
                </div>
                <div className="mt-1 flex items-center">
                  <span className={`text-xs ${stat.trend === 'positive' ? 'text-mintGreen' : 'text-coral'}`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">{t('dashboard.today')}</span>
                </div>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-full`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatCards;
