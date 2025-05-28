import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type: 'popularity' | 'order' | 'alert' | 'iot_change' | 'consumption_spike' | 'fire_alarm' | 'gas_leak';
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
}

export const useNotifications = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [lastMostPopular, setLastMostPopular] = useState<string | null>(null);
  const [lastIoTData, setLastIoTData] = useState<any>(null);
  const [processedNotificationIds, setProcessedNotificationIds] = useState<Set<string>>(new Set());
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
  });

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
    if (!notificationSettings.pushNotifications) return;
    
    const hasPermission = await requestNotificationPermission();
    
    if (hasPermission) {
      try {
        const notification = new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'trizzaone-notification',
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

  // Save notification settings
  const saveNotificationSettings = async (settings: NotificationSettings) => {
    try {
      console.log('Attempting to save notification settings:', settings);
      
      // Update local state immediately for better UX
      setNotificationSettings(settings);

      // Save to localStorage as the primary storage method
      localStorage.setItem('trizzaone_notification_settings', JSON.stringify(settings));
      
      console.log('Successfully saved notification settings to localStorage');

      // Show success toast
      toast({
        title: t('success'),
        description: t('notificationsSaved'),
        variant: "default",
      });

      return true;
    } catch (error) {
      console.error('Error saving notification settings:', error);
      
      // Revert local state on error
      loadNotificationSettings();
      
      toast({
        title: t('error'),
        description: 'Failed to save notification settings. Please try again.',
        variant: "destructive",
      });
      
      return false;
    }
  };

  // Load notification settings
  const loadNotificationSettings = () => {
    try {
      const saved = localStorage.getItem('trizzaone_notification_settings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setNotificationSettings(parsedSettings);
        console.log('Notification settings loaded successfully:', parsedSettings);
      } else {
        console.log('No saved notification settings found, using defaults');
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      // Keep default settings on error
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
    const notificationKey = `${notification.type}_${notification.title}_${Date.now()}`;
    
    if (!processedNotificationIds.has(notificationKey)) {
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
      setProcessedNotificationIds(prev => new Set([...prev, notificationKey]));
      
      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'alert' || notification.type === 'iot_change' || notification.type === 'fire_alarm' || notification.type === 'gas_leak' ? "destructive" : "default",
      });

      // Show browser notification for important alerts
      if (['alert', 'iot_change', 'consumption_spike', 'fire_alarm', 'gas_leak'].includes(notification.type)) {
        showBrowserNotification(notification.title, notification.message);
      }
    }
  };

  useEffect(() => {
    // Load settings on mount
    loadNotificationSettings();
    
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
          
          // Check for fire alarm - HIGH PRIORITY NOTIFICATION
          if (newIoTData.fire_alarm_triggered === 'yes') {
            const fireNotification: NotificationData = {
              id: `fire-${Date.now()}-${Math.random()}`,
              title: '🚨 FIRE ALARM TRIGGERED!',
              message: `Fire alarm activated in ${newIoTData.zone}. Evacuate immediately!`,
              timestamp: new Date(),
              type: 'fire_alarm'
            };
            addNotification(fireNotification);
            
            // Force show browser notification for fire alarm regardless of settings
            if (isNotificationSupported() && Notification.permission === 'granted') {
              new Notification('🚨 FIRE ALARM TRIGGERED!', {
                body: `Fire alarm activated in ${newIoTData.zone}. Evacuate immediately!`,
                icon: '/favicon.ico',
                requireInteraction: true,
                tag: 'fire-alarm'
              });
            }
          }

          // Check for gas leak - HIGH PRIORITY NOTIFICATION
          if (newIoTData.gas_leak_detected === 'yes') {
            const gasNotification: NotificationData = {
              id: `gas-${Date.now()}-${Math.random()}`,
              title: '⚠️ GAS LEAK DETECTED!',
              message: `Gas leak detected in ${newIoTData.zone}. Take immediate action!`,
              timestamp: new Date(),
              type: 'gas_leak'
            };
            addNotification(gasNotification);
            
            // Force show browser notification for gas leak regardless of settings
            if (isNotificationSupported() && Notification.permission === 'granted') {
              new Notification('⚠️ GAS LEAK DETECTED!', {
                body: `Gas leak detected in ${newIoTData.zone}. Take immediate action!`,
                icon: '/favicon.ico',
                requireInteraction: true,
                tag: 'gas-leak'
              });
            }
          }
          
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
  }, [t, lastMostPopular, lastIoTData, notificationSettings]);

  return {
    notifications,
    notificationCount: notifications.length,
    notificationSettings,
    requestNotificationPermission,
    isNotificationSupported,
    saveNotificationSettings
  };
};
