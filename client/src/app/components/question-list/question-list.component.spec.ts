/* eslint-disable @typescript-eslint/no-explicit-any */
// Certain methods are private and we need access for the test
import { HttpClientModule } from '@angular/common/http';
import { EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { ConfirmationDialogService } from '@app/services/confirmation-dialog.service';
import { DatabaseService } from '@app/services/database.service';
import { HandleQuestionListsService } from '@app/services/handle-question-lists.service';
import { MAX_QUESTION_LENGTH } from '@common/const';
import { Question, QuestionType } from '@common/question';
import { of } from 'rxjs';
import { AppMaterialModule } from '../../modules/material.module';
import { QuestionListComponent } from './question-list.component';

describe('QuestionListComponent', () => {
    let component: QuestionListComponent;
    let fixture: ComponentFixture<QuestionListComponent>;
    let testQuestions: Question[];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [QuestionListComponent],
            imports: [HttpClientModule, MatRadioModule, FormsModule, MatTableModule, AppMaterialModule, MatDialogModule],
            providers: [DatabaseService],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuestionListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        testQuestions = [
            {
                id: '0',
                type: QuestionType.MultipleChoices,
                text: 'Question Test',
                lastModification: 'Mon Jan 29 2024 12:24:41 GMT-0500 (Eastern Standard Time)',
                points: 20,
                choices: [
                    { text: 'a', isCorrect: true },
                    { text: 'b', isCorrect: false },
                ],
            },
            {
                id: '1',
                type: QuestionType.MultipleChoices,
                text: 'Question Test2',
                lastModification: 'Mon Jan 29 2024 12:11:13 GMT-0500 (Eastern Standard Time)',
                points: 20,
                choices: [
                    { text: 'c', isCorrect: true },
                    { text: 'd', isCorrect: false },
                ],
            },
            {
                id: '2',
                type: QuestionType.MultipleChoices,
                text: 'Question Test2',
                lastModification: 'Mon Jan 29 2024 12:11:15 GMT-0500 (Eastern Standard Time)',
                points: 20,
                choices: [
                    { text: 'c', isCorrect: true },
                    { text: 'd', isCorrect: false },
                ],
            },
        ];
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get all the correct questions', async () => {
        const httpManagerSpy = spyOn(TestBed.inject(DatabaseService), 'fetchQuestions').and.returnValue(Promise.resolve(testQuestions));
        const questions = await component['getQuestions']();

        expect(httpManagerSpy).toHaveBeenCalled();
        expect(questions).toEqual(testQuestions);
    });

    it('should return true if question is already in Quiz', () => {
        component.questionsInQuiz = testQuestions;
        expect(component.isQuestionInQuiz(testQuestions[0])).toBeTruthy();
    });

    it('should return false if question is already in Quiz', () => {
        component.questionsInQuiz = [testQuestions[0]];
        expect(component.isQuestionInQuiz(testQuestions[1])).toBeFalsy();
    });

    it('should filter questions depending on the selected type', async () => {
        const getQuestionsSpy = spyOn<any>(component, 'getQuestions').and.callFake(() => {
            return testQuestions;
        });
        const getSortedQuestionsSpy = spyOn<HandleQuestionListsService>(
            TestBed.inject(HandleQuestionListsService),
            'getSortedQuestions',
        ).and.callFake(() => {
            return testQuestions;
        });
        const filterQuestionsByTypeSpy = spyOn<HandleQuestionListsService>(TestBed.inject(HandleQuestionListsService), 'filterQuestionsByType');

        await component.filterQuestions();
        expect(getQuestionsSpy).toHaveBeenCalled();
        expect(getSortedQuestionsSpy).toHaveBeenCalledWith(testQuestions);
        expect(filterQuestionsByTypeSpy).toHaveBeenCalledWith(testQuestions, component.selectedType);
    });

    it('should delete a question', async () => {
        const deleteQuestionSpy = spyOn<DatabaseService>(TestBed.inject(DatabaseService), 'deleteQuestion').and.callFake(async () => {
            return [testQuestions[1], testQuestions[2]];
        });
        const question = testQuestions[0];
        component.questions = testQuestions;
        await component.deleteQuestion(question);

        expect(deleteQuestionSpy).toHaveBeenCalledWith(question, testQuestions);
        expect(component.questions).toEqual([testQuestions[1], testQuestions[2]]);
    });

    it('should throw an error if the question does not have an id', async () => {
        const question = testQuestions[0];
        question.id = undefined;
        component.questions = testQuestions;
        await expectAsync(component.deleteQuestion(question)).toBeRejectedWithError('Invalid question');
    });

    it('should return the correct color depending on the question type', () => {
        expect(component.getRowColor(testQuestions[0])).toEqual('DarkGrey');
        expect(component.getRowColor(testQuestions[1])).toEqual('DarkGrey');
        testQuestions[1].type = QuestionType.LongAnswer;
        expect(component.getRowColor(testQuestions[1])).toEqual('AliceBlue');
    });

    it('should emit the changeViewEvent with the correct question', () => {
        const changeViewEventSpy = spyOn<EventEmitter<Question | null>>(component.changeViewEvent, 'emit');
        const question = testQuestions[0];
        component.changeView(question);

        expect(changeViewEventSpy).toHaveBeenCalledWith(question);
    });

    it('should emit addQuestionEvent when function is called', () => {
        spyOn(component.addQuestionEvent, 'emit');
        component.addQuestionInQuiz(testQuestions[0]);
        expect(component.addQuestionEvent.emit).toHaveBeenCalled();
    });

    it('should return the correct text depending on question text length', () => {
        const QUESTION_LENGTH = 200;
        expect(component.getQuestionText(testQuestions[0])).toEqual('Question Test');
        testQuestions[0].text = 'a'.repeat(QUESTION_LENGTH);
        expect(component.getQuestionText(testQuestions[0])).toEqual('a'.repeat(QUESTION_LENGTH).substring(0, MAX_QUESTION_LENGTH) + '...');
        expect(component.getQuestionText(testQuestions[1])).toEqual('Question Test2');
    });

    it('should initialize questions', async () => {
        const getQuestionsSpy = spyOn<any>(component, 'getQuestions').and.returnValue(Promise.resolve(testQuestions));
        const getSortedQuestionsSpy = spyOn<HandleQuestionListsService>(
            TestBed.inject(HandleQuestionListsService),
            'getSortedQuestions',
        ).and.returnValue(testQuestions);
        await component['initializeQuestions']();

        expect(getQuestionsSpy).toHaveBeenCalled();
        expect(getSortedQuestionsSpy).toHaveBeenCalledWith(testQuestions);
        expect(component.questions).toEqual(testQuestions);
    });

    it('should ask for delete confirmation', () => {
        spyOn(component, 'deleteQuestion');
        const spy = spyOn(TestBed.inject(ConfirmationDialogService), 'openConfirmationDialog').and.returnValue({
            afterClosed: () => of(true),
            // Needed to mock the return value of the observer afterClosed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        component.confirmDelete({ text: 'test' } as Question);
        expect(spy).toHaveBeenCalled();
    });
});
