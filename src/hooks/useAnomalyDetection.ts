
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

export const useAnomalyDetection = () => {
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
      
      // Type cast the data and create unique entries
      const typedData = (data || []).map(item => ({
        ...item,
        input_data: item.input_data as AnomalyDetection['input_data']
      })) as AnomalyDetection[];
      
      // Create unique key for each anomaly to prevent duplicates
      const uniqueAnomalies = typedData.filter((anomaly, index, array) => {
        const uniqueKey = `${anomaly.iot_data_id}_${anomaly.zone}_${anomaly.api_timestamp}_${anomaly.prediction}`;
        const firstIndex = array.findIndex(a => 
          `${a.iot_data_id}_${a.zone}_${a.api_timestamp}_${a.prediction}` === uniqueKey
        );
        return index === firstIndex; // Keep only the first occurrence
      });
      
      setAnomalies(uniqueAnomalies);
      
      // Update processed IDs
      const newProcessedIds = new Set(uniqueAnomalies.map(a => 
        `${a.iot_data_id}_${a.zone}_${a.api_timestamp}_${a.prediction}`
      ));
      setProcessedIds(newProcessedIds);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
      setAnomalies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

      // If it's an anomaly and we haven't processed this specific combination before
      if (data?.anomalyResult?.prediction === 'Anomaly') {
        const result = data.anomalyResult;
        const uniqueKey = `${result.iot_data_id}_${result.input_data.zone}_${result.api_timestamp}_${result.prediction}`;
        
        if (!processedIds.has(uniqueKey)) {
          toast({
            title: "🚨 Anomaly Detected!",
            description: `${result.risk_level} risk anomaly in ${result.input_data.zone}. Probability: ${(result.anomaly_probability * 100).toFixed(1)}%`,
            variant: "destructive",
          });
          
          // Add to processed IDs to prevent duplicate notifications
          setProcessedIds(prev => new Set([...prev, uniqueKey]));
        }
      }

      // Refresh anomalies list after a short delay
      setTimeout(() => {
        fetchAnomalies();
      }, 1500);
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
          const newAnomaly = {
            ...payload.new,
            input_data: payload.new.input_data as AnomalyDetection['input_data']
          } as AnomalyDetection;
          
          // Create unique key for this anomaly
          const uniqueKey = `${newAnomaly.iot_data_id}_${newAnomaly.zone}_${newAnomaly.api_timestamp}_${newAnomaly.prediction}`;
          
          if (!processedIds.has(uniqueKey)) {
            setAnomalies(prev => {
              // Filter out any existing entries with the same unique key to prevent duplicates
              const filtered = prev.filter(a => {
                const existingKey = `${a.iot_data_id}_${a.zone}_${a.api_timestamp}_${a.prediction}`;
                return existingKey !== uniqueKey;
              });
              return [newAnomaly, ...filtered.slice(0, 49)];
            });
            
            // Add to processed IDs
            setProcessedIds(prev => new Set([...prev, uniqueKey]));
            
            // Show toast for anomalies only
            if (newAnomaly.prediction === 'Anomaly') {
              toast({
                title: "🚨 Real-time Anomaly Detected!",
                description: `${newAnomaly.risk_level} risk anomaly in ${newAnomaly.zone}. Probability: ${(newAnomaly.anomaly_probability * 100).toFixed(1)}%`,
                variant: "destructive",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, processedIds, fetchAnomalies]);

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
