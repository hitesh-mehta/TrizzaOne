
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

export const useAnomalyDetection = (realtimeEnabled: boolean = false, intervalSeconds: number = 30) => {
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const subscriptionRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
      
      // Remove duplicates based on ID only
      const uniqueAnomalies = typedData.filter((anomaly, index, self) => 
        index === self.findIndex(a => a.id === anomaly.id)
      );
      
      setAnomalies(uniqueAnomalies);
      
      // Update processed IDs
      const newProcessedIds = new Set(uniqueAnomalies.map(a => a.id));
      setProcessedIds(newProcessedIds);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
      setAnomalies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const callAnomalyDetection = useCallback(async (iotData: any) => {
    try {
      console.log('Calling anomaly detection for IoT data:', iotData);
      
      const { data, error } = await supabase.functions.invoke('anomaly-detection', {
        body: { iotData }
      });

      if (error) {
        console.error('Error calling anomaly detection:', error);
        return;
      }

      console.log('Anomaly detection response:', data);

      // Only show notification for new anomalies
      if (data?.anomalyResult?.prediction === 'Anomaly') {
        const result = data.anomalyResult;
        
        if (!processedIds.has(result.id)) {
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
  }, [fetchAnomalies, processedIds, toast]);

  // Clean up previous subscription and interval on unmount or when dependencies change
  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      console.log('Cleaning up previous subscription...');
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    if (intervalRef.current) {
      console.log('Clearing interval...');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Set up real-time subscription and interval
  useEffect(() => {
    // Clean up any existing subscriptions/intervals first
    cleanup();

    if (realtimeEnabled) {
      console.log('Setting up real-time anomaly detection...');
      
      // Create unique channel
      const channelName = `anomalies-${Date.now()}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'anomaly_detections'
          },
          (payload) => {
            console.log('Real-time anomaly detected:', payload);
            const newAnomaly = {
              ...payload.new,
              input_data: payload.new.input_data as AnomalyDetection['input_data']
            } as AnomalyDetection;
            
            // Add to anomalies list
            setAnomalies(prev => {
              const exists = prev.some(existing => existing.id === newAnomaly.id);
              if (!exists) {
                const updated = [newAnomaly, ...prev].slice(0, 50);
                return updated;
              }
              return prev;
            });
            
            // Show toast for anomalies
            if (newAnomaly.prediction === 'Anomaly') {
              toast({
                title: "🚨 Real-time Anomaly!",
                description: `${newAnomaly.risk_level} risk in ${newAnomaly.zone}. Probability: ${(newAnomaly.anomaly_probability * 100).toFixed(1)}%`,
                variant: "destructive",
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });

      subscriptionRef.current = channel;

      // Set up interval for forced refresh
      intervalRef.current = setInterval(() => {
        console.log('Interval refresh - fetching anomalies...');
        fetchAnomalies();
      }, intervalSeconds * 1000);
    }

    return cleanup;
  }, [realtimeEnabled, intervalSeconds, fetchAnomalies, cleanup, toast]);

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
