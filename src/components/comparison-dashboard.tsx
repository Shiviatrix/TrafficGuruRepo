'use client';

import { useState, useCallback, useReducer } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Car, Siren, ServerCrash } from 'lucide-react';
import Dashboard from '@/components/dashboard';
import type { SimulationMetrics, SimulationState } from '@/lib/types';
import { DashboardControls } from '@/components/dashboard-controls';
import { runSimulationCycle } from '@/lib/simulation-runner';
import * as CONSTANTS from '@/lib/constants';
import { useToast } from "@/hooks/use-toast"

type SimAction = { type: 'UPDATE'; payload: Partial<SimulationState> };
const simStateReducer = (state: SimulationState, action: SimAction) => ({ ...state, ...action.payload });


export default function ComparisonDashboard() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  
  const { toast } = useToast();

  // We use useReducer to manage state updates without forcing a full re-render on every tick.
  const [adaptiveState, dispatchAdaptive] = useReducer(simStateReducer, {...CONSTANTS.INITIAL_SIMULATION_STATE, mode: 'adaptive'});
  const [fixedState, dispatchFixed] = useReducer(simStateReducer, {...CONSTANTS.INITIAL_SIMULATION_STATE, mode: 'fixed'});

  const handleStart = () => setIsSimulating(true);
  const handleStop = () => setIsSimulating(false);
  
  const handleReset = useCallback(() => {
    setIsSimulating(false);
    setIsFastForwarding(false);
    dispatchAdaptive({ type: 'UPDATE', payload: {...CONSTANTS.INITIAL_SIMULATION_STATE, mode: 'adaptive'} });
    dispatchFixed({ type: 'UPDATE', payload: {...CONSTANTS.INITIAL_SIMULATION_STATE, mode: 'fixed'} });
  }, []);

  const runFastForward = async () => {
    setIsFastForwarding(true);
    let currentAdaptiveState = adaptiveState.cycleCount > 0 ? adaptiveState : {...CONSTANTS.INITIAL_SIMULATION_STATE, mode: 'adaptive'};
    let currentFixedState = fixedState.cycleCount > 0 ? fixedState : {...CONSTANTS.INITIAL_SIMULATION_STATE, mode: 'fixed'};

    try {
      const FAST_FORWARD_CYCLES = 100;
      for (let i = 0; i < FAST_FORWARD_CYCLES * 2; i++) { // x2 because each "cycle" is one phase change
        currentAdaptiveState = await runSimulationCycle(currentAdaptiveState);
        currentFixedState = await runSimulationCycle(currentFixedState);
        
        // Update UI only periodically to avoid freezing the browser
        if (i % 20 === 0) {
            dispatchAdaptive({ type: 'UPDATE', payload: currentAdaptiveState });
            dispatchFixed({ type: 'UPDATE', payload: currentFixedState });
        }
      }
      
      dispatchAdaptive({ type: 'UPDATE', payload: currentAdaptiveState });
      dispatchFixed({ type: 'UPDATE', payload: currentFixedState });

    } catch (error) {
        console.error("Fast-forward simulation failed:", error);
        toast({
          variant: "destructive",
          title: "Simulation Error",
          description: "An error occurred during the fast-forward simulation.",
          icon: <ServerCrash />,
        })
    } finally {
      setIsFastForwarding(false);
    }
  };

  const totalCycles = Math.max(adaptiveState.metrics.cycleCount, fixedState.metrics.cycleCount);
  const efficiencyGain = fixedState.metrics.totalVehicles > 0
    ? ((adaptiveState.metrics.totalVehicles - fixedState.metrics.totalVehicles) / fixedState.metrics.totalVehicles) * 100
    : 0;

  return (
    <div className="space-y-8">
       <DashboardControls
        isSimulating={isSimulating}
        isFastForwarding={isFastForwarding}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
        onFastForward={runFastForward}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Adaptive Control</h2>
            <Dashboard 
              isSimulating={isSimulating}
              isFastForwarding={isFastForwarding} 
              currentState={adaptiveState} 
              dispatch={dispatchAdaptive}
             />
        </div>
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Fixed Time</h2>
             <Dashboard 
              isSimulating={isSimulating}
              isFastForwarding={isFastForwarding} 
              currentState={fixedState}
              dispatch={dispatchFixed}
             />
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
                After {totalCycles} cycles, the adaptive system has processed {adaptiveState.metrics.totalVehicles.toFixed(0)} vehicles compared to the fixed system's {fixedState.metrics.totalVehicles.toFixed(0)}.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex items-center">
                    <Car className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-medium">Total Vehicles (Adaptive): </span>
                    <span className="text-sm font-bold ml-auto">{adaptiveState.metrics.totalVehicles.toFixed(0)}</span>
                </div>
                <div className="flex items-center">
                    <Car className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-medium">Total Vehicles (Fixed): </span>
                    <span className="text-sm font-bold ml-auto">{fixedState.metrics.totalVehicles.toFixed(0)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                    <Siren className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-medium">Emergency Vehicles (Adaptive): </span>
                    <span className="text-sm font-bold ml-auto">{adaptiveState.metrics.emergencyVehicles.toFixed(0)}</span>
                </div>
                <div className="flex items-center">
                    <Siren className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-medium">Emergency Vehicles (Fixed): </span>
                    <span className="text-sm font-bold ml-auto">{fixedState.metrics.emergencyVehicles.toFixed(0)}</span>
                </div>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
