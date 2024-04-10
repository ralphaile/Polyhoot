import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChoicePercentageCalculatorService } from '@app/services/choice-percentage-calculator.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { NO_BAR_SELECTED } from '@common/const';
import { QuestionForResultDisplay, QuestionType } from '@common/question';
import { AppMaterialModule } from '../../modules/material.module';
import { ResultHistogramComponent } from './result-histogram.component';

describe('ResultHistogramComponent', () => {
    let component: ResultHistogramComponent;
    let fixture: ComponentFixture<ResultHistogramComponent>;
    let mockSocketService: jasmine.SpyObj<SocketClientService>;
    let choicePercentageCalculatorService: jasmine.SpyObj<ChoicePercentageCalculatorService>;

    beforeEach(async () => {
        mockSocketService = jasmine.createSpyObj('SocketClientService', ['on', 'send', 'emit']);
        choicePercentageCalculatorService = jasmine.createSpyObj('ChoicePercentageCalculatorService', ['calculatePercentage']);
        await TestBed.configureTestingModule({
            declarations: [ResultHistogramComponent],
            providers: [
                { provide: SocketClientService, useValue: mockSocketService },
                { provide: ChoicePercentageCalculatorService, useValue: choicePercentageCalculatorService },
            ],
            imports: [AppMaterialModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ResultHistogramComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.currentDisplayedQuestion = {
            text: 'Test Question',
            points: 1,
            questionType: QuestionType.MultipleChoices,
            bandInfo: [
                { text: 'Choice 1', isCorrect: true, nbOfSelection: 5 },
                { text: 'Choice 2', isCorrect: false, nbOfSelection: 0 },
            ],
        };
        component.questions = [
            { text: 'Question 1', points: 1, questionType: QuestionType.MultipleChoices, bandInfo: [] },
            { text: 'Question 2', points: 2, questionType: QuestionType.MultipleChoices, bandInfo: [] },
            { text: 'Question 3', points: 3, questionType: QuestionType.MultipleChoices, bandInfo: [] },
        ];
        component.currentQuestion = 0;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should request questions from the server and initialize on ngOnInit', () => {
        const mockSingleQuestion: QuestionForResultDisplay[] = [
            {
                text: 'Sample Question',
                points: 5,
                questionType: QuestionType.MultipleChoices,
                bandInfo: [
                    { text: 'Choice 1', isCorrect: true, nbOfSelection: 20 },
                    { text: 'Choice 2', isCorrect: false, nbOfSelection: 10 },
                ],
            },
        ];

        mockSocketService.send.and.callFake((event, callback) => {
            if (event === 'getQuestionChoices' && typeof callback === 'function') {
                callback(mockSingleQuestion);
            }
        });

        component.ngOnInit();

        expect(mockSocketService.send).toHaveBeenCalledWith('getQuestionChoices', jasmine.any(Function));
        expect(component.questions).toEqual(mockSingleQuestion);
        expect(component.currentDisplayedQuestion).toEqual(mockSingleQuestion[0]);
    });

    it('should initialize socket listeners on ngOnInit', () => {
        component.ngOnInit();

        expect(mockSocketService.on).toHaveBeenCalledWith('updateResults', jasmine.any(Function));
        expect(mockSocketService.on).toHaveBeenCalledWith('loadNextQuestion', jasmine.any(Function));
        expect(mockSocketService.on).toHaveBeenCalledWith('sendToAllFinalResults', jasmine.any(Function));
    });

    it('should not update questionTextXPos and questionTextYPos if NO_BAR_SELECTED', () => {
        component.graphChoices.hoveredChoice = NO_BAR_SELECTED;
        const event = new MouseEvent('mousemove', {
            screenX: 100,
            screenY: 150,
        });
        component.onMouseMove(event);
        expect(component.graphChoices.choiceTextXPos).toBe(0);
        expect(component.graphChoices.choiceTextYPos).toBe(0);
    });

    it('should update questionTextXPos and questionTextYPos on mouse move when a bar is selected', () => {
        component.graphChoices.hoveredChoice = 1;
        const simulationX = 100;
        const simulationY = 150;
        const event = new MouseEvent('mousemove', {
            clientX: 100,
            clientY: 150,
        });

        document.dispatchEvent(event);

        expect(component.graphChoices.choiceTextXPos).toBe(simulationX);
        expect(component.graphChoices.choiceTextYPos).toBe(simulationY);
    });

    it('should correctly calculate percentages when choices have selections', () => {
        component['calculatePercentage']();
        expect(choicePercentageCalculatorService.calculatePercentage).toHaveBeenCalledWith(component.currentDisplayedQuestion);
    });

    it('should increment currentQuestion and update currentDisplayedQuestion when increasing', () => {
        component.changeQuestion(true);
        expect(component.currentQuestion).toBe(1);
        expect(component.currentDisplayedQuestion).toEqual(component.questions[1]);
    });

    it('should decrement currentQuestion and update currentDisplayedQuestion when decreasing', () => {
        component.currentQuestion = 2;
        component.changeQuestion(false);
        expect(component.currentQuestion).toBe(1);
        expect(component.currentDisplayedQuestion).toEqual(component.questions[1]);
    });

    it('should not increment currentQuestion beyond the last question', () => {
        component.currentQuestion = 2;
        component.changeQuestion(true);
        expect(component.currentQuestion).toBe(2);
        expect(component.currentDisplayedQuestion).toEqual(component.questions[2]);
    });

    it('should not decrement currentQuestion below the first question', () => {
        component.changeQuestion(false);
        expect(component.currentQuestion).toBe(0);
        expect(component.currentDisplayedQuestion).toEqual(component.questions[0]);
    });

    it('should emit the currentDisplayedQuestion on changing question', () => {
        spyOn(component.switchQuestion, 'emit');
        component.changeQuestion(true);
        expect(component.switchQuestion.emit).toHaveBeenCalledWith(component.currentDisplayedQuestion);
    });

    it('should set isShowingQuestionText to the passed index on trackMousePosition', () => {
        const testIndex = 2;
        component.trackMousePosition(testIndex);
        expect(component.graphChoices.hoveredChoice).toBe(testIndex);
    });

    it('should reset isShowingQuestionText to NO_BAR_SELECTED on stopTrackingMousePosition', () => {
        component.trackMousePosition(2);
        component.stopTrackingMousePosition();
        expect(component.graphChoices.hoveredChoice).toBe(NO_BAR_SELECTED);
    });

    it('should update questions and currentDisplayedQuestion on updateResults event', () => {
        const newResults: QuestionForResultDisplay = {
            text: 'Updated Question',
            points: 10,
            questionType: QuestionType.MultipleChoices,
            bandInfo: [{ text: 'Updated Choice', isCorrect: true, nbOfSelection: 20 }],
        };

        component.ngOnInit();

        mockSocketService.send.and.callFake((eventName: string, data: unknown, callback?: (res: QuestionForResultDisplay) => void) => {
            if (eventName === 'updateResults' && callback) {
                callback(newResults);
            }
        });

        const eventHandler = mockSocketService.on.calls.argsFor(0)[1];
        eventHandler(newResults);

        expect(component.questions).toEqual([newResults]);
        expect(component.currentDisplayedQuestion).toEqual(newResults);
        expect(component.graphChoices.numberOfChoices).toBe(newResults.bandInfo.length);
    });

    it('should update questions and currentDisplayedQuestion on sendToAllFinalResults event', () => {
        const finalResults: QuestionForResultDisplay[] = [
            {
                text: 'Final Question',
                points: 10,
                questionType: QuestionType.MultipleChoices,
                bandInfo: [{ text: 'Final Choice', isCorrect: true, nbOfSelection: 30 }],
            },
        ];

        mockSocketService.on.calls.argsFor(2)[1](finalResults);

        expect(component.questions).toEqual(finalResults);
        expect(component.currentDisplayedQuestion).toEqual(finalResults[0]);
        expect(component.graphChoices.numberOfChoices).toBe(finalResults[0].bandInfo.length);
    });

    it('should initialize socket listeners on component initialization', () => {
        expect(mockSocketService.on.calls.count()).toBeGreaterThan(0);
        expect(mockSocketService.on).toHaveBeenCalledWith('updateResults', jasmine.any(Function));
        expect(mockSocketService.on).toHaveBeenCalledWith('loadNextQuestion', jasmine.any(Function));
        expect(mockSocketService.on).toHaveBeenCalledWith('sendToAllFinalResults', jasmine.any(Function));
    });

    it('should request new questions when "loadNextQuestion" event is received', () => {
        const mockQuestions: QuestionForResultDisplay[] = [
            {
                text: 'Updated Question',
                points: 10,
                questionType: QuestionType.MultipleChoices,
                bandInfo: [
                    { text: 'Updated Choice 1', isCorrect: true, nbOfSelection: 25 },
                    { text: 'Updated Choice 2', isCorrect: false, nbOfSelection: 15 },
                ],
            },
        ];

        mockSocketService.send.and.callFake((event, callback) => {
            if (event === 'getQuestionChoices' && typeof callback === 'function') {
                callback(mockQuestions);
            }
        });

        const allCalls = mockSocketService.on.calls.allArgs();
        const loadNextQuestionCall = allCalls.find((args) => args[0] === 'loadNextQuestion');
        if (loadNextQuestionCall && typeof loadNextQuestionCall[1] === 'function') {
            const loadNextQuestionHandler = loadNextQuestionCall[1] as (data?: unknown) => void;
            loadNextQuestionHandler();
        }

        expect(mockSocketService.send).toHaveBeenCalledWith('getQuestionChoices', jasmine.any(Function));

        expect(component.questions).toEqual(mockQuestions);
        expect(component.currentDisplayedQuestion).toEqual(mockQuestions[0]);
        expect(component.graphChoices.numberOfChoices).toEqual(mockQuestions[0].bandInfo.length);
    });
});
