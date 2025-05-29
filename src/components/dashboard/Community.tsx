
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCommunity } from '@/hooks/useCommunity';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  MessageSquare, 
  Heart, 
  Laugh, 
  Angry, 
  Frown,
  Trophy,
  Medal,
  Award,
  Send,
  Users
} from 'lucide-react';
import { format } from 'date-fns';

const Community: React.FC = () => {
  const { t } = useTranslation();
  const { posts, leaderboard, isLoading, createPost, addReaction } = useCommunity();
  const isMobile = useIsMobile();
  const [newPostContent, setNewPostContent] = useState('');

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    await createPost(newPostContent);
    setNewPostContent('');
  };

  const getReactionIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-4 w-4" />;
      case 'love': return <Heart className="h-4 w-4 text-red-500" />;
      case 'laugh': return <Laugh className="h-4 w-4" />;
      case 'angry': return <Angry className="h-4 w-4" />;
      case 'sad': return <Frown className="h-4 w-4" />;
      default: return <Heart className="h-4 w-4" />;
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-lg font-bold">#{rank}</span>;
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
      <div className="mobile-center">
        <h2 className="responsive-title font-bold mb-2">{t('nav.community') || 'Community'}</h2>
        <p className="text-muted-foreground responsive-body">Connect with your team and share updates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Community Posts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Create Post */}
          <Card className="neumorphic-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Share with Community
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What's on your mind? Share updates, insights, or ask questions..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim()}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="neumorphic-card">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-mintGreen flex items-center justify-center">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Community Member</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(post.created_at), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm leading-relaxed">{post.content}</p>
                    
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {['like', 'love', 'laugh', 'angry', 'sad'].map((reactionType) => (
                        <Button
                          key={reactionType}
                          variant="ghost"
                          size="sm"
                          onClick={() => addReaction(post.id, reactionType as any)}
                          className="flex items-center gap-1 h-8 px-2"
                        >
                          {getReactionIcon(reactionType)}
                          <span className="text-xs">
                            {post.reactions?.filter(r => r.reaction_type === reactionType).length || 0}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          <Card className="neumorphic-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {getRankIcon(entry.rank)}
                    <div>
                      <p className="font-medium text-sm">Team Member {index + 1}</p>
                      <Badge variant="outline" className="text-xs">
                        {entry.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-mintGreen">{entry.score}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="neumorphic-card">
            <CardHeader>
              <CardTitle className="text-sm">Community Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Posts</span>
                <span className="font-medium">{posts.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Members</span>
                <span className="font-medium">{leaderboard.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Top Score</span>
                <span className="font-medium text-mintGreen">
                  {leaderboard[0]?.score || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Community;
