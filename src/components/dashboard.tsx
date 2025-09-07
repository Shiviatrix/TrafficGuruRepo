'use client';

import { useEffect, useRef, useMemo } from 'react';
import { TrafficCard } from '@/components/traffic-card';
import * as CONSTANTS from '@/lib/constants';
import type { DashboardProps, SimulationState } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"
import { runSimulationCycle } from '@/lib/simulation-runner';
import { ServerCrash } from 'lucide-react';


export default function Dashboard({ isSimulating, currentState, dispatch }: DashboardProps) {
  const cycleTimeout = useRef<NodeJS.Timeout | null>(null);
  const uiInterval = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Stop all timers and intervals when the component unmounts or simulation stops
    return () => {
      if (cycleTimeout.current) clearTimeout(cycleTimeout.current);
      if (uiInterval.current) clearInterval(uiInterval.current);
    };
  }, []);

  useEffect(() => {
    if (isSimulating && currentState.cycleCount === 0) {
      // If simulation starts from a reset state, trigger the first cycle immediately
      runCycle();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating, currentState.cycleCount]);


  const runCycle = async () => {
      try {
        const nextState = await runSimulationCycle(currentState);
        dispatch({ type: 'UPDATE', payload: nextState });
      } catch (error) {
        console.error(`Simulation cycle failed for mode: ${currentState.mode}`, error);
        toast({
          variant: "destructive",
          title: "Simulation Error",
          description: "An error occurred during the simulation cycle. Check the console for details.",
          icon: <ServerCrash />
        })
        // Stop simulation on error
        if (cycleTimeout.current) clearTimeout(cycleTimeout.current);
        if (uiInterval.current) clearInterval(uiInterval.current);
      }
  };
  
  useEffect(() => {
    if (!isSimulating) {
        if (cycleTimeout.current) clearTimeout(cycleTimeout.current);
        if (uiInterval.current) clearInterval(uiInterval.current);
        return;
    }
    
    // Main simulation cycle trigger
    const cycleDurationMs = currentState.timer * 1000;
    cycleTimeout.current = setTimeout(runCycle, cycleDurationMs > 0 ? cycleDurationMs : 100);

    // UI countdown timer
    uiInterval.current = setInterval(() => {
      dispatch({ type: 'UPDATE', payload: { timer: Math.max(0, currentState.timer - (CONSTANTS.UI_UPDATE_INTERVAL_MS / 1000)) } });
    }, CONSTANTS.UI_UPDATE_INTERVAL_MS);


    return () => {
      if (cycleTimeout.current) clearTimeout(cycleTimeout.current);
      if (uiInterval.current) clearInterval(uiInterval.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating, currentState.cycleCount, currentState.phase]); // Rerun effect when state changes


  const { nsTimer, nsProgress, ewTimer, ewProgress, nsDelta, ewDelta, nsExplanation, ewExplanation } = useMemo(() => {
    const { phase, activeGroup, ns_green_s, ew_green_s, timer, delta_used_s, explanation, mode } = currentState;
    const isAdaptive = mode === 'adaptive';
    
    let cycleDuration = phase === 'GREEN' ? (activeGroup === 'NS' ? ns_green_s : ew_green_s) : CONSTANTS.YELLOW_S;
    if (cycleDuration <= 0) cycleDuration = 1; // Prevent division by zero
    const currentProgress = (timer / cycleDuration) * 100;

    const getTimer = (group: 'NS' | 'EW') => (activeGroup === group ? timer : (group === 'NS' ? ns_green_s : ew_green_s));
    const getProgress = (group: 'NS' | 'EW') => (activeGroup === group ? currentProgress : 100);

    return {
        nsTimer: getTimer('NS'),
        nsProgress: getProgress('NS'),
        ewTimer: getTimer('EW'),
        ewProgress: getProgress('EW'),
        nsDelta: isAdaptive && activeGroup === 'NS' ? delta_used_s : undefined,
        ewDelta: isAdaptive && activeGroup === 'EW' ? delta_used_s : undefined,
        nsExplanation: isAdaptive && activeGroup === 'NS' && phase === 'GREEN' ? explanation : 'Waiting for phase...',
        ewExplanation: isAdaptive && activeGroup === 'EW' && phase === 'GREEN' ? explanation : 'Waiting for phase...',
    };
  }, [currentState]);


  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TrafficCard
          title="North-South"
          status={currentState.ns_status}
          timer={nsTimer}
          progress={nsProgress}
          sensorData={currentState.groups.NS}
          delta={nsDelta}
          explanation={nsExplanation}
          showExplanation={currentState.mode === 'adaptive'}
        />
        <TrafficCard
          title="East-West"
          status={currentState.ew_status}
          timer={ewTimer}
          progress={ewProgress}
          sensorData={currentState.groups.EW}
          delta={ewDelta}
          explanation={ewExplanation}
          showExplanation={currentState.mode === 'adaptive'}
        />
      </div>
    </div>
  );
}
