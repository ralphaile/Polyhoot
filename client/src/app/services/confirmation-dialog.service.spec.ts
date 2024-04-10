import { TestBed } from '@angular/core/testing';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogService } from './confirmation-dialog.service';

describe('ConfirmationDialogService', () => {
    let service: ConfirmationDialogService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [MatDialogModule],
            providers: [{ provide: MatDialogRef, useValue: {} }],
        });
        service = TestBed.inject(ConfirmationDialogService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should open dialog', () => {
        const spy = spyOn(service['dialog'], 'open');
        service.openConfirmationDialog('test');
        expect(spy).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({ data: { text: 'test' } }));
    });
});
