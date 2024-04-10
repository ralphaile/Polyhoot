import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { AlertService } from '@app/services/alert.service';
import { ConfirmationDialogService } from '@app/services/confirmation-dialog.service';
import { DatabaseService } from '@app/services/database.service';
import { FileManagerService } from '@app/services/file-manager.service';
import { ErrorMessage } from '@common/errors';
import { Quiz } from '@common/quiz';
@Component({
    selector: 'app-quiz-list',
    templateUrl: './quiz-list.component.html',
    styleUrls: ['./quiz-list.component.scss'],
})
export class QuizListComponent implements OnInit {
    @Output() changeViewEvent = new EventEmitter<Quiz | null>();
    @ViewChild('fileUpload') fileUpload: ElementRef;
    quizzes: Quiz[];

    // Need four services to be injected for correct separation of logic
    // eslint-disable-next-line max-params
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly alertService: AlertService,
        private readonly fileManager: FileManagerService,
        private readonly confirmationDialogService: ConfirmationDialogService,
    ) {}

    ngOnInit(): void {
        this.loadQuizzes();
    }

    changeView(quiz: Quiz | null): void {
        this.changeViewEvent.emit(quiz);
    }

    async deleteQuiz(quiz: Quiz) {
        this.quizzes = await this.databaseService.deleteQuiz(quiz, this.quizzes);
    }

    async toggleVisibility(quiz: Quiz) {
        quiz.isVisible = !quiz.isVisible;
        await this.databaseService.updateQuiz(true, quiz);
    }

    exportQuiz(quiz: Quiz) {
        const link = this.fileManager.exportQuiz(quiz);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    confirmDelete(quiz: Quiz): void {
        this.confirmationDialogService
            .openConfirmationDialog(`Voulez-vous vraiment supprimer le quiz suivant: ${quiz.title}`)
            .afterClosed()
            .subscribe((result) => {
                if (result) {
                    this.deleteQuiz(quiz);
                }
            });
    }

    async importQuiz(event: Event) {
        const quiz = await this.fileManager.importQuiz(event);
        if (quiz) {
            this.addQuiz(quiz);
        }
        this.fileUpload.nativeElement.value = '';
        this.loadQuizzes();
    }

    private async addQuiz(quiz: Quiz) {
        try {
            await this.databaseService.updateQuiz(false, quiz);
            this.loadQuizzes();
            // Needed to catch the error message and display it (Just like the .catch() reason parameter)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (message: any) {
            this.alertService.showAlert(message.error);
            if (message.error === ErrorMessage.SameQuizTitleExists) {
                this.changeView(quiz);
            }
        }
    }

    private async loadQuizzes(): Promise<void> {
        this.quizzes = await this.databaseService.fetchQuizzes();
    }
}
