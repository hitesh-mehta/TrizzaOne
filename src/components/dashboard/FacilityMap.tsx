
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Thermometer, Droplets, Users, Zap, Wifi } from 'lucide-react';

const FacilityMap: React.FC = () => {
  const { t } = useTranslation();
  const [selectedArea, setSelectedArea] = useState('overview');

  const facilityAreas = [
    { value: 'overview', label: 'Overview', icon: MapPin },
    { value: 'kitchen', label: 'Kitchen', icon: Thermometer },
    { value: 'dining', label: 'Dining Area', icon: Users },
    { value: 'storage', label: 'Storage', icon: Droplets },
    { value: 'hallway', label: 'Hallway', icon: Wifi },
  ];

  const mockData = {
    overview: {
      temperature: '28.5°C',
      humidity: '65%',
      occupancy: 45,
      status: 'Normal',
      sensors: 12,
      alerts: 0
    },
    kitchen: {
      temperature: '32.1°C',
      humidity: '70%',
      occupancy: 8,
      status: 'High Temp',
      sensors: 6,
      alerts: 1
    },
    dining: {
      temperature: '26.8°C',
      humidity: '60%',
      occupancy: 35,
      status: 'Normal',
      sensors: 4,
      alerts: 0
    },
    storage: {
      temperature: '24.2°C',
      humidity: '55%',
      occupancy: 2,
      status: 'Normal',
      sensors: 2,
      alerts: 0
    },
    hallway: {
      temperature: '27.5°C',
      humidity: '62%',
      occupancy: 12,
      status: 'Normal',
      sensors: 3,
      alerts: 0
    }
  };

  const currentData = mockData[selectedArea as keyof typeof mockData];

  return (
    <div className="space-y-6">
      <Card className="neumorphic-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-mintGreen" />
              {t('dashboard.facilityOverview')}
            </CardTitle>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {facilityAreas.map((area) => (
                  <SelectItem key={area.value} value={area.value}>
                    <div className="flex items-center gap-2">
                      <area.icon className="h-4 w-4" />
                      {area.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Temperature Card */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <Thermometer className="h-5 w-5 text-orange-500" />
                <Badge variant={currentData.temperature.includes('32') ? 'destructive' : 'default'}>
                  {currentData.temperature.includes('32') ? 'High' : 'Normal'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Temperature</p>
              <p className="text-2xl font-bold text-orange-600">{currentData.temperature}</p>
            </div>

            {/* Humidity Card */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                <Badge variant="default">Normal</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Humidity</p>
              <p className="text-2xl font-bold text-blue-600">{currentData.humidity}</p>
            </div>

            {/* Occupancy Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-purple-500" />
                <Badge variant="default">Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Occupancy</p>
              <p className="text-2xl font-bold text-purple-600">{currentData.occupancy}</p>
            </div>

            {/* Status Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <Zap className="h-5 w-5 text-green-500" />
                <Badge variant={currentData.status === 'Normal' ? 'default' : 'destructive'}>
                  {currentData.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">System Status</p>
              <p className="text-lg font-bold text-green-600">{currentData.status}</p>
            </div>

            {/* Sensors Card */}
            <div className="bg-gradient-to-br from-mintGreen/10 to-mintGreen/20 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <Wifi className="h-5 w-5 text-mintGreen" />
                <Badge variant="default">Online</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Active Sensors</p>
              <p className="text-2xl font-bold text-mintGreen">{currentData.sensors}</p>
            </div>

            {/* Alerts Card */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <Badge variant={currentData.alerts > 0 ? 'destructive' : 'default'}>
                  {currentData.alerts > 0 ? `${currentData.alerts} Alert${currentData.alerts > 1 ? 's' : ''}` : 'All Clear'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-600">{currentData.alerts}</p>
            </div>
          </div>

          {/* Facility Layout */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Facility Layout</h3>
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-lg">
              <div className="grid grid-cols-4 gap-4 h-64">
                {/* Kitchen */}
                <div 
                  className={`bg-orange-200 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedArea === 'kitchen' ? 'ring-2 ring-orange-500 bg-orange-300' : 'hover:bg-orange-300'
                  }`}
                  onClick={() => setSelectedArea('kitchen')}
                >
                  <div className="text-center">
                    <Thermometer className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <p className="text-sm font-medium">Kitchen</p>
                    <p className="text-xs text-orange-600">32.1°C</p>
                  </div>
                </div>

                {/* Dining Area */}
                <div 
                  className={`bg-blue-200 rounded-lg p-4 col-span-2 cursor-pointer transition-all ${
                    selectedArea === 'dining' ? 'ring-2 ring-blue-500 bg-blue-300' : 'hover:bg-blue-300'
                  }`}
                  onClick={() => setSelectedArea('dining')}
                >
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">Dining Area</p>
                    <p className="text-xs text-blue-600">35 people</p>
                  </div>
                </div>

                {/* Storage */}
                <div 
                  className={`bg-cyan-200 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedArea === 'storage' ? 'ring-2 ring-cyan-500 bg-cyan-300' : 'hover:bg-cyan-300'
                  }`}
                  onClick={() => setSelectedArea('storage')}
                >
                  <div className="text-center">
                    <Droplets className="h-8 w-8 mx-auto mb-2 text-cyan-600" />
                    <p className="text-sm font-medium">Storage</p>
                    <p className="text-xs text-cyan-600">55% humidity</p>
                  </div>
                </div>

                {/* Hallway */}
                <div 
                  className={`bg-mintGreen/40 rounded-lg p-4 col-span-4 cursor-pointer transition-all ${
                    selectedArea === 'hallway' ? 'ring-2 ring-mintGreen bg-mintGreen/60' : 'hover:bg-mintGreen/60'
                  }`}
                  onClick={() => setSelectedArea('hallway')}
                >
                  <div className="text-center">
                    <Wifi className="h-8 w-8 mx-auto mb-2 text-mintGreen" />
                    <p className="text-sm font-medium">Hallway</p>
                    <p className="text-xs text-mintGreen">12 people passing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacilityMap;
