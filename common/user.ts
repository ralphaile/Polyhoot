export interface User {
    id: string;
    name: string;
    points?: number;
    nbOfFirstAnswers?: number;
    currentChoices?: boolean[];
    qrlAnswer?: string;
    hasFinalizeIsAnswers?: boolean;
    isFirstToAnswers?: boolean;
    longResponseAnswer?: string;
    timeOutForRecentModification?: NodeJS.Timeout;
    state: UserState;
    isMuted: boolean;
}

export enum UserState {
    Connected,
    Answering,
    FinalizedAnswer,
    Disconnected,
}
export const userStateColor = new Map<UserState, string>([
    [UserState.Connected, 'red'],
    [UserState.Answering, 'yellow'],
    [UserState.FinalizedAnswer, 'green'],
    [UserState.Disconnected, 'black'],
]);
export enum UserType {
    Tester = 'Tester',
    Organizer = 'Organizer',
    Player = 'Player',
}
