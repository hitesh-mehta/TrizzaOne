
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

// Zone mapping as specified
const mapZone = (zone: string): string => {
  const zoneMap: { [key: string]: string } = {
    'Zone01': 'Kitchen01',
    'Zone02': 'Store01', 
    'Zone03': 'Hallway01',
    'Zone04': 'Dining01'
  };
  return zoneMap[zone] || zone;
};

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
      
      const uniqueAnomalies = typedData.filter((anomaly, index, self) => 
        index === self.findIndex(a => a.id === anomaly.id)
      );
      
      setAnomalies(uniqueAnomalies);
      
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
      console.log('Processing IoT data for anomaly detection:', iotData);
      
      // Prepare data in the exact format specified
      const hour = new Date(iotData.timestamp).getHours();
      const waterUse = Math.round((iotData.humidity * iotData.occupancy_count) / 100 * 100) / 100;
      
      const anomalyRequest = {
        zone: mapZone(iotData.zone),
        hour: hour,
        occupancy: iotData.occupancy_count,
        power_use: iotData.energy_consumed_kwh,
        water_use: waterUse,
        cleaning_status: iotData.cleaning_status
      };

      console.log('Sending to anomaly detection API:', anomalyRequest);

      // Call the external API directly
      const response = await fetch('https://crack-a-code-vxe7.onrender.com/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(anomalyRequest)
      });

      if (!response.ok) {
        console.error('Anomaly detection API error:', response.status, response.statusText);
        return;
      }

      const anomalyResult = await response.json();
      console.log('Anomaly detection response:', anomalyResult);

      // Store the result in our database
      const { error: insertError } = await supabase
        .from('anomaly_detections')
        .insert({
          iot_data_id: iotData.id,
          zone: anomalyResult.input_data.zone,
          prediction: anomalyResult.prediction,
          anomaly_probability: anomalyResult.anomaly_probability,
          normal_probability: anomalyResult.normal_probability,
          risk_level: anomalyResult.risk_level,
          input_data: anomalyResult.input_data,
          api_timestamp: anomalyResult.timestamp
        });

      if (insertError) {
        console.error('Error storing anomaly result:', insertError);
        return;
      }

      // Show notification for new anomalies only
      if (anomalyResult.prediction === 'Anomaly') {
        toast({
          title: "🚨 Anomaly Detected!",
          description: `${anomalyResult.risk_level} risk anomaly in ${anomalyResult.input_data.zone}. Probability: ${(anomalyResult.anomaly_probability * 100).toFixed(1)}%`,
          variant: "destructive",
        });
      }

      // Refresh anomalies list
      fetchAnomalies();
    } catch (error) {
      console.error('Error in anomaly detection:', error);
    }
  }, [fetchAnomalies, toast]);

  // Set up real-time subscription for new anomaly detections
  useEffect(() => {
    console.log('Setting up real-time anomaly subscription...');
    
    const channel = supabase
      .channel('anomaly-realtime-updated')
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
          
          setAnomalies(prev => {
            const exists = prev.some(existing => existing.id === newAnomaly.id);
            
            if (!exists) {
              console.log('Adding new anomaly to list:', newAnomaly.id);
              const updated = [newAnomaly, ...prev].slice(0, 50);
              return updated;
            }
            return prev;
          });
          
          setProcessedIds(prev => new Set([...prev, newAnomaly.id]));
          
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

  // Set up real-time subscription for new IoT data to trigger anomaly detection
  useEffect(() => {
    if (!realtimeEnabled) return;

    console.log('Setting up IoT data subscription for anomaly detection...');
    
    const iotChannel = supabase
      .channel('iot-data-for-anomaly')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'iot_data'
        },
        (payload) => {
          console.log('New IoT data for anomaly detection:', payload);
          if (payload.new) {
            callAnomalyDetection(payload.new);
          }
        }
      )
      .subscribe((status) => {
        console.log('IoT data subscription status:', status);
      });

    return () => {
      console.log('Cleaning up IoT data subscription...');
      supabase.removeChannel(iotChannel);
    };
  }, [realtimeEnabled, callAnomalyDetection]);

  // FORCED refresh interval when realtime is enabled
  useEffect(() => {
    let intervalId: number | undefined;

    if (realtimeEnabled) {
      console.log('Setting up forced anomaly refresh interval:', intervalSeconds, 'seconds');
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
