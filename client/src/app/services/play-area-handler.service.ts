import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlayAreaState } from '@app/interfaces/play-area-state';
import { FULL_GRADE, NEXT_QUESTION_TIMER, TESTER_QUESTION_DELAY } from '@common/const';
import { ErrorMessage } from '@common/errors';
import { LongResponseAnswerInfo, PointsToTester } from '@common/longResponse';
import { AnswerPlayerInfo, ClientQuestionInfo } from '@common/question';
import { SocketEvents } from '@common/socketEvents';
import { UserType } from '@common/user';
import { AlertService } from './alert.service';
import { RouterService } from './router.service';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class PlayAreaHandlerService {
    private userType: UserType;
    private isRandomMode: boolean;
    private playAreaState: PlayAreaState;
    private router: Router;
    private route: ActivatedRoute;

    constructor(
        private readonly socketService: SocketClientService,
        private readonly alertService: AlertService,
        private readonly routerService: RouterService,
    ) {
        this.userType = UserType.Player;
        this.isRandomMode = false;
        this.initializePlayAreaState();
        this.router = this.routerService.getRouter();
        this.route = this.routerService.getRoute();
    }

    get state(): PlayAreaState {
        return this.playAreaState;
    }

    get userTypeValue(): UserType {
        return this.userType;
    }

    doesSocketExist(): boolean {
        return !!this.socketService.socket;
    }

    disconnectSocket(): void {
        this.socketService.disconnect();
    }

    leavePage(): void {
        this.disconnectSocket();
        this.router.navigate(['/create-game'], { relativeTo: this.route });
    }

    initializePlayAreaState(): void {
        this.playAreaState = {
            currentScore: 0,
            currentQuestion: {} as ClientQuestionInfo,
            questionDuration: 0,
            isEvaluating: false,
            isGraded: false,
            isLoaded: false,
            isLeaving: false,
            isSubmitting: false,
            isWaiting: false,
            doesSeeResult: false,
            isFirst: false,
        };
    }

    submitProtocol(): void {
        this.playAreaState.isSubmitting = true;
        this.playAreaState.isWaiting = true;
        this.socketService.send(SocketEvents.FinalizeAnswers, (res: boolean) => {
            if (!res) {
                this.playAreaState.isWaiting = false;
                this.playAreaState.isSubmitting = false;
                this.alertService.showAlert(ErrorMessage.NoChoiceSelected);
            }
        });
    }

    async knowIfIsOrganizer(): Promise<boolean> {
        return new Promise((resolve) => {
            this.socketService.send(SocketEvents.GetIsOrganizer, (res: boolean) => {
                if (res) {
                    this.playAreaState.doesSeeResult = true;
                    this.userType = UserType.Organizer;
                }
                resolve(res);
            });
        });
    }

    async knowIfIsTester(): Promise<boolean> {
        return new Promise((resolve) => {
            this.socketService.send(SocketEvents.GetIsTester, (res: boolean) => {
                if (res) {
                    this.playAreaState.doesSeeResult = false;
                    this.userType = UserType.Tester;
                }
                resolve(res);
            });
        });
    }

    async knowIfIsRandomMode(): Promise<boolean> {
        return new Promise((resolve) => {
            this.socketService.send(SocketEvents.GetIsRandomGame, (res: boolean) => {
                if (res) {
                    this.playAreaState.doesSeeResult = false;
                    this.userType = UserType.Player;
                    this.isRandomMode = true;
                }
                resolve(res);
            });
        });
    }

    loadQuestion(): void {
        this.socketService.send(SocketEvents.GetCurrentQuestion, (res: ClientQuestionInfo) => {
            this.playAreaState.currentQuestion = res;
            this.playAreaState.isWaiting = false;
            this.playAreaState.isLoaded = true;
        });
    }

    fetchQuestionDuration(): void {
        this.socketService.send(SocketEvents.GetTimeForQuestion, (res: number) => {
            this.playAreaState.questionDuration = res;
        });
    }

    initializeSocket(): void {
        this.initializeAnswersForQuestion();
        this.initializePointsForLongResponse();
        this.initializeLoadNextQuestion();
        this.initializeShowFinalResults();
        this.initializeShowResultQuestionButton();
        this.initializeShowNextQuestionButton();
        this.initializeOrganizerEvaluation();
        this.initializeMutedByOrganizer();
    }

    closeFirstWindow(): void {
        this.playAreaState.isFirst = false;
    }

    private isTester(): boolean {
        return this.userType === UserType.Tester;
    }

    private isRandomGame(): boolean {
        return this.isRandomMode;
    }

    private initializeAnswersForQuestion(): void {
        this.socketService.on(SocketEvents.ShowAnswersForQuestion, (playerInfo: AnswerPlayerInfo) => {
            this.playAreaState.currentScore = playerInfo.points;
            this.playAreaState.isFirst = playerInfo.isFirst;
            this.playAreaState.isWaiting = true;
            this.playAreaState.isSubmitting = false;
            if (this.playAreaState.isFirst) {
                setTimeout(() => {
                    this.closeFirstWindow();
                }, NEXT_QUESTION_TIMER);
            }
        });
    }

    private initializePointsForLongResponse(): void {
        this.socketService.on(SocketEvents.ShowPointsForLongResponseQuestion, (responseInfo: LongResponseAnswerInfo) => {
            this.playAreaState.currentScore = responseInfo.points;
            this.playAreaState.grade = responseInfo.grade * FULL_GRADE;
            this.playAreaState.isGraded = true;
            this.playAreaState.isEvaluating = false;
        });
    }

    private initializeOrganizerEvaluation(): void {
        if (!this.isTester()) {
            this.getLongResponse();
        } else {
            this.getLongResponseFromTester();
        }
    }

    private getLongResponse(): void {
        this.socketService.on(SocketEvents.SendLongResponse, () => {
            this.playAreaState.isEvaluating = true;
            this.playAreaState.isWaiting = true;
            this.playAreaState.isSubmitting = false;
        });
    }

    private getLongResponseFromTester(): void {
        this.socketService.on(SocketEvents.SendPointsToTester, (pointsToTester: PointsToTester) => {
            this.setPlayAreaStateInTestMode(pointsToTester);
            this.verifyIfLastQuestionInTestMode(pointsToTester);
        });
    }

    private setPlayAreaStateInTestMode(pointsToTester: PointsToTester): void {
        this.playAreaState.grade = 100;
        this.playAreaState.isGraded = true;
        this.playAreaState.isWaiting = true;
        this.playAreaState.isSubmitting = false;
        this.playAreaState.currentScore = pointsToTester.points;
    }

    private verifyIfLastQuestionInTestMode(pointsToTester: PointsToTester): void {
        if (pointsToTester.isLastQuestion)
            setTimeout(() => {
                this.leavePage();
            }, NEXT_QUESTION_TIMER);
        else setTimeout(() => this.socketService.send(SocketEvents.GoToNextQuestion), TESTER_QUESTION_DELAY);
    }

    private initializeLoadNextQuestion(): void {
        this.socketService.on(SocketEvents.LoadNextQuestion, () => {
            this.playAreaState.isLoaded = false;
            this.loadQuestion();
            this.playAreaState.isGraded = false;
        });
    }

    private initializeShowFinalResults(): void {
        this.socketService.on(SocketEvents.SendToAllFinalResults, () => {
            this.playAreaState.doesSeeResult = true;
            this.playAreaState.isGraded = false;
        });
    }

    private initializeShowResultQuestionButton(): void {
        this.socketService.on(SocketEvents.ShowResultQuestionButton, () => {
            if (this.isRandomGame()) {
                setTimeout(() => {
                    this.socketService.send(SocketEvents.GoToResult);
                }, NEXT_QUESTION_TIMER);
            }
            if (this.isTester()) {
                setTimeout(() => {
                    this.leavePage();
                }, NEXT_QUESTION_TIMER);
            }
        });
    }

    private initializeShowNextQuestionButton(): void {
        this.socketService.on(SocketEvents.ShowNextQuestionButton, () => {
            if (this.isTester() || this.isRandomGame())
                setTimeout(() => this.socketService.send(SocketEvents.GoToNextQuestion), TESTER_QUESTION_DELAY);
        });
    }
    private initializeMutedByOrganizer() {
        this.socketService.on(SocketEvents.MutedByOrganizer, () => {
            this.alertService.showAlert(ErrorMessage.MutedByOrganizer);
        });
        this.socketService.on(SocketEvents.UnmutedByOrganizer, () => {
            this.alertService.showAlert(ErrorMessage.UnmutedByOrganizer);
        });
    }
}
