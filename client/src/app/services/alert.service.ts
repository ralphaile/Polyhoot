import { Injectable } from '@angular/core';
import { MESSAGE_DURATION_MS } from '@common/const';
import { Observable, Subject, timer } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AlertService {
    private alertSubject = new Subject<string>();

    showAlert(message: string, duration = MESSAGE_DURATION_MS) {
        this.alertSubject.next(message);
        return timer(duration);
    }

    getAlert(): Observable<string> {
        return this.alertSubject.asObservable();
    }
}
