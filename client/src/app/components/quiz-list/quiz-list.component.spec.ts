// Needed for private methods tests
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AlertService } from '@app/services/alert.service';
import { ConfirmationDialogService } from '@app/services/confirmation-dialog.service';
import { DatabaseService } from '@app/services/database.service';
import { FileManagerService } from '@app/services/file-manager.service';
import { ErrorMessage } from '@common/errors';
import { QuestionType } from '@common/question';
import { Quiz } from '@common/quiz';
import { of } from 'rxjs';
import { QuizListComponent } from './quiz-list.component';
import SpyObj = jasmine.SpyObj;
describe('QuizListComponent', () => {
    let component: QuizListComponent;
    let fixture: ComponentFixture<QuizListComponent>;
    let alertServiceSpy: SpyObj<AlertService>;
    const testQuiz: Quiz[] = [
        {
            id: '2',
            title: 'General Knowledge 2',
            description: 'A quiz to test your general knowledge',
            duration: 30,
            lastModification: new Date(),
            questions: [
                {
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
        },
        {
            id: '1',
            title: 'General Knowledge 1',
            description: 'A quiz to test your general knowledge',
            duration: 30,
            lastModification: new Date(),
            questions: [
                {
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
        },
    ];
    beforeEach(async () => {
        alertServiceSpy = jasmine.createSpyObj('AlertService', ['showAlert']);
        await TestBed.configureTestingModule({
            declarations: [QuizListComponent],
            imports: [HttpClientTestingModule, BrowserAnimationsModule, MatDialogModule],
            providers: [{ provide: AlertService, useValue: alertServiceSpy }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuizListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create the component', () => {
        expect(component).toBeTruthy();
    });
    it('should emit changeViewEvent when changeView is called', () => {
        spyOn(component.changeViewEvent, 'emit');

        component.changeView(testQuiz[0]);

        expect(component.changeViewEvent.emit).toHaveBeenCalledWith(testQuiz[0]);
    });

    it('should delete a quiz', async () => {
        component.quizzes = testQuiz;
        const spy = spyOn(TestBed.inject(DatabaseService), 'deleteQuiz');
        await component.deleteQuiz(testQuiz[1]);

        expect(spy).toHaveBeenCalledWith(testQuiz[1], testQuiz);
    });

    it('should toggle the visibility of a quiz', () => {
        const quizExample = {
            id: '1',
            title: 'JavaScript Basics',
            description: 'A quiz about the basics of JavaScript.',
            duration: 30,
            lastModification: new Date(),
            questions: [],
            isVisible: true,
        };
        const initialVisibility = quizExample.isVisible;
        const spy = spyOn(TestBed.inject(DatabaseService), 'updateQuiz');
        component.toggleVisibility(quizExample);

        expect(spy).toHaveBeenCalledWith(true, quizExample);
        expect(quizExample.isVisible).toBe(!initialVisibility);
    });

    it('should create a downloadable JSON file', () => {
        spyOn(TestBed.inject(FileManagerService), 'exportQuiz').and.returnValue(document.createElement('a'));
        spyOn(document.body, 'appendChild');
        spyOn(document.body, 'removeChild');

        component.exportQuiz(testQuiz[0]);
        expect(document.body.appendChild).toHaveBeenCalled();
        expect(document.body.removeChild).toHaveBeenCalled();
        expect(TestBed.inject(FileManagerService).exportQuiz).toHaveBeenCalledWith(testQuiz[0]);
    });

    it('should import quiz from file', async () => {
        const mockFile = new File([JSON.stringify(testQuiz[0])], 'mock-quiz.json', {
            type: 'application/json',
        });

        const mockEvent = { target: { files: [mockFile] } } as unknown as Event;
        spyOn(TestBed.inject(DatabaseService), 'updateQuiz');

        const spy2 = spyOn(component as any, 'addQuiz');
        const spy = spyOn(TestBed.inject(FileManagerService), 'importQuiz').and.returnValue(Promise.resolve(testQuiz[0]));

        await component.importQuiz(mockEvent);

        expect(spy).toHaveBeenCalledWith(mockEvent);
        expect(spy2).toHaveBeenCalled();
        expect(component.fileUpload.nativeElement.value).toEqual('');
    });

    it('should add a quiz', async () => {
        const spy = spyOn(TestBed.inject(DatabaseService), 'updateQuiz');
        await component['addQuiz'](testQuiz[0]);

        expect(spy).toHaveBeenCalledWith(false, testQuiz[0]);
    });

    it('should show an alert if their is an error adding a quiz', async () => {
        spyOn(TestBed.inject(DatabaseService), 'updateQuiz').and.returnValue(Promise.reject({ error: 'error' }));
        await component['addQuiz'](testQuiz[0]);

        expect(alertServiceSpy.showAlert).toHaveBeenCalledWith('error');
    });

    it('should change the view if the quiz title already exists', async () => {
        spyOn(TestBed.inject(DatabaseService), 'updateQuiz').and.returnValue(Promise.reject({ error: ErrorMessage.SameQuizTitleExists }));
        const spy2 = spyOn(component, 'changeView');
        await component['addQuiz'](testQuiz[0]);

        expect(spy2).toHaveBeenCalledWith(testQuiz[0]);
    });

    it('should load quizzes', async () => {
        spyOn(TestBed.inject(DatabaseService), 'fetchQuizzes').and.returnValue(Promise.resolve(testQuiz));
        await component['loadQuizzes']();

        expect(component.quizzes).toEqual(testQuiz);
    });

    it('should ask for delete confirmation', () => {
        spyOn(component, 'deleteQuiz');
        const spy = spyOn(TestBed.inject(ConfirmationDialogService), 'openConfirmationDialog').and.returnValue({
            afterClosed: () => of(true),
            // Needed to mock the return value of the observer afterClosed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        component.confirmDelete({ title: 'test' } as Quiz);
        expect(spy).toHaveBeenCalled();
    });
});
