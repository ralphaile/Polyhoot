import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GameHistory } from '@common/game';
import { Question } from '@common/question';
import { Quiz } from '@common/quiz';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class HttpManager {
    questionsUrl: string = 'questions';
    historyUrl: string = 'admin/history';
    manageGamesUrl: string = 'admin/manage-games';
    serverUrl: string = `${environment.serverUrl}`;

    constructor(private readonly http: HttpClient) {}

    async fetchAllQuestions(): Promise<Question[]> {
        try {
            return await lastValueFrom(this.http.get<Question[]>(`${this.serverUrl}/${this.questionsUrl}`));
        } catch {
            return [];
        }
    }

    async fetchAllMultipleQuestions(): Promise<Question[]> {
        try {
            const questions = await this.fetchAllQuestions();
            return questions.filter((question) => question.type === 'QCM');
        } catch {
            return [];
        }
    }

    async fetchQuestion(text: string): Promise<Question> {
        return await lastValueFrom(this.http.get<Question>(`${this.serverUrl}/${this.questionsUrl}/${text}`));
    }

    async addQuestion(question: Question): Promise<HttpResponse<string>> {
        return await lastValueFrom(this.http.post(`${this.serverUrl}/${this.questionsUrl}`, question, { observe: 'response', responseType: 'text' }));
    }

    async modifyQuestion(question: Question): Promise<HttpResponse<string>> {
        return await lastValueFrom(
            this.http.patch(`${this.serverUrl}/${this.questionsUrl}`, question, { observe: 'response', responseType: 'text' }),
        );
    }

    async deleteQuestion(id: string): Promise<HttpResponse<string>> {
        return await lastValueFrom(this.http.delete(`${this.serverUrl}/${this.questionsUrl}/${id}`, { observe: 'response', responseType: 'text' }));
    }

    async validateQuestion(question: Question): Promise<HttpResponse<string>> {
        return await lastValueFrom(
            this.http.post(`${this.serverUrl}/${this.questionsUrl}/validate`, question, { observe: 'response', responseType: 'text' }),
        );
    }

    async fetchAllQuizzes(): Promise<Quiz[]> {
        try {
            return await lastValueFrom(this.http.get<Quiz[]>(`${this.serverUrl}/${this.manageGamesUrl}`));
        } catch {
            return [];
        }
    }

    async fetchQuiz(title: string): Promise<Quiz> {
        return await lastValueFrom(this.http.get<Quiz>(`${this.serverUrl}/${this.manageGamesUrl}/${title}`));
    }

    async addQuiz(quiz: Quiz): Promise<HttpResponse<string>> {
        return await lastValueFrom(this.http.post(`${this.serverUrl}/${this.manageGamesUrl}`, quiz, { observe: 'response', responseType: 'text' }));
    }

    async modifyQuiz(quiz: Quiz): Promise<HttpResponse<string>> {
        return await lastValueFrom(this.http.patch(`${this.serverUrl}/${this.manageGamesUrl}`, quiz, { observe: 'response', responseType: 'text' }));
    }

    async deleteQuiz(id: string): Promise<HttpResponse<string>> {
        return await lastValueFrom(this.http.delete(`${this.serverUrl}/${this.manageGamesUrl}/${id}`, { observe: 'response', responseType: 'text' }));
    }

    async validatePlayerAnswers(questionId: string, playerAnswers: boolean[]): Promise<boolean> {
        const response = await lastValueFrom(
            this.http.post<{ isValid: boolean }>(`${this.serverUrl}/${this.questionsUrl}/validate-answers`, { questionId, playerAnswers }),
        );
        return response.isValid;
    }

    async getCorrectAnswers(questionId: string): Promise<boolean[]> {
        const response = await lastValueFrom(
            this.http.post<{ correctAnswers: boolean[] }>(`${this.serverUrl}/${this.questionsUrl}/correct-answers`, { questionId }),
        );
        return response.correctAnswers;
    }

    async authorize(password: string) {
        return await lastValueFrom(this.http.post(`${this.serverUrl}/login`, { password }));
    }

    async fetchHistory(): Promise<GameHistory[]> {
        try {
            return await lastValueFrom(this.http.get<GameHistory[]>(`${this.serverUrl}/${this.historyUrl}`));
        } catch (error) {
            return [];
        }
    }

    async deleteHistory(): Promise<HttpResponse<string>> {
        return await lastValueFrom(this.http.delete(`${this.serverUrl}/${this.historyUrl}`, { observe: 'response', responseType: 'text' }));
    }
}
