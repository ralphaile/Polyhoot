import { Question } from '@common/question';
import { Quiz } from '@common/quiz';

export interface CurrentQuizFormState {
    currentQuestion: Question | null;
    isFormChanged: boolean;
    currentPage: string;
    currentQuiz: Quiz;
    isModifyingQuiz: boolean;
}
