
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from "@/components/ui/use-toast";
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
    { label: 'Next 1 Day', value: '1', days: 1 },
    { label: 'Next 1 Week', value: '7', days: 7 },
    { label: 'Next 2 Weeks', value: '14', days: 14 },
    { label: 'Next 1 Month', value: '30', days: 30 }
  ];

  const fetchPrediction = async () => {
    if (!selectedDish || !selectedPeriod) {
      toast({
        title: "Missing Selection",
        description: "Please select both dish and prediction period",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://hotelpred-1.onrender.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dish: selectedDish,
          num_days: parseInt(selectedPeriod)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prediction');
      }

      const data: PredictionResponse = await response.json();
      setPredictionData(data);
      
      toast({
        title: "Prediction Generated",
        description: `Successfully generated forecast for ${selectedDish}`,
      });
    } catch (error) {
      console.error('Error fetching prediction:', error);
      toast({
        title: "Error",
        description: "Failed to fetch prediction. Please try again.",
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
          {t('nav.forecast')} Predictions
        </h2>
        <p className="text-muted-foreground">AI-powered quantity predictions for restaurant dishes</p>
      </div>

      {/* Selection Controls */}
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Configure Prediction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Dish</label>
              <Select value={selectedDish} onValueChange={setSelectedDish}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a dish" />
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
              <label className="text-sm font-medium">Prediction Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose period" />
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
                {isLoading ? 'Generating...' : 'Generate Prediction'}
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
                  <p className="text-sm text-muted-foreground">Total Quantity</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="neumorphic-card">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-coral">{getAverageQuantity().toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Daily Average</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="neumorphic-card">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-navy">{predictionData.forecast.length}</p>
                  <p className="text-sm text-muted-foreground">Days Forecasted</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results */}
          <Card className="neumorphic-card">
            <CardHeader>
              <CardTitle>Prediction Results for {predictionData.dish}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="chart" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="chart">Chart View</TabsTrigger>
                  <TabsTrigger value="table">Table View</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="chart" className="space-y-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => `Date: ${value}`}
                          formatter={(value) => [`${value} units`, 'Recommended Quantity']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="quantity" 
                          stroke="#4ECCA3" 
                          strokeWidth={3}
                          dot={{ r: 6, fill: '#4ECCA3' }}
                          activeDot={{ r: 8, fill: '#FF6B6B' }}
                          name="Recommended Quantity"
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
                          <TableHead>Date</TableHead>
                          <TableHead>Day</TableHead>
                          <TableHead className="text-right">Recommended Quantity</TableHead>
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
                              {item.recommended_quantity_to_prepare.toFixed(2)} units
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
                    Highlighted dates show prediction period for {predictionData.dish}
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
              Select a dish and prediction period to generate AI-powered quantity forecasts
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Predictions;
