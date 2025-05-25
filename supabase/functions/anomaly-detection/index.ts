
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IoTData {
  id: string;
  zone: 'Zone01' | 'Zone02' | 'Zone03' | 'Zone04';
  timestamp: string;
  occupancy_count: number;
  energy_consumed_kwh: number;
  cleaning_status: 'pending' | 'inprogress' | 'done';
  humidity: number;
}

interface AnomalyRequest {
  zone: string;
  hour: number;
  occupancy: number;
  power_use: number;
  water_use: number;
  cleaning_status: string;
}

interface AnomalyResponse {
  prediction: string;
  anomaly_probability: number;
  normal_probability: number;
  risk_level: string;
  input_data: AnomalyRequest;
  timestamp: string;
}

const mapZone = (zone: string): string => {
  const zoneMap: { [key: string]: string } = {
    'Zone01': 'Kitchen01',
    'Zone02': 'Dining01',
    'Zone03': 'Hallway01',
    'Zone04': 'Store01'
  };
  return zoneMap[zone] || zone;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { iotData } = await req.json();
    
    if (!iotData) {
      return new Response(
        JSON.stringify({ error: 'IoT data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing IoT data for anomaly detection:', iotData);

    // Prepare data for anomaly detection API
    const hour = new Date(iotData.timestamp).getHours();
    const waterUse = (iotData.humidity * iotData.occupancy_count) / 100; // Calculate water usage based on humidity

    const anomalyRequest: AnomalyRequest = {
      zone: mapZone(iotData.zone),
      hour: hour,
      occupancy: iotData.occupancy_count,
      power_use: iotData.energy_consumed_kwh,
      water_use: Math.round(waterUse * 100) / 100,
      cleaning_status: iotData.cleaning_status
    };

    console.log('Sending request to anomaly detection API:', anomalyRequest);

    // Call the anomaly detection API
    const response = await fetch('https://crack-a-code-vxe7.onrender.com/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(anomalyRequest)
    });

    if (!response.ok) {
      console.error('Anomaly detection API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to get anomaly prediction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anomalyResult: AnomalyResponse = await response.json();
    console.log('Anomaly detection result:', anomalyResult);

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
      return new Response(
        JSON.stringify({ error: 'Failed to store anomaly result' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        anomalyResult,
        message: 'Anomaly detection completed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in anomaly detection function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
