
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
    { value: 5, label: '5 seconds' },
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
  ];

  return (
    <Card className="neumorphic-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-mintGreen" />
          Real-time Data Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Real-time Simulation</p>
            <p className="text-xs text-muted-foreground">
              Automatically generate new sensor data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={isRealtime}
              onCheckedChange={onToggleRealtime}
              id="realtime-toggle"
            />
            <Badge variant={isRealtime ? 'default' : 'secondary'}>
              {isRealtime ? 'ON' : 'OFF'}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Update Interval</p>
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
            <p className="text-sm font-medium">Manual Refresh</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Records:</span>
            <span className="font-medium">{dataCount}</span>
          </div>
          {lastUpdate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Update:</span>
              <span className="font-medium text-xs">
                {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <div className="flex items-center gap-1">
              {isRealtime ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-500 text-xs font-medium">LIVE</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-gray-500 text-xs font-medium">PAUSED</span>
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
                <p className="font-medium text-mintGreen">Simulation Active</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealtimeControls;
