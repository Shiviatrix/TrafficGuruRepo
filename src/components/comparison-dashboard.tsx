'use client';

import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Car } from 'lucide-react';
import Dashboard from '@/components/dashboard';
import type { SimulationMetrics } from '@/lib/types';

export default function ComparisonDashboard() {
  const [adaptiveMetrics, setAdaptiveMetrics] = useState<SimulationMetrics>({ totalVehicles: 0, cycleCount: 0 });
  const [fixedMetrics, setFixedMetrics] = useState<SimulationMetrics>({ totalVehicles: 0, cycleCount: 0 });

  const handleAdaptiveUpdate = useCallback((metrics: SimulationMetrics) => {
    setAdaptiveMetrics(metrics);
  }, []);

  const handleFixedUpdate = useCallback((metrics: SimulationMetrics) => {
    setFixedMetrics(metrics);
  }, []);
  
  const efficiencyGain = fixedMetrics.totalVehicles > 0
    ? ((adaptiveMetrics.totalVehicles - fixedMetrics.totalVehicles) / fixedMetrics.totalVehicles) * 100
    : 0;

  const cycleCount = Math.max(adaptiveMetrics.cycleCount, fixedMetrics.cycleCount);

  return (
    <div className="space-y-8">
      <Tabs defaultValue="adaptive" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="adaptive">Adaptive Control</TabsTrigger>
          <TabsTrigger value="fixed">Fixed Time</TabsTrigger>
        </TabsList>
        <TabsContent value="adaptive">
          <Dashboard mode="adaptive" onMetricsUpdate={handleAdaptiveUpdate} />
        </TabsContent>
        <TabsContent value="fixed">
          <Dashboard mode="fixed" onMetricsUpdate={handleFixedUpdate} />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Performance Comparison</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="text-2xl font-bold text-primary">
                {efficiencyGain.toFixed(1)}% More Throughput
            </div>
            <p className="text-xs text-muted-foreground">
                After {cycleCount} cycles, the adaptive system has processed {adaptiveMetrics.totalVehicles.toFixed(0)} vehicles compared to the fixed system's {fixedMetrics.totalVehicles.toFixed(0)}.
            </p>
            <div className="flex items-center pt-2">
                <Car className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm font-medium">Total Vehicles Processed (Adaptive): </span>
                <span className="text-sm font-bold ml-auto">{adaptiveMetrics.totalVehicles.toFixed(0)}</span>
            </div>
            <div className="flex items-center">
                <Car className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm font-medium">Total Vehicles Processed (Fixed): </span>
                <span className="text-sm font-bold ml-auto">{fixedMetrics.totalVehicles.toFixed(0)}</span>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
