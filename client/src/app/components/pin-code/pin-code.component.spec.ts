// Needed for private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '@app/services/alert.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ErrorMessage } from '@common/errors';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { PinCodeComponent } from './pin-code.component';

describe('PinCodeComponent', () => {
    const code = 1234;
    let component: PinCodeComponent;
    let fixture: ComponentFixture<PinCodeComponent>;
    let socketMock: Partial<Socket>;
    let socketServiceMock: Partial<SocketClientService>;
    let alertServiceMock: jasmine.SpyObj<AlertService>;

    beforeEach(async () => {
        socketMock = {
            on: jasmine.createSpy('on'),
            send: jasmine.createSpy('send'),
            connect: jasmine.createSpy('connect'),
        };

        socketServiceMock = {
            socket: socketMock as Socket,
            connect: jasmine.createSpy('connect'),
            send: jasmine.createSpy('send'),
            isSocketAlive: jasmine.createSpy('isSocketAlive'),
            disconnect: jasmine.createSpy('disconnect'),
        };

        alertServiceMock = jasmine.createSpyObj('AlertService', ['showAlert', 'getAlert']);
        alertServiceMock.getAlert.and.returnValue(of(''));

        await TestBed.configureTestingModule({
            declarations: [PinCodeComponent],
            imports: [ReactiveFormsModule],
            providers: [
                { provide: SocketClientService, useValue: socketServiceMock },
                { provide: AlertService, useValue: alertServiceMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        const formBuilder: FormBuilder = TestBed.inject(FormBuilder);
        const pinCodeForm: FormGroup = formBuilder.group({
            accessCode: '1234',
        });
        fixture = TestBed.createComponent(PinCodeComponent);
        component = fixture.componentInstance;
        component.pinCodeForm = pinCodeForm;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should attempt to connect and validate code when socket is not alive', async () => {
        (socketServiceMock.isSocketAlive as jasmine.Spy).and.returnValue(false);

        // eslint needed because callback is needed and is last argument
        // eslint-disable-next-line @typescript-eslint/no-shadow
        (socketServiceMock.send as jasmine.Spy).and.callFake((eventName, code, callback) => {
            callback({ isValid: true });
        });

        const result = await component['connect'](code);

        expect(socketServiceMock.isSocketAlive).toHaveBeenCalled();
        expect(socketServiceMock.connect).toHaveBeenCalled();
        expect(socketServiceMock.send).toHaveBeenCalledWith('validateCode', code, jasmine.any(Function));
        expect(result).toBeTrue();
    });

    it('should not attempt to connect and validate code when socket is alive', async () => {
        (socketServiceMock.isSocketAlive as jasmine.Spy).and.returnValue(true);

        const result = await component['connect'](code);

        expect(socketServiceMock.isSocketAlive).toHaveBeenCalled();
        expect(socketServiceMock.connect).not.toHaveBeenCalled();
        expect(result).toBeFalse();
    });

    it('should return false if code is invalid', async () => {
        (socketServiceMock.isSocketAlive as jasmine.Spy).and.returnValue(false);
        // eslint needed because callback is needed and is last argument
        // eslint-disable-next-line @typescript-eslint/no-shadow
        (socketServiceMock.send as jasmine.Spy).and.callFake((eventName, code, callback) => {
            callback({ isValid: false });
        });

        expect(await component['connect'](code)).toBeFalse();
        expect(alertServiceMock.showAlert).toHaveBeenCalledWith(ErrorMessage.InvalidCode);
        expect(socketServiceMock.disconnect).toHaveBeenCalled();
    });

    it('should show an error if an error occurs during connection', async () => {
        (socketServiceMock.isSocketAlive as jasmine.Spy).and.returnValue(false);
        (socketServiceMock.connect as jasmine.Spy).and.throwError('error');

        await component['connect'](code);
        expect(alertServiceMock.showAlert).toHaveBeenCalledWith(ErrorMessage.ConnexionError);
    });

    it('should return false if code is not the correct length', async () => {
        expect(await component['isValidCode']('123')).toBeFalse();
        expect(alertServiceMock.showAlert).toHaveBeenCalledWith(ErrorMessage.CodeIsNotFourDigits);
    });

    it('should return false if code is not a number', async () => {
        expect(await component['isValidCode']('12a3')).toBeFalse();
        expect(alertServiceMock.showAlert).toHaveBeenCalledWith(ErrorMessage.CodeIsNotFourDigits);
    });

    it('should return false if room is locked', async () => {
        // Needed because callback is needed and is last argument
        // eslint-disable-next-line @typescript-eslint/no-shadow
        (socketServiceMock.send as jasmine.Spy).and.callFake((eventName, code, callback) => {
            callback({ isValid: false, isLocked: true });
        });
        expect(await component['isValidCode']('1243')).toBeFalse();
        expect(alertServiceMock.showAlert).toHaveBeenCalledWith(ErrorMessage.LockedGame);
    });

    it('should return connected() result if code is valid', async () => {
        (component['connect'] as jasmine.Spy) = jasmine.createSpy('connect').and.returnValue(true);
        expect(await component['isValidCode']('1234')).toBeTrue();

        (component['connect'] as jasmine.Spy) = jasmine.createSpy('connect').and.returnValue(false);
        expect(await component['isValidCode']('1234')).toBeFalse();

        expect(component['connect']).toHaveBeenCalled();
    });

    it('should emit code when submitCode is called and code is valid', async () => {
        const emitSpy = spyOn(component.codeSubmitted, 'emit');
        const codeNumber = parseInt(component.pinCodeForm.value.accessCode, 10);
        spyOn(component as any, 'connect').and.returnValue(Promise.resolve(true));

        await component.submitCode();
        expect(emitSpy).toHaveBeenCalledWith(codeNumber);
    });

    it('should not emit code when submitCode is called and code is invalid', async () => {
        const emitSpy = spyOn(component.codeSubmitted, 'emit');
        const codeNumber = parseInt(component.pinCodeForm.value.accessCode, 10);
        spyOn(component as any, 'connect').and.returnValue(Promise.resolve(false));

        await component.submitCode();
        expect(emitSpy).not.toHaveBeenCalledWith(codeNumber);
    });
});
