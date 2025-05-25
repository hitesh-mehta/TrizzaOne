
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, TrendingUp, MessageSquare, Users, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/components/ui/use-toast';
import Botato from '@/components/chatbot/Botato';

interface Feedback {
  id: string;
  Timestamp: string;
  Name: string;
  Email: string;
  "Ontime Service": number;
  Cleanliness: number;
  Comfortability: number;
  "Staff Response": number;
  Overall: number;
  "Phone number": string;
  "Suggestions ": string;
}

const ITEMS_PER_PAGE = 5;

const Feedback: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeedbacks = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('https://sheetdb.io/api/v1/2dzrrlo4qru6k');
      if (!response.ok) {
        throw new Error('Failed to fetch feedbacks');
      }
      const data = await response.json();
      
      // Transform data to add unique IDs and convert string ratings to numbers
      const transformedData = data.map((item: any, index: number) => ({
        ...item,
        id: `feedback_${index}_${Date.now()}`,
        "Ontime Service": parseInt(item["Ontime Service"]) || 0,
        Cleanliness: parseInt(item.Cleanliness) || 0,
        Comfortability: parseInt(item.Comfortability) || 0,
        "Staff Response": parseInt(item["Staff Response"]) || 0,
        Overall: parseInt(item.Overall) || 0,
      }));
      
      setFeedbacks(transformedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch feedbacks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchFeedbacks, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate statistics
  const stats = {
    totalFeedbacks: feedbacks.length,
    averageOverall: feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + f.Overall, 0) / feedbacks.length).toFixed(1) : '0',
    averageOntime: feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + f["Ontime Service"], 0) / feedbacks.length).toFixed(1) : '0',
    averageCleanliness: feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + f.Cleanliness, 0) / feedbacks.length).toFixed(1) : '0',
    averageComfort: feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + f.Comfortability, 0) / feedbacks.length).toFixed(1) : '0',
    averageStaff: feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + f["Staff Response"], 0) / feedbacks.length).toFixed(1) : '0',
  };

  // Pagination
  const totalPages = Math.ceil(feedbacks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentFeedbacks = feedbacks.slice(startIndex, endIndex);

  // Chart data
  const categoryData = [
    { name: 'Ontime Service', value: parseFloat(stats.averageOntime) },
    { name: 'Cleanliness', value: parseFloat(stats.averageCleanliness) },
    { name: 'Comfortability', value: parseFloat(stats.averageComfort) },
    { name: 'Staff Response', value: parseFloat(stats.averageStaff) },
  ];

  const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
    const rating = i + 1;
    const count = feedbacks.filter(f => f.Overall === rating).length;
    return { rating, count };
  });

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const formatDate = (timestamp: string) => {
    try {
      // Handle the MM/DD/YYYY HH:MM:SS format
      const [datePart, timePart] = timestamp.split(' ');
      const [month, day, year] = datePart.split('/');
      const formattedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`);
      return formattedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return timestamp; // Return original if parsing fails
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-full border-4 border-t-transparent border-mintGreen animate-spin"></div>
        </div>
        <Botato />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">{t('nav.feedback')}</h2>
          <p className="text-muted-foreground">Real-time feedback analytics and management</p>
        </div>
        <Button
          onClick={fetchFeedbacks}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="neumorphic-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-mintGreen" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Feedbacks</p>
                <p className="text-2xl font-bold">{stats.totalFeedbacks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Rating</p>
                <p className="text-2xl font-bold">{stats.averageOverall}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service Rating</p>
                <p className="text-2xl font-bold">{stats.averageOntime}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Staff Rating</p>
                <p className="text-2xl font-bold">{stats.averageStaff}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedbacks">All Feedbacks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>Average Ratings by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>Overall Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ratingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="neumorphic-card">
            <CardHeader>
              <CardTitle>Recent Feedbacks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedbacks.slice(0, 5).map((feedback) => (
                  <div key={feedback.id} className="border-l-4 border-mintGreen pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{feedback.Name}</span>
                        <Badge variant="outline">Overall: {feedback.Overall}/5</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(feedback.Timestamp)}
                      </span>
                    </div>
                    {feedback["Suggestions "] && (
                      <p className="text-sm text-muted-foreground">{feedback["Suggestions "]}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedbacks" className="space-y-6">
          <Card className="neumorphic-card">
            <CardHeader>
              <CardTitle>All Feedbacks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentFeedbacks.map((feedback) => (
                  <div key={feedback.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{feedback.Name}</p>
                          <p className="text-sm text-muted-foreground">{feedback.Email}</p>
                          <p className="text-sm text-muted-foreground">{feedback["Phone number"]}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{feedback.Overall}/5</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(feedback.Timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Service</p>
                        <p className="font-medium">{feedback["Ontime Service"]}/5</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Cleanliness</p>
                        <p className="font-medium">{feedback.Cleanliness}/5</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Comfort</p>
                        <p className="font-medium">{feedback.Comfortability}/5</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Staff</p>
                        <p className="font-medium">{feedback["Staff Response"]}/5</p>
                      </div>
                    </div>
                    
                    {feedback["Suggestions "] && (
                      <p className="text-sm border-t pt-2">{feedback["Suggestions "]}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, feedbacks.length)} of {feedbacks.length} feedbacks
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>Rating Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Ontime Service:</span>
                    <span className="font-bold">{stats.averageOntime}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleanliness:</span>
                    <span className="font-bold">{stats.averageCleanliness}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comfortability:</span>
                    <span className="font-bold">{stats.averageComfort}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Staff Response:</span>
                    <span className="font-bold">{stats.averageStaff}/5</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Overall Average:</span>
                    <span className="font-bold text-green-600">{stats.averageOverall}/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Responses:</span>
                    <span className="font-bold">{stats.totalFeedbacks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ratings ≥ 4:</span>
                    <span className="font-bold text-green-600">
                      {feedbacks.filter(f => f.Overall >= 4).length} ({((feedbacks.filter(f => f.Overall >= 4).length / feedbacks.length) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ratings ≤ 2:</span>
                    <span className="font-bold text-red-600">
                      {feedbacks.filter(f => f.Overall <= 2).length} ({((feedbacks.filter(f => f.Overall <= 2).length / feedbacks.length) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>With Suggestions:</span>
                    <span className="font-bold">
                      {feedbacks.filter(f => f["Suggestions "] && f["Suggestions "].trim()).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <Botato />
    </div>
  );
};

export default Feedback;
