import { Injectable } from '@angular/core';
import { Timer } from '@app/classes/timer';

const NOT_FOUND = -1;

@Injectable({
    providedIn: 'root',
})
export class TimeService {
    private timers: Timer[] = [];

    createTimer(onTimerEnd: () => void): Timer {
        const newTimer = new Timer(onTimerEnd);
        this.timers.push(newTimer);
        return newTimer;
    }

    deleteTimer(timerToDelete: Timer) {
        const timerIndex = this.timers.findIndex((element) => element === timerToDelete);
        if (timerIndex !== NOT_FOUND) {
            this.timers.splice(timerIndex, 1);
        }
    }
}
