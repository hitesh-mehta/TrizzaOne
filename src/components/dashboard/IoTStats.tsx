
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IoTData } from '@/hooks/useIoTData';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Lightbulb, 
  Users, 
  Zap, 
  Battery, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface IoTStatsProps {
  data: IoTData[];
}

const IoTStats: React.FC<IoTStatsProps> = ({ data }) => {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No IoT data available</p>
      </div>
    );
  }

  const latestData = data[0];
  const avgTemp = data.slice(0, 10).reduce((sum, d) => sum + Number(d.temperature), 0) / Math.min(data.length, 10);
  const avgHumidity = data.slice(0, 10).reduce((sum, d) => sum + Number(d.humidity), 0) / Math.min(data.length, 10);
  const avgCO2 = data.slice(0, 10).reduce((sum, d) => sum + Number(d.co2_level), 0) / Math.min(data.length, 10);
  const totalOccupancy = data.slice(0, 10).reduce((sum, d) => sum + d.occupancy_count, 0);
  const avgEnergyConsumption = data.slice(0, 10).reduce((sum, d) => sum + Number(d.energy_consumed_kwh), 0) / Math.min(data.length, 10);
  const avgBatteryLevel = data.slice(0, 10).reduce((sum, d) => sum + Number(d.battery_backup_level), 0) / Math.min(data.length, 10);

  const alertCount = data.slice(0, 10).filter(d => 
    d.fire_alarm_triggered === 'yes' || 
    d.gas_leak_detected === 'yes' || 
    Number(d.battery_backup_level) < 20 ||
    Number(d.temperature) > 35 ||
    d.power_status === 'off'
  ).length;

  const stats = [
    {
      title: t('iot.temperature'),
      value: `${Number(latestData.temperature).toFixed(1)}°C`,
      average: `${t('iot.average')}: ${avgTemp.toFixed(1)}°C`,
      icon: Thermometer,
      color: Number(latestData.temperature) > 30 ? 'text-red-500' : 'text-blue-500',
      bgColor: Number(latestData.temperature) > 30 ? 'bg-red-500/10' : 'bg-blue-500/10',
    },
    {
      title: t('iot.humidity'),
      value: `${Number(latestData.humidity).toFixed(1)}%`,
      average: `${t('iot.average')}: ${avgHumidity.toFixed(1)}%`,
      icon: Droplets,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: t('iot.co2Level'),
      value: `${Number(latestData.co2_level).toFixed(0)} ppm`,
      average: `${t('iot.average')}: ${avgCO2.toFixed(0)} ppm`,
      icon: Wind,
      color: Number(latestData.co2_level) > 450 ? 'text-orange-500' : 'text-green-500',
      bgColor: Number(latestData.co2_level) > 450 ? 'bg-orange-500/10' : 'bg-green-500/10',
    },
    {
      title: t('iot.lightLevel'),
      value: `${Number(latestData.light_level).toFixed(0)} lux`,
      average: `${t('iot.zone')}: ${latestData.zone}`,
      icon: Lightbulb,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: t('iot.occupancy'),
      value: `${latestData.occupancy_count}`,
      average: `${t('iot.total')}: ${totalOccupancy}`,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: t('iot.energyUsage'),
      value: `${Number(latestData.energy_consumed_kwh).toFixed(1)} kWh`,
      average: `${t('iot.average')}: ${avgEnergyConsumption.toFixed(1)} kWh`,
      icon: Zap,
      color: 'text-mintGreen',
      bgColor: 'bg-mintGreen/10',
    },
    {
      title: t('iot.batteryLevel'),
      value: `${Number(latestData.battery_backup_level).toFixed(1)}%`,
      average: `${t('iot.average')}: ${avgBatteryLevel.toFixed(1)}%`,
      icon: Battery,
      color: Number(latestData.battery_backup_level) < 20 ? 'text-red-500' : 'text-green-500',
      bgColor: Number(latestData.battery_backup_level) < 20 ? 'bg-red-500/10' : 'bg-green-500/10',
    },
    {
      title: t('iot.systemStatus'),
      value: alertCount === 0 ? t('iot.normal') : `${alertCount} ${t('iot.alerts')}`,
      average: `${t('iot.floor')}: ${latestData.floor}`,
      icon: alertCount === 0 ? CheckCircle : AlertTriangle,
      color: alertCount === 0 ? 'text-green-500' : 'text-red-500',
      bgColor: alertCount === 0 ? 'bg-green-500/10' : 'bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="neumorphic-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <p className="text-xs text-muted-foreground">{stat.average}</p>
                  </div>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="neumorphic-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {t('iot.systemStatusOverview')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('iot.powerStatus')}</p>
                <Badge variant={latestData.power_status === 'on' ? 'default' : 'destructive'}>
                  {latestData.power_status === 'on' ? t('iot.on') : t('iot.off')}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('iot.airPurifier')}</p>
                <Badge variant={latestData.air_purifier_status === 'on' ? 'default' : 'secondary'}>
                  {latestData.air_purifier_status === 'on' ? t('iot.on') : t('iot.off')}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('iot.motionDetected')}</p>
                <Badge variant={latestData.motion_detected === 'yes' ? 'default' : 'secondary'}>
                  {latestData.motion_detected === 'yes' ? t('iot.yes') : t('iot.no')}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('iot.cleaningStatus')}</p>
                <Badge variant={
                  latestData.cleaning_status === 'done' ? 'default' : 
                  latestData.cleaning_status === 'inprogress' ? 'secondary' : 'outline'
                }>
                  {latestData.cleaning_status === 'done' ? t('iot.done') : 
                   latestData.cleaning_status === 'inprogress' ? t('iot.inprogress') : t('iot.pending')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {t('iot.safetyAlerts')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('iot.fireAlarm')}</span>
                <Badge variant={latestData.fire_alarm_triggered === 'yes' ? 'destructive' : 'default'}>
                  {latestData.fire_alarm_triggered === 'yes' ? t('iot.triggered') : t('iot.normal')}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('iot.gasLeak')}</span>
                <Badge variant={latestData.gas_leak_detected === 'yes' ? 'destructive' : 'default'}>
                  {latestData.gas_leak_detected === 'yes' ? t('iot.detected') : t('iot.normal')}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('iot.lastCleaned')}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {latestData.last_cleaned_timestamp 
                    ? new Date(latestData.last_cleaned_timestamp).toLocaleString()
                    : t('iot.never')
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IoTStats;
