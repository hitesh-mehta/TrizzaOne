
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  reactions?: PostReaction[];
}

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'laugh' | 'angry' | 'sad';
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  score: number;
  rank: number;
  category: string;
  updated_at: string;
}

export const useCommunity = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          reactions:post_reactions(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }, []);

  const createPost = useCallback(async (content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('community_posts')
        .insert({ content, user_id: user.id });

      if (error) throw error;
      
      toast({
        title: "Post created!",
        description: "Your post has been shared with the community.",
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const addReaction = useCallback(async (postId: string, reactionType: PostReaction['reaction_type']) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('post_reactions')
        .upsert({ 
          post_id: postId, 
          user_id: user.id, 
          reaction_type: reactionType 
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const postsChannel = supabase
      .channel('community-posts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    const reactionsChannel = supabase
      .channel('post-reactions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_reactions'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(reactionsChannel);
    };
  }, [fetchPosts]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchPosts(), fetchLeaderboard()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchPosts, fetchLeaderboard]);

  return {
    posts,
    leaderboard,
    isLoading,
    createPost,
    addReaction,
    refetch: () => {
      fetchPosts();
      fetchLeaderboard();
    }
  };
};
