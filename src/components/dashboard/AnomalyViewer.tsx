
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnomalyDetection } from '@/hooks/useAnomalyDetection';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const AnomalyViewer: React.FC = () => {
  const { t } = useTranslation();
  const { anomalies, isLoading, refetch } = useAnomalyDetection();
  const isMobile = useIsMobile();

  // Get unique anomalies and limit to top 5
  const uniqueAnomalies = React.useMemo(() => {
    const seen = new Map();
    return anomalies
      .filter(anomaly => {
        // Create a more comprehensive unique key
        const key = `${anomaly.iot_data_id}_${anomaly.zone}_${anomaly.api_timestamp}_${anomaly.prediction}_${anomaly.created_at}`;
        if (seen.has(key)) {
          return false;
        }
        seen.set(key, true);
        return true;
      })
      .slice(0, 5);
  }, [anomalies]);

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
      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" /> : 
      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />;
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
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-center h-32 sm:h-40">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-mintGreen"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="neumorphic-card">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className={isMobile ? "text-sm" : ""}>Anomaly Detection (Real-time)</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            className="p-1 h-8 w-8"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
          {uniqueAnomalies.length === 0 ? (
            <div className="text-center text-muted-foreground py-6 sm:py-8">
              <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-green-500" />
              <p className="text-sm sm:text-base">No anomalies detected</p>
              <p className="text-xs text-muted-foreground mt-1">System monitoring in real-time</p>
            </div>
          ) : (
            uniqueAnomalies.map((anomaly, index) => (
              <div
                key={`${anomaly.id}_${anomaly.created_at}_${index}`}
                className={`p-2 sm:p-3 rounded-lg border transition-colors ${
                  anomaly.prediction === 'Anomaly' 
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20' 
                    : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <div className="flex items-center gap-1 sm:gap-2">
                    {getPredictionIcon(anomaly.prediction)}
                    <span className="font-medium text-foreground text-sm sm:text-base">{anomaly.zone}</span>
                    <Badge variant={getRiskColor(anomaly.risk_level)} className="text-xs">
                      {isMobile ? anomaly.risk_level.charAt(0) : anomaly.risk_level} Risk
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-2 w-2 sm:h-3 sm:w-3" />
                    {formatTimestamp(anomaly.created_at)}
                  </div>
                </div>
                
                <div className="text-xs sm:text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
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
                        <span className="text-muted-foreground">Risk Probability:</span>
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {(anomaly.anomaly_probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-border text-xs">
                        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2'} gap-1 sm:gap-2 text-muted-foreground`}>
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
