
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Edit, Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

const OrderHistory = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [foodHistory, setFoodHistory] = useState<FoodHistory[]>([]);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [newDish, setNewDish] = useState({ dish_name: '', dish_price: 0 });
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
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
    } catch (error: any) {
      toast({
        title: "Error fetching data",
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
        title: "Invalid input",
        description: "Please enter a valid dish name and price",
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
        title: "Success",
        description: "Dish added successfully",
      });

      setNewDish({ dish_name: '', dish_price: 0 });
      setIsAddingDish(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error adding dish",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateDish = async () => {
    if (!editingDish || !editingDish.dish_name.trim() || editingDish.dish_price <= 0) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid dish name and price",
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
        title: "Success",
        description: "Dish updated successfully",
      });

      setEditingDish(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating dish",
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
        title: "Success",
        description: "Dish deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error deleting dish",
        description: error.message,
        variant: "destructive",
      });
    }
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
        <h1 className="text-3xl font-bold text-foreground">Order History & Menu Management</h1>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-mintGreen/10 to-mintGreen/5 border-mintGreen/20">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular Today</CardTitle>
            <TrendingUp className="h-4 w-4 ml-auto text-mintGreen" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-mintGreen">
              {mostPopular ? mostPopular.name : 'No orders today'}
            </div>
            <p className="text-xs text-muted-foreground">
              {mostPopular ? `${mostPopular.quantity} servings` : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-coral/10 to-coral/5 border-coral/20">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Least Popular Today</CardTitle>
            <TrendingDown className="h-4 w-4 ml-auto text-coral" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-coral">
              {leastPopular && leastPopular !== mostPopular ? leastPopular.name : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {leastPopular && leastPopular !== mostPopular ? `${leastPopular.quantity} servings` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Order Popularity</CardTitle>
              <CardDescription>Quantity consumed by dish</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#4ECCA3" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Distribution</CardTitle>
              <CardDescription>Today's orders by percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
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
              <CardTitle>Menu Management</CardTitle>
              <CardDescription>Manage your dishes and prices</CardDescription>
            </div>
            <Button onClick={() => setIsAddingDish(true)} className="bg-mintGreen hover:bg-mintGreen/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Dish
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAddingDish && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="newDishName">Dish Name</Label>
                  <Input
                    id="newDishName"
                    value={newDish.dish_name}
                    onChange={(e) => setNewDish({ ...newDish, dish_name: e.target.value })}
                    placeholder="Enter dish name"
                  />
                </div>
                <div>
                  <Label htmlFor="newDishPrice">Price</Label>
                  <Input
                    id="newDishPrice"
                    type="number"
                    step="0.01"
                    value={newDish.dish_price}
                    onChange={(e) => setNewDish({ ...newDish, dish_price: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter price"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAddDish} className="bg-mintGreen hover:bg-mintGreen/90">
                  Add Dish
                </Button>
                <Button variant="outline" onClick={() => setIsAddingDish(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dish Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
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
                      `$${dish.dish_price.toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {editingDish?.dish_id === dish.dish_id ? (
                        <>
                          <Button size="sm" onClick={handleUpdateDish} className="bg-mintGreen hover:bg-mintGreen/90">
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingDish(null)}>
                            Cancel
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
          <CardTitle>Recent Order History</CardTitle>
          <CardDescription>Latest food orders and consumption data</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dish Name</TableHead>
                <TableHead>Quantity Consumed</TableHead>
                <TableHead>Order Price</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foodHistory.slice(0, 20).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.dish_name}</TableCell>
                  <TableCell>{item.quantity_consumed || 'N/A'}</TableCell>
                  <TableCell>{item.order_price ? `$${item.order_price}` : 'N/A'}</TableCell>
                  <TableCell>{item.food_rating ? `${item.food_rating}/5` : 'N/A'}</TableCell>
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
