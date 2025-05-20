
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const Sustainability: React.FC = () => {
  const { t } = useTranslation();
  
  // Mock sustainability data
  const data = [
    { name: 'Food Usage', value: 45, color: '#FF6B6B' },
    { name: 'Energy Usage', value: 30, color: '#4ECCA3' },
    { name: 'Water Usage', value: 25, color: '#1A535C' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">{t('nav.sustainability')}</h2>
        <p className="text-muted-foreground">Resource usage and sustainability metrics</p>
      </div>
      
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>Resource Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
        <div className="flex items-center">
          <div className="bg-green-500 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2a10 10 0 1 0 10 10H12V2Z"></path><path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20"></path><path d="M19.07 4.93A10 10 0 0 1 4.93 19.07"></path></svg>
          </div>
          <div className="ml-4">
            <h3 className="font-semibold">Achievement Unlocked!</h3>
            <p className="text-sm">Saved 12kg food this week</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sustainability;
