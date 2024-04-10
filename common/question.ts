export enum QuestionType {
    MultipleChoices = 'QCM',
    LongAnswer = 'QRL',
    All = 'ALL',
}

export enum QuestionColor {
    MultipleChoices = 'DarkGrey',
    LongAnswer = 'AliceBlue',
}

export interface Question {
    id?: string;
    type: QuestionType;
    text: string;
    lastModification?: string;
    points: number;
    choices: Choice[];
}

export interface Choice {
    text: string;
    isCorrect: boolean;
    nbOfSelection?: number;
}

export interface GraphInfo {
    text: string;
    nbOfSelection: number;
    isCorrect?: boolean;
}

export interface ClientQuestionInfo {
    text: string;
    points: number;
    type: QuestionType;
    choicesText: string[];
}

export interface QuestionForResultDisplay {
    text: string;
    points: number;
    questionType: QuestionType;
    bandInfo: GraphInfo[];
}

export interface AnswerPlayerInfo {
    correctAnswers: boolean[];
    playerAnswers: boolean[];
    points: number;
    isFirst: boolean;
}
