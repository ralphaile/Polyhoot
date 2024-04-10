/* eslint-disable @typescript-eslint/no-explicit-any */
// Certain methods are private and we need access for the test
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { AppMaterialModule } from '@app/modules/material.module';
import { AlertService } from '@app/services/alert.service';
import { ConfirmationDialogService } from '@app/services/confirmation-dialog.service';
import { DatabaseService } from '@app/services/database.service';
import { DEFAULT_POINTS } from '@common/const';
import { Choice, Question, QuestionType } from '@common/question';
import { of } from 'rxjs';
import { CreateQuestionComponent } from './create-question.component';
import SpyObj = jasmine.SpyObj;

describe('CreateQuestionComponent', () => {
    let component: CreateQuestionComponent;
    let fixture: ComponentFixture<CreateQuestionComponent>;
    let choices: Choice[];
    let formGroup: FormGroup;
    let alertServiceSpy: SpyObj<AlertService>;
    let question: Question;

    beforeEach(async () => {
        alertServiceSpy = jasmine.createSpyObj('AlertService', ['showAlert', 'getAlert']);
        alertServiceSpy.getAlert.and.returnValue(of(''));
        await TestBed.configureTestingModule({
            declarations: [CreateQuestionComponent],
            imports: [HttpClientModule, ReactiveFormsModule, AppMaterialModule, MatDialogModule],
            providers: [DatabaseService, { provide: AlertService, useValue: alertServiceSpy }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CreateQuestionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        choices = [
            { text: 'a', isCorrect: true },
            { text: 'b', isCorrect: false },
            { text: 'a', isCorrect: true },
            { text: 'b', isCorrect: false },
        ];

        question = {
            id: '0',
            type: QuestionType.MultipleChoices,
            text: 'Question Test',
            points: 20,
            choices,
        };

        formGroup = new FormGroup({
            text: new FormControl('Hi'),
            type: new FormControl(QuestionType.MultipleChoices),
            points: new FormControl(DEFAULT_POINTS),
            answers: new FormArray([
                new FormGroup({
                    text: new FormControl('a'),
                    isCorrect: new FormControl(true),
                }),
                new FormGroup({
                    text: new FormControl('b'),
                    isCorrect: new FormControl(false),
                }),
                new FormGroup({
                    text: new FormControl('c'),
                    isCorrect: new FormControl(true),
                }),
                new FormGroup({
                    text: new FormControl('d'),
                    isCorrect: new FormControl(false),
                }),
            ]),
        });
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set choices when function is called', () => {
        component['setChoices'](choices);
        const answersArray = component.multipleChoicesQuestionForm.get('answers') as FormArray;
        for (const [index, choice] of choices.entries()) {
            expect(answersArray.at(index).value.text).toBe(choice.text);
            expect(answersArray.at(index).value.isCorrect).toBe(choice.isCorrect);
        }
    });

    it('should return the correct form depending on the type of the question', () => {
        component.isMultipleChoiceQuestion = true;
        expect(component['getFormValues']()).toBe(component.multipleChoicesQuestionForm.value);
        component.isMultipleChoiceQuestion = false;
        expect(component['getFormValues']()).toBe(component.longQuestionForm.value);
    });

    it('should generate the correct question depending on the forms values', () => {
        spyOn<any>(component, 'getFormValues').and.returnValue(formGroup.value);
        question = component['generateQuestion']();
        expect(question.text).toBe(formGroup.value.text);
        expect(question.type).toBe(formGroup.value.type);
        expect(question.points).toBe(formGroup.value.points);
    });

    it('should have 2 choices even if they only filled answer 3 and 4', () => {
        formGroup.patchValue({
            answers: [
                {
                    text: '',
                    isCorrect: true,
                },
                {
                    text: '',
                    isCorrect: false,
                },
                {
                    text: 'c',
                    isCorrect: true,
                },
                {
                    text: 'd',
                    isCorrect: false,
                },
            ],
        });
        spyOn<any>(component, 'getFormValues').and.returnValue(formGroup.value);
        component.multipleChoicesQuestionForm = formGroup;
        const generatedQuestion = component['generateQuestion']();
        expect(generatedQuestion.choices?.length).toBe(2);
        expect(generatedQuestion.choices?.[0].text).toBe('c');
        expect(generatedQuestion.choices?.[1].text).toBe('d');
    });

    it('should change the type of the question', () => {
        component.multipleChoicesQuestionForm = formGroup;
        component.isMultipleChoiceQuestion = true;
        component.changeType(QuestionType.LongAnswer);
        expect(component.isMultipleChoiceQuestion).toBe(false);
        component.isMultipleChoiceQuestion = false;
        component.changeType(QuestionType.MultipleChoices);
        expect(component.isMultipleChoiceQuestion).toBe(true);
    });

    it('should not change the type of the question if it is already the same', () => {
        component.multipleChoicesQuestionForm = formGroup;
        component.isMultipleChoiceQuestion = true;
        component.changeType(QuestionType.MultipleChoices);
        expect(component.isMultipleChoiceQuestion).toBe(true);
        component.isMultipleChoiceQuestion = false;
        component.changeType(QuestionType.LongAnswer);
        expect(component.isMultipleChoiceQuestion).toBe(false);
    });

    it('should emit changeViewEvent when function is called', () => {
        spyOn(component.changeViewEvent, 'emit');
        component.changeView();
        expect(component.changeViewEvent.emit).toHaveBeenCalled();
    });

    it('should generate the form with the values of the current qcm question if it is not null', () => {
        component.currentQuestion = question;
        component.ngOnInit();
        expect(component.multipleChoicesQuestionForm.value.text).toBe(question.text);
        expect(component.multipleChoicesQuestionForm.value.type).toBe(question.type);
        expect(component.multipleChoicesQuestionForm.value.points).toBe(question.points);
    });

    it('should generate the form with the values of the current qrl question if it is not null', () => {
        question.type = QuestionType.LongAnswer;
        component.currentQuestion = question;
        component.ngOnInit();
        expect(component.longQuestionForm.value.text).toBe(question.text);
        expect(component.longQuestionForm.value.type).toBe(question.type);
        expect(component.longQuestionForm.value.points).toBe(question.points);
    });

    it('should have an empty form if the current question is null', () => {
        component.currentQuestion = null;
        component.ngOnInit();
        expect(component.multipleChoicesQuestionForm.value.text).toBe(null);
        expect(component.multipleChoicesQuestionForm.value.type).toBe(QuestionType.MultipleChoices);
        expect(component.multipleChoicesQuestionForm.value.points).toBe(DEFAULT_POINTS);
        expect(component.longQuestionForm.value.text).toBe(null);
        expect(component.longQuestionForm.value.type).toBe(QuestionType.LongAnswer);
        expect(component.longQuestionForm.value.points).toBe(DEFAULT_POINTS);
    });

    it('should handle drop event', () => {
        component.currentQuestion = question;
        const event: CdkDragDrop<string[]> = {
            previousIndex: 0,
            currentIndex: 1,
        } as CdkDragDrop<string[]>;

        component.onAnswerDropped(event);

        expect(component.currentQuestion.choices?.[0].text).toBe('a');
    });

    it('should delete a choice when deleteChoice is called', () => {
        component.multipleChoicesQuestionForm = formGroup;
        component.deleteChoice(0);
        const answersArray = component.multipleChoicesQuestionForm.get('answers') as FormArray;
        expect(answersArray.length).toBe(3);
    });

    it('should not delete a choice if there is only two choices', () => {
        component.multipleChoicesQuestionForm = formGroup;
        component.deleteChoice(0);
        component.deleteChoice(0);
        component.deleteChoice(0);
        const answersArray = component.multipleChoicesQuestionForm.get('answers') as FormArray;
        expect(answersArray.length).toBe(2);
        expect(alertServiceSpy.showAlert).toHaveBeenCalled();
    });

    it('should add a choice when addChoice is called', () => {
        component.multipleChoicesQuestionForm = formGroup;
        component.deleteChoice(0);
        component.addChoice();
        const answersArray = component.multipleChoicesQuestionForm.get('answers') as FormArray;
        const numberOfChoices = 4;
        expect(answersArray.length).toBe(numberOfChoices);
    });

    it('should not add a choice if there is already 4 choices', () => {
        component.multipleChoicesQuestionForm = formGroup;
        component.addChoice();
        const answersArray = component.multipleChoicesQuestionForm.get('answers') as FormArray;
        const numberOfChoices = 4;
        expect(answersArray.length).toBe(numberOfChoices);
        expect(alertServiceSpy.showAlert).toHaveBeenCalled();
    });

    it('should submit question accordingly when in quiz page', async () => {
        spyOn(component as any, 'generateQuestion').and.returnValue(question);
        const addQuestionSpy = spyOn(component as any, 'addQuestionToQuiz');
        component.isInQuizPage = true;
        component.onSubmit(false);
        expect(addQuestionSpy).toHaveBeenCalledWith(question);
    });

    it('should submit question accordingly when not in quiz page', async () => {
        spyOn(component as any, 'generateQuestion').and.returnValue(question);
        const modifyBankSpy = spyOn(component as any, 'modifyBank');
        component.isInQuizPage = false;
        component.onSubmit(false);
        expect(modifyBankSpy).toHaveBeenCalledWith(question, false);
    });

    it('should show an alert if an error occurs when submitting a question', async () => {
        spyOn(component as any, 'generateQuestion').and.returnValue(question);
        spyOn(component as any, 'modifyBank').and.throwError({ error: 'error' } as any);
        component.isInQuizPage = false;
        await component.onSubmit(false);
        expect(alertServiceSpy.showAlert).toHaveBeenCalledWith('error');
    });

    it('should add question to quiz', () => {
        spyOn(component.addQuestionEvent, 'emit');
        component['addQuestionToQuiz'](question);
        expect(component.addQuestionEvent.emit).toHaveBeenCalledWith(question);
    });

    it('should modify bank', async () => {
        const databaseSpy = spyOn(TestBed.inject(DatabaseService), 'updateQuestions').and.returnValue(Promise.resolve());
        component.currentQuestion = question;
        await component['modifyBank'](question, false);
        expect(databaseSpy).toHaveBeenCalledWith(false, question, question);
    });

    it('should not generate choices if its not a multiple choice question', () => {
        const spy = spyOn<any>(component, 'generateChoices');
        component.isMultipleChoiceQuestion = false;
        component.currentQuestion = question;
        component['generateQuestion']();
        expect(spy).not.toHaveBeenCalled();
    });

    it('should confirm cancellation of question creation', () => {
        const spy = spyOn(TestBed.inject(ConfirmationDialogService), 'openConfirmationDialog').and.returnValue({
            afterClosed: () => of(true),
            // Needed to mock the return value of the observer afterClosed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        component.confirmCancel();
        expect(spy).not.toHaveBeenCalled();
        component.isFormChanged = true;
        component.confirmCancel();
        expect(spy).toHaveBeenCalled();
    });
});
