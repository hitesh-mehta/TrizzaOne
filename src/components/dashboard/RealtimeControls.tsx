
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, RefreshCw, Activity } from 'lucide-react';

interface RealtimeControlsProps {
  isRealtime: boolean;
  interval: 5 | 30 | 60 | 300;
  onToggleRealtime: (enabled: boolean) => void;
  onUpdateInterval: (interval: 5 | 30 | 60 | 300) => void;
  onRefresh: () => void;
  dataCount: number;
  lastUpdate?: string;
}

const RealtimeControls: React.FC<RealtimeControlsProps> = ({
  isRealtime,
  interval,
  onToggleRealtime,
  onUpdateInterval,
  onRefresh,
  dataCount,
  lastUpdate,
}) => {
  const { t } = useTranslation();

  const intervalOptions = [
    { value: 5, label: t('realtimeControls.5seconds') },
    { value: 30, label: t('realtimeControls.30seconds') },
    { value: 60, label: t('realtimeControls.1minute') },
    { value: 300, label: t('realtimeControls.5minutes') },
  ];

  return (
    <Card className="neumorphic-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-mintGreen" />
          {t('realtimeControls.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('realtimeControls.simulation')}</p>
            <p className="text-xs text-muted-foreground">
              {t('realtimeControls.simulationDesc')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={isRealtime}
              onCheckedChange={onToggleRealtime}
              id="realtime-toggle"
            />
            <Badge variant={isRealtime ? 'default' : 'secondary'}>
              {isRealtime ? t('iot.on') : t('iot.off')}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t('realtimeControls.updateInterval')}</p>
            <Select
              value={interval.toString()}
              onValueChange={(value) => onUpdateInterval(Number(value) as 5 | 30 | 60 | 300)}
              disabled={!isRealtime}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {intervalOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t('realtimeControls.manualRefresh')}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              {t('realtimeControls.refresh')}
            </Button>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('realtimeControls.totalRecords')}:</span>
            <span className="font-medium">{dataCount}</span>
          </div>
          {lastUpdate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('realtimeControls.lastUpdate')}:</span>
              <span className="font-medium text-xs">
                {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('realtimeControls.status')}:</span>
            <div className="flex items-center gap-1">
              {isRealtime ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-500 text-xs font-medium">{t('realtimeControls.live')}</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-gray-500 text-xs font-medium">{t('realtimeControls.paused')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {isRealtime && (
          <div className="bg-mintGreen/10 border border-mintGreen/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Activity className="h-4 w-4 text-mintGreen mt-0.5 animate-pulse" />
              <div className="text-xs">
                <p className="font-medium text-mintGreen">{t('realtimeControls.simulationActive')}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealtimeControls;
