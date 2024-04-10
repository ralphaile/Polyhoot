import { MIN_TIME_FOR_PANIC_IN_LONG_QUESTION, MIN_TIME_FOR_PANIC_IN_SHORT_QUESTION, NORMAL_TICK, PANIC_TICK } from '@common/const';
import { GameInfo, GameState } from '@common/game';
import { QuestionType } from '@common/question';
import { SocketEvents } from '@common/socketEvents';
// import { TimerMode } from '@common/timer';
import { TimerMode } from '@common/timer';
import * as io from 'socket.io';

export class TimeService {
    private intervalId: NodeJS.Timeout;
    private mode: TimerMode;
    private counter: number;
    private onTimeEndFunction: () => void;
    private game: GameInfo;

    constructor(
        private readonly sio: io.Server, // private readonly game: GameInfo,
    ) {
        this.mode = {
            isPaused: false,
            isInPanicMode: false,
        };
    }

    get time() {
        return this.counter;
    }

    set gameInfo(gameInfo: GameInfo) {
        this.game = gameInfo;
    }

    startTimer(startValue: number, onTimerEnd: () => void): void {
        this.counter = startValue;
        if (this.game.gameState === GameState.AnsweringQuestion) this.sio.to(String(this.game.gameId)).emit(SocketEvents.RefreshTimer, startValue);
        this.onTimeEndFunction = onTimerEnd;
        this.intervalId = setInterval(() => this.tickDown(), this.getTickValue());
    }

    resetTimer(startValue: number, onTimerEnd: () => void) {
        this.stopTimer();
        this.setNormalTimer();
        this.startTimer(startValue, onTimerEnd);
    }

    enterPanicMode(): void {
        if (this.mode.isInPanicMode) return;
        this.stopTimer();
        this.mode.isInPanicMode = true;
        this.startTimer(this.time, this.onTimeEndFunction);
    }

    togglePause(): void {
        this.mode.isPaused = !this.mode.isPaused;
        this.sio.to(String(this.game.gameId)).emit(SocketEvents.ToggleTimerSpin, !this.mode.isPaused);
    }

    canGoInPanicMode(questionType: QuestionType): boolean {
        if (questionType === QuestionType.LongAnswer) return this.counter <= MIN_TIME_FOR_PANIC_IN_LONG_QUESTION;
        else return this.counter <= MIN_TIME_FOR_PANIC_IN_SHORT_QUESTION;
    }

    private setNormalTimer(): void {
        this.mode = {
            isPaused: false,
            isInPanicMode: false,
        };
    }

    private stopTimer() {
        clearTimeout(this.intervalId);
    }

    private tickDown(): void {
        if (this.mode.isPaused) return;
        this.counter -= 1;
        if (this.game.gameState === GameState.AnsweringQuestion) {
            this.sio.to(String(this.game.gameId)).emit(SocketEvents.RefreshTimer, this.counter);
        }
        this.checkForTimerEnd();
    }

    private checkForTimerEnd(): void {
        if (this.counter <= 0) {
            this.stopTimer();
            this.setNormalTimer();
            this.onTimeEndFunction();
        }
    }

    private getTickValue(): number {
        // console.log(this.mode.isInPanicMode);
        return this.mode.isInPanicMode ? PANIC_TICK : NORMAL_TICK;
    }
}
