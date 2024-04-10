import { Injectable } from '@angular/core';
import { ErrorMessage } from '@common/errors';
import { Question } from '@common/question';
import { Quiz } from '@common/quiz';
import { AlertService } from './alert.service';

@Injectable({
    providedIn: 'root',
})
export class FileManagerService {
    constructor(private readonly alertService: AlertService) {}

    exportQuiz(quiz: Quiz): HTMLAnchorElement {
        const quizJson = this.stringifyQuiz(quiz);

        return this.getLink(quizJson, quiz.title);
    }

    async importQuiz(event: Event): Promise<Quiz | null> {
        const file = (event.target as HTMLInputElement)?.files?.[0];

        if (file) {
            const reader = new FileReader();
            return await this.getQuiz(reader, file);
        }
        return null;
    }

    private stringifyQuiz(quiz: Quiz): string {
        return JSON.stringify({
            title: quiz.title,
            lastModification: new Date(),
            description: quiz.description,
            duration: quiz.duration,
            questions: this.getJsonQuestions(quiz.questions),
        });
    }

    private getJsonQuestions(questions: Question[]): Question[] {
        return questions.map((question) => {
            return {
                type: question.type,
                choices: question.choices,
                text: question.text,
                points: question.points,
            };
        });
    }

    private getLink(quizJson: string, quizTitle: string): HTMLAnchorElement {
        const blob = new Blob([quizJson], { type: 'application/json' });

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = quizTitle + '.json';

        return link;
    }

    private async getQuiz(reader: FileReader, file: File) {
        return new Promise<Quiz | null>((done) => {
            reader.onload = async (e) => {
                try {
                    const json = await JSON.parse((e.target as FileReader)?.result as string);
                    const quiz: Quiz = json;
                    quiz.lastModification = new Date(quiz.lastModification);
                    quiz.isVisible = false;
                    return done(quiz);
                } catch (err) {
                    this.alertService.showAlert(ErrorMessage.JSONError);
                    return done(null);
                }
            };
            reader.readAsText(file);
        });
    }
}
