import { Quiz } from './quiz';
import { User } from './user';

export enum GameState {
    WaitRoom = 'WaitRoom',
    SwitchingQuestion = 'SwitchingQuestion',
    AnsweringQuestion = 'AnsweringQuestion',
    QuestionFinalized = 'QuestionFinalized',
    ResultView = 'ResultView',
}

export interface GameInfo {
    gameId: number;
    organizer: User;
    isTester: boolean;
    isRandomGame: boolean;
    players: User[];
    banList: string[];
    isLocked: boolean;
    quiz: Quiz;
    currentQuestionIndex: number;
    firstToAnswer: User;
    nbOfGoodAnswers: number;
    nbOfFinishedPlayers: number;
    timer: any;
    gameState: GameState;
    nbOfRecentModification: number;
}

export interface GameHistory {
    name: string;
    startTime: Date;
    players: number;
    bestScore: number;
}

export enum HistorySortType {
    Name = 'name',
    Date = 'date',
}
