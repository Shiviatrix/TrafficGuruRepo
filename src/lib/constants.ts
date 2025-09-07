import type { SimulationState } from './types';

// Core simulation parameters
export const BASE_GREEN_S = 40;
export const MAX_ADJUST_S = 15;
export const EMERGENCY_BONUS_S = 10;
export const MIN_GREEN_BASE_S = 10;
export const MIN_GREEN_EMERG_S = 7;
export const UI_UPDATE_INTERVAL_MS = 200;

// Delta calculation coefficients
export const ALPHA_PER_MEAN = 0.8;
export const BETA_PER_WEIGHT = 0.5;

// Traffic evolution rules
export const HEADWAY_S = 1.9; // Time between vehicles clearing intersection
export const STARTUP_LOST_S = 2.0; // Initial delay for first car
export const LANES_PER_APPROACH = 2;
export const ARRIVAL_JITTER = 0.1; // +/- 10%
export const WEIGHT_JITTER = 0.1; // +/- 10%
export const EMERG_DECAY_P = 0.6; // 60% chance emergency clears
export const EMERG_SPAWN_P = 0.04; // 4% chance new emergency appears
export const MEAN_UPDATE_FACTOR = 0.1; // Weight for new queue pressure in mean calculation

// Initial state for the simulation, mimicking traffic_gen.py
export const INITIAL_SIMULATION_STATE: SimulationState = {
  isSimulating: false,
  cycleCount: 0,
  activeGroup: 'EW',
  ns_green_s: BASE_GREEN_S,
  ew_green_s: BASE_GREEN_S,
  timer: BASE_GREEN_S,
  progress: 100,
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
};
