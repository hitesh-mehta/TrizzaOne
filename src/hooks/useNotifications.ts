
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

  // Save notification settings - FIXED VERSION
  const saveNotificationSettings = async (settings: NotificationSettings) => {
    try {
      console.log('Saving notification settings:', settings);
      
      // Update local state immediately
      setNotificationSettings(settings);

      // Save to localStorage
      localStorage.setItem('trizzaone_notification_settings', JSON.stringify(settings));
      
      console.log('Notification settings saved successfully');

      // Show success toast
      toast({
        title: t('success'),
        description: t('notificationsSaved'),
        variant: "default",
      });

      return true;
    } catch (error) {
      console.error('Error saving notification settings:', error);
      
      // Show error toast
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
        console.log('Notification settings loaded:', parsedSettings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  // Function to detect sharp changes in IoT data
  const detectIoTChanges = (newData: any, oldData: any) => {
    if (!oldData) return [];
    
    const changes = [];
    const thresholds = {
      temperature: 0.15,
      humidity: 0.20,
      co2_level: 0.25,
      occupancy_count: 0.30,
      energy_consumed_kwh: 0.20
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

  // Add notification with duplicate prevention
  const addNotification = (notification: NotificationData) => {
    const notificationKey = `${notification.type}_${notification.title}_${Math.floor(Date.now() / 60000)}`;
    
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
          
          // Check for fire alarm - HIGH PRIORITY
          if (newIoTData.fire_alarm_triggered === 'yes') {
            const fireNotification: NotificationData = {
              id: `fire-${Date.now()}-${Math.random()}`,
              title: '🚨 FIRE ALARM TRIGGERED!',
              message: `Fire alarm activated in ${newIoTData.zone}. Evacuate immediately!`,
              timestamp: new Date(),
              type: 'fire_alarm'
            };
            addNotification(fireNotification);
          }

          // Check for gas leak - HIGH PRIORITY
          if (newIoTData.gas_leak_detected === 'yes') {
            const gasNotification: NotificationData = {
              id: `gas-${Date.now()}-${Math.random()}`,
              title: '⚠️ GAS LEAK DETECTED!',
              message: `Gas leak detected in ${newIoTData.zone}. Take immediate action!`,
              timestamp: new Date(),
              type: 'gas_leak'
            };
            addNotification(gasNotification);
          }
          
          // Check for IoT changes
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(iotChannel);
      supabase.removeChannel(foodChannel);
    };
  }, [t, lastIoTData, notificationSettings]);

  return {
    notifications,
    notificationCount: notifications.length,
    notificationSettings,
    requestNotificationPermission,
    isNotificationSupported,
    saveNotificationSettings
  };
};
