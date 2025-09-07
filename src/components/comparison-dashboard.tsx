'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Car, Siren } from 'lucide-react';
import Dashboard from '@/components/dashboard';
import type { SimulationMetrics } from '@/lib/types';
import { DashboardControls } from '@/components/dashboard-controls';

export default function ComparisonDashboard() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [adaptiveMetrics, setAdaptiveMetrics] = useState<SimulationMetrics>({ totalVehicles: 0, cycleCount: 0, emergencyVehicles: 0 });
  const [fixedMetrics, setFixedMetrics] = useState<SimulationMetrics>({ totalVehicles: 0, cycleCount: 0, emergencyVehicles: 0 });

  const handleStart = () => setIsSimulating(true);
  const handleStop = () => setIsSimulating(false);
  const handleReset = () => {
    setIsSimulating(false);
    // The Dashboard components will reset their internal state via the isSimulating prop changing
  };


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
       <DashboardControls
        isSimulating={isSimulating}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Adaptive Control</h2>
            <Dashboard mode="adaptive" onMetricsUpdate={handleAdaptiveUpdate} isSimulating={isSimulating} />
        </div>
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Fixed Time</h2>
            <Dashboard mode="fixed" onMetricsUpdate={handleFixedUpdate} isSimulating={isSimulating} />
        </div>
      </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex items-center">
                    <Car className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-medium">Total Vehicles (Adaptive): </span>
                    <span className="text-sm font-bold ml-auto">{adaptiveMetrics.totalVehicles.toFixed(0)}</span>
                </div>
                <div className="flex items-center">
                    <Car className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-medium">Total Vehicles (Fixed): </span>
                    <span className="text-sm font-bold ml-auto">{fixedMetrics.totalVehicles.toFixed(0)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                    <Siren className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-medium">Emergency Vehicles (Adaptive): </span>
                    <span className="text-sm font-bold ml-auto">{adaptiveMetrics.emergencyVehicles.toFixed(0)}</span>
                </div>
                <div className="flex items-center">
                    <Siren className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-medium">Emergency Vehicles (Fixed): </span>
                    <span className="text-sm font-bold ml-auto">{fixedMetrics.emergencyVehicles.toFixed(0)}</span>
                </div>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
