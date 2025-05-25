
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Droplets, Zap, Users, Activity, Shield } from 'lucide-react';

interface IoTData {
  id: string;
  zone: string;
  floor: number;
  temperature: number;
  humidity: number;
  co2_level: number;
  light_level: number;
  occupancy_count: number;
  motion_detected: boolean;
  power_status: boolean;
  energy_consumed_kwh: number;
  battery_backup_level: number;
  cleaning_status: string;
  last_cleaned_timestamp: string | null;
  fire_alarm_triggered: boolean;
  gas_leak_detected: boolean;
  air_purifier_status: boolean;
  timestamp: string;
}

interface IoTStatsProps {
  data: IoTData[];
}

const IoTStats: React.FC<IoTStatsProps> = ({ data }) => {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <Card className="neumorphic-card">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No IoT data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate averages from all data points
  const avgTemp = (data.reduce((sum, item) => sum + item.temperature, 0) / data.length).toFixed(1);
  const avgHumidity = (data.reduce((sum, item) => sum + item.humidity, 0) / data.length).toFixed(1);
  const totalOccupancy = data.reduce((sum, item) => sum + item.occupancy_count, 0);
  const avgCO2 = (data.reduce((sum, item) => sum + item.co2_level, 0) / data.length).toFixed(0);
  const avgEnergy = (data.reduce((sum, item) => sum + item.energy_consumed_kwh, 0) / data.length).toFixed(2);

  // Get latest data for status indicators
  const latestData = data[0];

  // Group data by zone for facility overview
  const zoneData = data.reduce((acc, item) => {
    if (!acc[item.zone]) {
      acc[item.zone] = [];
    }
    acc[item.zone].push(item);
    return acc;
  }, {} as Record<string, IoTData[]>);

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-500';
    if (value <= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getCleaningStatusTranslation = (status: string) => {
    switch (status.toLowerCase()) {
      case 'clean':
        return t('facility.cleaning') + ': Clean';
      case 'dirty':
        return t('facility.cleaning') + ': Dirty';
      case 'in_progress':
        return t('facility.cleaning') + ': In Progress';
      default:
        return t('facility.cleaning') + ': ' + status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="neumorphic-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5 text-coral" />
              <div>
                <p className="text-xs text-muted-foreground">{t('facility.temp')}</p>
                <p className={`text-lg font-semibold ${getStatusColor(parseFloat(avgTemp), { good: 24, warning: 28 })}`}>
                  {avgTemp}°C
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className={`text-lg font-semibold ${getStatusColor(parseFloat(avgHumidity), { good: 60, warning: 80 })}`}>
                  {avgHumidity}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-mintGreen" />
              <div>
                <p className="text-xs text-muted-foreground">{t('facility.occupancy')}</p>
                <p className="text-lg font-semibold text-mintGreen">{totalOccupancy}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">CO₂</p>
                <p className={`text-lg font-semibold ${getStatusColor(parseFloat(avgCO2), { good: 800, warning: 1200 })}`}>
                  {avgCO2} ppm
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Energy</p>
                <p className="text-lg font-semibold text-yellow-600">{avgEnergy} kWh</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(zoneData).map(([zone, zoneItems]) => {
          const zoneAvgTemp = (zoneItems.reduce((sum, item) => sum + item.temperature, 0) / zoneItems.length).toFixed(1);
          const zoneOccupancy = zoneItems.reduce((sum, item) => sum + item.occupancy_count, 0);
          const latestZoneData = zoneItems[0];
          
          const getZoneTranslation = (zoneName: string) => {
            switch (zoneName.toLowerCase()) {
              case 'kitchen':
                return t('facility.kitchen');
              case 'dining':
              case 'dining_area':
                return t('facility.dining');
              case 'pantry':
                return t('facility.pantry');
              default:
                return zoneName;
            }
          };

          return (
            <Card key={zone} className="neumorphic-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{getZoneTranslation(zone)}</CardTitle>
                  <Badge variant={latestZoneData.power_status ? "default" : "destructive"}>
                    {latestZoneData.power_status ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('facility.temp')}:</span>
                    <span className="ml-1 font-medium">{zoneAvgTemp}°C</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('facility.occupancy')}:</span>
                    <span className="ml-1 font-medium">{zoneOccupancy}</span>
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="text-muted-foreground">{getCleaningStatusTranslation(latestZoneData.cleaning_status)}</span>
                </div>

                {/* Status Indicators */}
                <div className="flex space-x-2">
                  {latestZoneData.motion_detected && (
                    <Badge variant="outline" className="text-xs">Motion</Badge>
                  )}
                  {latestZoneData.air_purifier_status && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Air Purifier
                    </Badge>
                  )}
                  {(latestZoneData.fire_alarm_triggered || latestZoneData.gas_leak_detected) && (
                    <Badge variant="destructive" className="text-xs">Alert</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default IoTStats;
