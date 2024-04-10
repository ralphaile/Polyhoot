import { TestBed } from '@angular/core/testing';
import { Timer } from '@app/classes/timer';
import { TimeService } from './time.service';

describe('TimeService', () => {
    let service: TimeService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TimeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should create a new timer and add it to the timers array', () => {
        const onTimerEndSpy = jasmine.createSpy('onTimerEnd');
        const initialTimersCount = service['timers'].length;

        const newTimer = service.createTimer(onTimerEndSpy);

        expect(newTimer).toBeDefined();
        expect(newTimer).toBeInstanceOf(Timer);

        const newTimersCount = service['timers'].length;
        expect(newTimersCount).toBe(initialTimersCount + 1);

        expect(service['timers']).toContain(newTimer);
    });

    it('should delete a timer from the timers array when it exists', () => {
        const onTimerEndSpy = jasmine.createSpy('onTimerEnd');
        const timer = service.createTimer(onTimerEndSpy);

        expect(service['timers']).toContain(timer);

        service.deleteTimer(timer);

        expect(service['timers']).not.toContain(timer);
    });

    it('should not modify the timers array when the timer does not exist', () => {
        const onTimerEndSpy1 = jasmine.createSpy('onTimerEnd1');
        const onTimerEndSpy2 = jasmine.createSpy('onTimerEnd2');
        service.createTimer(onTimerEndSpy2);

        const timersBeforeDelete = [...service['timers']];

        const externalTimer = new Timer(onTimerEndSpy1);

        service.deleteTimer(externalTimer);

        expect(service['timers']).toEqual(timersBeforeDelete);
    });
});
