import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { AlertService } from '@app/services/alert.service';
import { ConfirmationDialogService } from '@app/services/confirmation-dialog.service';
import { DatabaseService } from '@app/services/database.service';
import { DEFAULT_POINTS, MAXIMUM_CHOICES, MINIMUM_CHOICES } from '@common/const';
import { ErrorMessage } from '@common/errors';
import { Choice, Question, QuestionType } from '@common/question';

@Component({
    selector: 'app-create-question',
    templateUrl: './create-question.component.html',
    styleUrls: ['./create-question.component.scss'],
})
export class CreateQuestionComponent implements OnInit {
    @Input() currentQuestion: Question | null;
    @Input() isInQuizPage: boolean = false;
    @Output() changeViewEvent = new EventEmitter<null>();
    @Output() addQuestionEvent = new EventEmitter<Question>();

    multipleChoicesQuestionForm: FormGroup;
    longQuestionForm: FormGroup;
    isMultipleChoiceQuestion: boolean;
    isFormChanged: boolean;

    constructor(
        private readonly alertService: AlertService,
        private readonly databaseService: DatabaseService,
        private readonly confirmationDialogService: ConfirmationDialogService,
    ) {
        this.isMultipleChoiceQuestion = true;
        this.isFormChanged = false;
        this.multipleChoicesQuestionForm = new FormGroup({
            text: new FormControl(''),
            type: new FormControl(QuestionType.MultipleChoices),
            points: new FormControl(DEFAULT_POINTS),
            answers: new FormArray([
                new FormGroup({
                    text: new FormControl(''),
                    isCorrect: new FormControl(false),
                }),
                new FormGroup({
                    text: new FormControl(''),
                    isCorrect: new FormControl(false),
                }),
            ]),
        });
        this.longQuestionForm = new FormGroup({
            text: new FormControl(''),
            type: new FormControl(QuestionType.LongAnswer),
            points: new FormControl(DEFAULT_POINTS),
        });
    }

    get answersArray(): AbstractControl[] {
        return (this.multipleChoicesQuestionForm.get('answers') as FormArray)?.controls;
    }

    ngOnInit(): void {
        this.generateForm();
        this.multipleChoicesQuestionForm.valueChanges.subscribe(() => {
            this.isFormChanged = true;
        });
        this.longQuestionForm.valueChanges.subscribe(() => {
            this.isFormChanged = true;
        });
    }

    async onSubmit(isModifyingQuestion: boolean) {
        const question = this.generateQuestion();
        if (this.isInQuizPage) {
            this.addQuestionToQuiz(question);
            return;
        }
        try {
            await this.modifyBank(question, isModifyingQuestion);
            // Needed to catch the error message and display it (Just like the .catch() reason parameter)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (message: any) {
            this.alertService.showAlert(message.error);
        }
    }

    onAnswerDropped(event: CdkDragDrop<string[]>) {
        const previousIndex = event.previousIndex;
        const currentIndex = event.currentIndex;

        const answersArray = this.multipleChoicesQuestionForm.get('answers') as FormArray;
        const movedAnswer = answersArray.at(previousIndex);
        answersArray.removeAt(previousIndex);
        answersArray.insert(currentIndex, movedAnswer);
    }

    changeView(): void {
        this.changeViewEvent.emit();
    }

    deleteChoice(index: number): void {
        const answersArray = this.multipleChoicesQuestionForm.get('answers') as FormArray;
        if (answersArray.length > MINIMUM_CHOICES) {
            answersArray.removeAt(index);
            return;
        }
        this.alertService.showAlert(ErrorMessage.TwoAnswersMinimum);
    }

    addChoice(): void {
        const answersArray = this.multipleChoicesQuestionForm.get('answers') as FormArray;
        if (answersArray.length < MAXIMUM_CHOICES) {
            answersArray.push(
                new FormGroup({
                    text: new FormControl(''),
                    isCorrect: new FormControl(false),
                }),
            );
            return;
        }
        this.alertService.showAlert(ErrorMessage.FourAnswersMaximum);
    }

    changeType(type: string) {
        if (this.isMultipleChoiceQuestion && type === QuestionType.LongAnswer) {
            this.isMultipleChoiceQuestion = false;
        } else if (!this.isMultipleChoiceQuestion && type === QuestionType.MultipleChoices) {
            this.isMultipleChoiceQuestion = true;
        }
        this.setFormType(type);
    }

