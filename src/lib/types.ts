export interface SensorData {
  queue: number;
  count: number;
  mean: number;
  weight: number;
  emergency: boolean;
}

export type TrafficLightStatus = 'GREEN' | 'RED' | 'YELLOW';

export interface SimulationState {
  isSimulating: boolean;
  cycleCount: number;
  activeGroup: 'NS' | 'EW';
  phase: 'GREEN' | 'YELLOW';
  ns_status: TrafficLightStatus;
  ew_status: TrafficLightStatus;
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

export interface VehicleThroughput {
  NS: number;
  EW: number;
}

export interface SimulationMetrics {
  totalVehicles: number;
  cycleCount: number;
}

export interface DashboardProps {
  mode: 'adaptive' | 'fixed';
  onMetricsUpdate?: (metrics: SimulationMetrics) => void;
  isSimulating: boolean;
}
