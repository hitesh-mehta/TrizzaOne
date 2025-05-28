
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
      
      // Type cast the data
      const typedData = (data || []).map(item => ({
        ...item,
        input_data: item.input_data as AnomalyDetection['input_data']
      })) as AnomalyDetection[];
      
      // Remove duplicates based on unique combination of fields
      const uniqueAnomalies = typedData.reduce((acc, anomaly) => {
        const uniqueKey = `${anomaly.iot_data_id}_${anomaly.zone}_${anomaly.api_timestamp}_${anomaly.prediction}_${anomaly.created_at}`;
        
        // Only add if we haven't seen this exact combination before
        const exists = acc.some(existing => {
          const existingKey = `${existing.iot_data_id}_${existing.zone}_${existing.api_timestamp}_${existing.prediction}_${existing.created_at}`;
          return existingKey === uniqueKey;
        });
        
        if (!exists) {
          acc.push(anomaly);
        }
        
        return acc;
      }, [] as AnomalyDetection[]);
      
      setAnomalies(uniqueAnomalies);
      
      // Update processed IDs to track what we've already processed
      const newProcessedIds = new Set(uniqueAnomalies.map(a => `${a.id}_${a.created_at}`));
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

      // Only show notification for new anomalies
      if (data?.anomalyResult?.prediction === 'Anomaly') {
        const result = data.anomalyResult;
        const uniqueKey = `${result.iot_data_id}_${result.api_timestamp}`;
        
        if (!processedIds.has(uniqueKey)) {
          toast({
            title: "🚨 Anomaly Detected!",
            description: `${result.risk_level} risk anomaly in ${result.input_data.zone}. Probability: ${(result.anomaly_probability * 100).toFixed(1)}%`,
            variant: "destructive",
          });
          
          // Add to processed IDs
          setProcessedIds(prev => new Set([...prev, uniqueKey]));
        }
      }

      // Refresh anomalies list
      setTimeout(() => {
        fetchAnomalies();
      }, 1000);
    } catch (error) {
      console.error('Error in anomaly detection:', error);
    }
  };

  // Set up real-time subscription for new anomaly detections
  useEffect(() => {
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
          console.log('Real-time anomaly detected:', payload);
          const newAnomaly = {
            ...payload.new,
            input_data: payload.new.input_data as AnomalyDetection['input_data']
          } as AnomalyDetection;
          
          // Create unique identifier for this anomaly
          const uniqueKey = `${newAnomaly.id}_${newAnomaly.created_at}`;
          
          // Only process if we haven't seen this exact anomaly before
          if (!processedIds.has(uniqueKey)) {
            setAnomalies(prev => {
              // Check if this anomaly already exists in our current list
              const exists = prev.some(existing => 
                existing.id === newAnomaly.id && existing.created_at === newAnomaly.created_at
              );
              
              if (!exists) {
                // Add new anomaly to the beginning of the list and limit to 50
                const updated = [newAnomaly, ...prev].slice(0, 50);
                return updated;
              }
              return prev;
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
  }, [toast, processedIds]);

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
