export interface SensorData {
  queue: number;
  count: number;
  mean: number;
  weight: number;
  emergency: boolean;
}

export type TrafficLightStatus = 'GREEN' | 'RED' | 'YELLOW';

export interface SimulationMetrics {
  totalVehicles: number;
  cycleCount: number;
  emergencyVehicles: number;
}

export interface VehicleThroughput {
  NS: number;
  EW: number;
}

export interface EmergencyVehicleThroughput {
  NS: number;
  EW: number;
}


export interface SimulationState {
  mode: 'adaptive' | 'fixed';
  cycleCount: number;
  activeGroup: 'NS' | 'EW';
  phase: 'GREEN' | 'YELLOW';
  ns_status: TrafficLightStatus;
  ew_status: TrafficLightStatus;
  ns_green_s: number;
  ew_green_s: number;
  timer: number;
  delta_used_s: number;
  explanation: string;
  groups: {
    NS: SensorData;
    EW: SensorData;
  };
  // Internal state for metrics calculation
  throughput: VehicleThroughput;
  emergencyThroughput: EmergencyVehicleThroughput;
  // Published metrics for UI
  metrics: SimulationMetrics;
}


export interface DashboardProps {
  isSimulating: boolean;
  currentState: SimulationState;
  dispatch: React.Dispatch<{ type: 'UPDATE'; payload: Partial<SimulationState> }>;
}
