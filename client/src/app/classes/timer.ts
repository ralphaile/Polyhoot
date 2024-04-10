import { ONE_SECOND_INTERVAL } from '@common/const';

export class Timer {
    private interval: number | undefined;
    private counter;
    private readonly tick;

    constructor(private readonly onTimerEnd: () => void) {
        this.counter = 0;
        this.tick = ONE_SECOND_INTERVAL;
    }

    get time() {
        return this.counter;
    }

    private set time(newTime: number) {
        this.counter = newTime;
    }

    // This is just to allow to call the timer without a function
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    startTimer(startValue: number): void {
        if (this.interval) return;

        this.time = startValue;
        this.interval = window.setInterval(() => {
            if (this.time > 0) {
                this.time--;
            } else {
                this.stopTimer();
                this.onTimerEnd();
            }
        }, this.tick);
    }

    resetTimer(startValue: number) {
        this.stopTimer();
        this.startTimer(startValue);
    }

    stopTimer() {
        clearInterval(this.interval);
        this.interval = undefined;
    }
}
