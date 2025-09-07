export interface SensorData {
  queue: number;
  count: number;
  mean: number;
  weight: number;
  emergency: boolean;
}

export interface SimulationState {
  isSimulating: boolean;
  cycleCount: number;
  activeGroup: 'NS' | 'EW';
  ns_green_s: number;
  ew_green_s: number;
  timer: number;
  progress: number;
  delta_used_s: number;
  explanation: string;
  groups: {
    NS: SensorData;
    EW: SensorData;
  };
}