    confirmCancel(): void {
        if (!this.isFormChanged) {
            this.changeView();
            return;
        }
        this.confirmationDialogService
            .openConfirmationDialog('Voulez-vous vraiment retourner à la page précédente? Tous vos changements seront perdus.')
            .afterClosed()
            .subscribe((result) => {
                if (result) {
                    this.changeView();
                }
            });
    }

    private setFormType(type: string) {
        if (this.isMultipleChoiceQuestion) {
            this.multipleChoicesQuestionForm.setValue({ ...this.multipleChoicesQuestionForm.value, type });
        } else {
            this.longQuestionForm.setValue({ ...this.longQuestionForm.value, type });
        }
    }
    private generateForm() {
        if (this.currentQuestion) {
            this.fillForm(this.currentQuestion);
        } else {
            this.resetForm();
        }
    }

    private generateQuestion(): Question {
        const formValues = this.getFormValues();
        const question: Question = {
            text: formValues.text,
            type: formValues.type,
            points: formValues.points,
            choices: [],
        };
        if (!this.isMultipleChoiceQuestion) return question;
        question.choices = this.generateChoices();
        return question;
    }

    private generateChoices(): Choice[] {
        let choices: Choice[] = [];
        const answersArray = this.multipleChoicesQuestionForm.get('answers') as FormArray;
        answersArray.value.forEach((answer: Choice) => {
            choices = this.setChoice(answer, choices);
        });
        choices = choices.filter((choice) => choice.text !== '');
        return choices;
    }

    private setChoice(answer: Choice, choices: Choice[]) {
        if (!answer.text) return choices;

        answer.text = answer.text.trim();
        answer.isCorrect = answer.isCorrect ? true : false;
        choices.push(answer);

        return choices;
    }

    private getFormValues() {
        if (this.isMultipleChoiceQuestion) {
            return this.multipleChoicesQuestionForm.value;
        } else {
            return this.longQuestionForm.value;
        }
    }

    private setChoices(choices: Choice[]): void {
        const answersFormArray = this.multipleChoicesQuestionForm.get('answers') as FormArray;
        choices.forEach((choice, index) => {
            this.createChoiceForm(choice, index, answersFormArray);
        });
    }

    private createChoiceForm(choice: Choice, index: number, answersFormArray: FormArray): void {
        const answerGroup = answersFormArray.at(index) as FormGroup;
        if (!answerGroup) {
            answersFormArray.push(
                new FormGroup({
                    text: new FormControl(choice.text),
                    isCorrect: new FormControl(choice.isCorrect),
                }),
            );
        } else {
            answerGroup.patchValue({
                text: choice.text,
                isCorrect: choice.isCorrect,
            });
        }
    }

    private resetForm(): void {
        this.currentQuestion = null;
        this.multipleChoicesQuestionForm.reset();
        this.longQuestionForm.reset();
        this.multipleChoicesQuestionForm.setValue({
            ...this.multipleChoicesQuestionForm.value,
            type: QuestionType.MultipleChoices,
            points: DEFAULT_POINTS,
        });
        this.longQuestionForm.setValue({ ...this.longQuestionForm.value, type: QuestionType.LongAnswer, points: DEFAULT_POINTS });
    }

    private setQuestionType(currentQuestion: Question): void {
        if (currentQuestion.type === QuestionType.MultipleChoices) {
            this.isMultipleChoiceQuestion = true;
        } else {
            this.isMultipleChoiceQuestion = false;
        }
    }

    private fillForm(currentQuestion: Question): void {
        this.setQuestionType(currentQuestion);
        if (this.isMultipleChoiceQuestion) {
            this.setMultipleChoicesQuestionForm(currentQuestion);
        } else {
            this.setLongQuestionForm(currentQuestion);
        }
    }

    private setMultipleChoicesQuestionForm(currentQuestion: Question): void {
        this.multipleChoicesQuestionForm.setValue({
            ...this.multipleChoicesQuestionForm.value,
            text: currentQuestion.text,
            type: QuestionType.MultipleChoices,
            points: currentQuestion.points,
        });
        this.setChoices(currentQuestion.choices);
    }

    private setLongQuestionForm(currentQuestion: Question): void {
        this.longQuestionForm.setValue({
            text: currentQuestion.text,
            type: QuestionType.LongAnswer,
            points: currentQuestion.points,
        });
    }

    private addQuestionToQuiz(question: Question): void {
        question.id = this.currentQuestion?.id;
        this.addQuestionEvent.emit(question);
    }

    private async modifyBank(question: Question, isModifyingQuestion: boolean): Promise<void> {
        await this.databaseService.updateQuestions(isModifyingQuestion, this.currentQuestion, question);
        this.changeView();
    }
}
