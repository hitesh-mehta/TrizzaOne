
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
      
      setAnomalies(typedData);
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
    } catch (error) {
      console.error('Error in anomaly detection:', error);
    }
  }, []);

  // Set up real-time subscription for anomaly detections - ALWAYS ACTIVE
  useEffect(() => {
    console.log('Setting up real-time anomaly detection subscription...');
    
    const channel = supabase
      .channel('anomaly-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'anomaly_detections'
        },
        (payload) => {
          console.log('Real-time anomaly received:', payload);
          const newAnomaly = {
            ...payload.new,
            input_data: payload.new.input_data as AnomalyDetection['input_data']
          } as AnomalyDetection;
          
          setAnomalies(prev => {
            // Add new anomaly to the beginning and limit to 50
            const updated = [newAnomaly, ...prev].slice(0, 50);
            return updated;
          });
          
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
        console.log('Anomaly real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up anomaly real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [toast]);

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
