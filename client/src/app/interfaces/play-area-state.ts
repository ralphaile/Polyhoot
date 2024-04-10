import { ClientQuestionInfo } from '@common/question';

export interface PlayAreaState {
    currentScore: number;
    currentQuestion: ClientQuestionInfo;
    questionDuration: number;
    grade?: number;
    isEvaluating: boolean;
    isGraded: boolean;
    isLoaded: boolean;
    isLeaving: boolean;
    isSubmitting: boolean;
    isWaiting: boolean;
    doesSeeResult: boolean;
    isFirst: boolean;
}
