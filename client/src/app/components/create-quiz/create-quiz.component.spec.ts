// Needed for private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { AlertService } from '@app/services/alert.service';
import { ConfirmationDialogService } from '@app/services/confirmation-dialog.service';
import { DatabaseService } from '@app/services/database.service';
import { GameQuestionValidatorService } from '@app/services/game-question-validator.service';
import { HttpManager } from '@app/services/http-manager.service';
import { DEFAULT_DURATION, MAX_QUESTION_LENGTH } from '@common/const';
import { ErrorMessage } from '@common/errors';
import { Question, QuestionColor, QuestionType } from '@common/question';
import { Quiz } from '@common/quiz';
import { of } from 'rxjs';
import { CreateQuizComponent } from './create-quiz.component';
import SpyObj = jasmine.SpyObj;
describe('CreateQuizComponent', () => {
    let component: CreateQuizComponent;
    let fixture: ComponentFixture<CreateQuizComponent>;
    let testQuiz: Quiz;
    let question: Question;
    let alertServiceSpy: SpyObj<AlertService>;
    beforeEach(() => {
        alertServiceSpy = jasmine.createSpyObj('AlertService', ['showAlert', 'getAlert']);
        alertServiceSpy.getAlert.and.returnValue(of(''));
        TestBed.configureTestingModule({
            declarations: [CreateQuizComponent],
            imports: [ReactiveFormsModule, MatTableModule, MatInputModule, HttpClientTestingModule, MatDialogModule],
            providers: [HttpManager, { provide: AlertService, useValue: alertServiceSpy }],
        }).compileComponents();
        fixture = TestBed.createComponent(CreateQuizComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(CreateQuizComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        question = {
            id: '0',
            type: QuestionType.LongAnswer,
            text: 'Question Test',
            points: 20,
            choices: [],
        };
        testQuiz = {
            id: '1',
            title: 'General Knowledge',
            description: 'A quiz to test your general knowledge',
            duration: 30,
            lastModification: new Date(),
            questions: [
                {
                    id: '1',
                    type: QuestionType.MultipleChoices,
                    text: 'What is the capital of Canada?',
                    points: 10,
                    choices: [
                        { text: 'Toronto', isCorrect: false },
                        { text: 'Vancouver', isCorrect: false },
                        { text: 'Ottawa', isCorrect: true },
                        { text: 'Montreal', isCorrect: false },
                    ],
                },
                {
                    id: '2',
                    type: QuestionType.MultipleChoices,
                    text: 'The sun is a star.',
                    points: 10,
                    choices: [
                        { text: 'True', isCorrect: true },
                        { text: 'False', isCorrect: false },
                    ],
                },
            ],
            isVisible: true,
        };
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should generate the form with the values of the current quiz if it is not null', () => {
        component.quizInput = testQuiz;
        component.ngOnInit();
        expect(component.quizForm.value.title).toBe(testQuiz.title);
        expect(component.quizForm.value.description).toBe(testQuiz.description);
        expect(component.quizForm.value.duration).toBe(testQuiz.duration);
    });

    it('should have an empty form if the input quiz is null', () => {
        component.quizInput = null;
        component.ngOnInit();
        expect(component.quizForm.value.title).toBe('');
        expect(component.quizForm.value.description).toBe('');
        expect(component.quizForm.value.duration).toBe(DEFAULT_DURATION);
    });
    it('should show bank', () => {
        component.currentQuizFormState.currentPage = 'create-quiz';
        component.showBank();
        expect(component.currentQuizFormState.currentPage).toBe('bank');

        component.showBank();
        expect(component.currentQuizFormState.currentPage).toBe('create-quiz');
    });
    it('should set formChanged to true when form values change', () => {
        component.ngOnInit();

        component.quizForm.setValue({ title: 'testQuiz', description: 'This is a test Quiz', duration: 40 });

        expect(component.currentQuizFormState.isFormChanged).toBeTrue();
    });
    it('should cancel question form', () => {
        component.currentQuizFormState.currentPage = 'create-quiz';
        component.currentQuizFormState.currentQuestion = {} as Question;
        component.cancelQuestionForm();
        expect(component.currentQuizFormState.currentPage).toBe('create-quiz');
        expect(component.currentQuizFormState.currentQuestion).toBeNull();
    });

    it('should modify question', () => {
        component.modifyQuestion(question);
        expect(component.currentQuizFormState.currentQuestion).toBe(question);
        expect(component.currentQuizFormState.currentPage).toBe('create-question');
    });

    it('should modify question in quiz', () => {
        const quiz: Quiz = { questions: [question] } as Quiz;
        component.currentQuizFormState.currentQuiz = quiz;
        component.currentQuizFormState.currentQuestion = question;
        const indexToUpdate = component.quizQuestions.findIndex((q) => q.id === component.currentQuizFormState.currentQuestion?.id);
        component['modifyQuestionInQuiz'](question, indexToUpdate);

        expect(quiz.questions[0]).toBe(question);
    });

    it('should add question to bank', async () => {
        const spy = spyOn(TestBed.inject(HttpManager), 'addQuestion').and.resolveTo(new HttpResponse({ status: 200, body: 'Success' }));

        await component.addToBank(question);
        expect(spy).toHaveBeenCalledWith(question);
    });

    it('should alert if question is already in bank', async () => {
        spyOn(TestBed.inject(HttpManager), 'addQuestion').and.throwError(new Error());
        await component.addToBank(question);
        expect(alertServiceSpy.showAlert).toHaveBeenCalledWith(ErrorMessage.SimilarQuestionInBank);
    });

    it('should handle drop event', () => {
        component.currentQuizFormState.currentQuiz = { questions: [{}] } as Quiz;
        const event: CdkDragDrop<string[]> = {
            previousIndex: 0,
            currentIndex: 1,
        } as CdkDragDrop<string[]>;

        component.onDropEvent(event);

        expect(component.currentQuizFormState.isFormChanged).toBeTrue();
    });

    it('should add question to quiz', () => {
        component.currentQuizFormState.currentQuiz = testQuiz;
        component.addQuestion(question);
        expect(component.quizQuestions.length).toBe(3);
    });

    it('should delete question from quiz', () => {
        component.currentQuizFormState.currentQuiz = testQuiz;
        component.deleteQuestion(testQuiz.questions[0]);
        expect(component.currentQuizFormState.currentQuiz.questions.length).toBe(1);
    });
    it('should alert if we try to remove all the questions in a quiz', () => {
        component.currentQuizFormState.currentQuiz = testQuiz;
        component.deleteQuestion(testQuiz.questions[0]);

        component.deleteQuestion(testQuiz.questions[0]);
        expect(alertServiceSpy.showAlert).toHaveBeenCalledWith(ErrorMessage.QuizMustHaveQuestions);
    });

    it('should create question', () => {
        component.createQuestion();
        expect(component.currentQuizFormState.currentQuestion).toBeNull();
        expect(component.currentQuizFormState.currentPage).toBe('create-question');
    });

    it('should generate the quiz when the form is submitted (create)', async () => {
        component.quizForm = new FormGroup({
            title: new FormControl('title'),
            description: new FormControl('description'),
            duration: new FormControl(DEFAULT_DURATION),
        });
        const generatedQuiz = component['generateQuiz']();
        expect(generatedQuiz.title).toBe('title');
        expect(generatedQuiz.description).toBe('description');
        expect(generatedQuiz.duration).toBe(DEFAULT_DURATION);
    });

    it('should return true if the given text is in the questionsInBank array', () => {
        component['questionsInBank'] = ['Question 1', 'Question 2', 'Question 3'];
        const result = component.isInBank('Question 2');
        expect(result).toBe(true);
    });

    it('should return false if the given text is not in the questionsInBank array', () => {
        component['questionsInBank'] = ['Question 1', 'Question 2', 'Question 3'];
        const result = component.isInBank('Question 4');
        expect(result).toBe(false);
    });

    it('should handle form submission', async () => {
        const spy = spyOn(component as any, 'generateQuiz').and.returnValue(testQuiz);
        const spy2 = spyOn(component as any, 'modifyQuizBank');
        const spy3 = spyOn(component, 'goToList');

        await component.onSubmit();
        expect(spy).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalledWith(testQuiz);
        expect(spy3).toHaveBeenCalled();
    });

    it('should show an alert if there is an error modifying the bank', async () => {
        spyOn(component as any, 'generateQuiz').and.returnValue(testQuiz);
        spyOn(component as any, 'modifyQuizBank').and.throwError(new Error());
        await component.onSubmit();
        expect(alertServiceSpy.showAlert).toHaveBeenCalled();
    });

    it('should emit the changeViewEvent', () => {
        const spy = spyOn(component.changeViewEvent, 'emit');
        component.goToList();
        expect(spy).toHaveBeenCalled();
    });

    it('should get the question text with the maximum length', () => {
        const REPEAT_TIMES = 500;
        let question2 = { text: 'a'.repeat(REPEAT_TIMES) } as Question;
        expect(component.getQuestionText(question2)).toBe('a'.repeat(MAX_QUESTION_LENGTH) + '...');
        question2 = { text: 'a'.repeat(MAX_QUESTION_LENGTH - 1) } as Question;
        expect(component.getQuestionText(question2)).toBe(question2.text);
    });

    it('should get the correct submit button text', () => {
        component.currentQuizFormState.isModifyingQuiz = true;
        expect(component.getSubmitButtonText()).toBe('Modifier');
        component.currentQuizFormState.isModifyingQuiz = false;
        expect(component.getSubmitButtonText()).toBe('Ajouter');
    });

    it('should validate a question', async () => {
        const spy = spyOn(component as any, 'confirmNewQuestionData');
        const spy2 = spyOn(TestBed.inject(GameQuestionValidatorService), 'isValidQuestion').and.returnValue(Promise.resolve(true));
        await component.validateQuestion(question);
        expect(spy).toHaveBeenCalledWith(question);
        expect(spy2).toHaveBeenCalledWith(question, component.currentQuizFormState.currentQuiz);
    });

    it('should handle questions in bank', async () => {
        spyOn(TestBed.inject(DatabaseService), 'fetchQuestions').and.returnValue(Promise.resolve([question]));
        await component['checkQuestionsInBank']();
        expect(component['questionsInBank']).toEqual([question.text]);
    });

    it('should modify the quiz bank', async () => {
        const spy = spyOn(TestBed.inject(DatabaseService), 'updateQuiz');
        await component['modifyQuizBank'](testQuiz);
        expect(spy).toHaveBeenCalledWith(component.currentQuizFormState.isModifyingQuiz, testQuiz);
    });

    it('should confirm new question data when modifying a question', () => {
        component.currentQuizFormState.currentQuiz = testQuiz;
        component.currentQuizFormState.currentQuestion = testQuiz.questions[0];
        const spy = spyOn(component as any, 'modifyQuestionInQuiz');
        component['confirmNewQuestionData'](question);
        expect(spy).toHaveBeenCalledWith(question, 0);
    });

    it('should confirm new question data when adding a question', () => {
        component.currentQuizFormState.currentQuiz = testQuiz;
        component.currentQuizFormState.currentQuestion = question;
        const spy = spyOn(component, 'addQuestion');
        component['confirmNewQuestionData'](question);
        expect(spy).toHaveBeenCalledWith(question);
    });

    it('should get question color', () => {
        expect(component.getQuestionColor(question)).toBe(QuestionColor.LongAnswer);
        question.type = QuestionType.MultipleChoices;
        expect(component.getQuestionColor(question)).toBe(QuestionColor.MultipleChoices);
    });

    it('should confirm cancelling the quiz creation', () => {
        component.currentQuizFormState.isFormChanged = true;
        const spy = spyOn(TestBed.inject(ConfirmationDialogService), 'openConfirmationDialog').and.returnValue({
            afterClosed: () => of(true),
            // Needed to mock the return value of the observer afterClosed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        component.confirmQuizCancel();
        expect(spy).toHaveBeenCalled();
        component.currentQuizFormState.isFormChanged = false;
        const spy2 = spyOn(component, 'goToList');
        component.confirmQuizCancel();
        expect(spy2).toHaveBeenCalled();
    });

    it('should confirm deleting a quiz', () => {
        const spy = spyOn(TestBed.inject(ConfirmationDialogService), 'openConfirmationDialog').and.returnValue({
            afterClosed: () => of(true),
            // Needed to mock the return value of the observer afterClosed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        component.confirmDelete({ text: 'test' } as Question);
        expect(spy).toHaveBeenCalled();
    });
});
