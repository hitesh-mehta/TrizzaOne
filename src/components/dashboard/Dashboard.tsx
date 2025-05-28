
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FacilityMap from './FacilityMap';
import StatCards from './StatCards';
import IoTStats from './IoTStats';
import IoTCharts from './IoTCharts';
import RealtimeControls from './RealtimeControls';
import AnomalyViewer from './AnomalyViewer';
import { useIoTData } from '@/hooks/useIoTData';
import { Activity, BarChart3, Map, TrendingUp, AlertTriangle } from 'lucide-react';

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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 relative z-10">
      <div className="mobile-center">
        <h2 className="responsive-title font-bold mb-2">{t('nav.dashboard')}</h2>
        <p className="text-muted-foreground responsive-body">{t('dashboard.quickStats')}</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6 relative z-10">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 min-w-max sm:min-w-0">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Over</span>
            </TabsTrigger>
            <TabsTrigger value="iot-stats" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">IoT Stats</span>
              <span className="sm:hidden">IoT</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Chart</span>
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Anomalies</span>
              <span className="sm:hidden">Alert</span>
            </TabsTrigger>
            <TabsTrigger value="facility" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <Map className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Facility</span>
              <span className="sm:hidden">Map</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6 relative z-10">
          <StatCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 relative z-10">
            <div className="lg:col-span-2 order-2 lg:order-1">
              {iotLoading ? (
                <Card className="neumorphic-card">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-center h-32 sm:h-40">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-mintGreen"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : iotError ? (
                <Card className="neumorphic-card">
                  <CardContent className="p-4 sm:p-6">
                    <div className="text-center text-red-500">
                      <p className="text-sm sm:text-base">Error loading IoT data: {iotError}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <IoTStats data={iotData} />
              )}
            </div>
            
            <div className="order-1 lg:order-2">
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

        <TabsContent value="iot-stats" className="space-y-4 sm:space-y-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="lg:col-span-3 order-2 lg:order-1">
              {iotLoading ? (
                <div className="flex items-center justify-center h-32 sm:h-40">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-mintGreen"></div>
                </div>
              ) : (
                <IoTStats data={iotData} />
              )}
            </div>
            <div className="order-1 lg:order-2">
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

        <TabsContent value="charts" className="space-y-4 sm:space-y-6 relative z-10">
          {iotLoading ? (
            <div className="flex items-center justify-center h-32 sm:h-40">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-mintGreen"></div>
            </div>
          ) : (
            <IoTCharts data={iotData} />
          )}
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4 sm:space-y-6 relative z-10">
          <AnomalyViewer />
        </TabsContent>

        <TabsContent value="facility" className="space-y-4 sm:space-y-6 relative z-30">
          <FacilityMap />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
