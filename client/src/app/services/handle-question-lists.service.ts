import { Injectable } from '@angular/core';
import { ErrorMessage } from '@common/errors';
import { Question, QuestionType } from '@common/question';

@Injectable({
    providedIn: 'root',
})
export class HandleQuestionListsService {
    isQuestionInQuestionList(question: Question, questions: Question[]): boolean {
        const questionFound = questions.filter((q: Question) => {
            return q.text === question.text;
        });
        return questionFound.length !== 0;
    }

    filterQuestionsByType(questions: Question[], type: string): Question[] {
        if (type === QuestionType.All) return questions;
        return questions.filter((question: Question) => {
            return question.type === type;
        });
    }

    getSortedQuestions(questions: Question[]): Question[] {
        const lessThan = -1;
        const greaterThan = 1;
        questions = questions.sort((a: Question, b: Question) => {
            if (a.lastModification && b.lastModification) {
                const dateA = new Date(a.lastModification);
                const dateB = new Date(b.lastModification);
                if (dateA.getTime() >= dateB.getTime()) {
                    return greaterThan;
                }
                return lessThan;
            }
            throw new Error(ErrorMessage.InvalidQuestion);
        });
        return questions;
    }
}
