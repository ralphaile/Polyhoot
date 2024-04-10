import { Component, Input, OnInit } from '@angular/core';
import { TimerInfo } from '@app/interfaces/timer-info';
import { SocketClientService } from '@app/services/socket-client.service';
import {
    DEFAULT_ROTATION_SPEED,
    FAST_ROTATION_SPEED,
    MIN_TIME_FOR_PANIC_IN_LONG_QUESTION,
    MIN_TIME_FOR_PANIC_IN_SHORT_QUESTION,
    NUMBER_OF_COLORS_IN_TIMER,
    PANIC_AUDIO,
    STOP_SPINNING,
} from '@common/const';
import { QuestionType } from '@common/question';
import { SocketEvents } from '@common/socketEvents';
import { UserType } from '@common/user';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnInit {
    @Input() questionType: QuestionType;
    panicSound: HTMLAudioElement;
    playerType: UserType;
    buttonsAreDisable: boolean;
    // isButtonsDisabled: boolean;
    // This array is only used to display the number of color in the ngFor in timer.component.html
    readonly numberOfColor: string[];
    private timerInfo: TimerInfo;

    constructor(private readonly socketService: SocketClientService) {
        this.numberOfColor = Array(NUMBER_OF_COLORS_IN_TIMER).fill('');
        this.timerInfo = this.createDefaultTimerInfo();
        this.panicSound = new Audio(PANIC_AUDIO);
        this.buttonsAreDisable = false;
        // this.isPlayButtonDisabled = false;
    }

    get time(): number {
        return this.timerInfo.time;
    }

    get rotationSpeed(): number {
        return this.timerInfo.rotationSpeed;
    }

    get isInPanicMode(): boolean {
        return this.timerInfo.timerMode.isInPanicMode;
    }

    get isPaused(): boolean {
        return this.timerInfo.timerMode.isPaused;
    }

    ngOnInit(): void {
        this.initializeSocket();
        this.getTime();
        this.getTypeOfUser();
    }

    pauseTimer(): void {
        this.socketService.send(SocketEvents.PauseTimer);
    }

    enterPanicMode(): void {
        if (!this.isInPanicMode) this.socketService.send(SocketEvents.EnterPanicMode);
    }

    isPanicButtonDisable(): boolean {
        if (this.isInPanicMode) return true;
        if (this.buttonsAreDisable) return true;
        if (this.time === 0) return true;
        if (this.questionType === QuestionType.LongAnswer) return this.time > MIN_TIME_FOR_PANIC_IN_LONG_QUESTION;
        else return this.time > MIN_TIME_FOR_PANIC_IN_SHORT_QUESTION;
    }

    private createDefaultTimerInfo(): TimerInfo {
        return {
            rotationSpeed: DEFAULT_ROTATION_SPEED,
            timerMode: {
                isPaused: false,
                isInPanicMode: false,
            },
            time: 0,
        };
    }

    private getTime(): void {
        this.socketService.send(SocketEvents.GetDuration, (res: number) => {
            this.timerInfo.time = res;
        });
    }

    private getTypeOfUser(): void {
        this.socketService.send(SocketEvents.GetIsOrganizer, (res: boolean) => {
            if (res) this.playerType = UserType.Organizer;
        });
        this.socketService.send(SocketEvents.GetIsTester, (res: boolean) => {
            if (res) this.playerType = UserType.Tester;
        });
    }

    private startTimer(): void {
        this.timerInfo.rotationSpeed = this.isInPanicMode ? FAST_ROTATION_SPEED : DEFAULT_ROTATION_SPEED;
        this.timerInfo.timerMode.isPaused = false;
    }

    private stopTimer(): void {
        this.timerInfo.rotationSpeed = STOP_SPINNING;
        this.timerInfo.timerMode.isPaused = true;
    }

    private panicProcess(): void {
        this.timerInfo.timerMode.isInPanicMode = true;
        this.panicSound.play();
        this.timerInfo.rotationSpeed = this.isPaused ? STOP_SPINNING : FAST_ROTATION_SPEED;
    }

    private stopTimerForResult(): void {
        this.timerInfo.rotationSpeed = STOP_SPINNING;
        this.buttonsAreDisable = true;
    }

    private initializeSocket(): void {
        this.initializeShowAnswersForQuestionEvent();
        this.initializeRefreshPlayerListEvent();
        this.initializeSendLongResponseEvent();
        this.initializeRefreshTimerEvent();
        this.initializeToggleTimerSpinEvent();
        this.initializeEnterInPanicModeEvent();
    }

    private initializeShowAnswersForQuestionEvent(): void {
        this.socketService.on(SocketEvents.ShowAnswersForQuestion, () => {
            this.stopTimerForResult();
        });
    }
    private initializeRefreshPlayerListEvent(): void {
        this.socketService.on(SocketEvents.RefreshPlayerList, () => {
            this.stopTimerForResult();
        });
    }
    private initializeSendLongResponseEvent(): void {
        this.socketService.on(SocketEvents.SendLongResponse, () => {
            this.stopTimerForResult();
        });
    }
    private initializeRefreshTimerEvent(): void {
        this.socketService.on(SocketEvents.RefreshTimer, (newTime: number) => {
            this.timerInfo.time = newTime;
            this.buttonsAreDisable = false;
        });
    }
    private initializeToggleTimerSpinEvent(): void {
        this.socketService.on(SocketEvents.ToggleTimerSpin, (shouldPlay: boolean) => {
            if (shouldPlay) this.startTimer();
            else this.stopTimer();
        });
    }
    private initializeEnterInPanicModeEvent(): void {
        this.socketService.on(SocketEvents.EnterInPanicMode, () => {
            this.panicProcess();
        });
    }
}
