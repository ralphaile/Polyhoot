import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { GraphChoices } from '@app/interfaces/graph-choices';
import { ChoicePercentageCalculatorService } from '@app/services/choice-percentage-calculator.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { NO_BAR_SELECTED } from '@common/const';
import { QuestionForResultDisplay, QuestionType } from '@common/question';
import { SocketEvents } from '@common/socketEvents';

@Component({
    selector: 'app-result-histogram',
    templateUrl: './result-histogram.component.html',
    styleUrls: ['./result-histogram.component.scss'],
})
export class ResultHistogramComponent implements OnInit {
    @Output() switchQuestion = new EventEmitter<QuestionForResultDisplay>();

    currentQuestion: number;
    questions: QuestionForResultDisplay[];
    currentDisplayedQuestion: QuestionForResultDisplay;
    graphChoices: GraphChoices;

    constructor(
        private readonly socketService: SocketClientService,
        private readonly choicePercentageCalculator: ChoicePercentageCalculatorService,
    ) {
        this.graphChoices = {
            numberOfChoices: 0,
            barsLength: [1, 1, 1, 1],
            hoveredChoice: NO_BAR_SELECTED,
            choiceTextXPos: 0,
            choiceTextYPos: 0,
        };
        this.currentDisplayedQuestion = {
            text: '',
            points: 0,
            questionType: QuestionType.All,
            bandInfo: [],
        };
        this.questions = [];
        this.currentQuestion = 0;
    }

    @HostListener('document:mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (this.graphChoices.hoveredChoice !== NO_BAR_SELECTED) {
            this.graphChoices.choiceTextXPos = event.x;
            this.graphChoices.choiceTextYPos = event.y;
        }
    }
    ngOnInit(): void {
        this.initializeSocket();
    }

    changeQuestion(isIncreasing: boolean): void {
        this.setCurrentQuestion(isIncreasing);

        this.currentDisplayedQuestion = this.questions[this.currentQuestion];
        this.calculatePercentage();
        this.switchQuestion.emit(this.currentDisplayedQuestion);
    }

    trackMousePosition(index: number): void {
        this.graphChoices.hoveredChoice = index;
    }

    stopTrackingMousePosition(): void {
        this.graphChoices.hoveredChoice = NO_BAR_SELECTED;
    }

    private calculatePercentage(): void {
        this.graphChoices.barsLength = this.choicePercentageCalculator.calculatePercentage(this.currentDisplayedQuestion);
    }

    private initializeSocket() {
        this.getQuestionChoices();

        this.initializeUpdateResults();

        this.initializeNextQuestion();

        this.initializeFinalResults();
    }

    private setCurrentQuestion(isIncreasing: boolean): void {
        if (isIncreasing) {
            this.currentQuestion = Math.min(this.currentQuestion + 1, this.questions.length - 1);
        } else {
            this.currentQuestion = Math.max(this.currentQuestion - 1, 0);
        }
    }

    private getQuestionChoices(): void {
        this.socketService.send(SocketEvents.GetQuestionChoices, (res: QuestionForResultDisplay[]) => {
            this.questions = res;
            this.currentDisplayedQuestion = this.questions[this.currentQuestion];
            this.graphChoices.numberOfChoices = this.currentDisplayedQuestion.bandInfo.length;
            this.calculatePercentage();
            this.switchQuestion.emit(this.currentDisplayedQuestion);
        });
    }

    private initializeUpdateResults(): void {
        this.socketService.on(SocketEvents.UpdateResults, (newResults: QuestionForResultDisplay) => {
            this.setQuestions([newResults]);
        });
    }

    private initializeNextQuestion(): void {
        this.socketService.on(SocketEvents.LoadNextQuestion, () => {
            this.socketService.send(SocketEvents.GetQuestionChoices, (res: QuestionForResultDisplay[]) => {
                this.setQuestions(res);
            });
        });
    }

    private initializeFinalResults(): void {
        this.socketService.on(SocketEvents.SendToAllFinalResults, (finalResults: QuestionForResultDisplay[]) => {
            this.setQuestions(finalResults);
            this.switchQuestion.emit(this.currentDisplayedQuestion);
        });
    }

    private setQuestions(questions: QuestionForResultDisplay[]): void {
        this.questions = questions;
        this.currentDisplayedQuestion = this.questions[this.currentQuestion];
        this.graphChoices.numberOfChoices = this.currentDisplayedQuestion.bandInfo.length;
        this.calculatePercentage();
    }
}
