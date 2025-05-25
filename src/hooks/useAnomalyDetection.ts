
import { useState, useEffect } from 'react';
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

export const useAnomalyDetection = () => {
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnomalies = async () => {
    try {
      const { data, error } = await supabase
        .from('anomaly_detections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAnomalies(data || []);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const callAnomalyDetection = async (iotData: any) => {
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

      // If it's an anomaly, show notification
      if (data?.anomalyResult?.prediction === 'Anomaly') {
        const result = data.anomalyResult;
        toast({
          title: "🚨 Anomaly Detected!",
          description: `${result.risk_level} risk anomaly in ${result.input_data.zone}. Probability: ${(result.anomaly_probability * 100).toFixed(1)}%`,
          variant: "destructive",
        });
      }

      // Refresh anomalies list
      fetchAnomalies();
    } catch (error) {
      console.error('Error in anomaly detection:', error);
    }
  };

  // Set up real-time subscription for new anomaly detections
  useEffect(() => {
    const channel = supabase
      .channel('anomaly-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'anomaly_detections'
        },
        (payload) => {
          console.log('New anomaly detected:', payload);
          const newAnomaly = payload.new as AnomalyDetection;
          
          setAnomalies(prev => [newAnomaly, ...prev.slice(0, 49)]);
          
          // Show toast for anomalies
          if (newAnomaly.prediction === 'Anomaly') {
            toast({
              title: "🚨 Anomaly Detected!",
              description: `${newAnomaly.risk_level} risk anomaly in ${newAnomaly.zone}. Probability: ${(newAnomaly.anomaly_probability * 100).toFixed(1)}%`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  useEffect(() => {
    fetchAnomalies();
  }, []);

  return {
    anomalies,
    isLoading,
    callAnomalyDetection,
    refetch: fetchAnomalies
  };
};
