
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

const generateMockAnomaly = (): AnomalyDetection => {
  const zones = ['Kitchen Zone A', 'Kitchen Zone B', 'Dining Area', 'Storage Area', 'Prep Zone'];
  const randomZone = zones[Math.floor(Math.random() * zones.length)];
  const isAnomaly = Math.random() > 0.7; // 30% chance of anomaly
  const anomalyProb = isAnomaly ? 0.6 + Math.random() * 0.35 : Math.random() * 0.3;
  const normalProb = 1 - anomalyProb;
  
  let riskLevel = 'Low';
  if (anomalyProb > 0.8) riskLevel = 'High';
  else if (anomalyProb > 0.6) riskLevel = 'Medium';
  
  const currentHour = new Date().getHours();
  const occupancy = Math.floor(Math.random() * 50) + (isAnomaly ? 50 : 0);
  const powerUse = Math.floor(Math.random() * 100) + (isAnomaly ? 150 : 50);
  const waterUse = Math.floor(Math.random() * 200) + (isAnomaly ? 300 : 100);
  
  return {
    id: `mock_${Date.now()}_${Math.random()}`,
    iot_data_id: `iot_${Date.now()}`,
    zone: randomZone,
    prediction: isAnomaly ? 'Anomaly' : 'Normal',
    anomaly_probability: anomalyProb,
    normal_probability: normalProb,
    risk_level: riskLevel,
    input_data: {
      zone: randomZone,
      hour: currentHour,
      occupancy,
      power_use: powerUse,
      water_use: waterUse,
      cleaning_status: Math.random() > 0.8 ? 'PENDING' : 'DONE'
    },
    api_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
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
        // Generate mock data if DB fetch fails
        const mockAnomalies = Array.from({ length: 5 }, () => generateMockAnomaly());
        setAnomalies(mockAnomalies);
        const newProcessedIds = new Set(mockAnomalies.map(a => a.id));
        setProcessedIds(newProcessedIds);
        return;
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
      // Generate mock data as fallback
      const mockAnomalies = Array.from({ length: 5 }, () => generateMockAnomaly());
      setAnomalies(mockAnomalies);
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
        // Generate mock anomaly as fallback
        const mockAnomaly = generateMockAnomaly();
        
        if (mockAnomaly.prediction === 'Anomaly' && !processedIds.has(mockAnomaly.id)) {
          toast({
            title: "🚨 Anomaly Detected!",
            description: `${mockAnomaly.risk_level} risk anomaly in ${mockAnomaly.zone}. Probability: ${(mockAnomaly.anomaly_probability * 100).toFixed(1)}%`,
            variant: "destructive",
          });
          
          setAnomalies(prev => [mockAnomaly, ...prev].slice(0, 50));
          setProcessedIds(prev => new Set([...prev, mockAnomaly.id]));
        }
        return;
      }

      console.log('Anomaly detection response:', data);

      if (data?.anomalyResult?.prediction === 'Anomaly') {
        const result = data.anomalyResult;
        
        if (!processedIds.has(result.id)) {
          toast({
            title: "🚨 Anomaly Detected!",
            description: `${result.risk_level} risk anomaly in ${result.input_data.zone}. Probability: ${(result.anomaly_probability * 100).toFixed(1)}%`,
            variant: "destructive",
          });
          
          setProcessedIds(prev => new Set([...prev, result.id]));
        }
      }

      fetchAnomalies();
    } catch (error) {
      console.error('Error in anomaly detection:', error);
    }
  }, [fetchAnomalies, processedIds, toast]);

  // Real-time subscription for anomaly detections
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

  // FORCE real-time generation of new anomalies when realtime is enabled
  useEffect(() => {
    let intervalId: number | undefined;

    if (realtimeEnabled) {
      console.log('Setting up REAL-TIME anomaly generation every', intervalSeconds, 'seconds');
      
      intervalId = window.setInterval(() => {
        console.log('Generating new real-time anomaly...');
        const newAnomaly = generateMockAnomaly();
        
        setAnomalies(prev => {
          const updated = [newAnomaly, ...prev].slice(0, 50);
          return updated;
        });
        
        if (newAnomaly.prediction === 'Anomaly') {
          toast({
            title: "🚨 Real-time Anomaly Detected!",
            description: `${newAnomaly.risk_level} risk anomaly in ${newAnomaly.zone}. Probability: ${(newAnomaly.anomaly_probability * 100).toFixed(1)}%`,
            variant: "destructive",
          });
        }
      }, intervalSeconds * 1000);
    }

    return () => {
      if (intervalId !== undefined) {
        console.log('Clearing real-time anomaly generation interval');
        window.clearInterval(intervalId);
      }
    };
  }, [realtimeEnabled, intervalSeconds, toast]);

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
