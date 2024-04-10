import { TestBed } from '@angular/core/testing';
import { AlertService } from './alert.service';

describe('AlertService', () => {
    let service: AlertService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AlertService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should send alert message', (done) => {
        service.getAlert().subscribe((message) => {
            expect(message).toEqual('Test alert message');
            done();
        });

        service.showAlert('Test alert message');
    });
});
