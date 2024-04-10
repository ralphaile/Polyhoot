import { Injectable } from '@angular/core';
import { ErrorMessage } from '@common/errors';
import { Question } from '@common/question';
import { Quiz } from '@common/quiz';
import { AlertService } from './alert.service';
import { HttpManager } from './http-manager.service';

@Injectable({
    providedIn: 'root',
})
export class GameQuestionValidatorService {
    constructor(
        private readonly httpManager: HttpManager,
        private readonly alertService: AlertService,
    ) {}

    async isValidQuestion(question: Question, currentQuiz: Quiz): Promise<boolean> {
        const isInQuiz = this.isInQuiz(question, currentQuiz);
        if (isInQuiz) {
            this.alertService.showAlert(ErrorMessage.SimilarQuestionInQuiz);
        }
        return !isInQuiz && (await this.isQuestionValid(question));
    }

    isInQuiz(question: Question, currentQuiz: Quiz): boolean {
        const found = currentQuiz.questions.filter((q) => {
            return q.text === question.text && q.id !== question.id;
        });
        return !!found.length;
    }

    private async isQuestionValid(question: Question): Promise<boolean> {
        try {
            await this.httpManager.validateQuestion(question);
            return true;
            // Needed to catch the error message and display it (Just like the .catch() reason parameter)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (message: any) {
            this.alertService.showAlert(message.error);
            return false;
        }
    }
}
