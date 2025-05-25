
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FacilityMap from './FacilityMap';
import StatCards from './StatCards';
import IoTStats from './IoTStats';
import IoTCharts from './IoTCharts';
import RealtimeControls from './RealtimeControls';
import { useIoTData } from '@/hooks/useIoTData';
import { Activity, BarChart3, Map, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const {
    data: iotData,
    isLoading: iotLoading,
    error: iotError,
    isRealtime,
    interval,
    toggleRealtime,
    updateInterval,
    refetch,
  } = useIoTData();

  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6 p-6 relative z-10">
      <div>
        <h2 className="text-3xl font-bold mb-2">{t('nav.dashboard')}</h2>
        <p className="text-muted-foreground">{t('dashboard.quickStats')}</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 relative z-10">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="iot-stats" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            IoT Stats
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="facility" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Facility
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 relative z-10">
          <StatCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            <div className="lg:col-span-2">
              {iotLoading ? (
                <Card className="neumorphic-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mintGreen"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : iotError ? (
                <Card className="neumorphic-card">
                  <CardContent className="p-6">
                    <div className="text-center text-red-500">
                      <p>Error loading IoT data: {iotError}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <IoTStats data={iotData} />
              )}
            </div>
            
            <div>
              <RealtimeControls
                isRealtime={isRealtime}
                interval={interval}
                onToggleRealtime={toggleRealtime}
                onUpdateInterval={updateInterval}
                onRefresh={refetch}
                dataCount={iotData.length}
                lastUpdate={iotData[0]?.timestamp}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="iot-stats" className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              {iotLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mintGreen"></div>
                </div>
              ) : (
                <IoTStats data={iotData} />
              )}
            </div>
            <div>
              <RealtimeControls
                isRealtime={isRealtime}
                interval={interval}
                onToggleRealtime={toggleRealtime}
                onUpdateInterval={updateInterval}
                onRefresh={refetch}
                dataCount={iotData.length}
                lastUpdate={iotData[0]?.timestamp}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6 relative z-10">
          {iotLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mintGreen"></div>
            </div>
          ) : (
            <IoTCharts data={iotData} />
          )}
        </TabsContent>

        <TabsContent value="facility" className="space-y-6 relative z-20">
          <FacilityMap />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
