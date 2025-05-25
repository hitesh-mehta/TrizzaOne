
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, TrendingUp, MessageSquare, Users, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface Feedback {
  Timestamp: string;
  Name: string;
  Email: string;
  "Ontime Service": string;
  "Cleanliness": string;
  "Comfortability": string;
  "Staff Response": string;
  "Overall": string;
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

  // Transform the new API format to match our existing structure
  const transformedFeedbacks = feedbacks.map((feedback) => ({
    id: feedback.Timestamp,
    name: feedback.Name,
    email: feedback.Email,
    category: 'general',
    rating: parseFloat(feedback.Overall) || 0,
    comment: feedback["Suggestions "] || 'No additional comments',
    timestamp: feedback.Timestamp,
    ontimeService: parseFloat(feedback["Ontime Service"]) || 0,
    cleanliness: parseFloat(feedback.Cleanliness) || 0,
    comfortability: parseFloat(feedback.Comfortability) || 0,
    staffResponse: parseFloat(feedback["Staff Response"]) || 0,
    phone: feedback["Phone number"]
  }));

  // Calculate statistics
  const stats = {
    totalFeedbacks: transformedFeedbacks.length,
    averageRating: transformedFeedbacks.length > 0 ? (transformedFeedbacks.reduce((sum, f) => sum + f.rating, 0) / transformedFeedbacks.length).toFixed(1) : '0',
    averageOntimeService: transformedFeedbacks.length > 0 ? (transformedFeedbacks.reduce((sum, f) => sum + f.ontimeService, 0) / transformedFeedbacks.length).toFixed(1) : '0',
    averageCleanliness: transformedFeedbacks.length > 0 ? (transformedFeedbacks.reduce((sum, f) => sum + f.cleanliness, 0) / transformedFeedbacks.length).toFixed(1) : '0',
    averageComfortability: transformedFeedbacks.length > 0 ? (transformedFeedbacks.reduce((sum, f) => sum + f.comfortability, 0) / transformedFeedbacks.length).toFixed(1) : '0',
    averageStaffResponse: transformedFeedbacks.length > 0 ? (transformedFeedbacks.reduce((sum, f) => sum + f.staffResponse, 0) / transformedFeedbacks.length).toFixed(1) : '0',
  };

  // Pagination
  const totalPages = Math.ceil(transformedFeedbacks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentFeedbacks = transformedFeedbacks.slice(startIndex, endIndex);

  // Chart data for different metrics
  const metricsData = [
    { name: 'Ontime Service', value: parseFloat(stats.averageOntimeService) },
    { name: 'Cleanliness', value: parseFloat(stats.averageCleanliness) },
    { name: 'Comfortability', value: parseFloat(stats.averageComfortability) },
    { name: 'Staff Response', value: parseFloat(stats.averageStaffResponse) },
  ];

  const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
    const rating = i + 1;
    const count = transformedFeedbacks.filter(f => Math.round(f.rating) === rating).length;
    return { rating, count };
  });

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const formatDate = (timestamp: string) => {
    try {
      // Handle the MM/DD/YYYY HH:MM:SS format from SheetDB
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
                <p className="text-2xl font-bold">{stats.averageRating}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ontime Service</p>
                <p className="text-2xl font-bold">{stats.averageOntimeService}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cleanliness</p>
                <p className="text-2xl font-bold">{stats.averageCleanliness}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Staff Response</p>
                <p className="text-2xl font-bold">{stats.averageStaffResponse}/5</p>
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
                <CardTitle>Service Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
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
                {transformedFeedbacks.slice(0, 5).map((feedback) => (
                  <div key={feedback.id} className="border-l-4 border-mintGreen pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{feedback.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 text-sm">{feedback.rating}/5</span>
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
                          <p className="text-sm text-muted-foreground">{feedback.email || 'No email provided'}</p>
                          {feedback.phone && (
                            <p className="text-sm text-muted-foreground">Phone: {feedback.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 font-medium">{feedback.rating}/5</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(feedback.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      <div className="text-xs">
                        <span className="font-medium">Ontime: </span>
                        <span>{feedback.ontimeService}/5</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Cleanliness: </span>
                        <span>{feedback.cleanliness}/5</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Comfort: </span>
                        <span>{feedback.comfortability}/5</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Staff: </span>
                        <span>{feedback.staffResponse}/5</span>
                      </div>
                    </div>
                    {feedback.comment && (
                      <p className="text-sm">{feedback.comment}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, transformedFeedbacks.length)} of {transformedFeedbacks.length} feedbacks
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
                <CardTitle>Metrics Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metricsData.map((metric) => (
                    <div key={metric.name} className="flex items-center justify-between">
                      <span>{metric.name}:</span>
                      <span className="font-bold">{metric.value.toFixed(1)}/5</span>
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
                    <span>Average Overall Rating:</span>
                    <span className="font-bold">{stats.averageRating}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Highest Rating:</span>
                    <span className="font-bold">{Math.max(...transformedFeedbacks.map(f => f.rating))}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lowest Rating:</span>
                    <span className="font-bold">{Math.min(...transformedFeedbacks.map(f => f.rating))}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ratings ≥ 4:</span>
                    <span className="font-bold text-green-600">
                      {transformedFeedbacks.filter(f => f.rating >= 4).length} ({((transformedFeedbacks.filter(f => f.rating >= 4).length / transformedFeedbacks.length) * 100).toFixed(1)}%)
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
