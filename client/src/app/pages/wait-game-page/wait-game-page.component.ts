import { Component, OnInit, ViewChild } from '@angular/core';
import { WaitAreaComponent } from '@app/components/wait-area/wait-area.component';
import { ChatService } from '@app/services/chat.service';

@Component({
    selector: 'app-wait-game-page',
    templateUrl: './wait-game-page.component.html',
    styleUrls: ['./wait-game-page.component.scss'],
})
export class WaitGamePageComponent implements OnInit {
    @ViewChild(WaitAreaComponent) waitAreaComponent: WaitAreaComponent;
    isResizing: boolean = false;

    constructor(private readonly chatService: ChatService) {}
    get chatWidth(): number {
        return this.chatService.width;
    }
    ngOnInit() {
        this.resizeChat();
    }

    resizeChat() {
        this.chatService.resizeChat();
    }

    trackSliding(event: MouseEvent) {
        if (this.isResizing) {
            this.chatService.trackSliding(event);
        }
    }
}
