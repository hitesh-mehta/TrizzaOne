
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

// Realistic anomaly scenarios for different zones
const anomalyScenarios = [
  {
    zone: 'Kitchen Zone A',
    prediction: 'Anomaly',
    anomaly_probability: 0.89,
    normal_probability: 0.11,
    risk_level: 'High',
    input_data: {
      zone: 'Kitchen Zone A',
      hour: 14,
      occupancy: 12,
      power_use: 45.8,
      water_use: 120.5,
      cleaning_status: 'PENDING'
    }
  },
  {
    zone: 'Kitchen Zone B',
    prediction: 'Normal',
    anomaly_probability: 0.15,
    normal_probability: 0.85,
    risk_level: 'Low',
    input_data: {
      zone: 'Kitchen Zone B',
      hour: 11,
      occupancy: 8,
      power_use: 28.3,
      water_use: 85.2,
      cleaning_status: 'DONE'
    }
  },
  {
    zone: 'Dining Area',
    prediction: 'Anomaly',
    anomaly_probability: 0.73,
    normal_probability: 0.27,
    risk_level: 'Medium',
    input_data: {
      zone: 'Dining Area',
      hour: 19,
      occupancy: 45,
      power_use: 62.1,
      water_use: 35.8,
      cleaning_status: 'IN PROGRESS'
    }
  },
  {
    zone: 'Storage Area',
    prediction: 'Anomaly',
    anomaly_probability: 0.94,
    normal_probability: 0.06,
    risk_level: 'High',
    input_data: {
      zone: 'Storage Area',
      hour: 22,
      occupancy: 2,
      power_use: 18.7,
      water_use: 5.3,
      cleaning_status: 'PENDING'
    }
  },
  {
    zone: 'Kitchen Zone C',
    prediction: 'Normal',
    anomaly_probability: 0.08,
    normal_probability: 0.92,
    risk_level: 'Low',
    input_data: {
      zone: 'Kitchen Zone C',
      hour: 9,
      occupancy: 6,
      power_use: 22.4,
      water_use: 67.9,
      cleaning_status: 'DONE'
    }
  },
  {
    zone: 'Pantry',
    prediction: 'Anomaly',
    anomaly_probability: 0.67,
    normal_probability: 0.33,
    risk_level: 'Medium',
    input_data: {
      zone: 'Pantry',
      hour: 16,
      occupancy: 3,
      power_use: 15.2,
      water_use: 12.1,
      cleaning_status: 'IN PROGRESS'
    }
  }
];

export const useAnomalyDetection = (realtimeEnabled: boolean = false, intervalSeconds: number = 30) => {
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const { toast } = useToast();

  const generateRealtimeAnomaly = useCallback(() => {
    const scenario = anomalyScenarios[scenarioIndex % anomalyScenarios.length];
    const timestamp = new Date().toISOString();
    const id = `realtime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add some randomness to make it more realistic
    const variationFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    const newAnomaly: AnomalyDetection = {
      id,
      iot_data_id: `iot_${Date.now()}`,
      zone: scenario.zone,
      prediction: scenario.prediction,
      anomaly_probability: Math.min(0.99, scenario.anomaly_probability * variationFactor),
      normal_probability: Math.max(0.01, scenario.normal_probability * variationFactor),
      risk_level: scenario.risk_level,
      input_data: {
        ...scenario.input_data,
        hour: new Date().getHours(),
        occupancy: Math.max(1, Math.floor(scenario.input_data.occupancy * variationFactor)),
        power_use: Math.round(scenario.input_data.power_use * variationFactor * 10) / 10,
        water_use: Math.round(scenario.input_data.water_use * variationFactor * 10) / 10,
      },
      api_timestamp: timestamp,
      created_at: timestamp
    };

    console.log('Generated realtime anomaly:', newAnomaly);

    setAnomalies(prev => {
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

    setScenarioIndex(prev => prev + 1);
  }, [scenarioIndex, toast]);

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

  // Set up real-time subscription for new anomaly detections
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

  // REALTIME anomaly generation - generates new practical results every 5 seconds when enabled
  useEffect(() => {
    let intervalId: number | undefined;

    if (realtimeEnabled && intervalSeconds === 5) {
      console.log('Setting up realtime anomaly generation every 5 seconds...');
      // Generate new anomaly every 5 seconds
      intervalId = window.setInterval(() => {
        console.log('Generating new realtime anomaly...');
        generateRealtimeAnomaly();
      }, 5000); // 5 seconds
    }

    return () => {
      if (intervalId !== undefined) {
        console.log('Clearing realtime anomaly generation interval');
        window.clearInterval(intervalId);
      }
    };
  }, [realtimeEnabled, intervalSeconds, generateRealtimeAnomaly]);

  // FORCED refresh interval when realtime is enabled (for database sync)
  useEffect(() => {
    let intervalId: number | undefined;

    if (realtimeEnabled && intervalSeconds !== 5) {
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
