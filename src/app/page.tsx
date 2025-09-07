import ComparisonDashboard from '@/components/comparison-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, Dot } from 'lucide-react';

const SensorListItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-center gap-2">
    <Dot className="text-primary size-5" />
    <span>{children}</span>
  </li>
);

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          AdaptiveFlow
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Smart Adaptive Traffic Light Controller
        </p>
      </header>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu /> About the Simulation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            This simulation demonstrates an adaptive traffic control system that
            dynamically adjusts signal timings based on real-time data from a network of simulated IoT (Internet of Things) sensors. It
            compares its performance against a traditional fixed-time
            controller. The system uses a variety of sensors to
            make intelligent decisions:
          </p>
          <ul className="list-none space-y-2 pl-2">
            <SensorListItem>
              <strong>Inductive-Loop Vehicle Detectors (as Pressure Plates):</strong> These are simulated as loops of wire embedded in the road. When a vehicle drives over them, the metal in the vehicle changes the magnetic field, which is detected to provide vehicle counts and queue lengths.
            </SensorListItem>
            <SensorListItem>
              <strong>Acoustic Sensors:</strong> These sensors are equipped with microphones tuned to detect the specific frequency patterns of emergency vehicle sirens. This allows the system to grant immediate priority to fire trucks, ambulances, and police cars.
            </SensorListItem>
            <SensorListItem>
              <strong>AI-Powered Cameras:</strong> Used to classify vehicle types (e.g., trucks, buses), which are assigned different "weights" to influence green light duration.
            </SensorListItem>
          </ul>
          <p>
            An AI model uses this combined sensor data to calculate the optimal green light duration for each cycle, aiming to maximize traffic throughput and reduce congestion.
          </p>
        </CardContent>
      </Card>

      <ComparisonDashboard />
    </main>
  );
}
