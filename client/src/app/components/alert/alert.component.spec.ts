import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertService } from '@app/services/alert.service';
import { MESSAGE_DURATION_MS } from '@common/const';
import { of } from 'rxjs';
import { AlertComponent } from './alert.component';

describe('AlertComponent', () => {
    let component: AlertComponent;
    let fixture: ComponentFixture<AlertComponent>;
    let alertService: AlertService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AlertComponent],
            providers: [AlertService],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AlertComponent);
        component = fixture.componentInstance;
        alertService = TestBed.inject(AlertService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display alert message', () => {
        spyOn(alertService, 'getAlert').and.returnValue(of('Test alert message'));
        component.ngOnInit();
        expect(component.message).toEqual('Test alert message');
    });

    it('should clear alert message after 4 seconds', (done) => {
        spyOn(alertService, 'getAlert').and.returnValue(of('Test alert message'));
        component.ngOnInit();
        setTimeout(() => {
            expect(component.message).toBe('');
            done();
        }, MESSAGE_DURATION_MS);
    });
});
