import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlayAreaHandlerService } from '@app/services/play-area-handler.service';
import { RouterService } from '@app/services/router.service';
import { Question, QuestionForResultDisplay, QuestionType } from '@common/question';
import { TimerComponent } from '../timer/timer.component';

@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
})
export class PlayAreaComponent implements OnInit {
    @ViewChild(TimerComponent) timerComponent: TimerComponent;
    quiz: Question[];

    private router: Router;
    private route: ActivatedRoute;

    constructor(
        private readonly routerService: RouterService,
        private readonly playAreaHandlerService: PlayAreaHandlerService,
    ) {
        this.router = this.routerService.getRouter();
        this.route = this.routerService.getRoute();
        this.playAreaHandlerService.initializePlayAreaState();
    }

    get playAreaService(): PlayAreaHandlerService {
        return this.playAreaHandlerService;
    }

    @HostListener('window:keyup', ['$event'])
    buttonDetect(event: KeyboardEvent): void {
        if (this.canSubmit(event)) {
            this.setUpEnterEvent();
        }
    }

    async ngOnInit(): Promise<void> {
        await this.verifySocket();

        this.initializeSocket();
        this.playAreaHandlerService.fetchQuestionDuration();
        this.playAreaHandlerService.loadQuestion();
    }

    leaveProtocol(): void {
        this.playAreaHandlerService.state.isLeaving = true;
    }

    closeFirstWindow(): void {
        this.playAreaHandlerService.state.isFirst = false;
    }

    submitProtocol(): void {
        this.playAreaHandlerService.submitProtocol();
    }

    switchQuestion(newQuestion: QuestionForResultDisplay): void {
        this.playAreaHandlerService.state.currentQuestion.text = newQuestion.text;
        this.playAreaHandlerService.state.currentQuestion.points = newQuestion.points;
    }

    isPlayingMultipleChoiceQuestion(): boolean {
        return this.doesSeeChoices() && this.playAreaHandlerService.state.currentQuestion.type === QuestionType.MultipleChoices;
    }

    isPlayingLongAnswerQuestion(): boolean {
        return this.doesSeeChoices() && this.playAreaHandlerService.state.currentQuestion.type === QuestionType.LongAnswer;
    }

    readonly onTimerEndFunction: () => void = () => {
        this.submitProtocol();
    };

    private async knowIfIsOrganizer(): Promise<void> {
        await this.playAreaHandlerService.knowIfIsOrganizer();
    }

    private async knowIfIsTester(): Promise<boolean> {
        return await this.playAreaHandlerService.knowIfIsTester();
    }

    private async knowIfIsRandomMode(): Promise<boolean> {
        return await this.playAreaHandlerService.knowIfIsRandomMode();
    }

    private initializeSocket(): void {
        this.playAreaHandlerService.initializeSocket();
    }

    private doesSeeChoices(): boolean {
        return !this.playAreaHandlerService.state.doesSeeResult && this.playAreaHandlerService.state.isLoaded;
    }

    private canSubmit(event: KeyboardEvent): boolean {
        return event.key === 'Enter' && !this.playAreaHandlerService.state.isLeaving && !this.playAreaHandlerService.state.isWaiting;
    }

    private setUpEnterEvent(): void {
        const activeElement = document.activeElement as HTMLElement;
        const focusedElementTagName = activeElement.tagName;

        if (focusedElementTagName !== 'INPUT' && focusedElementTagName !== 'TEXTAREA') {
            this.submitProtocol();
        }
    }

    private async verifySocket(): Promise<void> {
        if (!this.playAreaHandlerService.doesSocketExist()) {
            this.router.navigate(['/home'], { relativeTo: this.route });
            return;
        }

        if (!(await this.knowIfIsTester()) && !(await this.knowIfIsRandomMode())) {
            await this.knowIfIsOrganizer();
        }
    }
}
