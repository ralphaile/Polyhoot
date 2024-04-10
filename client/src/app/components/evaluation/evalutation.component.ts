import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SocketClientService } from '@app/services/socket-client.service';
import { EvaluatedLongResponse, LongResponseForOrganizer } from '@common/longResponse';
import { SocketEvents } from '@common/socketEvents';

@Component({
    selector: 'app-evaluation',
    templateUrl: './evaluation.component.html',
    styleUrls: ['./evaluation.component.scss'],
})
export class EvaluationComponent implements OnInit {
    @Input() responsesArray: LongResponseForOrganizer[];
    @Output() allResponsesEvaluated = new EventEmitter<boolean>();
    currentIndex: number = 0;
    evaluatedResponses: EvaluatedLongResponse[] = [];

    constructor(private readonly socketService: SocketClientService) {}

    ngOnInit(): void {
        this.sortLongResponsesByNames();
    }

    evaluateResponse(score: number): void {
        this.evaluatedResponses.push({ userName: this.responsesArray[this.currentIndex].userName, multiplier: score });
        this.nextResponse();
    }

    nextResponse(): void {
        if (this.currentIndex < this.responsesArray.length - 1) {
            this.currentIndex++;
        } else {
            this.allResponsesEvaluated.emit(true);
            this.sendEvaluatedResponses();
        }
    }

    sendEvaluatedResponses(): void {
        this.socketService.send(SocketEvents.EvaluationLongResponse, this.evaluatedResponses);
        this.evaluatedResponses = [];
    }

    private sortLongResponsesByNames(): void {
        this.responsesArray.sort((a, b) => a.userName.localeCompare(b.userName));
    }
}
