import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from '@app/services/alert.service';
import { RouterService } from '@app/services/router.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { LongResponseForOrganizer } from '@common/longResponse';
import { ClientQuestionInfo, QuestionForResultDisplay, QuestionType } from '@common/question';
import { SocketEvents } from '@common/socketEvents';
import { AppMaterialModule } from '../../modules/material.module';
import { ResultHistogramComponent } from '../result-histogram/result-histogram.component';
import { OrganizerViewComponent } from './organizer-view.component';

describe('OrganizerViewComponent', () => {
    let component: OrganizerViewComponent;
    let fixture: ComponentFixture<OrganizerViewComponent>;
    let mockSocketService: jasmine.SpyObj<SocketClientService>;
    let mockActivatedRoute: Partial<ActivatedRoute>;
    let mockRouter: Partial<Router>;
    let mockAlertService: jasmine.SpyObj<AlertService>;

    beforeEach(async () => {
        mockSocketService = jasmine.createSpyObj('SocketClientService', ['on', 'send', 'disconnect']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockAlertService = jasmine.createSpyObj('AlertService', ['showAlert']);
        mockActivatedRoute = {};

        mockSocketService.socket = jasmine.createSpyObj('Socket', [], { connected: true });

        await TestBed.configureTestingModule({
            declarations: [OrganizerViewComponent, ResultHistogramComponent],
            providers: [
                { provide: SocketClientService, useValue: mockSocketService },
                { provide: RouterService, useValue: { getRouter: () => mockRouter, getRoute: () => mockActivatedRoute } },
                { provide: Router, useValue: mockRouter },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: AlertService, useValue: mockAlertService },
            ],
            imports: [AppMaterialModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(OrganizerViewComponent);
        component = fixture.componentInstance;
        component.currentQuestion = {
            text: '',
            points: 0,
            type: QuestionType.All,
            choicesText: [],
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to /home if socket does not exist', () => {
        mockSocketService.socket = undefined as never;
        component.ngOnInit();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/home'], jasmine.any(Object));
    });

    it('should navigate to /home if user is not organizer', () => {
        (mockSocketService.send as jasmine.Spy).and.callFake((event: string, callback: (res: boolean) => void) => {
            if (event === 'getIsOrganizer') {
                callback(false);
            }
        });

        component.ngOnInit();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/home'], jasmine.any(Object));
    });

    it('should not navigate if user is organizer', () => {
        (mockSocketService.send as jasmine.Spy).and.callFake((event: string, callback: (res: boolean) => void) => {
            if (event === 'getIsOrganizer') {
                callback(true);
            }
        });
        component.ngOnInit();
        expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/home'], jasmine.any(Object));
    });

    it('should not navigate or disconnect if doesLeave is false', () => {
        component.currentState.isLeaving = true;
        component.leavePage(false);
        expect(mockSocketService.disconnect).not.toHaveBeenCalled();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        expect(component.currentState.isLeaving).toBeFalse();
    });

    it('should set isLeaving to true when leaveProtocol is called', () => {
        expect(component.currentState.isLeaving).toBeFalse();
        component.leaveProtocol();
        expect(component.currentState.isLeaving).toBeTrue();
    });

    it('should call send with goToNextQuestion when goToNextQuestion is called', () => {
        component.goToNextQuestion();
        expect(mockSocketService.send).toHaveBeenCalledWith('goToNextQuestion');
    });

    it('should call send with goToResult when goToResultView is called', () => {
        mockSocketService.send.calls.reset();
        component.goToResultView();
        expect(mockSocketService.send).toHaveBeenCalledWith('goToResult');
    });

    it('should navigate to /create-game if doesLeave is true', () => {
        component.leavePage(true);
        expect(mockSocketService.disconnect).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/create-game'], jasmine.any(Object));
    });

    it('should update currentQuestion with new question text and points', () => {
        const newQuestion: QuestionForResultDisplay = {
            text: 'New Question Text',
            points: 100,
            questionType: QuestionType.MultipleChoices,
            bandInfo: [
                { text: 'Choice 1', isCorrect: true, nbOfSelection: 0 },
                { text: 'Choice 2', isCorrect: false, nbOfSelection: 0 },
            ],
        };

        component.switchQuestion(newQuestion);

        expect(component.currentQuestion.text).toEqual(newQuestion.text);
        expect(component.currentQuestion.points).toEqual(newQuestion.points);
    });

    it('should not affect other properties of currentQuestion', () => {
        const initialType = component.currentQuestion.type;
        const initialChoicesText = component.currentQuestion.choicesText;

        const newQuestion: QuestionForResultDisplay = {
            text: 'Another New Question Text',
            points: 50,
            questionType: QuestionType.MultipleChoices,
            bandInfo: [
                { text: 'New Choice 1', isCorrect: false, nbOfSelection: 0 },
                { text: 'New Choice 2', isCorrect: true, nbOfSelection: 0 },
            ],
        };

        component.switchQuestion(newQuestion);

        expect(component.currentQuestion.type).toEqual(initialType);
        expect(component.currentQuestion.choicesText).toEqual(initialChoicesText);
    });

    it('should load current question from server on init', () => {
        const mockQuestion: ClientQuestionInfo = {
            text: 'Sample Question',
            points: 5,
            type: QuestionType.MultipleChoices,
            choicesText: ['Choice 1', 'Choice 2', 'Choice 3'],
        };

        (mockSocketService.send as jasmine.Spy).and.callFake((event: string, callback: (res: ClientQuestionInfo) => void) => {
            if (event === 'getCurrentQuestion') {
                callback(mockQuestion);
            }
        });

        component['loadQuestion']();

        expect(component.currentQuestion).toEqual(mockQuestion);
        expect(component.currentState.isLoaded).toBeTrue();
        expect(component.questionType).toBe(QuestionType.MultipleChoices);
    });

    it('should fetch question duration from server on init', () => {
        const mockDuration = 30;

        (mockSocketService.send as jasmine.Spy).and.callFake((event: string, callback: (res: number) => void) => {
            if (event === 'getTimeForQuestion') {
                callback(mockDuration);
            }
        });

        component['fetchQuestionDuration']();

        expect(component.questionDuration).toEqual(mockDuration);
    });

    it('should set canGoToNextQuestion to true on "showNextQuestionButton" event', () => {
        (mockSocketService.on as jasmine.Spy).and.callFake((event: string, callback: (res: void) => void) => {
            if (event === 'showNextQuestionButton') {
                callback();
            }
        });

        component['initializeSocket']();
        expect(component.currentState.canGoToNextQuestion).toBeTrue();
    });

    it('should set canGoToResultView to true on "showResultQuestionButton" event', () => {
        (mockSocketService.on as jasmine.Spy).and.callFake((event: string, callback: (res: void) => void) => {
            if (event === 'showResultQuestionButton') {
                callback();
            }
        });

        component['initializeSocket']();
        expect(component.currentState.canGoToResultView).toBeTrue();
    });

    it('should reset canGoToNextQuestion and load a new question on "loadNextQuestion" event', () => {
        component.currentState.canGoToNextQuestion = true;
        (mockSocketService.on as jasmine.Spy).and.callFake((event: string, callback: (res: void) => void) => {
            if (event === 'loadNextQuestion') {
                callback();
            }
        });

        spyOn(component as never, 'loadQuestion');

        component['initializeSocket']();
        expect(component.currentState.canGoToNextQuestion).toBeFalse();
        expect(component['loadQuestion']).toHaveBeenCalled();
    });

    it('should disable canGoToResultView and doesSeeTimer on "sendToAllFinalResults" event', () => {
        (mockSocketService.on as jasmine.Spy).and.callFake((event: string, callback: (res: void) => void) => {
            if (event === 'sendToAllFinalResults') {
                callback();
            }
        });

        component['initializeSocket']();
        expect(component.currentState.canGoToResultView).toBeFalse();
        expect(component.currentState.doesSeeTimer).toBeFalse();
    });

    it('should show an alert and disconnect on "allPlayerDisconnected" event', () => {
        (mockSocketService.on as jasmine.Spy).and.callFake((event: string, callback: (res: void) => void) => {
            if (event === 'allPlayerDisconnected') {
                callback();
            }
        });

        component['initializeSocket']();
        expect(mockAlertService.showAlert).toHaveBeenCalledWith('Tous les joueurs se sont déconnectés');
        expect(mockSocketService.disconnect).toHaveBeenCalled();
    });

    it('should user type (Organizer)', () => {
        expect(component.getUserType()).toEqual('Organizer');
    });

    it('should return true if timer is enabled', () => {
        component.currentState.isLoaded = true;
        component.currentState.doesSeeTimer = true;
        expect(component.isTimerEnabled()).toBeTrue();
    });

    it('should set evaluationDisplay to false when evaluationComplete is true', () => {
        component.evaluationDisplay = true;
        component.handleAllResponsesEvaluated(true);
        expect(component.evaluationDisplay).toBeFalse();
    });

    it('should not change evaluationDisplay when evaluationComplete is false', () => {
        component.evaluationDisplay = true;
        component.handleAllResponsesEvaluated(false);
        expect(component.evaluationDisplay).toBeTrue();
    });

    it('should update responsesArray and set evaluationDisplay to true on receiving SendLongResponse', () => {
        const longResponses: LongResponseForOrganizer[] = [
            { userName: 'User1', longResponse: 'Response1' },
            { userName: 'User2', longResponse: 'Response2' },
        ];
        (mockSocketService.on as jasmine.Spy).and.callFake((event, callback) => {
            if (event === SocketEvents.SendLongResponse) {
                callback(longResponses);
            }
        });
        component.ngOnInit();
        mockSocketService.on.calls.mostRecent().args[1](longResponses);
        expect(component.responsesArray).toEqual(longResponses);
        expect(component.evaluationDisplay).toBeTrue();
    });
});
