
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnomalyDetection } from '@/hooks/useAnomalyDetection';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const AnomalyViewer: React.FC = () => {
  const { t } = useTranslation();
  const { anomalies, isLoading } = useAnomalyDetection();

  // Filter unique anomalies and limit to top 5
  const uniqueAnomalies = anomalies
    .filter((anomaly, index, array) => {
      // Remove duplicates based on iot_data_id, zone, and prediction timestamp
      const key = `${anomaly.iot_data_id}_${anomaly.zone}_${anomaly.api_timestamp}_${anomaly.prediction}`;
      return array.findIndex(a => 
        `${a.iot_data_id}_${a.zone}_${a.api_timestamp}_${a.prediction}` === key
      ) === index;
    })
    .slice(0, 5);

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

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch (error) {
      return 'Invalid time';
    }
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
          Anomaly Detection Status (Top 5)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {uniqueAnomalies.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No anomaly data available</p>
            </div>
          ) : (
            uniqueAnomalies.map((anomaly) => (
              <div
                key={`${anomaly.id}_${anomaly.api_timestamp}`}
                className={`p-3 rounded-lg border transition-colors ${
                  anomaly.prediction === 'Anomaly' 
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20' 
                    : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPredictionIcon(anomaly.prediction)}
                    <span className="font-medium text-foreground">{anomaly.zone}</span>
                    <Badge variant={getRiskColor(anomaly.risk_level)}>
                      {anomaly.risk_level} Risk
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(anomaly.created_at)}
                  </div>
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prediction:</span>
                    <span className={`font-medium ${
                      anomaly.prediction === 'Anomaly' 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {anomaly.prediction}
                    </span>
                  </div>
                  
                  {anomaly.prediction === 'Anomaly' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Anomaly Probability:</span>
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {(anomaly.anomaly_probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-border text-xs">
                        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                          <div>Occupancy: <span className="text-foreground">{anomaly.input_data.occupancy}</span></div>
                          <div>Hour: <span className="text-foreground">{anomaly.input_data.hour}:00</span></div>
                          <div>Power: <span className="text-foreground">{anomaly.input_data.power_use} kWh</span></div>
                          <div>Water: <span className="text-foreground">{anomaly.input_data.water_use} L</span></div>
                          <div className="col-span-2">Status: <span className="text-foreground">{anomaly.input_data.cleaning_status}</span></div>
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
