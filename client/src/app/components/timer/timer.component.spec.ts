// used to test private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimerComponent } from '@app/components/timer/timer.component';
import { TimerInfo } from '@app/interfaces/timer-info';
import { SocketClientService } from '@app/services/socket-client.service';
import { DEFAULT_ROTATION_SPEED, FAST_ROTATION_SPEED, STOP_SPINNING } from '@common/const';
import { QuestionType } from '@common/question';
import { SocketEvents } from '@common/socketEvents';
import { UserType } from '@common/user';
import { Socket } from 'socket.io-client';
import { AppMaterialModule } from '../../modules/material.module';

const timerInfoMock: TimerInfo = {
    rotationSpeed: DEFAULT_ROTATION_SPEED,
    timerMode: {
        isInPanicMode: false,
        isPaused: false,
    },
    time: 10,
};

describe('TimerComponent', () => {
    let component: TimerComponent;
    let fixture: ComponentFixture<TimerComponent>;
    let mockSocketService: jasmine.SpyObj<SocketClientService>;
    let socketMock: Partial<Socket>;
    let socketServiceMock: Partial<SocketClientService>;

    beforeEach(async () => {
        socketMock = {
            on: jasmine.createSpy('on'),
            send: jasmine.createSpy('send'),
            connect: jasmine.createSpy('connect'),
        };
        socketServiceMock = {
            socket: socketMock as Socket,
            send: jasmine.createSpy('send'),
            on: jasmine.createSpy('on'),
            disconnect: jasmine.createSpy('disconnect'),
        };
        await TestBed.configureTestingModule({
            declarations: [TimerComponent],
            providers: [
                { provide: SocketClientService, useValue: mockSocketService },
                { provide: SocketClientService, useValue: socketServiceMock },
            ],
            imports: [AppMaterialModule],
        }).compileComponents();
        socketServiceMock = TestBed.inject(SocketClientService);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TimerComponent);
        component = fixture.componentInstance;
        component['timerInfo'] = timerInfoMock;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('pauseTimer', () => {
        it('should send pauseTimer when called', () => {
            component.pauseTimer();
            expect(socketServiceMock.send).toHaveBeenCalledWith(SocketEvents.PauseTimer);
        });
    });
    describe('enterPanicMode', () => {
        it('should send to the socket the event EnterPanicMode if the mode is not PanicMode', () => {
            component['timerInfo'].timerMode.isInPanicMode = false;
            component.enterPanicMode();
            expect(socketServiceMock.send).toHaveBeenCalledWith(SocketEvents.EnterPanicMode);
        });
        it('should send to the socket the event EnterPanicMode if the mode is not PanicMode', () => {
            component['timerInfo'].timerMode.isInPanicMode = true;
            component.enterPanicMode();
            expect(socketServiceMock.send).not.toHaveBeenCalledWith(SocketEvents.EnterPanicMode);
        });
    });

    describe('isPanicButtonDisable', () => {
        it('should return true if the timer is in PanicMode', () => {
            component['timerInfo'].timerMode.isInPanicMode = true;
            expect(component.isPanicButtonDisable()).toBeTrue();
        });
        it('should return true if the buttons are disabled', () => {
            component['timerInfo'].timerMode.isInPanicMode = false;
            component.buttonsAreDisable = true;
            expect(component.isPanicButtonDisable()).toBeTrue();
        });
        it('should return true if the timer the time is 0', () => {
            component['timerInfo'].timerMode.isInPanicMode = false;
            component['timerInfo'].time = 0;
            expect(component.isPanicButtonDisable()).toBeTrue();
        });
        it('should verify with MIN_TIME_FOR_PANIC_IN_LONG_QUESTION when is not in PanicMode and question type is LongAnswer', () => {
            component.questionType = QuestionType.LongAnswer;
            component['timerInfo'].timerMode.isInPanicMode = false;
            component['timerInfo'].time = 30;
            expect(component.isPanicButtonDisable()).toBeTrue();
            component['timerInfo'].time = 10;
            expect(component.isPanicButtonDisable()).toBeFalse();
        });
        it('should verify with MIN_TIME_FOR_PANIC_IN_SHORT_QUESTION when is not in PanicMode and question type is MultipleChoices', () => {
            component.questionType = QuestionType.MultipleChoices;
            component['timerInfo'].timerMode.isInPanicMode = false;
            component['timerInfo'].time = 20;
            expect(component.isPanicButtonDisable()).toBeTrue();
            component['timerInfo'].time = 5;
            expect(component.isPanicButtonDisable()).toBeFalse();
        });
    });

    describe('getTime', () => {
        it('should get the time when called', () => {
            const time = 10;
            (socketServiceMock.send as jasmine.Spy).and.callFake((eventName: string, callback: (res: number) => void) => {
                callback(time);
            });
            component['getTime']();
            expect(socketServiceMock.send).toHaveBeenCalledWith(SocketEvents.GetDuration, jasmine.any(Function));
            expect(component['timerInfo'].time).toBe(time);
        });
    });

    describe('getTypeOfUser', () => {
        it('should not change the user type if the server return false', () => {
            component.playerType = UserType.Player;
            (socketServiceMock.send as jasmine.Spy).and.callFake((eventName: string, callback: (res: boolean) => void) => {
                callback(false);
            });
            component['getTypeOfUser']();
            expect(socketServiceMock.send).toHaveBeenCalledWith(SocketEvents.GetIsOrganizer, jasmine.any(Function));
            expect(socketServiceMock.send).toHaveBeenCalledWith(SocketEvents.GetIsTester, jasmine.any(Function));
            expect(component.playerType).toBe(UserType.Player);
        });
        it('should set the playerType to be Tester if the server return true', () => {
            component.playerType = UserType.Player;
            (socketServiceMock.send as jasmine.Spy).and.callFake((eventName: string, callback: (res: boolean) => void) => {
                callback(true);
            });
            component['getTypeOfUser']();
            expect(socketServiceMock.send).toHaveBeenCalledWith(SocketEvents.GetIsOrganizer, jasmine.any(Function));
            expect(socketServiceMock.send).toHaveBeenCalledWith(SocketEvents.GetIsTester, jasmine.any(Function));
            expect(component.playerType).toBe(UserType.Tester);
        });
    });

    describe('startTimer', () => {
        it('should set the rotation speed and timer mode to normal when not inPanicMode', () => {
            component['timerInfo'].timerMode.isInPanicMode = false;
            component['startTimer']();
            expect(component.rotationSpeed).toBe(DEFAULT_ROTATION_SPEED);
            expect(component.isPaused).toBeFalse();
        });
        it('should set the rotation speed to fast and start it when inPanicMode', () => {
            component['timerInfo'].timerMode.isInPanicMode = true;
            component['startTimer']();
            expect(component.rotationSpeed).toBe(FAST_ROTATION_SPEED);
            expect(component.isPaused).toBeFalse();
        });
    });

    describe('stopTimer', () => {
        it('should set the rotation speed and timer mode to stopped', () => {
            component['stopTimer']();
            expect(component.rotationSpeed).toBe(STOP_SPINNING);
            expect(component.isPaused).toBeTrue();
        });
    });

    describe('panicProcess', () => {
        it('should play the sound and the timer mode to panic', () => {
            const soundSpy = spyOn(component.panicSound, 'play');
            component['timerInfo'].timerMode.isPaused = false;
            component['panicProcess']();
            expect(component.rotationSpeed).toBe(FAST_ROTATION_SPEED);
            expect(component.isInPanicMode).toBeTrue();
            expect(soundSpy).toHaveBeenCalled();
        });
        it('should play the sound and the timer mode to panic but paused if isPause is true', () => {
            const soundSpy = spyOn(component.panicSound, 'play');
            component['timerInfo'].timerMode.isPaused = true;
            component['panicProcess']();
            expect(component.rotationSpeed).toBe(STOP_SPINNING);
            expect(component.isInPanicMode).toBeTrue();
            expect(soundSpy).toHaveBeenCalled();
        });
    });

    describe('stopTimerForResult', () => {
        it('should put the timer into PanicMode but with a stopped rotationSpeed', () => {
            component['stopTimerForResult']();
            expect(component.rotationSpeed).toBe(STOP_SPINNING);
        });
    });

    describe('initializeShowAnswersForQuestionEvent', () => {
        it('should call stop timer on ShowAnswersForQuestionEvent', () => {
            const stopTimerSpy = spyOn(component as any, 'stopTimerForResult');
            (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: () => void) => {
                callback();
            });
            component['initializeShowAnswersForQuestionEvent']();
            expect(stopTimerSpy).toHaveBeenCalled();
        });
    });

    describe('initializeRefreshPlayerListEvent', () => {
        it('should call stop timer on RefreshPlayerList', () => {
            const stopTimerSpy = spyOn(component as any, 'stopTimerForResult');
            (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: () => void) => {
                callback();
            });
            component['initializeRefreshPlayerListEvent']();
            expect(stopTimerSpy).toHaveBeenCalled();
        });
    });

    describe('initializeRefreshPlayerListEvent', () => {
        it('should set the timer to the new time on RefreshTimer', () => {
            const time = 10;
            (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: (newTime: number) => void) => {
                callback(time);
            });
            component['initializeRefreshTimerEvent']();
            expect(component.time).toEqual(time);
        });
    });

    describe('initializeSendLongResponseEvent', () => {
        it('should call stop timer on RefreshPlayerList', () => {
            const stopTimerSpy = spyOn(component as any, 'stopTimerForResult');
            (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: () => void) => {
                callback();
            });
            component['initializeSendLongResponseEvent']();
            expect(stopTimerSpy).toHaveBeenCalled();
        });
    });

    describe('initializeToggleTimerSpinEvent', () => {
        it('should start the timer when the server response is true', () => {
            const startTimerToNormalSpeedSpy = spyOn(component as any, 'startTimer');
            (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: (shouldBeSpinning: boolean) => void) => {
                callback(true);
            });
            component['initializeToggleTimerSpinEvent']();
            expect(startTimerToNormalSpeedSpy).toHaveBeenCalled();
        });
        it('should stop the timer when the server response is false', () => {
            const stopTimerSpy = spyOn(component as any, 'stopTimer');
            (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: (shouldBeSpinning: boolean) => void) => {
                callback(false);
            });
            component['initializeToggleTimerSpinEvent']();
            expect(stopTimerSpy).toHaveBeenCalled();
        });
    });

    describe('initializeEnterInPanicModeEvent', () => {
        it('should call panicProcess on EnterInPanicMode ', () => {
            const panicProcessSpy = spyOn(component as any, 'panicProcess');
            (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: () => void) => {
                callback();
            });
            component['initializeEnterInPanicModeEvent']();
            expect(panicProcessSpy).toHaveBeenCalled();
        });
    });
});
