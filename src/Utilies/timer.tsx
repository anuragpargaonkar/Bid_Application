// ../../Utiles/timer.ts
export interface AuctionTimer {
  startTime: number;
  timeRemaining: number;
  isActive: boolean;
  hasStarted: boolean;
}

class TimerManagerClass {
  private intervals: { [key: string]: NodeJS.Timeout } = {};

  createSampleStartTime(minutes: number): number {
    return Date.now() + minutes * 60 * 1000;
  }

  startCountdown(
    id: string,
    startTime: number,
    onTick: (timeRemaining: number) => void,
    onStart?: () => void
  ) {
    this.stopCountdown(id);

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(Math.floor((startTime - now) / 1000), 0);

      onTick(remaining);

      if (remaining === 0) {
        this.stopCountdown(id);
        if (onStart) onStart();
      }
    };

    tick();
    this.intervals[id] = setInterval(tick, 1000);
  }

  stopCountdown(id: string) {
    if (this.intervals[id]) {
      clearInterval(this.intervals[id]);
      delete this.intervals[id];
    }
  }

  formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }
}

const TimerManager = new TimerManagerClass();
export default TimerManager;
