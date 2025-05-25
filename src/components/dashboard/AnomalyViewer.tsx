
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnomalyDetection } from '@/hooks/useAnomalyDetection';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const AnomalyViewer: React.FC = () => {
  const { anomalies, isLoading } = useAnomalyDetection();

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getPredictionIcon = (prediction: string) => {
    return prediction === 'Anomaly' ? 
      <AlertTriangle className="h-4 w-4 text-red-500" /> : 
      <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  if (isLoading) {
    return (
      <Card className="neumorphic-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mintGreen"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="neumorphic-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Anomaly Detection Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {anomalies.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No anomaly data available</p>
            </div>
          ) : (
            anomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className={`p-3 rounded-lg border ${
                  anomaly.prediction === 'Anomaly' 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPredictionIcon(anomaly.prediction)}
                    <span className="font-medium">{anomaly.zone}</span>
                    <Badge variant={getRiskColor(anomaly.risk_level)}>
                      {anomaly.risk_level} Risk
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(anomaly.created_at), 'HH:mm')}
                  </div>
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Prediction:</span>
                    <span className={anomaly.prediction === 'Anomaly' ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {anomaly.prediction}
                    </span>
                  </div>
                  
                  {anomaly.prediction === 'Anomaly' && (
                    <>
                      <div className="flex justify-between">
                        <span>Anomaly Probability:</span>
                        <span className="text-red-600 font-medium">
                          {(anomaly.anomaly_probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>Occupancy: {anomaly.input_data.occupancy}</div>
                          <div>Hour: {anomaly.input_data.hour}:00</div>
                          <div>Power: {anomaly.input_data.power_use} kWh</div>
                          <div>Water: {anomaly.input_data.water_use} L</div>
                          <div className="col-span-2">Status: {anomaly.input_data.cleaning_status}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnomalyViewer;
