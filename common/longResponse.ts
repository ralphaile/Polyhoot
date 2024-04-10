export interface LongResponseAnswerInfo {
    points: number;
    grade: number;
}

export interface LongResponseForOrganizer {
    userName: string;
    longResponse: string;
}

export interface EvaluatedLongResponse {
    userName: string;
    multiplier: number;
}

export interface PointsToTester {
    points: number;
    isLastQuestion: boolean;
}
