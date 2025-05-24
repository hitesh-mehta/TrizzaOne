
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { IoTData } from '@/hooks/useIoTData';
import { format } from 'date-fns';

interface IoTChartsProps {
  data: IoTData[];
}

const IoTCharts: React.FC<IoTChartsProps> = ({ data }) => {
  if (data.length === 0) return null;

  // Prepare data for charts (last 20 records, reversed for chronological order)
  const chartData = data.slice(0, 20).reverse().map(item => ({
    time: format(new Date(item.timestamp), 'HH:mm'),
    fullTime: format(new Date(item.timestamp), 'MMM dd, HH:mm'),
    temperature: Number(item.temperature),
    humidity: Number(item.humidity),
    co2: Number(item.co2_level),
    light: Number(item.light_level),
    occupancy: item.occupancy_count,
    energy: Number(item.energy_consumed_kwh),
    battery: Number(item.battery_backup_level),
    zone: item.zone,
  }));

  // Zone distribution data
  const zoneData = ['Zone01', 'Zone02', 'Zone03', 'Zone04'].map(zone => ({
    name: zone,
    value: data.filter(item => item.zone === zone).length,
    fill: zone === 'Zone01' ? '#4ECCA3' : zone === 'Zone02' ? '#FF6B6B' : zone === 'Zone03' ? '#4ECDC4' : '#45B7D1'
  }));

  // Power status data
  const powerData = [
    { name: 'ON', value: data.filter(item => item.power_status === 'on').length, fill: '#4ECCA3' },
    { name: 'OFF', value: data.filter(item => item.power_status === 'off').length, fill: '#FF6B6B' }
  ];

  const chartConfig = {
    temperature: { label: "Temperature", color: "#FF6B6B" },
    humidity: { label: "Humidity", color: "#4ECDC4" },
    co2: { label: "CO₂", color: "#45B7D1" },
    light: { label: "Light", color: "#FFA726" },
    occupancy: { label: "Occupancy", color: "#9C27B0" },
    energy: { label: "Energy", color: "#4ECCA3" },
    battery: { label: "Battery", color: "#8BC34A" },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Temperature & Humidity Chart */}
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>Temperature & Humidity Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis dataKey="time" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="temperature" stroke="var(--color-temperature)" strokeWidth={2} name="Temperature (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="var(--color-humidity)" strokeWidth={2} name="Humidity (%)" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* CO₂ & Light Level Chart */}
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>Air Quality & Lighting</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <XAxis dataKey="time" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="co2" stackId="1" stroke="var(--color-co2)" fill="var(--color-co2)" fillOpacity={0.3} name="CO₂ (ppm)" />
                <Area type="monotone" dataKey="light" stackId="2" stroke="var(--color-light)" fill="var(--color-light)" fillOpacity={0.3} name="Light (lux)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Occupancy & Energy Chart */}
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>Occupancy & Energy Consumption</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="time" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="occupancy" fill="var(--color-occupancy)" name="Occupancy" />
                <Bar dataKey="energy" fill="var(--color-energy)" name="Energy (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Battery Level Chart */}
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>Battery Backup Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="battery" stroke="var(--color-battery)" strokeWidth={3} name="Battery (%)" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Zone Distribution */}
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>Data Distribution by Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={zoneData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {zoneData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Power Status */}
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>Power Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={powerData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {powerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default IoTCharts;
