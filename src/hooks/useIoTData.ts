
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface IoTData {
  id: string;
  timestamp: string;
  zone: 'Zone01' | 'Zone02' | 'Zone03' | 'Zone04';
  floor: number;
  temperature: number;
  humidity: number;
  co2_level: number;
  light_level: number;
  occupancy_count: number;
  motion_detected: 'yes' | 'no';
  power_status: 'on' | 'off';
  energy_consumed_kwh: number;
  battery_backup_level: number;
  cleaning_status: 'pending' | 'inprogress' | 'done';
  last_cleaned_timestamp: string | null;
  air_purifier_status: 'on' | 'off';
  fire_alarm_triggered: 'yes' | 'no';
  gas_leak_detected: 'yes' | 'no';
  created_at: string;
}

export const useIoTData = () => {
  const [data, setData] = useState<IoTData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtime, setIsRealtime] = useState(false);
  const [interval, setInterval] = useState<5 | 30 | 60 | 300>(30); // seconds
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const { data: iotData, error } = await supabase
        .from('iot_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setData(iotData || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching IoT data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateNewDataPoint = useCallback(async (lastRecord: IoTData) => {
    const zones: IoTData['zone'][] = ['Zone01', 'Zone02', 'Zone03', 'Zone04'];
    const cleaningStatuses: IoTData['cleaning_status'][] = ['pending', 'inprogress', 'done'];
    
    // Calculate new values based on last record with specified variations
    const temperature = Math.max(15, Math.min(45, lastRecord.temperature + (Math.random() - 0.5) * lastRecord.temperature * 0.1)); // ±5%
    const humidity = Math.max(30, Math.min(90, lastRecord.humidity + (Math.random() - 0.5) * lastRecord.humidity * 0.1)); // ±5%
    const co2_level = Math.max(300, Math.min(1000, lastRecord.co2_level + (Math.random() - 0.5) * lastRecord.co2_level * 0.1)); // ±5%
    const light_level = Math.max(0, Math.min(2000, lastRecord.light_level + (Math.random() - 0.5) * lastRecord.light_level * 0.3)); // ±15%
    const occupancy_count = Math.max(0, Math.min(50, Math.round(lastRecord.occupancy_count + (Math.random() - 0.5) * lastRecord.occupancy_count * 0.5))); // ±25%
    const motion_detected = occupancy_count === 0 ? 'no' : (Math.random() < 0.99 ? 'yes' : 'no'); // 99% yes if occupancy > 0
    const power_status = Math.random() < 0.9 ? 'on' : 'off'; // 90% on
    const energy_consumed_kwh = Math.max(0, lastRecord.energy_consumed_kwh + (Math.random() - 0.5) * lastRecord.energy_consumed_kwh * 0.2); // ±10%
    const battery_backup_level = Math.max(0, Math.min(100, lastRecord.battery_backup_level + (Math.random() - 0.5) * lastRecord.battery_backup_level * 0.2)); // ±10%
    const cleaning_status = cleaningStatuses[Math.floor(Math.random() * cleaningStatuses.length)];
    const air_purifier_status = Math.random() < 0.8 ? 'on' : 'off'; // 80% on
    const fire_alarm_triggered = Math.random() < 0.01 ? 'yes' : 'no'; // 99% no
    const gas_leak_detected = Math.random() < 0.01 ? 'yes' : 'no'; // 99% no

    const newDataPoint = {
      zone: zones[Math.floor(Math.random() * zones.length)],
      floor: Math.floor(Math.random() * 4), // 0-3
      temperature: Math.round(temperature * 100) / 100,
      humidity: Math.round(humidity * 100) / 100,
      co2_level: Math.round(co2_level * 100) / 100,
      light_level: Math.round(light_level * 100) / 100,
      occupancy_count,
      motion_detected,
      power_status,
      energy_consumed_kwh: Math.round(energy_consumed_kwh * 100) / 100,
      battery_backup_level: Math.round(battery_backup_level * 100) / 100,
      cleaning_status,
      last_cleaned_timestamp: Math.random() < 0.3 ? new Date().toISOString() : lastRecord.last_cleaned_timestamp,
      air_purifier_status,
      fire_alarm_triggered,
      gas_leak_detected,
    };

    try {
      const { error } = await supabase
        .from('iot_data')
        .insert([newDataPoint]);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error inserting new data point:', err);
      toast({
        title: "Error generating data",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const toggleRealtime = useCallback((enabled: boolean) => {
    setIsRealtime(enabled);
    if (enabled) {
      toast({
        title: "Real-time mode enabled",
        description: `New data will be generated every ${interval} seconds`,
      });
    } else {
      toast({
        title: "Real-time mode disabled",
        description: "Data simulation stopped",
      });
    }
  }, [interval, toast]);

  const updateInterval = useCallback((newInterval: 5 | 30 | 60 | 300) => {
    setInterval(newInterval);
    if (isRealtime) {
      toast({
        title: "Interval updated",
        description: `New data will be generated every ${newInterval} seconds`,
      });
    }
  }, [isRealtime, toast]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('iot-data-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'iot_data'
        },
        (payload) => {
          console.log('New IoT data received:', payload);
          setData(prev => [payload.new as IoTData, ...prev.slice(0, 99)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Set up data generation interval
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (isRealtime && data.length > 0) {
      intervalId = setInterval(() => {
        const lastRecord = data[0];
        generateNewDataPoint(lastRecord);
      }, interval * 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRealtime, interval, data, generateNewDataPoint]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isRealtime,
    interval,
    toggleRealtime,
    updateInterval,
    refetch: fetchData,
  };
};
