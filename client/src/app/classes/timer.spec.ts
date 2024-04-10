import { fakeAsync, flush, tick } from '@angular/core/testing';
import { Timer } from '@app/classes/timer';

describe('Timer', () => {
    let timer: Timer;
    let onTimerEndSpy: jasmine.Spy;
    const startValue = 5;
    const tickDuration = 1000;

    beforeEach(() => {
        onTimerEndSpy = jasmine.createSpy('onTimerEnd');
        timer = new Timer(onTimerEndSpy);
    });

    it('should start the timer with the given start value', fakeAsync(() => {
        timer.startTimer(3);
        expect(timer.time).toBe(3);
        tick(tickDuration);
        expect(timer.time).toBe(2);
        timer.stopTimer();
        flush();
    }));

    it('should call onTimerEnd when the timer reaches zero', fakeAsync(() => {
        timer.startTimer(1);
        tick(tickDuration * 2);
        expect(onTimerEndSpy).toHaveBeenCalled();
        flush();
    }));

    it('should not start a new timer if one is already running', fakeAsync(() => {
        timer.startTimer(3);
        timer.startTimer(startValue);
        tick(tickDuration);
        expect(timer.time).toBe(2);
        timer.stopTimer();
        flush();
    }));

    it('should reset the timer to the given start value', fakeAsync(() => {
        timer.startTimer(startValue);
        tick(tickDuration);
        expect(timer.time).toBe(startValue - 1);

        const newStartValue = 10;
        timer.resetTimer(newStartValue);
        expect(timer.time).toBe(newStartValue);

        timer.stopTimer();
        flush();
    }));
});
