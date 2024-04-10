import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { CurrentQuizFormState } from '@app/interfaces/current-quiz-form-state';
import { AlertService } from '@app/services/alert.service';
import { ConfirmationDialogService } from '@app/services/confirmation-dialog.service';
import { DatabaseService } from '@app/services/database.service';
import { GameQuestionValidatorService } from '@app/services/game-question-validator.service';
import { DEFAULT_DURATION, MAX_QUESTION_LENGTH, QUESTION_NOT_FOUND } from '@common/const';
import { ErrorMessage } from '@common/errors';
import { Question, QuestionColor, QuestionType } from '@common/question';
import { Quiz } from '@common/quiz';

enum CurrentPage {
    CreateQuiz = 'create-quiz',
    CreateQuestion = 'create-question',
    Bank = 'bank',
}
@Component({
    selector: 'app-create-quiz',
    templateUrl: './create-quiz.component.html',
    styleUrls: ['./create-quiz.component.scss'],
})
export class CreateQuizComponent implements OnInit {
    @Input() quizInput: Quiz | null;
    @Output() changeViewEvent = new EventEmitter<null>();
    quizForm: FormGroup;
    currentQuizFormState: CurrentQuizFormState;
    private questionsInBank: string[];

    // 4 parameters are needed to respect logic separation from component
    // eslint-disable-next-line max-params
    constructor(
        private readonly alertService: AlertService,
        private readonly gameValidatorService: GameQuestionValidatorService,
        private readonly databaseService: DatabaseService,
        private readonly confirmationDialogService: ConfirmationDialogService,
    ) {
        this.currentQuizFormState = {
            isModifyingQuiz: true,
            currentQuestion: null,
            isFormChanged: false,
            currentPage: CurrentPage.CreateQuiz,
            currentQuiz: {} as Quiz,
        };
        this.questionsInBank = [];
        this.quizForm = new FormGroup({
            title: new FormControl(''),
            description: new FormControl(''),
            duration: new FormControl(DEFAULT_DURATION),
        });
    }

    get quizQuestions(): Question[] {
        return this.currentQuizFormState.currentQuiz.questions;
    }

    set quizQuestions(questions: Question[]) {
        this.currentQuizFormState.currentQuiz.questions = questions;
    }

    async ngOnInit(): Promise<void> {
        this.generateForm();
        this.quizForm.valueChanges.subscribe(() => {
            this.currentQuizFormState.isFormChanged = true;
        });
        await this.checkQuestionsInBank();
    }

    confirmQuizCancel(): void {
        if (!this.currentQuizFormState.isFormChanged) {
            this.goToList();
            return;
        }
        this.confirmationDialogService
            .openConfirmationDialog('Voulez-vous vraiment retourner à la page précédente? Tous vos changements seront perdus.')
            .afterClosed()
            .subscribe((result) => {
                if (result) {
                    this.goToList();
                }
            });
    }

    confirmDelete(question: Question): void {
        this.confirmationDialogService
            .openConfirmationDialog('Voulez-vous vraiment supprimer la question suivante: ' + question.text + '.')
            .afterClosed()
            .subscribe((result) => {
                if (result) {
                    this.deleteQuestion(question);
                }
            });
    }

    showBank(): void {
        if (this.currentQuizFormState.currentPage !== CurrentPage.Bank) {
            this.currentQuizFormState.currentPage = CurrentPage.Bank;
        } else {
            this.currentQuizFormState.currentPage = CurrentPage.CreateQuiz;
        }
    }

    cancelQuestionForm(): void {
        this.currentQuizFormState.currentPage = CurrentPage.CreateQuiz;
        this.currentQuizFormState.currentQuestion = null;
    }

    isInBank(text: string): boolean {
        return this.questionsInBank.includes(text);
    }

    modifyQuestion(question: Question): void {
        this.currentQuizFormState.currentQuestion = question;
        this.currentQuizFormState.currentPage = CurrentPage.CreateQuestion;
    }

    async addToBank(question: Question): Promise<void> {
        try {
            await this.databaseService.updateQuestions(false, null, question);
            this.questionsInBank.push(question.text);
        } catch {
            this.alertService.showAlert(ErrorMessage.SimilarQuestionInBank);
        }
    }

    onDropEvent(event: CdkDragDrop<string[]>) {
        if (this.currentQuizFormState.currentQuiz) {
            const previousIndex = event.previousIndex;
            const currentIndex = event.currentIndex;
            this.switchTwoQuestions(previousIndex, currentIndex);
        }
    }

    addQuestion(question: Question): void {
        question.id = new Date().toString();
        this.currentQuizFormState.currentQuiz.questions.push(question);
        this.currentQuizFormState.isFormChanged = true;
    }

