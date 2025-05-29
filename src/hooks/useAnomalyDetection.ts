
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
      
      // Create a Map to track unique anomalies by ID
      const uniqueAnomaliesMap = new Map();
      
      typedData.forEach(anomaly => {
        // Use ID as the primary key for uniqueness
        if (!uniqueAnomaliesMap.has(anomaly.id)) {
          uniqueAnomaliesMap.set(anomaly.id, anomaly);
        }
      });
      
      const uniqueAnomalies = Array.from(uniqueAnomaliesMap.values());
      
      setAnomalies(uniqueAnomalies);
      
      // Update processed IDs to track what we've already processed
      const newProcessedIds = new Set(uniqueAnomalies.map(a => a.id));
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
        
        if (!processedIds.has(result.iot_data_id)) {
          toast({
            title: "🚨 Anomaly Detected!",
            description: `${result.risk_level} risk anomaly in ${result.input_data.zone}. Probability: ${(result.anomaly_probability * 100).toFixed(1)}%`,
            variant: "destructive",
          });
          
          // Add to processed IDs
          setProcessedIds(prev => new Set([...prev, result.iot_data_id]));
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
          
          // Only process if we haven't seen this ID before
          if (!processedIds.has(newAnomaly.id)) {
            setAnomalies(prev => {
              // Check if this anomaly ID already exists in our current list
              const exists = prev.some(existing => existing.id === newAnomaly.id);
              
              if (!exists) {
                // Add new anomaly to the beginning of the list and limit to 50
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
