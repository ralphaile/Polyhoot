// export enum TimerMode {
//     Stopped = 'stopped',
//     PanicMode = 'panicMode',
//     Normal = 'normal',
// }

export interface TimerMode {
    isPaused: boolean;
    isInPanicMode: boolean;
}
