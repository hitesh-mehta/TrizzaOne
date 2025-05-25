
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type: 'popularity' | 'order' | 'alert';
}

export const useNotifications = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [lastMostPopular, setLastMostPopular] = useState<string | null>(null);

  useEffect(() => {
    // Set up real-time subscription for food_history
    const channel = supabase
      .channel('food-history-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'food_history'
        },
        (payload) => {
          const newOrder = payload.new as any;
          
          // Create notification for new order
          const orderNotification: NotificationData = {
            id: `order-${Date.now()}`,
            title: t('notifications.newOrder'),
            message: t('notifications.orderReceived', { dish: newOrder.dish_name }),
            timestamp: new Date(),
            type: 'order'
          };
          
          setNotifications(prev => [orderNotification, ...prev.slice(0, 4)]);
          
          // Show toast notification
          toast({
            title: orderNotification.title,
            description: orderNotification.message,
          });
        }
      )
      .subscribe();

    // Check for popularity changes every 30 seconds
    const popularityInterval = setInterval(async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: todayOrders } = await supabase
          .from('food_history')
          .select('dish_name, quantity_consumed')
          .gte('timestamp', today)
          .not('quantity_consumed', 'is', null);

        if (todayOrders && todayOrders.length > 0) {
          const dishPopularity = todayOrders.reduce((acc, item) => {
            acc[item.dish_name] = (acc[item.dish_name] || 0) + (item.quantity_consumed || 0);
            return acc;
          }, {} as Record<string, number>);

          const sortedDishes = Object.entries(dishPopularity)
            .sort((a, b) => b[1] - a[1]);

          const currentMostPopular = sortedDishes[0]?.[0];

          if (currentMostPopular && lastMostPopular && currentMostPopular !== lastMostPopular) {
            const popularityNotification: NotificationData = {
              id: `popularity-${Date.now()}`,
              title: t('notifications.newMostPopular'),
              message: t('notifications.dishIsNowMostPopular', { dish: currentMostPopular }),
              timestamp: new Date(),
              type: 'popularity'
            };

            setNotifications(prev => [popularityNotification, ...prev.slice(0, 4)]);
            
            toast({
              title: popularityNotification.title,
              description: popularityNotification.message,
            });
          }

          setLastMostPopular(currentMostPopular);
        }
      } catch (error) {
        console.error('Error checking popularity:', error);
      }
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(popularityInterval);
    };
  }, [t, toast, lastMostPopular]);

  return {
    notifications,
    notificationCount: notifications.length
  };
};
