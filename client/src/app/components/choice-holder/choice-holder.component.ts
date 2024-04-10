import { Component, HostListener, Input, OnInit } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client.service';
import { ARRAY_INDEX_OFFSET, DECIMAL_BASE, FIRST_CHOICE, IN_INPUT, IN_TEXTAREA, LAST_CHOICE } from '@common/const';
import { AnswerPlayerInfo, ClientQuestionInfo } from '@common/question';
import { SocketEvents } from '@common/socketEvents';

@Component({
    selector: 'app-choice-holder',
    templateUrl: './choice-holder.component.html',
    styleUrls: ['./choice-holder.component.scss'],
})
export class ChoiceHolderComponent implements OnInit {
    @Input() choices: string[];
    @Input() isEnabled: boolean;
    isCorrectAnswers: boolean[];
    isCurrentAnswers: boolean[];

    constructor(private readonly socketService: SocketClientService) {}

    @HostListener('window:keydown', ['$event'])
    handleKeyPress(event: KeyboardEvent) {
        if (document.activeElement && document.activeElement.tagName) {
            this.addEventListeners(document.activeElement.tagName, event);
        }
    }

    resetChoices() {
        this.isCurrentAnswers = new Array(this.choices.length).fill(false);
    }

    ngOnInit() {
        this.initializeSocket();
        this.socketService.send(SocketEvents.GetCurrentQuestion, (res: ClientQuestionInfo) => {
            this.choices = res.choicesText;
            this.resetChoices();
        });
    }

    selectChoice(index: number) {
        if (!this.isEnabled) return;
        this.socketService.send(SocketEvents.ToggleChoice, index + ARRAY_INDEX_OFFSET, (res: boolean) => {
            this.isCurrentAnswers[index] = res;
        });
    }

    private addEventListeners(focusedElementTagName: string, event: KeyboardEvent) {
        if (this.isWrongArea(focusedElementTagName)) {
            return;
        }
        const key = event.key;
        if (this.isAChoice(key)) {
            this.handleChoiceSelection(key);
        }
    }

    private handleChoiceSelection(key: string) {
        const choiceIndex = parseInt(key, DECIMAL_BASE) - ARRAY_INDEX_OFFSET;
        if (choiceIndex < this.choices.length) {
            this.selectChoice(choiceIndex);
        }
    }

    private isAChoice(key: string) {
        return key >= FIRST_CHOICE && key <= LAST_CHOICE;
    }

    private isWrongArea(focusedElementTagName: string) {
        return focusedElementTagName === IN_INPUT || focusedElementTagName === IN_TEXTAREA;
    }

    private initializeSocket() {
        this.socketService.on(SocketEvents.ShowAnswersForQuestion, (playerInfo: AnswerPlayerInfo) => {
            this.isCorrectAnswers = playerInfo.correctAnswers;
            this.isCurrentAnswers = playerInfo.playerAnswers;
        });
        this.socketService.on(SocketEvents.LoadNextQuestion, () => {
            this.resetChoices();
        });
    }
}
