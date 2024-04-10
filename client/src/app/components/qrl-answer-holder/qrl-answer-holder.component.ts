import { Component, Input } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client.service';
import { MAX_NUMBER_OF_CHAR_IN_QRL } from '@common/const';
import { SocketEvents } from '@common/socketEvents';

@Component({
    selector: 'app-qrl-answer-holder',
    templateUrl: './qrl-answer-holder.component.html',
    styleUrls: ['./qrl-answer-holder.component.scss'],
})
export class QrlAnswerHolderComponent {
    @Input() isEnabled: boolean;
    longResponseAnswer: string = '';
    numberOfChar: number = 0;

    constructor(private readonly socketService: SocketClientService) {}
    changeCharCount(element: HTMLTextAreaElement) {
        this.numberOfChar = element.value.length;
        this.socketService.send(SocketEvents.LongAnswerUpdated, this.longResponseAnswer);
    }

    handleTab(element: HTMLTextAreaElement, event: KeyboardEvent) {
        if (event.key === 'Tab') {
            event.preventDefault();
            if (element.value.length < MAX_NUMBER_OF_CHAR_IN_QRL) {
                const start = element.selectionStart;
                const end = element.selectionEnd;
                element.value = element.value.substring(0, start) + '\t' + element.value.substring(end);
                element.selectionStart = element.selectionEnd = start + '\t'.length;
            }
            this.changeCharCount(element);
        }
    }
}
