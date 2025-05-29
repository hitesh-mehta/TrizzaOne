import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Heart, 
  Send, 
  Trophy, 
  TrendingUp, 
  Users, 
  Star,
  ThumbsUp,
  MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  likes: number;
  replies: number;
  created_at: string;
  user_name: string;
  user_role: string;
}

interface LeaderboardEntry {
  id: string;
  user_name: string;
  user_role: string;
  efficiency_score: number;
  sustainability_points: number;
  total_orders: number;
  rank: number;
}

const Community: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with dummy data
  useEffect(() => {
    const dummyPosts: CommunityPost[] = [
      {
        id: '1',
        user_id: 'user1',
        content: `🌱 ${t('community.justImplemented')}`,
        likes: 12,
        replies: 3,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        user_name: 'Sarah Chen',
        user_role: 'sustainabilityManager'
      },
      {
        id: '2',
        user_id: 'user2',
        content: `📊 ${t('community.amazingEfficiency')}`,
        likes: 8,
        replies: 5,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        user_name: 'Marcus Rodriguez',
        user_role: 'operationsLead'
      },
      {
        id: '3',
        user_id: 'user3',
        content: `🍳 ${t('community.kitchenRecord')}`,
        likes: 15,
        replies: 7,
        created_at: new Date(Date.now() - 10800000).toISOString(),
        user_name: 'Elena Foster',
        user_role: 'kitchenSupervisor'
      },
      {
        id: '4',
        user_id: 'user4',
        content: `⚡ ${t('community.energyConsumption')}`,
        likes: 6,
        replies: 2,
        created_at: new Date(Date.now() - 14400000).toISOString(),
        user_name: 'David Kim',
        user_role: 'energyAnalyst'
      }
    ];

    const dummyLeaderboard: LeaderboardEntry[] = [
      {
        id: '1',
        user_name: 'Elena Foster',
        user_role: 'kitchenSupervisor',
        efficiency_score: 96.8,
        sustainability_points: 1250,
        total_orders: 2340,
        rank: 1
      },
      {
        id: '2',
        user_name: 'Sarah Chen',
        user_role: 'sustainabilityManager',
        efficiency_score: 94.2,
        sustainability_points: 1180,
        total_orders: 1890,
        rank: 2
      },
      {
        id: '3',
        user_name: 'Marcus Rodriguez',
        user_role: 'operationsLead',
        efficiency_score: 92.5,
        sustainability_points: 1020,
        total_orders: 2100,
        rank: 3
      },
      {
        id: '4',
        user_name: 'David Kim',
        user_role: 'energyAnalyst',
        efficiency_score: 90.1,
        sustainability_points: 980,
        total_orders: 1650,
        rank: 4
      },
      {
        id: '5',
        user_name: 'Lisa Wang',
        user_role: 'qualityControl',
        efficiency_score: 88.7,
        sustainability_points: 890,
        total_orders: 1420,
        rank: 5
      }
    ];

    setPosts(dummyPosts);
    setLeaderboard(dummyLeaderboard);
    setIsLoading(false);
  }, [t]);

  // Real-time subscription for new posts
  useEffect(() => {
    console.log('Setting up community real-time subscription...');
    
    const channel = supabase
      .channel('community-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts'
        },
        (payload) => {
          console.log('New community post:', payload);
          const newPost = payload.new as CommunityPost;
          setPosts(prev => [newPost, ...prev]);
          
          toast({
            title: t('community.newCommunityPost'),
            description: `${newPost.user_name} ${t('community.sharedUpdate')}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, t]);

  const handleSubmitPost = async () => {
    if (!newPostContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Simulate posting (in real app, this would go to Supabase)
      const newPost: CommunityPost = {
        id: Date.now().toString(),
        user_id: 'current_user',
        content: newPostContent,
        likes: 0,
        replies: 0,
        created_at: new Date().toISOString(),
        user_name: t('community.you'),
        user_role: 'teamMember'
      };
      
      setPosts(prev => [newPost, ...prev]);
      setNewPostContent('');
      
      toast({
        title: t('community.postShared'),
        description: t('community.postSharedDesc'),
      });
    } catch (error) {
      console.error('Error posting:', error);
      toast({
        title: t('error'),
        description: "Failed to share your post",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ));
    
    toast({
      title: t('community.liked'),
      description: t('community.likedPostDesc'),
    });
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'sustainabilitymanager': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'operationslead': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'kitchensupervisor': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'energyanalyst': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'qualitycontrol': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3: return <Trophy className="h-5 w-5 text-amber-600" />;
      default: return <Star className="h-5 w-5 text-gray-300" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mintGreen"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 text-foreground">{t('community.title')}</h2>
        <p className="text-muted-foreground">{t('community.subtitle')}</p>
      </div>

      <Tabs defaultValue="community" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="community" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
            <MessageSquare className="h-4 w-4" />
            {t('community.feed')}
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Trophy className="h-4 w-4" />
            {t('community.leaderboard')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="community" className="space-y-6">
          {/* New Post Section */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <MessageSquare className="h-5 w-5 text-mintGreen" />
                {t('community.shareUpdate')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={t('community.shareUpdatePlaceholder')}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-20 bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {newPostContent.length}/500 {t('community.characterCount')}
                </div>
                <Button 
                  onClick={handleSubmitPost}
                  disabled={!newPostContent.trim() || isSubmitting}
                  className="flex items-center gap-2 bg-mintGreen hover:bg-mintGreen/90 text-white"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? t('community.posting') : t('community.share')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Community Posts */}
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="border border-border bg-card">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {post.user_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-card-foreground">{post.user_name}</h4>
                          <Badge variant="secondary" className={getRoleColor(post.user_role)}>
                            {t(`community.${post.user_role}`)}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(post.created_at), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      
                      <p className="text-sm leading-relaxed text-card-foreground">{post.content}</p>
                      
                      <div className="flex items-center space-x-4 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikePost(post.id)}
                          className="flex items-center gap-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Heart className="h-4 w-4" />
                          {post.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {post.replies} {t('community.replies')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-border bg-card">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-mintGreen mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-card-foreground">{leaderboard.length}</h3>
                <p className="text-muted-foreground">{t('community.activeMembers')}</p>
              </CardContent>
            </Card>
            <Card className="border border-border bg-card">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-card-foreground">94.2%</h3>
                <p className="text-muted-foreground">{t('community.avgEfficiency')}</p>
              </CardContent>
            </Card>
            <Card className="border border-border bg-card">
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-card-foreground">6,500</h3>
                <p className="text-muted-foreground">{t('community.totalPoints')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {t('community.performanceLeaderboard')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      index === 0 ? 'bg-yellow-50/50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800/50' :
                      index === 1 ? 'bg-gray-50/50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700/50' :
                      index === 2 ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/50' :
                      'bg-background/50 border-border/50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(entry.rank)}
                        <span className="font-bold text-lg text-foreground">#{entry.rank}</span>
                      </div>
                      <Avatar>
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {entry.user_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-foreground">{entry.user_name}</h4>
                        <Badge variant="outline" className={getRoleColor(entry.user_role)}>
                          {t(`community.${entry.user_role}`)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">{t('community.efficiency')}</p>
                        <p className="font-bold text-green-600 dark:text-green-400">{entry.efficiency_score}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('community.points')}</p>
                        <p className="font-bold text-blue-600 dark:text-blue-400">{entry.sustainability_points}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('community.orders')}</p>
                        <p className="font-bold text-purple-600 dark:text-purple-400">{entry.total_orders}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Community;
