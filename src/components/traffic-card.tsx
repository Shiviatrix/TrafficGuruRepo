'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CarFront, Gauge, Siren, Truck, Users, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SensorData } from '@/lib/types';

interface TrafficCardProps {
  title: string;
  status: 'GREEN' | 'RED';
  timer: number;
  progress: number;
  sensorData: SensorData;
  delta?: number;
  explanation: string;
  showExplanation?: boolean;
}

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="size-4" />
      <span>{label}</span>
    </div>
    <span className="font-medium">{value}</span>
  </div>
);

export function TrafficCard({ title, status, timer, progress, sensorData, delta, explanation, showExplanation = true }: TrafficCardProps) {
  const isGreen = status === 'GREEN';

  return (
    <Card className={cn("transition-all duration-300 flex flex-col", isGreen ? 'border-accent shadow-lg shadow-accent/20' : 'border-destructive/50')}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription className={cn(isGreen ? 'text-accent-foreground' : 'text-destructive', 'font-semibold text-lg')}>
              {status}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold tabular-nums">
              {timer.toFixed(1)}s
            </div>
            {isGreen && typeof delta !== 'undefined' && (
               <div className={cn('text-sm font-semibold', delta >= 0 ? 'text-green-500' : 'text-red-500')}>
                Δ {delta >= 0 ? '+' : ''}{delta.toFixed(1)}s
              </div>
            )}
          </div>
        </div>
        <Progress value={progress} className={cn('h-2 mt-2 [&>*]:transition-all [&>*]:duration-200', isGreen ? '[&>*]:bg-accent' : '[&>*]:bg-destructive')} />
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-muted-foreground">SENSOR DATA</h3>
            {sensorData.emergency && <Badge variant="destructive" className="animate-pulse"><Siren className="mr-1 size-3" /> EMERGENCY</Badge>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <InfoItem icon={Users} label="Queue Length" value={sensorData.queue.toFixed(0)} />
            <InfoItem icon={CarFront} label="Vehicle Count" value={`${sensorData.count.toFixed(0)}/min`} />
            <InfoItem icon={Gauge} label="Mean Demand" value={sensorData.mean.toFixed(1)} />
            <InfoItem icon={Truck} label="Weight Index" value={sensorData.weight.toFixed(1)} />
        </div>
      </CardContent>
      {showExplanation && (
        <CardFooter>
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                  <Bot className="size-4" /> AI EXPLANATION
              </div>
              <p>{explanation}</p>
            </div>
        </CardFooter>
      )}
    </Card>
  );
}
