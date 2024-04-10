import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganizerViewState } from '@app/interfaces/organizer-view-state';
import { AlertService } from '@app/services/alert.service';
import { RouterService } from '@app/services/router.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ErrorMessage } from '@common/errors';
import { LongResponseForOrganizer } from '@common/longResponse';
import { ClientQuestionInfo, QuestionForResultDisplay, QuestionType } from '@common/question';
import { SocketEvents } from '@common/socketEvents';
import { UserType } from '@common/user';

@Component({
    selector: 'app-organizer-view',
    templateUrl: './organizer-view.component.html',
    styleUrls: ['./organizer-view.component.scss'],
})
export class OrganizerViewComponent implements OnInit {
    currentState: OrganizerViewState;
    questionDuration: number;
    responsesArray: LongResponseForOrganizer[];
    evaluationDisplay: boolean = false;
    private router: Router;
    private route: ActivatedRoute;

    constructor(
        private readonly routerService: RouterService,
        private readonly socketService: SocketClientService,
        private readonly alertService: AlertService,
    ) {
        this.router = this.routerService.getRouter();
        this.route = this.routerService.getRoute();
        this.currentState = {
            isLoaded: false,
            isLeaving: false,
            canGoToNextQuestion: false,
            canGoToResultView: false,
            doesSeeTimer: true,
            currentQuestion: {} as ClientQuestionInfo,
        };
    }

    get currentQuestion(): ClientQuestionInfo {
        return this.currentState.currentQuestion;
    }

    get questionType(): QuestionType {
        return this.currentQuestion.type;
    }

    set currentQuestion(question: ClientQuestionInfo) {
        this.currentState.currentQuestion = question;
    }

    ngOnInit(): void {
        this.validateSocket();

        this.initializeSocket();

        this.fetchQuestionDuration();
        this.loadQuestion();
    }

    leaveProtocol(): void {
        this.currentState.isLeaving = true;
    }

    goToNextQuestion(): void {
        this.socketService.send(SocketEvents.GoToNextQuestion);
    }

    goToResultView(): void {
        this.socketService.send(SocketEvents.GoToResult);
    }

    leavePage(doesLeave: boolean) {
        if (doesLeave) {
            this.socketService.disconnect();
            this.router.navigate(['/create-game'], { relativeTo: this.route });
        } else {
            this.currentState.isLeaving = false;
        }
    }

    switchQuestion(newQuestion: QuestionForResultDisplay): void {
        this.currentQuestion.text = newQuestion.text;
        this.currentQuestion.points = newQuestion.points;
    }

    getUserType(): UserType {
        return UserType.Organizer;
    }

    handleAllResponsesEvaluated(evaluationComplete: boolean): void {
        if (evaluationComplete) {
            this.evaluationDisplay = false;
        }
    }

    isTimerEnabled(): boolean {
        return this.currentState.isLoaded && this.currentState.doesSeeTimer;
    }

    private loadQuestion(): void {
        this.socketService.send(SocketEvents.GetCurrentQuestion, (res: ClientQuestionInfo) => {
            this.currentQuestion = res;
            this.currentState.isLoaded = true;
        });
    }

    private fetchQuestionDuration() {
        this.socketService.send(SocketEvents.GetTimeForQuestion, (res: number) => {
            this.questionDuration = res;
        });
    }

    private goToHomePage(): void {
        this.router.navigate(['/home'], { relativeTo: this.route });
    }

    private initializeSocket() {
        this.showButtonEvents();
        this.loadNextQuestionEvent();
        this.sendToAllFinalResultsEvent();
        this.handleDisconnectEvent();
        this.receiveLongResponse();
    }

    private showButtonEvents() {
        this.socketService.on(SocketEvents.ShowNextQuestionButton, () => {
            this.currentState.canGoToNextQuestion = true;
        });
        this.socketService.on(SocketEvents.ShowResultQuestionButton, () => {
            this.currentState.canGoToResultView = true;
        });
    }

    private loadNextQuestionEvent(): void {
        this.socketService.on(SocketEvents.LoadNextQuestion, () => {
            this.currentState.isLoaded = false;
            this.currentState.canGoToNextQuestion = false;
            this.loadQuestion();
        });
    }

    private sendToAllFinalResultsEvent(): void {
        this.socketService.on(SocketEvents.SendToAllFinalResults, () => {
            this.currentState.canGoToResultView = false;
            this.currentState.doesSeeTimer = false;
        });
    }

    private handleDisconnectEvent(): void {
        this.socketService.on(SocketEvents.AllPlayerDisconnected, () => {
            this.alertService.showAlert(ErrorMessage.AllPlayersHaveDisconnected);
            this.socketService.disconnect();
        });
    }

    private receiveLongResponse(): void {
        this.socketService.on(SocketEvents.SendLongResponse, (data: LongResponseForOrganizer[]) => {
            this.responsesArray = data;
            this.evaluationDisplay = true;
        });
    }

    private validateSocket(): void {
        if (!this.socketService.socket) {
            this.goToHomePage();
            return;
        }

        this.socketService.send(SocketEvents.GetIsOrganizer, (res: boolean) => {
            if (!res) {
                this.goToHomePage();
            }
        });
    }
}
