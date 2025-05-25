
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Leaf, Zap, Droplets, Utensils } from 'lucide-react';

interface HourlyData {
  hour: string;
  energy: number;
  water: number;
  food: number;
}

const Sustainability: React.FC = () => {
  const { t } = useTranslation();
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('energy');
  const [isLoading, setIsLoading] = useState(true);

  // Mock sustainability data for pie chart
  const pieData = [
    { name: 'Food Usage', value: 45, color: '#FF6B6B' },
    { name: 'Energy Usage', value: 30, color: '#4ECCA3' },
    { name: 'Water Usage', value: 25, color: '#1A535C' },
  ];

  // Fetch hourly IoT data from Supabase
  useEffect(() => {
    const fetchHourlyData = async () => {
      try {
        const { data: iotData, error } = await supabase
          .from('iot_data')
          .select('*')
          .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('timestamp', { ascending: true });

        if (error) throw error;

        // Process data into hourly aggregates
        const hourlyMap = new Map<string, { energy: number[], water: number[], food: number[], count: number }>();

        iotData?.forEach(record => {
          const hour = new Date(record.timestamp).getHours().toString().padStart(2, '0') + ':00';
          
          if (!hourlyMap.has(hour)) {
            hourlyMap.set(hour, { energy: [], water: [], food: [], count: 0 });
          }
          
          const hourData = hourlyMap.get(hour)!;
          hourData.energy.push(record.energy_consumed_kwh);
          // Use humidity as a proxy for water usage (higher humidity = more water usage)
          hourData.water.push(record.humidity / 10); 
          // Use occupancy and temperature as proxies for food usage
          hourData.food.push((record.occupancy_count * record.temperature) / 100);
          hourData.count++;
        });

        // Convert to array format for charts
        const processedData: HourlyData[] = [];
        for (let hour = 0; hour < 24; hour++) {
          const hourStr = hour.toString().padStart(2, '0') + ':00';
          const data = hourlyMap.get(hourStr);
          
          if (data && data.count > 0) {
            processedData.push({
              hour: hourStr,
              energy: Math.round((data.energy.reduce((a, b) => a + b, 0) / data.count) * 100) / 100,
              water: Math.round((data.water.reduce((a, b) => a + b, 0) / data.count) * 100) / 100,
              food: Math.round((data.food.reduce((a, b) => a + b, 0) / data.count) * 100) / 100,
            });
          } else {
            processedData.push({
              hour: hourStr,
              energy: 0,
              water: 0,
              food: 0,
            });
          }
        }

        setHourlyData(processedData);
      } catch (error) {
        console.error('Error fetching hourly data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHourlyData();
  }, []);

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'energy': return '#4ECCA3';
      case 'water': return '#1A535C';
      case 'food': return '#FF6B6B';
      default: return '#4ECCA3';
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'energy': return <Zap className="h-5 w-5" />;
      case 'water': return <Droplets className="h-5 w-5" />;
      case 'food': return <Utensils className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getMetricUnit = (metric: string) => {
    switch (metric) {
      case 'energy': return 'kWh';
      case 'water': return 'L';
      case 'food': return 'kg';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">{t('nav.sustainability')}</h2>
        <p className="text-muted-foreground">Resource usage and sustainability metrics</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="neumorphic-card">
          <CardHeader>
            <CardTitle>Resource Allocation Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
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

        <Card className="neumorphic-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                {getMetricIcon(selectedMetric)}
                Hourly {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Usage
              </CardTitle>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mintGreen"></div>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis label={{ value: getMetricUnit(selectedMetric), angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value} ${getMetricUnit(selectedMetric)}`, selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)]} />
                    <Line 
                      type="monotone" 
                      dataKey={selectedMetric} 
                      stroke={getMetricColor(selectedMetric)} 
                      strokeWidth={2}
                      dot={{ fill: getMetricColor(selectedMetric) }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>24-Hour Resource Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mintGreen"></div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="energy" fill="#4ECCA3" name="Energy (kWh)" />
                  <Bar dataKey="water" fill="#1A535C" name="Water (L)" />
                  <Bar dataKey="food" fill="#FF6B6B" name="Food (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
        <div className="flex items-center">
          <div className="bg-green-500 p-2 rounded-full">
            <Leaf className="h-6 w-6 text-white" />
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
