
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type: 'popularity' | 'order' | 'alert' | 'iot_change' | 'consumption_spike';
}

export const useNotifications = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [lastMostPopular, setLastMostPopular] = useState<string | null>(null);
  const [lastIoTData, setLastIoTData] = useState<any>(null);
  const [processedNotificationIds, setProcessedNotificationIds] = useState<Set<string>>(new Set());

  // Check if notifications are supported
  const isNotificationSupported = () => {
    return 'Notification' in window;
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!isNotificationSupported()) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  // Show browser notification
  const showBrowserNotification = async (title: string, message: string) => {
    const hasPermission = await requestNotificationPermission();
    
    if (hasPermission) {
      try {
        const notification = new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'trizzaone-notification',
          renotify: true,
          requireInteraction: false,
          silent: false
        });

        // Auto close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  };

  // Function to detect sharp changes in IoT data
  const detectIoTChanges = (newData: any, oldData: any) => {
    if (!oldData) return [];
    
    const changes = [];
    const thresholds = {
      temperature: 0.15, // 15% change
      humidity: 0.20, // 20% change
      co2_level: 0.25, // 25% change
      occupancy_count: 0.30, // 30% change
      energy_consumed_kwh: 0.20 // 20% change
    };

    for (const [key, threshold] of Object.entries(thresholds)) {
      if (newData[key] && oldData[key] && oldData[key] > 0) {
        const change = Math.abs((newData[key] - oldData[key]) / oldData[key]);
        if (change > threshold) {
          const direction = newData[key] > oldData[key] ? 'increased' : 'decreased';
          changes.push({
            metric: key,
            direction,
            change: (change * 100).toFixed(1),
            zone: newData.zone,
            newValue: newData[key],
            oldValue: oldData[key]
          });
        }
      }
    }
    
    return changes;
  };

  // Function to detect consumption spikes
  const detectConsumptionSpikes = async () => {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Get consumption in last hour vs previous hour
      const { data: recentConsumption } = await supabase
        .from('food_history')
        .select('quantity_consumed, dish_name')
        .gte('timestamp', oneHourAgo.toISOString())
        .not('quantity_consumed', 'is', null);

      const { data: previousConsumption } = await supabase
        .from('food_history')
        .select('quantity_consumed, dish_name')
        .gte('timestamp', twoHoursAgo.toISOString())
        .lt('timestamp', oneHourAgo.toISOString())
        .not('quantity_consumed', 'is', null);

      if (recentConsumption && previousConsumption) {
        const recentTotal = recentConsumption.reduce((sum, item) => sum + (item.quantity_consumed || 0), 0);
        const previousTotal = previousConsumption.reduce((sum, item) => sum + (item.quantity_consumed || 0), 0);

        // Detect 50% increase in consumption
        if (previousTotal > 0 && ((recentTotal - previousTotal) / previousTotal) > 0.5) {
          return {
            type: 'spike',
            increase: (((recentTotal - previousTotal) / previousTotal) * 100).toFixed(1),
            recentTotal,
            previousTotal
          };
        }
      }
    } catch (error) {
      console.error('Error detecting consumption spikes:', error);
    }
    
    return null;
  };

  // Add notification with duplicate prevention
  const addNotification = (notification: NotificationData) => {
    const notificationKey = `${notification.type}_${notification.title}_${notification.message}`;
    
    if (!processedNotificationIds.has(notificationKey)) {
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
      setProcessedNotificationIds(prev => new Set([...prev, notificationKey]));
      
      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'alert' || notification.type === 'iot_change' ? "destructive" : "default",
      });

      // Show browser notification for important alerts
      if (notification.type === 'alert' || notification.type === 'iot_change' || notification.type === 'consumption_spike') {
        showBrowserNotification(notification.title, notification.message);
      }
    }
  };

  useEffect(() => {
    // Request notification permission on mount
    requestNotificationPermission();

    // Set up real-time subscription for IoT data changes
    const iotChannel = supabase
      .channel('iot-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'iot_data'
        },
        async (payload) => {
          const newIoTData = payload.new as any;
          
          // Get the latest data from the same zone for comparison
          if (lastIoTData && lastIoTData.zone === newIoTData.zone) {
            const changes = detectIoTChanges(newIoTData, lastIoTData);
            
            changes.forEach(change => {
              const notification: NotificationData = {
                id: `iot-change-${Date.now()}-${Math.random()}`,
                title: `⚠️ Sharp Change Detected`,
                message: `${change.metric.replace('_', ' ')} ${change.direction} by ${change.change}% in ${change.zone}`,
                timestamp: new Date(),
                type: 'iot_change'
              };
              
              addNotification(notification);
            });
          }
          
          setLastIoTData(newIoTData);
        }
      )
      .subscribe();

    // Set up real-time subscription for food_history
    const foodChannel = supabase
      .channel('food-history-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'food_history'
        },
        async (payload) => {
          const newOrder = payload.new as any;
          
          // Create notification for new order
          const orderNotification: NotificationData = {
            id: `order-${Date.now()}-${Math.random()}`,
            title: t('newOrder'),
            message: t('orderReceived', { dish: newOrder.dish_name }),
            timestamp: new Date(),
            type: 'order'
          };
          
          addNotification(orderNotification);

          // Check for consumption spikes
          const spike = await detectConsumptionSpikes();
          if (spike) {
            const spikeNotification: NotificationData = {
              id: `spike-${Date.now()}-${Math.random()}`,
              title: '📈 Consumption Spike Detected!',
              message: `Food consumption increased by ${spike.increase}% in the last hour`,
              timestamp: new Date(),
              type: 'consumption_spike'
            };
            
            addNotification(spikeNotification);
          }
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
              id: `popularity-${Date.now()}-${Math.random()}`,
              title: t('newMostPopular'),
              message: t('dishIsNowMostPopular', { dish: currentMostPopular }),
              timestamp: new Date(),
              type: 'popularity'
            };

            addNotification(popularityNotification);
          }

          setLastMostPopular(currentMostPopular);
        }
      } catch (error) {
        console.error('Error checking popularity:', error);
      }
    }, 30000);

    // Check for consumption spikes every 5 minutes
    const consumptionInterval = setInterval(async () => {
      const spike = await detectConsumptionSpikes();
      if (spike) {
        const spikeNotification: NotificationData = {
          id: `spike-${Date.now()}-${Math.random()}`,
          title: '📈 Consumption Spike Detected!',
          message: `Food consumption increased by ${spike.increase}% in the last hour`,
          timestamp: new Date(),
          type: 'consumption_spike'
        };
        
        addNotification(spikeNotification);
      }
    }, 300000); // 5 minutes

    return () => {
      supabase.removeChannel(iotChannel);
      supabase.removeChannel(foodChannel);
      clearInterval(popularityInterval);
      clearInterval(consumptionInterval);
    };
  }, [t, lastMostPopular, lastIoTData]);

  return {
    notifications,
    notificationCount: notifications.length,
    requestNotificationPermission,
    isNotificationSupported
  };
};
