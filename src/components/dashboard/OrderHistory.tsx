import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Edit, Trash2, Plus, TrendingUp, TrendingDown, Star, Calendar, Clock, BarChart } from 'lucide-react';
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

interface Dish {
  dish_id: number;
  dish_name: string;
  dish_price: number;
}

interface FoodHistory {
  dish_name: string;
  food_rating: number | null;
  gas_consumption: number | null;
  order_price: number | null;
  quantity_consumed: number | null;
  quantity_prepared: number | null;
  timestamp: string;
  water_consumption: number | null;
}

type TimePeriod = 'hourly' | 'daily' | 'weekly';

const OrderHistory = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [foodHistory, setFoodHistory] = useState<FoodHistory[]>([]);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [newDish, setNewDish] = useState({ dish_name: '', dish_price: 0 });
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ratingPeriod, setRatingPeriod] = useState<TimePeriod>('daily');
  const [chartKey, setChartKey] = useState(0); // Force chart re-render

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription for food_history
    const channel = supabase
      .channel('food-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_history'
        },
        () => {
          fetchData(); // Refresh data when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [dishesResponse, historyResponse] = await Promise.all([
        supabase.from('dishes').select('*').order('dish_name'),
        supabase.from('food_history').select('*').order('timestamp', { ascending: false })
      ]);

      if (dishesResponse.error) throw dishesResponse.error;
      if (historyResponse.error) throw historyResponse.error;

      setDishes(dishesResponse.data || []);
      setFoodHistory(historyResponse.data || []);
      setChartKey(prev => prev + 1); // Force chart re-render
    } catch (error: any) {
      toast({
        title: t('error', 'Error fetching data'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDish = async () => {
    if (!newDish.dish_name.trim() || newDish.dish_price <= 0) {
      toast({
        title: t('error', 'Invalid input'),
        description: t('selectBothFields', 'Please enter a valid dish name and price'),
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('dishes')
        .insert([{ dish_name: newDish.dish_name, dish_price: newDish.dish_price }]);

      if (error) throw error;

      toast({
        title: t('success', 'Success'),
        description: t('dishAdded', 'Dish added successfully'),
      });

      setNewDish({ dish_name: '', dish_price: 0 });
      setIsAddingDish(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: t('error', 'Error adding dish'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateDish = async () => {
    if (!editingDish || !editingDish.dish_name.trim() || editingDish.dish_price <= 0) {
      toast({
        title: t('error', 'Invalid input'),
        description: t('selectBothFields', 'Please enter a valid dish name and price'),
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('dishes')
        .update({ dish_name: editingDish.dish_name, dish_price: editingDish.dish_price })
        .eq('dish_id', editingDish.dish_id);

      if (error) throw error;

      toast({
        title: t('success', 'Success'),
        description: t('dishUpdated', 'Dish updated successfully'),
      });

      setEditingDish(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: t('error', 'Error updating dish'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteDish = async (dishId: number) => {
    try {
      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('dish_id', dishId);

      if (error) throw error;

      toast({
        title: t('success', 'Success'),
        description: t('dishDeleted', 'Dish deleted successfully'),
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: t('error', 'Error deleting dish'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Get rating data based on selected time period
  const getRatingData = () => {
    const now = new Date();
    let filteredData = foodHistory.filter(item => item.food_rating !== null);

    switch (ratingPeriod) {
      case 'hourly':
        // Last 24 hours, grouped by hour
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        filteredData = filteredData.filter(item => new Date(item.timestamp) >= last24Hours);
        
        const hourlyData = Array.from({ length: 24 }, (_, i) => {
          const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).getHours();
          const hourlyItems = filteredData.filter(item => {
            const itemHour = new Date(item.timestamp).getHours();
            return itemHour === hour;
          });
          const avgRating = hourlyItems.length > 0 
            ? hourlyItems.reduce((sum, item) => sum + (item.food_rating || 0), 0) / hourlyItems.length 
            : 0;
          return {
            period: `${hour}:00`,
            rating: Math.round(avgRating * 10) / 10,
            count: hourlyItems.length
          };
        });
        return hourlyData;

      case 'weekly':
        // Last 7 weeks, grouped by week
        const last7Weeks = new Date(now.getTime() - 7 * 7 * 24 * 60 * 60 * 1000);
        filteredData = filteredData.filter(item => new Date(item.timestamp) >= last7Weeks);
        
        const weeklyData = Array.from({ length: 7 }, (_, i) => {
          const weekStart = new Date(now.getTime() - (6 - i) * 7 * 24 * 60 * 60 * 1000);
          const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          const weeklyItems = filteredData.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= weekStart && itemDate < weekEnd;
          });
          const avgRating = weeklyItems.length > 0 
            ? weeklyItems.reduce((sum, item) => sum + (item.food_rating || 0), 0) / weeklyItems.length 
            : 0;
          return {
            period: `Week ${i + 1}`,
            rating: Math.round(avgRating * 10) / 10,
            count: weeklyItems.length
          };
        });
        return weeklyData;

      default: // daily
        // Last 7 days, grouped by day
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = filteredData.filter(item => new Date(item.timestamp) >= last7Days);
        
        const dailyData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split('T')[0];
          const dailyItems = filteredData.filter(item => item.timestamp.startsWith(dateStr));
          const avgRating = dailyItems.length > 0 
            ? dailyItems.reduce((sum, item) => sum + (item.food_rating || 0), 0) / dailyItems.length 
            : 0;
          return {
            period: date.toLocaleDateString('en-US', { weekday: 'short' }),
            rating: Math.round(avgRating * 10) / 10,
            count: dailyItems.length
          };
        });
        return dailyData;
    }
  };

  // Get today's average rating
  const getTodayAverageRating = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayRatings = foodHistory.filter(item => 
      item.timestamp.startsWith(today) && item.food_rating !== null
    );
    
    if (todayRatings.length === 0) return 0;
    
    const sum = todayRatings.reduce((acc, item) => acc + (item.food_rating || 0), 0);
    return Math.round((sum / todayRatings.length) * 10) / 10;
  };

  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  const todayHistory = foodHistory.filter(item => 
    item.timestamp.startsWith(today)
  );

  // Calculate dish popularity for today
  const dishPopularity = todayHistory.reduce((acc, item) => {
    acc[item.dish_name] = (acc[item.dish_name] || 0) + (item.quantity_consumed || 0);
    return acc;
  }, {} as Record<string, number>);

  const sortedDishes = Object.entries(dishPopularity)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  const mostPopular = sortedDishes[0];
  const leastPopular = sortedDishes[sortedDishes.length - 1];

  // Chart data
  const chartData = sortedDishes.slice(0, 10);
  const ratingData = getRatingData();
  const todayAvgRating = getTodayAverageRating();
  
  const COLORS = ['#4ECCA3', '#FF6B6B', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent border-mintGreen animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{t('orderHistory', 'Order History & Menu Management')}</h1>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-mintGreen/10 to-mintGreen/5 border-mintGreen/20">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('mostPopularToday', 'Most Popular Today')}</CardTitle>
            <TrendingUp className="h-4 w-4 ml-auto text-mintGreen" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-mintGreen">
              {mostPopular ? mostPopular.name : t('noOrdersToday', 'No orders today')}
            </div>
            <p className="text-xs text-muted-foreground">
              {mostPopular ? `${mostPopular.quantity} ${t('servings', 'servings')}` : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-coral/10 to-coral/5 border-coral/20">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('leastPopularToday', 'Least Popular Today')}</CardTitle>
            <TrendingDown className="h-4 w-4 ml-auto text-coral" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-coral">
              {leastPopular && leastPopular !== mostPopular ? leastPopular.name : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {leastPopular && leastPopular !== mostPopular ? `${leastPopular.quantity} ${t('servings', 'servings')}` : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-400/10 to-yellow-400/5 border-yellow-400/20">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('todayAvgRating', "Today's Avg Rating")}</CardTitle>
            <Star className="h-4 w-4 ml-auto text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {todayAvgRating > 0 ? `${todayAvgRating}/5` : t('noRatings', 'No ratings')}
            </div>
            <div className="flex items-center mt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(todayAvgRating) 
                      ? 'text-yellow-400 fill-current' 
                      : i < todayAvgRating 
                        ? 'text-yellow-400 fill-current opacity-50'
                        : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                {t('ratingTrends', 'Rating Trends')}
              </CardTitle>
              <CardDescription>{t('avgRatingsOverTime', 'Average ratings over time')}</CardDescription>
            </div>
            <Select value={ratingPeriod} onValueChange={(value: TimePeriod) => setRatingPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('hourly', 'Hourly')}
                  </div>
                </SelectItem>
                <SelectItem value="daily">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('daily', 'Daily')}
                  </div>
                </SelectItem>
                <SelectItem value="weekly">{t('weekly', 'Weekly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300} key={`rating-${chartKey}`}>
            <AreaChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis domain={[0, 5]} />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${value} ${t('stars', 'stars')}`, 
                  t('avgRating', 'Average Rating')
                ]}
                labelFormatter={(label) => `${t('period', 'Period')}: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="rating" 
                stroke="#4ECCA3" 
                fill="#4ECCA3" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('todayOrderPopularity', "Today's Order Popularity")}</CardTitle>
              <CardDescription>{t('quantityConsumedByDish', 'Quantity consumed by dish')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300} key={`bar-${chartKey}`}>
                <RechartsBar data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#4ECCA3" />
                </RechartsBar>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('orderDistribution', 'Order Distribution')}</CardTitle>
              <CardDescription>{t('todayOrdersByPercentage', "Today's orders by percentage")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300} key={`pie-${chartKey}`}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantity"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Menu Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('menuManagement', 'Menu Management')}</CardTitle>
              <CardDescription>{t('manageDishesAndPrices', 'Manage your dishes and prices')}</CardDescription>
            </div>
            <Button onClick={() => setIsAddingDish(true)} className="bg-mintGreen hover:bg-mintGreen/90">
              <Plus className="h-4 w-4 mr-2" />
              {t('addDish', 'Add Dish')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAddingDish && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="newDishName">{t('dishName', 'Dish Name')}</Label>
                  <Input
                    id="newDishName"
                    value={newDish.dish_name}
                    onChange={(e) => setNewDish({ ...newDish, dish_name: e.target.value })}
                    placeholder={t('enterDishName', 'Enter dish name')}
                  />
                </div>
                <div>
                  <Label htmlFor="newDishPrice">{t('price', 'Price')}</Label>
                  <Input
                    id="newDishPrice"
                    type="number"
                    step="0.01"
                    value={newDish.dish_price}
                    onChange={(e) => setNewDish({ ...newDish, dish_price: parseFloat(e.target.value) || 0 })}
                    placeholder={t('enterPrice', 'Enter price')}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAddDish} className="bg-mintGreen hover:bg-mintGreen/90">
                  {t('addDish', 'Add Dish')}
                </Button>
                <Button variant="outline" onClick={() => setIsAddingDish(false)}>
                  {t('buttons.cancel', 'Cancel')}
                </Button>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dishName', 'Dish Name')}</TableHead>
                <TableHead>{t('price', 'Price')}</TableHead>
                <TableHead>{t('actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dishes.map((dish) => (
                <TableRow key={dish.dish_id}>
                  <TableCell>
                    {editingDish?.dish_id === dish.dish_id ? (
                      <Input
                        value={editingDish.dish_name}
                        onChange={(e) => setEditingDish({ ...editingDish, dish_name: e.target.value })}
                      />
                    ) : (
                      dish.dish_name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingDish?.dish_id === dish.dish_id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editingDish.dish_price}
                        onChange={(e) => setEditingDish({ ...editingDish, dish_price: parseFloat(e.target.value) || 0 })}
                      />
                    ) : (
                      `₹${dish.dish_price.toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {editingDish?.dish_id === dish.dish_id ? (
                        <>
                          <Button size="sm" onClick={handleUpdateDish} className="bg-mintGreen hover:bg-mintGreen/90">
                            {t('buttons.save', 'Save')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingDish(null)}>
                            {t('buttons.cancel', 'Cancel')}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setEditingDish(dish)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDish(dish.dish_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order History Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentOrderHistory', 'Recent Order History')}</CardTitle>
          <CardDescription>{t('latestFoodOrdersData', 'Latest food orders and consumption data')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dishName', 'Dish Name')}</TableHead>
                <TableHead>{t('quantityConsumed', 'Quantity Consumed')}</TableHead>
                <TableHead>{t('orderPrice', 'Order Price')}</TableHead>
                <TableHead>{t('rating', 'Rating')}</TableHead>
                <TableHead>{t('timestamp', 'Timestamp')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foodHistory.slice(0, 20).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.dish_name}</TableCell>
                  <TableCell>{item.quantity_consumed || 'N/A'}</TableCell>
                  <TableCell>{item.order_price ? `₹${item.order_price}` : 'N/A'}</TableCell>
                  <TableCell>
                    {item.food_rating ? (
                      <div className="flex items-center gap-1">
                        <span>{item.food_rating}/5</span>
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      </div>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderHistory;
