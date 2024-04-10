// Needed more line for test
/* eslint-disable max-lines */
// Needed to test private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { ActivatedRoute, Router } from '@angular/router';
import { FULL_GRADE, NEXT_QUESTION_TIMER, TESTER_QUESTION_DELAY } from '@common/const';
import { ErrorMessage } from '@common/errors';
import { LongResponseAnswerInfo, PointsToTester } from '@common/longResponse';
import { ClientQuestionInfo } from '@common/question';
import { SocketEvents } from '@common/socketEvents';
import { UserType } from '@common/user';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { AlertService } from './alert.service';
import { PlayAreaHandlerService } from './play-area-handler.service';
import { RouterService } from './router.service';
import { SocketClientService } from './socket-client.service';

describe('PlayAreaHandlerService', () => {
    let service: PlayAreaHandlerService;
    let socketServiceMock: Partial<SocketClientService>;
    let socketMock: Partial<Socket>;
    let routerServiceMock: jasmine.SpyObj<RouterService>;
    let routerMock: jasmine.SpyObj<Router>;
    let alertServiceMock: jasmine.SpyObj<AlertService>;

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

        routerMock = jasmine.createSpyObj('Router', ['navigate']);
        routerServiceMock = jasmine.createSpyObj('RouterService', ['getRouter', 'getRoute']);
        routerServiceMock.getRouter.and.returnValue(routerMock);

        alertServiceMock = jasmine.createSpyObj('AlertService', ['showAlert', 'getAlert']);
        alertServiceMock.getAlert.and.returnValue(of(''));
        TestBed.configureTestingModule({
            providers: [
                { provide: SocketClientService, useValue: socketServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: {} },
                { provide: RouterService, useValue: routerServiceMock },
                { provide: AlertService, useValue: alertServiceMock },
            ],
        });
        socketServiceMock = TestBed.inject(SocketClientService);
    });
    beforeEach(() => {
        service = TestBed.inject(PlayAreaHandlerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get state', () => {
        expect(service.state).toBe(service['playAreaState']);
    });

    it('should disconnect socket', () => {
        service.disconnectSocket();
        expect(socketServiceMock.disconnect).toHaveBeenCalled();
    });

    it('should do the submit protocol correctly', () => {
        service.submitProtocol();
        expect(socketServiceMock.send).toHaveBeenCalledWith('finalizeAnswers', jasmine.any(Function));
        expect(service.state.isSubmitting).toBeTrue();
        expect(service.state.isWaiting).toBeTrue();
    });

    it('should show an alert if no choice is selected', () => {
        (socketServiceMock.send as jasmine.Spy).and.callFake((eventName: string, callback: (res: boolean) => void) => {
            callback(false);
        });

        service.submitProtocol();
        expect(alertServiceMock.showAlert).toHaveBeenCalled();
        expect(service.state.isSubmitting).toBeFalse();
        expect(service.state.isWaiting).toBeFalse();
    });

    it('should set state correctly if it is organizer', async () => {
        (socketServiceMock.send as jasmine.Spy).and.callFake((eventName: string, callback: (res: boolean) => void) => {
            callback(true);
        });

        const res = await service['knowIfIsOrganizer']();
        expect(res).toBeTrue();
        expect(service.state.doesSeeResult).toBeTrue();
        expect(service['userType']).toBe(UserType.Organizer);
    });

    it('should set state correctly if it is tester', async () => {
        (socketServiceMock.send as jasmine.Spy).and.callFake((eventName: string, callback: (res: boolean) => void) => {
            callback(true);
        });
        service.state.doesSeeResult = true;
        const res = await service['knowIfIsTester']();
        expect(res).toBeTrue();
        expect(service['userType']).toBe(UserType.Tester);
        expect(service.state.doesSeeResult).toBeFalse();
    });

    it('should set state correctly if it is random game', async () => {
        (socketServiceMock.send as jasmine.Spy).and.callFake((eventName: string, callback: (res: boolean) => void) => {
            callback(true);
        });
        service.state.doesSeeResult = true;
        const res = await service['knowIfIsRandomMode']();
        expect(res).toBeTrue();
        expect(service['userType']).toBe(UserType.Player);
        expect(service.state.doesSeeResult).toBeFalse();
        expect(service['isRandomMode']).toBeTrue();
    });

    it('should load Question', () => {
        (socketServiceMock.send as jasmine.Spy).and.callFake((eventName: string, callback: (res: ClientQuestionInfo) => void) => {
            callback({} as ClientQuestionInfo);
        });
        service.loadQuestion();
        expect(socketServiceMock.send).toHaveBeenCalledWith('getCurrentQuestion', jasmine.any(Function));
        expect(service.state.currentQuestion).toBeDefined();
        expect(service.state.isLoaded).toBeTrue();
    });

    it('should fetch question duration', () => {
        const questionTime = 10;
        (socketServiceMock.send as jasmine.Spy).and.callFake((eventName: string, callback: (res: number) => void) => {
            callback(questionTime);
        });
        service.fetchQuestionDuration();
        expect(socketServiceMock.send).toHaveBeenCalledWith('getTimeForQuestion', jasmine.any(Function));
        expect(service.state.questionDuration).toBe(questionTime);
    });

    it('should put isFirst to false', () => {
        service.closeFirstWindow();
        expect(service.state.isFirst).toBeFalse();
    });

    it('should return is tester', () => {
        service['userType'] = UserType.Tester;
        expect(service['isTester']()).toBeTrue();
    });

    it('should initialize showAnswersForQuestion event', fakeAsync(() => {
        const playerInfo = {
            points: 0,
            isFirst: true,
        };
        (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: (res: any) => void) => {
            callback(playerInfo);
        });
        const closeSpy = spyOn(service, 'closeFirstWindow');
        const spy = spyOn(window, 'setTimeout').and.callThrough();
        service['initializeAnswersForQuestion']();
        expect(spy).toHaveBeenCalled();
        expect(socketServiceMock.on).toHaveBeenCalledWith('showAnswersForQuestion', jasmine.any(Function));
        expect(service.state.currentScore).toBe(playerInfo.points);
        expect(service.state.isFirst).toBe(playerInfo.isFirst);
        expect(service.state.isWaiting).toBeTrue();
        expect(service.state.isSubmitting).toBeFalse();
        tick(NEXT_QUESTION_TIMER);
        expect(closeSpy).toHaveBeenCalled();
    }));

    it('should initialize loadNextQuestion event', () => {
        (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: () => void) => {
            callback();
        });
        service['initializeLoadNextQuestion']();
        expect(socketServiceMock.on).toHaveBeenCalledWith('loadNextQuestion', jasmine.any(Function));
    });

    it('should initialize sendToAllFinalResults event', () => {
        (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: () => void) => {
            callback();
        });
        service['initializeShowFinalResults']();
        expect(socketServiceMock.on).toHaveBeenCalledWith('sendToAllFinalResults', jasmine.any(Function));
    });

    it('should initialize showResultQuestionButton event for tester', fakeAsync(() => {
        (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: () => void) => {
            callback();
        });
        spyOn(service as any, 'isTester').and.returnValue(true);
        const spy = spyOn(window, 'setTimeout').and.callThrough();
        service['initializeShowResultQuestionButton']();
        expect(spy).toHaveBeenCalled();
        expect(socketServiceMock.on).toHaveBeenCalledWith('showResultQuestionButton', jasmine.any(Function));
        tick(NEXT_QUESTION_TIMER);
        expect(service.state.isLeaving).toBeFalse();
    }));

    it('should initialize showResultQuestionButton event for random game', fakeAsync(() => {
        (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: () => void) => {
            callback();
        });
        spyOn(service as any, 'isRandomGame').and.returnValue(true);
        const spy = spyOn(window, 'setTimeout').and.callThrough();
        service['initializeShowResultQuestionButton']();
        expect(spy).toHaveBeenCalled();
        expect(socketServiceMock.on).toHaveBeenCalledWith('showResultQuestionButton', jasmine.any(Function));
        tick(NEXT_QUESTION_TIMER);
        expect(socketServiceMock.send).toHaveBeenCalledWith('goToResult');
    }));

    it('should initialize showNextQuestionButton event for tester', fakeAsync(() => {
        (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: () => void) => {
            callback();
        });
        spyOn(service as any, 'isTester').and.returnValue(true);
        const spy = spyOn(window, 'setTimeout').and.callThrough();
        service['initializeShowNextQuestionButton']();
        expect(spy).toHaveBeenCalledWith(jasmine.any(Function), TESTER_QUESTION_DELAY);
        expect(socketServiceMock.on).toHaveBeenCalledWith('showNextQuestionButton', jasmine.any(Function));
        tick(TESTER_QUESTION_DELAY);
        expect(socketServiceMock.send).toHaveBeenCalledWith('goToNextQuestion');
    }));

    it('should initialize showNextQuestionButton event for random game', fakeAsync(() => {
        (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: () => void) => {
            callback();
        });
        spyOn(service as any, 'isRandomGame').and.returnValue(true);
        const spy = spyOn(window, 'setTimeout').and.callThrough();
        service['initializeShowNextQuestionButton']();
        expect(spy).toHaveBeenCalledWith(jasmine.any(Function), TESTER_QUESTION_DELAY);
        expect(socketServiceMock.on).toHaveBeenCalledWith('showNextQuestionButton', jasmine.any(Function));
        tick(TESTER_QUESTION_DELAY);
        expect(socketServiceMock.send).toHaveBeenCalledWith('goToNextQuestion');
    }));

    it('should get userTypeValue from playAreaHandlerService', () => {
        service['userType'] = UserType.Organizer;
        expect(service.userTypeValue).toBe(service['userType']);
    });

    it('should initialize and handle points for long response correctly', () => {
        const longResponseAnswerInfo: LongResponseAnswerInfo = {
            points: 10,
            grade: 0.5,
        };

        (socketServiceMock.on as jasmine.Spy).and.callFake((eventName, callback) => {
            if (eventName === SocketEvents.ShowPointsForLongResponseQuestion) {
                callback(longResponseAnswerInfo);
            }
        });

        service['initializePointsForLongResponse']();

        expect(service.state.currentScore).toEqual(longResponseAnswerInfo.points);
        expect(service.state.grade).toEqual(longResponseAnswerInfo.grade * FULL_GRADE);
        expect(service.state.isGraded).toBeTrue();
        expect(service.state.isEvaluating).toBeFalse();
    });

    it('should handle loadNextQuestion event correctly', () => {
        (socketServiceMock.on as jasmine.Spy).and.callFake((eventName, callback) => {
            if (eventName === SocketEvents.LoadNextQuestion) {
                callback();
            }
        });
        service['initializeLoadNextQuestion']();
        expect(service.state.isLoaded).toBeFalse();
        expect(service.state.isGraded).toBeFalse();
        expect(socketServiceMock.send).toHaveBeenCalledWith(SocketEvents.GetCurrentQuestion, jasmine.any(Function));
    });

    it('should initialize and handle final results display correctly', () => {
        (socketServiceMock.on as jasmine.Spy).and.callFake((eventName, callback) => {
            if (eventName === SocketEvents.SendToAllFinalResults) {
                callback();
            }
        });

        service['initializeShowFinalResults']();

        expect(service.state.doesSeeResult).toBeTrue();
        expect(service.state.isGraded).toBeFalse();
    });

    it('should handle receiving points for testers correctly', fakeAsync(() => {
        const points = 100;
        const pointsToTester: PointsToTester = {
            points: 100,
            isLastQuestion: false,
        };
        (socketServiceMock.on as jasmine.Spy).and.callFake((eventName, callback) => {
            if (eventName === SocketEvents.SendPointsToTester) {
                callback(pointsToTester);
            }
        });
        service['userType'] = UserType.Tester;
        service['getLongResponseFromTester']();
        tick(TESTER_QUESTION_DELAY);
        expect(service.state.isGraded).toBeTrue();
        expect(service.state.grade).toEqual(points);
        expect(socketServiceMock.send).toHaveBeenCalledWith(SocketEvents.GoToNextQuestion);
    }));

    it('should call leavePage after NEXT_QUESTION_TIMER if isLastQuestion is true', fakeAsync(() => {
        const pointsToTester = { points: 100, isLastQuestion: true };
        spyOn(service, 'leavePage');
        service['verifyIfLastQuestionInTestMode'](pointsToTester);
        tick(NEXT_QUESTION_TIMER);
        expect(service.leavePage).toHaveBeenCalled();
    }));

    it('should call getLongResponse if user is not a tester', () => {
        service['userType'] = UserType.Organizer;
        const getLongResponseSpy = spyOn(service as any, 'getLongResponse');
        service['initializeOrganizerEvaluation']();
        expect(getLongResponseSpy).toHaveBeenCalled();
    });

    it('should call getLongResponseFromTester if user is a tester', () => {
        service['userType'] = UserType.Tester;
        const getLongResponseFromTesterSpy = spyOn(service as any, 'getLongResponseFromTester');
        service['initializeOrganizerEvaluation']();
        expect(getLongResponseFromTesterSpy).toHaveBeenCalled();
    });

    it('should set play area state correctly on receiving long response', () => {
        (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: () => void) => {
            if (eventName === SocketEvents.SendLongResponse) {
                callback();
            }
        });
        service['getLongResponse']();
        expect(socketServiceMock.on).toHaveBeenCalledWith(SocketEvents.SendLongResponse, jasmine.any(Function));
        expect(service.state.isEvaluating).toBeTrue();
        expect(service.state.isWaiting).toBeTrue();
        expect(service.state.isSubmitting).toBeFalse();
    });
    it('should initialize MutedByOrganizer and UnmutedByOrganizer events', () => {
        (socketServiceMock.on as jasmine.Spy).and.callFake((eventName: string, callback: () => void) => {
            callback();
        });
        service['initializeMutedByOrganizer']();
        expect(socketServiceMock.on).toHaveBeenCalledWith(SocketEvents.MutedByOrganizer, jasmine.any(Function));
        expect(socketServiceMock.on).toHaveBeenCalledWith(SocketEvents.UnmutedByOrganizer, jasmine.any(Function));
        expect(alertServiceMock.showAlert).toHaveBeenCalledWith(ErrorMessage.MutedByOrganizer);
        expect(alertServiceMock.showAlert).toHaveBeenCalledWith(ErrorMessage.UnmutedByOrganizer);
    });
});
