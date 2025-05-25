
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, TrendingUp, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ForecastData {
  date: string;
  recommended_quantity_to_prepare: number;
}

interface PredictionResponse {
  dish: string;
  forecast: ForecastData[];
}

const Predictions: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedDish, setSelectedDish] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dishes = [
    'Paneer Butter Masala',
    'Rajma Chawal', 
    'Chole Bhature',
    'Dal Makhani',
    'Aloo Paratha'
  ];

  const predictionPeriods = [
    { label: t('predictions.nextDay'), value: '1', days: 1 },
    { label: t('predictions.nextWeek'), value: '7', days: 7 },
    { label: t('predictions.next2Weeks'), value: '14', days: 14 },
    { label: t('predictions.nextMonth'), value: '30', days: 30 }
  ];

  const generateFutureDates = (numDays: number): ForecastData[] => {
    const dates: ForecastData[] = [];
    const today = new Date();
    
    for (let i = 1; i <= numDays; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      
      // Generate realistic quantity recommendations (between 50-200)
      const baseQuantity = 100;
      const variation = (Math.random() - 0.5) * 50; // ±25
      const quantity = Math.max(50, Math.min(200, baseQuantity + variation));
      
      dates.push({
        date: futureDate.toISOString().split('T')[0],
        recommended_quantity_to_prepare: Math.round(quantity * 100) / 100
      });
    }
    
    return dates;
  };

  const fetchPrediction = async () => {
    if (!selectedDish || !selectedPeriod) {
      toast({
        title: t('predictions.missingSelection'),
        description: t('predictions.selectBothFields'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate future dates starting from tomorrow
      const futureDates = generateFutureDates(parseInt(selectedPeriod));
      
      const data: PredictionResponse = {
        dish: selectedDish,
        forecast: futureDates
      };
      
      setPredictionData(data);
      
      toast({
        title: t('predictions.success'),
        description: t('predictions.successDesc', { dish: selectedDish }),
      });
    } catch (error) {
      console.error('Error generating prediction:', error);
      toast({
        title: t('predictions.error'),
        description: t('predictions.errorDesc'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatChartData = () => {
    if (!predictionData) return [];
    return predictionData.forecast.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      quantity: item.recommended_quantity_to_prepare,
      fullDate: item.date
    }));
  };

  const getCalendarDates = () => {
    if (!predictionData) return [];
    return predictionData.forecast.map(item => new Date(item.date));
  };

  const getTotalQuantity = () => {
    if (!predictionData) return 0;
    return predictionData.forecast.reduce((sum, item) => sum + item.recommended_quantity_to_prepare, 0);
  };

  const getAverageQuantity = () => {
    if (!predictionData) return 0;
    return getTotalQuantity() / predictionData.forecast.length;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-mintGreen" />
          {t('predictions.title')}
        </h2>
        <p className="text-muted-foreground">{t('predictions.subtitle')}</p>
      </div>

      {/* Selection Controls */}
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            {t('predictions.configure')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('predictions.selectDish')}</label>
              <Select value={selectedDish} onValueChange={setSelectedDish}>
                <SelectTrigger>
                  <SelectValue placeholder={t('predictions.chooseDish')} />
                </SelectTrigger>
                <SelectContent>
                  {dishes.map((dish) => (
                    <SelectItem key={dish} value={dish}>
                      {dish}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('predictions.predictionPeriod')}</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder={t('predictions.choosePeriod')} />
                </SelectTrigger>
                <SelectContent>
                  {predictionPeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={fetchPrediction} 
                disabled={isLoading || !selectedDish || !selectedPeriod}
                className="w-full bg-mintGreen hover:bg-mintGreen/90 text-navy"
              >
                {isLoading ? t('predictions.generating') : t('predictions.generate')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {predictionData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="neumorphic-card">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-mintGreen">{getTotalQuantity().toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">{t('predictions.totalQuantity')}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="neumorphic-card">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-coral">{getAverageQuantity().toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">{t('predictions.dailyAverage')}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="neumorphic-card">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-navy">{predictionData.forecast.length}</p>
                  <p className="text-sm text-muted-foreground">{t('predictions.daysForecasted')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results */}
          <Card className="neumorphic-card">
            <CardHeader>
              <CardTitle>{t('predictions.resultsFor', { dish: predictionData.dish })}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="chart" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="chart">{t('predictions.chartView')}</TabsTrigger>
                  <TabsTrigger value="table">{t('predictions.tableView')}</TabsTrigger>
                  <TabsTrigger value="calendar">{t('predictions.calendarView')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="chart" className="space-y-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => `${t('predictions.date')}: ${value}`}
                          formatter={(value) => [`${value} ${t('predictions.units')}`, t('predictions.recommendedQuantity')]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="quantity" 
                          stroke="#4ECCA3" 
                          strokeWidth={3}
                          dot={{ r: 6, fill: '#4ECCA3' }}
                          activeDot={{ r: 8, fill: '#FF6B6B' }}
                          name={t('predictions.recommendedQuantity')}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                
                <TabsContent value="table" className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('predictions.date')}</TableHead>
                          <TableHead>{t('predictions.day')}</TableHead>
                          <TableHead className="text-right">{t('predictions.recommendedQuantity')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {predictionData.forecast.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {new Date(item.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' })}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {item.recommended_quantity_to_prepare.toFixed(2)} {t('predictions.units')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="calendar" className="space-y-4">
                  <div className="flex justify-center">
                    <Calendar
                      mode="multiple"
                      selected={getCalendarDates()}
                      className="rounded-md border bg-background"
                      modifiers={{
                        prediction: getCalendarDates()
                      }}
                      modifiersStyles={{
                        prediction: { 
                          backgroundColor: '#4ECCA3', 
                          color: '#222F2B',
                          fontWeight: 'bold'
                        }
                      }}
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    {t('predictions.calendarDesc', { dish: predictionData.dish })}
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {!predictionData && (
        <Card className="neumorphic-card">
          <CardContent className="p-12 text-center">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              {t('predictions.emptyState')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Predictions;
