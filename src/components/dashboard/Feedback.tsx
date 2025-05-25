
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, TrendingUp, MessageSquare, Users, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/components/ui/use-toast';

interface Feedback {
  id: string;
  name: string;
  email: string;
  category: string;
  rating: number;
  comment: string;
  timestamp: string;
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
      setFeedbacks(data);
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
    averageRating: feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1) : '0',
    categories: feedbacks.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    recentFeedbacks: feedbacks.slice(0, 10),
  };

  // Pagination
  const totalPages = Math.ceil(feedbacks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentFeedbacks = feedbacks.slice(startIndex, endIndex);

  // Chart data
  const categoryData = Object.entries(stats.categories).map(([name, value]) => ({
    name,
    value,
  }));

  const ratingDistribution = Array.from({ length: 10 }, (_, i) => {
    const rating = i + 1;
    const count = feedbacks.filter(f => f.rating === rating).length;
    return { rating, count };
  });

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'food': 'bg-green-100 text-green-800',
      'cleanliness': 'bg-blue-100 text-blue-800',
      'ac': 'bg-yellow-100 text-yellow-800',
      'wait': 'bg-red-100 text-red-800',
      'other': 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-full border-4 border-t-transparent border-mintGreen animate-spin"></div>
        </div>
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
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{stats.averageRating}/10</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Most Common</p>
                <p className="text-2xl font-bold">
                  {Object.entries(stats.categories).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{Object.keys(stats.categories).length}</p>
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
                <CardTitle>Feedback Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ratingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10B981" />
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
                {stats.recentFeedbacks.slice(0, 5).map((feedback) => (
                  <div key={feedback.id} className="border-l-4 border-mintGreen pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{feedback.name}</span>
                        <Badge className={getCategoryColor(feedback.category)}>
                          {feedback.category}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 text-sm">{feedback.rating}/10</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(feedback.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{feedback.comment}</p>
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
                          <p className="font-medium">{feedback.name}</p>
                          <p className="text-sm text-muted-foreground">{feedback.email}</p>
                        </div>
                        <Badge className={getCategoryColor(feedback.category)}>
                          {feedback.category}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 font-medium">{feedback.rating}/10</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(feedback.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm">{feedback.comment}</p>
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
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.categories).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <Badge className={getCategoryColor(category)}>{category}</Badge>
                      <span className="font-medium">{count} feedbacks</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>Rating Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Average Rating:</span>
                    <span className="font-bold">{stats.averageRating}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Highest Rating:</span>
                    <span className="font-bold">{Math.max(...feedbacks.map(f => f.rating))}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lowest Rating:</span>
                    <span className="font-bold">{Math.min(...feedbacks.map(f => f.rating))}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ratings ≥ 8:</span>
                    <span className="font-bold text-green-600">
                      {feedbacks.filter(f => f.rating >= 8).length} ({((feedbacks.filter(f => f.rating >= 8).length / feedbacks.length) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Feedback;
