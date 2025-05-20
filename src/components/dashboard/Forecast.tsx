
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Forecast: React.FC = () => {
  const { t } = useTranslation();
  
  // Mock forecast data
  const data = [
    { day: 'Mon', predicted: 120, actual: 122 },
    { day: 'Tue', predicted: 145, actual: 143 },
    { day: 'Wed', predicted: 135, actual: 130 },
    { day: 'Thu', predicted: 160, actual: 165 },
    { day: 'Fri', predicted: 180, actual: 185 },
    { day: 'Sat', predicted: 190, actual: 187 },
    { day: 'Sun', predicted: 130, predicted_only: true }
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">{t('nav.forecast')}</h2>
        <p className="text-muted-foreground">Weekly meal consumption forecast</p>
      </div>
      
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>Weekly Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#4ECCA3" 
                  strokeWidth={2} 
                  dot={{ r: 5 }}
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#FF6B6B" 
                  strokeWidth={2} 
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-center text-sm text-muted-foreground">More forecast features coming soon!</p>
    </div>
  );
};

export default Forecast;
