import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertService } from '@app/services/alert.service';
import { MESSAGE_DURATION_MS } from '@common/const';
import { Subscription } from 'rxjs';
@Component({
    selector: 'app-alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit, OnDestroy {
    message: string;
    private subscription: Subscription;

    constructor(private readonly alertService: AlertService) {}

    ngOnInit() {
        this.subscription = this.alertService.getAlert().subscribe((message) => {
            this.message = message;
            setTimeout(() => (this.message = ''), MESSAGE_DURATION_MS);
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
