import { Injectable } from '@angular/core';
import { ErrorMessage } from '@common/errors';
import { GameHistory } from '@common/game';
import { Question } from '@common/question';
import { Quiz } from '@common/quiz';
import { HttpManager } from './http-manager.service';

@Injectable({
    providedIn: 'root',
})
export class DatabaseService {
    constructor(private readonly httpManager: HttpManager) {}

    async updateQuestions(isModifyingQuestion: boolean, oldQuestion: Question | null, newQuestion: Question): Promise<void> {
        if (isModifyingQuestion) {
            newQuestion.id = oldQuestion?.id;
            await this.httpManager.modifyQuestion(newQuestion);
        } else {
            await this.httpManager.addQuestion(newQuestion);
        }
    }

    async updateQuiz(isModifyingQuiz: boolean, quiz: Quiz): Promise<void> {
        if (isModifyingQuiz) {
            await this.httpManager.modifyQuiz(quiz);
        } else {
            quiz.id = Date.now().toString();
            await this.httpManager.addQuiz(quiz);
        }
    }

    async fetchQuestions(): Promise<Question[]> {
        return await this.httpManager.fetchAllQuestions();
    }

    async fetchMultipleQuestions(): Promise<Question[]> {
        return await this.httpManager.fetchAllMultipleQuestions();
    }

    async fetchQuizzes(): Promise<Quiz[]> {
        return await this.httpManager.fetchAllQuizzes();
    }

    async deleteQuestion(question: Question, questions: Question[]): Promise<Question[]> {
        if (question.id) {
            return this.httpManager.deleteQuestion(question.id).then(() => {
                questions = questions.filter((q: Question) => q !== question);
                return questions;
            });
        } else {
            throw new Error(ErrorMessage.InvalidQuestion);
        }
    }

    async deleteQuiz(quiz: Quiz, quizzes: Quiz[]): Promise<Quiz[]> {
        return this.httpManager.deleteQuiz(quiz.id).then(() => {
            quizzes = quizzes.filter((q: Quiz) => q !== quiz);
            return quizzes;
        });
    }

    async getHistory(): Promise<GameHistory[]> {
        return await this.httpManager.fetchHistory();
    }

    async deleteHistory(): Promise<void> {
        await this.httpManager.deleteHistory();
    }
}
