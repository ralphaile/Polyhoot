export interface WaitAreaInformation {
    gameCode: string;
    gameTitle: string;
    playersList: string[];
    isOrganizer: boolean;
    isLocked: boolean;
    isRandomMode: boolean;
    countdown: number;
    countdownInterval: number;
}
