
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AnomalyDetection {
  id: string;
  iot_data_id: string;
  zone: string;
  prediction: string;
  anomaly_probability: number;
  normal_probability: number;
  risk_level: string;
  input_data: {
    zone: string;
    hour: number;
    occupancy: number;
    power_use: number;
    water_use: number;
    cleaning_status: string;
  };
  api_timestamp: string;
  created_at: string;
}

export const useAnomalyDetection = (realtimeEnabled: boolean = false, intervalSeconds: number = 5) => {
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const intervalRef = useRef<number>();

  const fetchAnomalies = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('anomaly_detections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching anomalies:', error);
        throw error;
      }
      
      const typedData = (data || []).map(item => ({
        ...item,
        input_data: item.input_data as AnomalyDetection['input_data']
      })) as AnomalyDetection[];
      
      console.log('Fetched anomalies:', typedData.length);
      setAnomalies(typedData);
      
      // Update processed IDs
      const newProcessedIds = new Set(typedData.map(a => a.id));
      setProcessedIds(newProcessedIds);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
      setAnomalies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateRandomIoTData = useCallback(() => {
    const zones = ['Zone01', 'Zone02', 'Zone03', 'Zone04'];
    const cleaningStatuses = ['pending', 'inprogress', 'done'];
    
    return {
      id: `iot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      zone: zones[Math.floor(Math.random() * zones.length)],
      timestamp: new Date().toISOString(),
      occupancy_count: Math.floor(Math.random() * 15) + 1,
      energy_consumed_kwh: Math.random() * 10 + 2,
      cleaning_status: cleaningStatuses[Math.floor(Math.random() * cleaningStatuses.length)],
      humidity: Math.random() * 40 + 30
    };
  }, []);

  const callAnomalyDetection = useCallback(async (iotData?: any) => {
    try {
      const dataToUse = iotData || generateRandomIoTData();
      console.log('Calling anomaly detection for IoT data:', dataToUse);
      
      const { data, error } = await supabase.functions.invoke('anomaly-detection', {
        body: { iotData: dataToUse }
      });

      if (error) {
        console.error('Error calling anomaly detection:', error);
        return;
      }

      console.log('Anomaly detection response:', data);

      if (data?.anomalyResult) {
        const result = data.anomalyResult;
        
        // Only show notification for new anomalies
        if (result.prediction === 'Anomaly' && !processedIds.has(result.id)) {
          toast({
            title: "🚨 Anomaly Detected!",
            description: `${result.risk_level} risk anomaly in ${result.input_data.zone}. Probability: ${(result.anomaly_probability * 100).toFixed(1)}%`,
            variant: "destructive",
          });
          
          // Add to processed IDs
          setProcessedIds(prev => new Set([...prev, result.id]));
        }
      }

      // Refresh anomalies list immediately
      fetchAnomalies();
    } catch (error) {
      console.error('Error in anomaly detection:', error);
    }
  }, [fetchAnomalies, processedIds, toast, generateRandomIoTData]);

  // Set up real-time subscription for new anomaly detections
  useEffect(() => {
    console.log('Setting up real-time anomaly subscription...');
    
    const channel = supabase
      .channel('anomaly-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'anomaly_detections'
        },
        (payload) => {
          console.log('REAL-TIME anomaly detected:', payload);
          const newAnomaly = {
            ...payload.new,
            input_data: payload.new.input_data as AnomalyDetection['input_data']
          } as AnomalyDetection;
          
          // Force update anomalies list immediately
          setAnomalies(prev => {
            const exists = prev.some(existing => existing.id === newAnomaly.id);
            
            if (!exists) {
              console.log('Adding new anomaly to list:', newAnomaly.id);
              return [newAnomaly, ...prev].slice(0, 50);
            }
            return prev;
          });
          
          // Add to processed IDs
          setProcessedIds(prev => new Set([...prev, newAnomaly.id]));
          
          // Show toast for anomalies only
          if (newAnomaly.prediction === 'Anomaly') {
            toast({
              title: "🚨 Real-time Anomaly Detected!",
              description: `${newAnomaly.risk_level} risk anomaly in ${newAnomaly.zone}. Probability: ${(newAnomaly.anomaly_probability * 100).toFixed(1)}%`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Anomaly subscription status:', status);
      });

    return () => {
      console.log('Cleaning up anomaly subscription...');
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Set up interval for anomaly detection API calls when realtime is enabled
  useEffect(() => {
    if (realtimeEnabled) {
      console.log(`Setting up anomaly detection API calls every ${intervalSeconds} seconds`);
      
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Call immediately once
      callAnomalyDetection();
      
      // Set up interval for repeated calls
      intervalRef.current = window.setInterval(() => {
        console.log('Triggering automatic anomaly detection...');
        callAnomalyDetection();
      }, intervalSeconds * 1000);
    } else {
      // Clear interval when realtime is disabled
      if (intervalRef.current) {
        console.log('Clearing anomaly detection interval');
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [realtimeEnabled, intervalSeconds, callAnomalyDetection]);

  // Initial data fetch
  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  return {
    anomalies,
    isLoading,
    callAnomalyDetection,
    refetch: fetchAnomalies
  };
};
