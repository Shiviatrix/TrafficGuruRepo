'use client';

import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw } from 'lucide-react';

interface DashboardControlsProps {
  isSimulating: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function DashboardControls({
  isSimulating,
  onStart,
  onStop,
  onReset,
}: DashboardControlsProps) {
  return (
    <div className="flex justify-center items-center gap-4 my-8">
      {!isSimulating ? (
        <Button onClick={onStart} size="lg" className="w-36 bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSimulating}>
          <Play className="mr-2" /> Start
        </Button>
      ) : (
        <Button
          onClick={onStop}
          variant="destructive"
          size="lg"
          className="w-36"
        >
          <Pause className="mr-2" /> Stop
        </Button>
      )}
      <Button onClick={onReset} variant="outline" size="lg" disabled={isSimulating}>
        <RefreshCw className="mr-2" /> Reset
      </Button>
    </div>
  );
}
