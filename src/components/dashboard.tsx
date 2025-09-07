'use client';

import { useState, useEffect, useRef } from 'react';
import { TrafficCard } from '@/components/traffic-card';
import * as CONSTANTS from '@/lib/constants';
import type { SimulationState, DashboardProps, VehicleThroughput } from '@/lib/types';
import { calculateDelta, type CalculateDeltaInput } from '@/ai/flows/calculate-delta';
import { explainDecisionReasoning, type ExplainDecisionReasoningInput } from '@/ai/flows/explain-decision-reasoning';
import { useToast } from "@/hooks/use-toast"

export default function Dashboard({ mode, onMetricsUpdate, isSimulating }: DashboardProps) {
  const [simState, setSimState] = useState<SimulationState>({...CONSTANTS.INITIAL_SIMULATION_STATE});
  const cycleTimeout = useRef<NodeJS.Timeout | null>(null);
  const uiInterval = useRef<NodeJS.Timeout | null>(null);
  const throughput = useRef<VehicleThroughput>({ NS: 0, EW: 0 });
  const { toast } = useToast();

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

  const runSimulationCycle = async (currentState: SimulationState) => {
    try {
      if (currentState.phase === 'GREEN') {
        // === GREEN to YELLOW transition ===
        const prevActiveGroupName = currentState.activeGroup;
        const prevCycleDuration = prevActiveGroupName === 'NS' ? currentState.ns_green_s : currentState.ew_green_s;
  
        const evolvedGroups = JSON.parse(JSON.stringify(currentState.groups));
  
        // Evolve both groups based on green light duration
        for (const groupName of ['NS', 'EW'] as const) {
            const group = evolvedGroups[groupName];
            const isGreen = groupName === prevActiveGroupName;
            const duration = isGreen ? prevCycleDuration : CONSTANTS.YELLOW_S + prevCycleDuration;

            if (isGreen) {
                const dischargedVehicles = Math.max(0, (duration - CONSTANTS.STARTUP_LOST_S) * (CONSTANTS.LANES_PER_APPROACH / CONSTANTS.HEADWAY_S));
                throughput.current[groupName] += dischargedVehicles;
                group.queue = Math.max(0, group.queue - dischargedVehicles);
            }
            group.queue += (group.count / 60) * duration;
        }

        setSimState({
          ...currentState,
          phase: 'YELLOW',
          timer: CONSTANTS.YELLOW_S,
          progress: 100,
          ns_status: prevActiveGroupName === 'NS' ? 'YELLOW' : 'RED',
          ew_status: prevActiveGroupName === 'EW' ? 'YELLOW' : 'RED',
          groups: evolvedGroups,
        });

      } else {
        // === YELLOW to GREEN transition ===
        const prevActiveGroupName = currentState.activeGroup;
        const nextActiveGroupName = prevActiveGroupName === 'NS' ? 'EW' : 'NS';
  
        const evolvedGroups = JSON.parse(JSON.stringify(currentState.groups));

        // Evolve all groups' properties (random walk)
        for (const groupName of ['NS', 'EW'] as const) {
          const group = evolvedGroups[groupName];
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
        let explanation = 'Fixed time cycle. No AI intervention.';
  
        if (mode === 'adaptive') {
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
          
          const adjustment = nextActiveGroupName === 'NS' ? delta : -delta;
          ns_green_s += adjustment;
          ew_green_s -= adjustment;
  
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
          const { explanation: aiExplanation } = await explainDecisionReasoning(explanationInput);
          explanation = aiExplanation;
        }
        
        const min_ns = evolvedGroups.NS.emergency ? CONSTANTS.MIN_GREEN_EMERG_S : CONSTANTS.MIN_GREEN_BASE_S;
        const min_ew = evolvedGroups.EW.emergency ? CONSTANTS.MIN_GREEN_EMERG_S : CONSTANTS.MIN_GREEN_BASE_S;
        ns_green_s = Math.max(min_ns, ns_green_s);
        ew_green_s = Math.max(min_ew, ew_green_s);
  
        const nextCycleDuration = nextActiveGroupName === 'NS' ? ns_green_s : ew_green_s;
        
        setSimState({
          ...currentState,
          cycleCount: currentState.cycleCount + 1,
          activeGroup: nextActiveGroupName,
          phase: 'GREEN',
          ns_status: nextActiveGroupName === 'NS' ? 'GREEN' : 'RED',
          ew_status: nextActiveGroupName === 'EW' ? 'GREEN' : 'RED',
          groups: evolvedGroups,
          ns_green_s,
          ew_green_s,
          delta_used_s: delta,
          timer: nextCycleDuration,
          progress: 100,
          explanation,
        });
  
        if (onMetricsUpdate) {
          onMetricsUpdate({
            totalVehicles: throughput.current.NS + throughput.current.EW,
            cycleCount: currentState.cycleCount + 1,
          });
        }
      }

    } catch (error) {
        console.error("Simulation cycle failed:", error);
        toast({
          variant: "destructive",
          title: "Simulation Error",
          description: "An error occurred during the simulation cycle. Check the console for details.",
        })
        if (cycleTimeout.current) clearTimeout(cycleTimeout.current);
        if (uiInterval.current) clearInterval(uiInterval.current);
    }
  };

  useEffect(() => {
    if (isSimulating) {
      // Main simulation cycle trigger
      const cycleDurationMs = simState.timer * 1000;
      cycleTimeout.current = setTimeout(() => runSimulationCycle(simState), cycleDurationMs > 0 ? cycleDurationMs : 1000);
      
      // UI countdown timer
      uiInterval.current = setInterval(() => {
        setSimState(s => {
          if (!isSimulating) return s;
          const newTime = s.timer - (CONSTANTS.UI_UPDATE_INTERVAL_MS / 1000);
          
          let cycleDuration = 0;
          if (s.phase === 'GREEN') {
            cycleDuration = s.activeGroup === 'NS' ? s.ns_green_s : s.ew_green_s;
          } else {
            cycleDuration = CONSTANTS.YELLOW_S;
          }

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
        // Reset if simulation is stopped
        if (simState.cycleCount > 0) {
            handleReset();
        }
    }

    return () => {
      if (cycleTimeout.current) clearTimeout(cycleTimeout.current);
      if (uiInterval.current) clearInterval(uiInterval.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating, simState.cycleCount, simState.phase]);


  const getTimerForGroup = (group: 'NS' | 'EW') => {
    if (simState.phase === 'GREEN' && simState.activeGroup === group) return simState.timer;
    if (simState.phase === 'YELLOW' && simState.activeGroup === group) return simState.timer;
    return simState.activeGroup === group ? (group === 'NS' ? simState.ns_green_s : simState.ew_green_s) : (group === 'NS' ? simState.ns_green_s : simState.ew_green_s);
  };
  
  const getProgressForGroup = (group: 'NS' | 'EW') => {
      if (simState.phase === 'GREEN' && simState.activeGroup === group) return simState.progress;
      if (simState.phase === 'YELLOW' && simState.activeGroup === group) return simState.progress;
      return 100;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TrafficCard
          title="North-South"
          status={simState.ns_status}
          timer={getTimerForGroup('NS')}
          progress={getProgressForGroup('NS')}
          sensorData={simState.groups.NS}
          delta={mode === 'adaptive' && simState.activeGroup === 'NS' ? simState.delta_used_s : undefined}
          explanation={mode === 'adaptive' && isSimulating && simState.activeGroup === 'NS' && simState.phase === 'GREEN' ? simState.explanation : 'Waiting for phase...'}
          showExplanation={mode === 'adaptive'}
        />
        <TrafficCard
          title="East-West"
          status={simState.ew_status}
          timer={getTimerForGroup('EW')}
          progress={getProgressForGroup('EW')}
          sensorData={simState.groups.EW}
          delta={mode === 'adaptive' && simState.activeGroup === 'EW' ? simState.delta_used_s : undefined}
          explanation={mode === 'adaptive' && isSimulating && simState.activeGroup === 'EW' && simState.phase === 'GREEN' ? simState.explanation : 'Waiting for phase...'}
          showExplanation={mode === 'adaptive'}
        />
      </div>
    </div>
  );
}
