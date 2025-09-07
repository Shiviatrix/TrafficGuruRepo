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
            dynamically adjusts signal timings based on real-time data. It
            compares its performance against a traditional fixed-time
            controller. The system uses a variety of simulated IoT sensors to
            make intelligent decisions:
          </p>
          <ul className="list-none space-y-2 pl-2">
            <SensorListItem>
              <strong>Inductive-Loop Vehicle Detectors:</strong> Simulated to
              provide vehicle counts and queue lengths for each direction.
            </SensorListItem>
            <SensorListItem>
              <strong>Acoustic Sensors:</strong> Detect siren frequencies to
              identify and prioritize emergency vehicles.
            </SensorListItem>
            <SensorListItem>
              <strong>AI-Powered Cameras:</strong> Used to classify vehicle types (e.g., trucks, buses), which are assigned different "weights" to influence green light duration.
            </SensorListItem>
          </ul>
          <p>
            An AI model calculates the optimal green light duration each cycle
            to maximize traffic throughput and reduce congestion.
          </p>
        </CardContent>
      </Card>

      <ComparisonDashboard />
    </main>
  );
}
