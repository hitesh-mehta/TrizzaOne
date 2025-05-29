
import { useState, useEffect, useCallback } from 'react';
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

  // Set up real-time subscription for new anomaly detections - FIXED
  useEffect(() => {
    console.log('Setting up real-time anomaly subscription...');
    
    const channel = supabase
      .channel('anomaly-realtime-fixed')
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
            // Check if this anomaly ID already exists
            const exists = prev.some(existing => existing.id === newAnomaly.id);
            
            if (!exists) {
              console.log('Adding new anomaly to list:', newAnomaly.id);
              // Add new anomaly to the beginning and limit to 50
              const updated = [newAnomaly, ...prev].slice(0, 50);
              return updated;
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

  // FORCED refresh interval when realtime is enabled
  useEffect(() => {
    let intervalId: number | undefined;

    if (realtimeEnabled) {
      console.log('Setting up forced anomaly refresh interval:', intervalSeconds, 'seconds');
      // Fetch anomalies at the specified interval to ensure sync
      intervalId = window.setInterval(() => {
        console.log('Force refreshing anomalies...');
        fetchAnomalies();
      }, intervalSeconds * 1000);
    }

    return () => {
      if (intervalId !== undefined) {
        console.log('Clearing anomaly refresh interval');
        window.clearInterval(intervalId);
      }
    };
  }, [realtimeEnabled, intervalSeconds, fetchAnomalies]);

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
