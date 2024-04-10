// Needed for private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '@app/services/alert.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { NameComponent } from './name.component';

describe('NameComponent', () => {
    let component: NameComponent;
    let fixture: ComponentFixture<NameComponent>;
    let socketMock: Partial<Socket>;
    let socketServiceMock: Partial<SocketClientService>;
    let alertServiceMock: jasmine.SpyObj<AlertService>;
    let loginErrorCallback: (message: string) => void;
    let loginSuccessfulCallback: () => void;

    beforeEach(async () => {
        socketMock = {
            on: jasmine.createSpy('on').and.callFake((event: string, callback: () => void) => {
                if (event === 'loginError') {
                    loginErrorCallback = callback as (message: string) => void;
                } else if (event === 'loginSuccessful') {
                    loginSuccessfulCallback = callback as () => void;
                }
            }),
            send: jasmine.createSpy('send'),
            connect: jasmine.createSpy('connect'),
        };

        socketServiceMock = {
            socket: socketMock as Socket,
            connect: jasmine.createSpy('connect'),
            send: jasmine.createSpy('send'),
            disconnect: jasmine.createSpy('disconnect'),
        };

        alertServiceMock = jasmine.createSpyObj('AlertService', ['showAlert', 'getAlert']);
        alertServiceMock.getAlert.and.returnValue(of(''));

        await TestBed.configureTestingModule({
            declarations: [NameComponent],
            imports: [ReactiveFormsModule],
            providers: [
                { provide: SocketClientService, useValue: socketServiceMock },
                { provide: AlertService, useValue: alertServiceMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        const formBuilder: FormBuilder = TestBed.inject(FormBuilder);
        const nameForm: FormGroup = formBuilder.group({
            playerName: '',
        });
        fixture = TestBed.createComponent(NameComponent);
        component = fixture.componentInstance;
        component.nameForm = nameForm;
        component.gameCode = 1234;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize actions when component is created', () => {
        expect(socketServiceMock.socket?.on).toHaveBeenCalledWith('loginError', jasmine.any(Function));
        expect(socketServiceMock.socket?.on).toHaveBeenCalledWith('loginSuccessful', jasmine.any(Function));
    });

    it('should not submit name if it is invalid', () => {
        spyOn(component as any, 'isNameEmpty').and.returnValue(true);
        component.nameSubmitted();
        expect(socketServiceMock.send).not.toHaveBeenCalled();
    });

    it('should submit name if it is valid', () => {
        component.nameForm.controls.playerName.setValue('test');
        spyOn(component as any, 'isNameEmpty').and.returnValue(false);
        spyOn(component as any, 'isNameOrganizor').and.returnValue(false);
        component.nameSubmitted();
        expect(socketServiceMock.send).toHaveBeenCalledWith('playerLogin', [component.gameCode, 'test']);
    });

    it('should handle loginError event', () => {
        const errorMessage = 'Login failed';
        loginErrorCallback(errorMessage);

        expect(alertServiceMock.showAlert).toHaveBeenCalledWith(errorMessage);
    });

    it('should emit playerConnected on loginSuccessful event', () => {
        spyOn(component.playerConnected, 'emit');
        loginSuccessfulCallback();

        expect(component.playerConnected.emit).toHaveBeenCalledWith('');
    });

    it('should not submit name if it is organizor', () => {
        expect(component['isNameOrganizor']('organIsateur')).toBeTrue();
        expect(component['isNameOrganizor']('Normal')).toBeFalse();
    });

    it('should not submit name if it is system', () => {
        expect(component['isNameSystem']('system')).toBeTrue();
        expect(component['isNameSystem']('Normal')).toBeFalse();
    });

    it('should not submit name if it is empty', () => {
        expect(component['isNameEmpty']('')).toBeTrue();
        expect(component['isNameEmpty']('test')).toBeFalse();
    });
});