    deleteQuestion(question: Question): void {
        if (this.currentQuizFormState.currentQuiz && this.quizQuestions.length > 1) {
            this.quizQuestions = this.quizQuestions.filter((q) => q.text !== question.text);
            this.currentQuizFormState.isFormChanged = true;
        } else {
            this.alertService.showAlert(ErrorMessage.QuizMustHaveQuestions);
        }
    }

    createQuestion(): void {
        this.currentQuizFormState.currentQuestion = null;
        this.currentQuizFormState.currentPage = CurrentPage.CreateQuestion;
    }

    async onSubmit(): Promise<void> {
        const quiz = this.generateQuiz();
        try {
            await this.modifyQuizBank(quiz);
            this.goToList();
            // Needed to catch the error message and display it (Just like the .catch() reason parameter)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (message: any) {
            this.alertService.showAlert(message.error);
        }
    }

    goToList(): void {
        this.changeViewEvent.emit();
    }

    getQuestionText(question: Question): string {
        return question.text.length > MAX_QUESTION_LENGTH ? question.text.slice(0, MAX_QUESTION_LENGTH) + '...' : question.text;
    }

    getSubmitButtonText(): string {
        return this.currentQuizFormState.isModifyingQuiz ? 'Modifier' : 'Ajouter';
    }

    getQuestionColor(question: Question): string {
        return question.type === QuestionType.MultipleChoices ? QuestionColor.MultipleChoices : QuestionColor.LongAnswer;
    }

    async validateQuestion(question: Question): Promise<void> {
        if (await this.gameValidatorService.isValidQuestion(question, this.currentQuizFormState.currentQuiz)) {
            this.confirmNewQuestionData(question);
        }
    }

    private async checkQuestionsInBank() {
        const questions = await this.databaseService.fetchQuestions();
        for (const question of questions) {
            this.questionsInBank.push(question.text);
        }
    }

    private async modifyQuizBank(quiz: Quiz) {
        await this.databaseService.updateQuiz(this.currentQuizFormState.isModifyingQuiz, quiz);
    }

    private generateForm() {
        if (this.quizInput) {
            this.fillForm(this.quizInput);
        } else {
            this.resetForm();
        }
    }

    private generateQuiz(): Quiz {
        const quiz: Quiz = {
            title: this.quizForm.value.title,
            id: this.currentQuizFormState.currentQuiz.id,
            lastModification: new Date(),
            isVisible: false,
            description: this.quizForm.value.description,
            duration: this.quizForm.value.duration,
            questions: this.quizQuestions,
        };
        return quiz;
    }

    private switchTwoQuestions(previousIndex: number, currentIndex: number): void {
        const answersArray = this.quizQuestions;
        const movedAnswer = answersArray[previousIndex];
        answersArray[previousIndex] = answersArray[currentIndex];
        answersArray[currentIndex] = movedAnswer;
        this.quizQuestions = answersArray;

        if (previousIndex !== currentIndex) {
            this.currentQuizFormState.isFormChanged = true;
        }
    }

    private modifyQuestionInQuiz(question: Question, indexToUpdate: number): void {
        if (this.currentQuizFormState.currentQuiz) {
            this.quizQuestions[indexToUpdate] = question;
        }
    }

    private confirmNewQuestionData(question: Question): void {
        const indexToUpdate = this.quizQuestions.findIndex((q) => q.id === this.currentQuizFormState.currentQuestion?.id);
        if (indexToUpdate !== QUESTION_NOT_FOUND && indexToUpdate !== undefined) {
            this.modifyQuestionInQuiz(question, indexToUpdate);
        } else {
            this.addQuestion(question);
        }
        this.leaveQuestionForm();
    }

    private leaveQuestionForm(): void {
        this.currentQuizFormState.currentPage = CurrentPage.CreateQuiz;
        this.currentQuizFormState.currentQuestion = null;
        this.currentQuizFormState.isFormChanged = true;
    }

    private fillForm(quiz: Quiz): void {
        this.currentQuizFormState.currentQuiz = quiz;
        this.quizForm.setValue({
            title: this.currentQuizFormState.currentQuiz.title,
            description: this.currentQuizFormState.currentQuiz.description,
            duration: this.currentQuizFormState.currentQuiz.duration,
        });
    }

    private resetForm(): void {
        this.currentQuizFormState.isModifyingQuiz = false;
        this.currentQuizFormState.currentQuiz = {
            title: '',
            id: new Date().toString(),
            lastModification: new Date(),
            isVisible: false,
            description: '',
            duration: DEFAULT_DURATION,
            questions: [],
        };
    }
}
