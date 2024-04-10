import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfirmationDialogService } from '@app/services/confirmation-dialog.service';
import { DatabaseService } from '@app/services/database.service';
import { HandleQuestionListsService } from '@app/services/handle-question-lists.service';
import { MAX_QUESTION_LENGTH } from '@common/const';
import { Question, QuestionColor, QuestionType } from '@common/question';

@Component({
    selector: 'app-question-list',
    templateUrl: './question-list.component.html',
    styleUrls: ['./question-list.component.scss'],
})
export class QuestionListComponent {
    @Output() addQuestionEvent = new EventEmitter<Question>();
    @Output() changeViewEvent = new EventEmitter<Question | null>();
    @Input() isInQuizPage: boolean;
    @Input() questionsInQuiz: Question[] = [];

    questions: Question[];
    selectedType: string;

    constructor(
        private readonly databaseService: DatabaseService,
        private readonly handleQuestionListsService: HandleQuestionListsService,
        private readonly confirmationDialogService: ConfirmationDialogService,
    ) {
        this.selectedType = QuestionType.All;
        this.initializeQuestions();
    }

    isQuestionInQuiz(question: Question): boolean {
        return this.handleQuestionListsService.isQuestionInQuestionList(question, this.questionsInQuiz);
    }

    async filterQuestions(): Promise<void> {
        const questionsToSort = await this.getQuestions();
        const questionsToFilter = this.handleQuestionListsService.getSortedQuestions(questionsToSort);
        this.questions = this.handleQuestionListsService.filterQuestionsByType(questionsToFilter, this.selectedType);
    }

    async deleteQuestion(question: Question): Promise<void> {
        this.questions = await this.databaseService.deleteQuestion(question, this.questions);
    }

    confirmDelete(question: Question): void {
        this.confirmationDialogService
            .openConfirmationDialog(`Voulez-vous vraiment supprimer la question suivante: ${question.text}`)
            .afterClosed()
            .subscribe((result) => {
                if (result) {
                    this.deleteQuestion(question);
                }
            });
    }

    getRowColor(question: Question): string {
        if (question.type === QuestionType.MultipleChoices) {
            return QuestionColor.MultipleChoices;
        } else {
            return QuestionColor.LongAnswer;
        }
    }

    addQuestionInQuiz(question: Question): void {
        this.addQuestionEvent.emit(question);
    }

    changeView(question: Question | null): void {
        this.changeViewEvent.emit(question);
    }

    getQuestionText(question: Question): string {
        return question.text.length > MAX_QUESTION_LENGTH ? question.text.substring(0, MAX_QUESTION_LENGTH) + '...' : question.text;
    }

    private async initializeQuestions(): Promise<void> {
        const questions = await this.getQuestions();
        this.questions = this.handleQuestionListsService.getSortedQuestions(questions);
    }

    private async getQuestions(): Promise<Question[]> {
        return await this.databaseService.fetchQuestions();
    }
}
