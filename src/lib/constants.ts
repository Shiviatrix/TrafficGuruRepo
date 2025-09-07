import type { SimulationState } from './types';

// Core simulation parameters
export const BASE_GREEN_S = 30;
export const YELLOW_S = 3;
export const MAX_ADJUST_S = 20;
export const EMERGENCY_BONUS_S = 15;
export const MIN_GREEN_BASE_S = 10;
export const MIN_GREEN_EMERG_S = 7;
export const UI_UPDATE_INTERVAL_MS = 100;

// Delta calculation coefficients
export const ALPHA_PER_MEAN = 1.0;
export const BETA_PER_WEIGHT = 0.6;

// Traffic evolution rules
export const HEADWAY_S = 1.9; // Time between vehicles clearing intersection
export const STARTUP_LOST_S = 2.0; // Initial delay for first car
export const LANES_PER_APPROACH = 2;
export const ARRIVAL_JITTER = 0.15; // +/- 15%
export const WEIGHT_JITTER = 0.1; // +/- 10%
export const EMERG_DECAY_P = 0.6; // 60% chance emergency clears
export const EMERG_SPAWN_P = 0.05; // 5% chance new emergency appears
export const MEAN_UPDATE_FACTOR = 0.1; // Weight for new queue pressure in mean calculation

// Initial state for the simulation, mimicking traffic_gen.py
export const INITIAL_SIMULATION_STATE: Omit<SimulationState, 'mode'> = {
  cycleCount: 0,
  activeGroup: 'EW',
  phase: 'GREEN',
  ns_status: 'RED',
  ew_status: 'GREEN',
  ns_green_s: BASE_GREEN_S,
  ew_green_s: BASE_GREEN_S,
  timer: BASE_GREEN_S,
  delta_used_s: 0,
  explanation: 'Simulation has not started. Press Start to begin.',
  groups: {
    NS: {
      queue: 22,
      count: 35,
      mean: 18.5,
      weight: 4.2,
      emergency: false,
    },
    EW: {
      queue: 15,
      count: 45,
      mean: 12.0,
      weight: 2.9,
      emergency: false,
    },
  },
  metrics: {
      totalVehicles: 0,
      cycleCount: 0,
      emergencyVehicles: 0,
  },
  throughput: { NS: 0, EW: 0 },
  emergencyThroughput: { NS: 0, EW: 0 },
};
