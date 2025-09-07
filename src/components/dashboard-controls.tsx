'use client';

import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw, FastForward } from 'lucide-react';
import { Loader } from 'lucide-react';


interface DashboardControlsProps {
  isSimulating: boolean;
  isFastForwarding: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onFastForward: () => void;
}

export function DashboardControls({
  isSimulating,
  isFastForwarding,
  onStart,
  onStop,
  onReset,
  onFastForward,
}: DashboardControlsProps) {
  const isBusy = isSimulating || isFastForwarding;
  return (
    <div className="flex justify-center items-center gap-4 my-8">
      {!isSimulating ? (
        <Button onClick={onStart} size="lg" className="w-36 bg-accent text-accent-foreground hover:bg-accent/90" disabled={isBusy}>
          <Play className="mr-2" /> Start
        </Button>
      ) : (
        <Button
          onClick={onStop}
          variant="destructive"
          size="lg"
          className="w-36"
          disabled={isFastForwarding}
        >
          <Pause className="mr-2" /> Stop
        </Button>
      )}
       <Button onClick={onFastForward} variant="outline" size="lg" disabled={isBusy} className="w-44">
        {isFastForwarding ? (
          <Loader className="mr-2 animate-spin" />
        ) : (
          <FastForward className="mr-2" />
        )}
        Fast Forward
      </Button>
      <Button onClick={onReset} variant="outline" size="lg" disabled={isBusy}>
        <RefreshCw className="mr-2" /> Reset
      </Button>
    </div>
  );
}
