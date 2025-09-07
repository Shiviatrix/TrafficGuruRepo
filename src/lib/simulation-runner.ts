'use server';

import { calculateDelta, type CalculateDeltaInput } from '@/ai/flows/calculate-delta';
import { explainDecisionReasoning, type ExplainDecisionReasoningInput } from '@/ai/flows/explain-decision-reasoning';
import * as CONSTANTS from '@/lib/constants';
import type { SimulationState } from '@/lib/types';


export async function runSimulationCycle(currentState: SimulationState, generateExplanation = true): Promise<SimulationState> {
    const nextState: SimulationState = JSON.parse(JSON.stringify(currentState));

    if (currentState.phase === 'GREEN') {
        // === GREEN to YELLOW transition ===
        const prevActiveGroupName = currentState.activeGroup;
        const prevCycleDuration = prevActiveGroupName === 'NS' ? currentState.ns_green_s : currentState.ew_green_s;
  
        // Evolve both groups based on green light duration
        for (const groupName of ['NS', 'EW'] as const) {
            const group = nextState.groups[groupName];
            const isGreen = groupName === prevActiveGroupName;
            const duration = isGreen ? prevCycleDuration : CONSTANTS.YELLOW_S + prevCycleDuration;

            if (isGreen) {
                const dischargedVehicles = Math.max(0, (duration - CONSTANTS.STARTUP_LOST_S) * (CONSTANTS.LANES_PER_APPROACH / CONSTANTS.HEADWAY_S));
                nextState.throughput[groupName] += dischargedVehicles;
                group.queue = Math.max(0, group.queue - dischargedVehicles);

                if (group.emergency) {
                  nextState.emergencyThroughput[groupName] += 1;
                }
            }
            group.queue += (group.count / 60) * duration;
        }

        nextState.phase = 'YELLOW';
        nextState.timer = CONSTANTS.YELLOW_S;
        nextState.ns_status = prevActiveGroupName === 'NS' ? 'YELLOW' : 'RED';
        nextState.ew_status = prevActiveGroupName === 'EW' ? 'YELLOW' : 'RED';

      } else {
        // === YELLOW to GREEN transition ===
        const prevActiveGroupName = currentState.activeGroup;
        const nextActiveGroupName = prevActiveGroupName === 'NS' ? 'EW' : 'NS';
  
        // Evolve all groups' properties (random walk)
        for (const groupName of ['NS', 'EW'] as const) {
          const group = nextState.groups[groupName];
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
  
        if (currentState.mode === 'adaptive') {
          const groupToAdjust = nextState.groups[nextActiveGroupName];
          const otherGroup = nextState.groups[prevActiveGroupName];
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

          if (generateExplanation) {
            const explanationInput: ExplainDecisionReasoningInput = {
                group: nextActiveGroupName,
                ns_green_s,
                ew_green_s,
                delta_used_s: delta,
                ns_queue: nextState.groups.NS.queue,
                ew_queue: nextState.groups.EW.queue,
                ns_count: nextState.groups.NS.count,
                ew_count: nextState.groups.EW.count,
                ns_mean: nextState.groups.NS.mean,
                ew_mean: nextState.groups.EW.mean,
                ns_weight: nextState.groups.NS.weight,
                ew_weight: nextState.groups.EW.weight,
                ns_emergency: nextState.groups.NS.emergency,
                ew_emergency: nextState.groups.EW.emergency,
            };
            const { explanation: aiExplanation } = await explainDecisionReasoning(explanationInput);
            explanation = aiExplanation;
          } else {
            explanation = 'Calculating...';
          }
        }
        
        const min_ns = nextState.groups.NS.emergency ? CONSTANTS.MIN_GREEN_EMERG_S : CONSTANTS.MIN_GREEN_BASE_S;
        const min_ew = nextState.groups.EW.emergency ? CONSTANTS.MIN_GREEN_EMERG_S : CONSTANTS.MIN_GREEN_BASE_S;
        ns_green_s = Math.max(min_ns, ns_green_s);
        ew_green_s = Math.max(min_ew, ew_green_s);
  
        const nextCycleDuration = nextActiveGroupName === 'NS' ? ns_green_s : ew_green_s;
        
        nextState.cycleCount = currentState.cycleCount + 1;
        nextState.activeGroup = nextActiveGroupName;
        nextState.phase = 'GREEN';
        nextState.ns_status = nextActiveGroupName === 'NS' ? 'GREEN' : 'RED';
        nextState.ew_status = nextActiveGroupName === 'EW' ? 'GREEN' : 'RED';
        nextState.ns_green_s = ns_green_s;
        nextState.ew_green_s = ew_green_s;
        nextState.delta_used_s = delta;
        nextState.timer = nextCycleDuration;
        nextState.explanation = explanation;

        // Update metrics after the cycle completes
        nextState.metrics = {
            totalVehicles: nextState.throughput.NS + nextState.throughput.EW,
            cycleCount: Math.ceil(nextState.cycleCount / 2), // Each full cycle is two phase changes
            emergencyVehicles: nextState.emergencyThroughput.NS + nextState.emergencyThroughput.EW,
        };
      }
      return nextState;
}
