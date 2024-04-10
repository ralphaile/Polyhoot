import { ClientQuestionInfo } from '@common/question';

export interface OrganizerViewState {
    currentQuestion: ClientQuestionInfo;
    isLoaded: boolean;
    isLeaving: boolean;
    canGoToNextQuestion: boolean;
    canGoToResultView: boolean;
    doesSeeTimer: boolean;
}
