
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationData {
  id: string;
  type: 'popularity_change' | 'trend_shift' | 'new_order';
  message: string;
  timestamp: Date;
  read: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [lastPopularDish, setLastPopularDish] = useState<string>('');
  const { toast } = useToast();

  // Monitor food history for changes
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        // Get today's most popular dish
        const { data: todayOrders, error } = await supabase
          .from('food_history')
          .select('dish_name, quantity_consumed')
          .gte('timestamp', new Date().toISOString().split('T')[0])
          .order('quantity_consumed', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (todayOrders && todayOrders.length > 0) {
          const currentPopular = todayOrders[0].dish_name;
          
          if (lastPopularDish && lastPopularDish !== currentPopular) {
            const newNotification: NotificationData = {
              id: Date.now().toString(),
              type: 'popularity_change',
              message: `Most popular dish changed from ${lastPopularDish} to ${currentPopular}`,
              timestamp: new Date(),
              read: false
            };
            
            setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
            
            toast({
              title: "Popularity Change",
              description: `${currentPopular} is now the most popular dish!`,
            });
          }
          
          setLastPopularDish(currentPopular);
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Check initially and then every 30 seconds
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 30000);

    return () => clearInterval(interval);
  }, [lastPopularDish, toast]);

  // Listen for real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('food-history-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'food_history'
        },
        (payload) => {
          const newNotification: NotificationData = {
            id: Date.now().toString(),
            type: 'new_order',
            message: `New order: ${payload.new.dish_name}`,
            timestamp: new Date(),
            read: false
          };
          
          setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAllNotifications
  };
};
