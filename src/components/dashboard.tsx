'use client';

import { useState, useEffect, useRef } from 'react';
import { TrafficCard } from '@/components/traffic-card';
import { DashboardControls } from '@/components/dashboard-controls';
import * as CONSTANTS from '@/lib/constants';
import type { SimulationState, DashboardProps, VehicleThroughput } from '@/lib/types';
import { calculateDelta, type CalculateDeltaInput } from '@/ai/flows/calculate-delta';
import { explainDecisionReasoning, type ExplainDecisionReasoningInput } from '@/ai/flows/explain-decision-reasoning';
import { useToast } from "@/hooks/use-toast"

export default function Dashboard({ mode, onMetricsUpdate }: DashboardProps) {
  const [simState, setSimState] = useState<SimulationState>(CONSTANTS.INITIAL_SIMULATION_STATE);
  const cycleTimeout = useRef<NodeJS.Timeout | null>(null);
  const uiInterval = useRef<NodeJS.Timeout | null>(null);
  const throughput = useRef<VehicleThroughput>({ NS: 0, EW: 0 });
  const { toast } = useToast();

  const runSimulationCycle = async (currentState: SimulationState) => {
    try {
      // 1. Determine active/inactive groups for this cycle
      const prevActiveGroupName = currentState.activeGroup;
      const nextActiveGroupName = prevActiveGroupName === 'NS' ? 'EW' : 'NS';
      const prevCycleDuration = prevActiveGroupName === 'NS' ? currentState.ns_green_s : currentState.ew_green_s;

      // 2. Evolve state based on the *previous* cycle's duration
      const evolvedGroups = JSON.parse(JSON.stringify(currentState.groups));

      // 2a. Evolve Red Group
      const redGroup = evolvedGroups[nextActiveGroupName];
      redGroup.queue += (redGroup.count / 60) * prevCycleDuration;

      // 2b. Evolve Green Group & track throughput
      const greenGroup = evolvedGroups[prevActiveGroupName];
      const dischargedVehicles = Math.max(0, (prevCycleDuration - CONSTANTS.STARTUP_LOST_S) * (CONSTANTS.LANES_PER_APPROACH / CONSTANTS.HEADWAY_S));
      throughput.current[prevActiveGroupName] += dischargedVehicles;
      greenGroup.queue += (greenGroup.count / 60) * prevCycleDuration;
      greenGroup.queue = Math.max(0, greenGroup.queue - dischargedVehicles);

      // 2c. Evolve all groups' properties
      for (const groupName of ['NS', 'EW']) {
        const group = evolvedGroups[groupName as 'NS' | 'EW'];
        const jitter = (val: number, jitterAmount: number) => val * (1 + (Math.random() - 0.5) * 2 * jitterAmount);
        
        group.count = jitter(group.count, CONSTANTS.ARRIVAL_JITTER);
        group.weight = jitter(group.weight, CONSTANTS.WEIGHT_JITTER);
        group.mean = group.mean * (1 - CONSTANTS.MEAN_UPDATE_FACTOR) + group.queue * CONSTANTS.MEAN_UPDATE_FACTOR;

        if (group.emergency && Math.random() < CONSTANTS.EMERG_DECAY_P) group.emergency = false;
        if (!group.emergency && Math.random() < CONSTANTS.EMERG_SPAWN_P) group.emergency = true;
      }

      let delta = 0;
      let ns_green_s = CONSTANTS.BASE_GREEN_S;
      let ew_green_s = CONSTANTS.BASE_GREEN_S;

      if (mode === 'adaptive') {
        // 3. Calculate Delta for the *next* active group
        const groupToAdjust = evolvedGroups[nextActiveGroupName];
        const otherGroup = evolvedGroups[prevActiveGroupName];
        const avg_mean = (groupToAdjust.mean + otherGroup.mean) / 2;
        const avg_weight = (groupToAdjust.weight + otherGroup.weight) / 2;

        const deltaInput: CalculateDeltaInput = {
          emergencyBonus: groupToAdjust.emergency ? CONSTANTS.EMERGENCY_BONUS_S : 0,
          meanDemand: groupToAdjust.mean,
          avgMean: avg_mean,
          weightIndex: groupToAdjust.weight,
          avgWeight: avg_weight,
          alpha: CONSTANTS.ALPHA_PER_MEAN,
          beta: CONSTANTS.BETA_PER_WEIGHT,
          maxAdjust: CONSTANTS.MAX_ADJUST_S,
        };
        const { delta: calculatedDelta } = await calculateDelta(deltaInput);
        delta = calculatedDelta;
        
        // 4. Calculate and clamp green times
        const adjustment = nextActiveGroupName === 'NS' ? delta : -delta;
        ns_green_s += adjustment;
        ew_green_s -= adjustment;
      }

      const min_ns = evolvedGroups.NS.emergency ? CONSTANTS.MIN_GREEN_EMERG_S : CONSTANTS.MIN_GREEN_BASE_S;
      const min_ew = evolvedGroups.EW.emergency ? CONSTANTS.MIN_GREEN_EMERG_S : CONSTANTS.MIN_GREEN_BASE_S;
      ns_green_s = Math.max(min_ns, ns_green_s);
      ew_green_s = Math.max(min_ew, ew_green_s);


      // 5. Get AI explanation
      const explanationInput: ExplainDecisionReasoningInput = {
        group: nextActiveGroupName,
        ns_green_s,
        ew_green_s,
        delta_used_s: delta,
        ns_queue: evolvedGroups.NS.queue,
        ew_queue: evolvedGroups.EW.queue,
        ns_count: evolvedGroups.NS.count,
        ew_count: evolvedGroups.EW.count,
        ns_mean: evolvedGroups.NS.mean,
        ew_mean: evolvedGroups.EW.mean,
        ns_weight: evolvedGroups.NS.weight,
        ew_weight: evolvedGroups.EW.weight,
        ns_emergency: evolvedGroups.NS.emergency,
        ew_emergency: evolvedGroups.EW.emergency,
      };
      const { explanation } = await explainDecisionReasoning(explanationInput);
      
      // 6. Update state for next cycle
      const nextCycleDuration = nextActiveGroupName === 'NS' ? ns_green_s : ew_green_s;
      
      setSimState({
        ...currentState,
        cycleCount: currentState.cycleCount + 1,
        activeGroup: nextActiveGroupName,
        groups: evolvedGroups,
        ns_green_s,
        ew_green_s,
        delta_used_s: delta,
        timer: nextCycleDuration,
        progress: 100,
        explanation,
      });

      // 7. Report metrics
      if (onMetricsUpdate) {
        onMetricsUpdate({
          totalVehicles: throughput.current.NS + throughput.current.EW,
          cycleCount: currentState.cycleCount + 1,
        });
      }

    } catch (error) {
        console.error("Simulation cycle failed:", error);
        toast({
          variant: "destructive",
          title: "Simulation Error",
          description: "An error occurred during the simulation cycle. Check the console for details.",
        })
        handleStop();
    }
  };

  const handleStart = () => setSimState(s => ({ ...s, isSimulating: true }));
  const handleStop = () => setSimState(s => ({ ...s, isSimulating: false }));
  const handleReset = () => {
    throughput.current = { NS: 0, EW: 0 };
    setSimState(CONSTANTS.INITIAL_SIMULATION_STATE)
    if (onMetricsUpdate) {
      onMetricsUpdate({
        totalVehicles: 0,
        cycleCount: 0,
      });
    }
  };

  useEffect(() => {
    if (simState.isSimulating) {
      // Main simulation cycle trigger
      const cycleDurationMs = simState.timer * 1000;
      cycleTimeout.current = setTimeout(() => runSimulationCycle(simState), cycleDurationMs > 0 ? cycleDurationMs : 1000);
      
      // UI countdown timer
      uiInterval.current = setInterval(() => {
        setSimState(s => {
          if (!s.isSimulating) return s;
          const newTime = s.timer - (CONSTANTS.UI_UPDATE_INTERVAL_MS / 1000);
          const cycleDuration = s.activeGroup === 'NS' ? s.ns_green_s : s.ew_green_s;
          return {
            ...s,
            timer: Math.max(0, newTime),
            progress: (newTime / cycleDuration) * 100,
          };
        });
      }, CONSTANTS.UI_UPDATE_INTERVAL_MS);

    } else {
        if (cycleTimeout.current) clearTimeout(cycleTimeout.current);
        if (uiInterval.current) clearInterval(uiInterval.current);
    }

    return () => {
      if (cycleTimeout.current) clearTimeout(cycleTimeout.current);
      if (uiInterval.current) clearInterval(uiInterval.current);
    };
  }, [simState.isSimulating, simState.cycleCount]);


  return (
    <div className="space-y-8">
      <DashboardControls
        isSimulating={simState.isSimulating}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TrafficCard
          title="North-South"
          status={simState.activeGroup === 'NS' ? 'GREEN' : 'RED'}
          timer={simState.activeGroup === 'NS' ? simState.timer : simState.ns_green_s}
          progress={simState.activeGroup === 'NS' ? simState.progress : 100}
          sensorData={simState.groups.NS}
          delta={mode === 'adaptive' && simState.activeGroup === 'NS' ? simState.delta_used_s : undefined}
          explanation={simState.isSimulating && simState.activeGroup === 'NS' ? simState.explanation : 'Waiting for phase...'}
        />
        <TrafficCard
          title="East-West"
          status={simState.activeGroup === 'EW' ? 'GREEN' : 'RED'}
          timer={simState.activeGroup === 'EW' ? simState.timer : simState.ew_green_s}
          progress={simState.activeGroup === 'EW' ? simState.progress : 100}
          sensorData={simState.groups.EW}
          delta={mode === 'adaptive' && simState.activeGroup === 'EW' ? simState.delta_used_s : undefined}
          explanation={simState.isSimulating && simState.activeGroup === 'EW' ? simState.explanation : 'Waiting for phase...'}
        />
      </div>
    </div>
  );
}
