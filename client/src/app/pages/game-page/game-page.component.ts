import { Component, OnInit, ViewChild } from '@angular/core';
import { Timer } from '@app/classes/timer';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { ChatService } from '@app/services/chat.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimeService } from '@app/services/time.service';
import { DEFAULT_CHAT_WIGHT, DEFAULT_PLAYER_LIST_WIDTH } from '@common/const';
import { GameState } from '@common/game';
import { SocketEvents } from '@common/socketEvents';
import { UserType } from '@common/user';
@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit {
    @ViewChild(PlayAreaComponent) playAreaComponent: PlayAreaComponent;

    playerListWidth: number = 0;
    isResizing: boolean = false;
    playerType: UserType = UserType.Player;
    isRandomGame: boolean = false;
    currentGameState: GameState = GameState.AnsweringQuestion;
    private timer: Timer;

    constructor(
        private readonly socketService: SocketClientService,
        private readonly timeService: TimeService,
        private chatService: ChatService,
    ) {}

    get countdown(): number {
        return this.timer.time;
    }

    get chatWidth(): number {
        return this.chatService.width;
    }

    ngOnInit() {
        this.timer = this.timeService.createTimer(this.onTimeEnd);
        this.initializeGamePage();
        this.initializeSocket();
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

    canSeePlayArea(): boolean {
        return this.playerType === UserType.Player || this.playerType === UserType.Tester;
    }

    canSeeResults(): boolean {
        return this.currentGameState === GameState.ResultView || this.playerType === UserType.Organizer;
    }

    private initializeGamePage() {
        this.socketService.send(SocketEvents.GetIsOrganizer, (res: boolean) => {
            if (res) {
                this.playerListWidth = DEFAULT_CHAT_WIGHT;
                this.playerType = UserType.Organizer;
            }
        });
        this.socketService.send(SocketEvents.GetIsTester, (res: boolean) => {
            if (res) {
                this.playerType = UserType.Tester;
                this.playerListWidth = 0;
            }
        });
        this.socketService.send(SocketEvents.GetIsRandomGame, (res: boolean) => {
            if (res) {
                this.isRandomGame = true;
                this.playerListWidth = 0;
                this.playerType = UserType.Player;
            }
        });
    }

    private initializeSocket() {
        this.socketService.on(SocketEvents.StartCountdownForQuestion, () => {
            this.timer.startTimer(3);
        });
        this.socketService.on(SocketEvents.SendToAllFinalResults, () => {
            this.currentGameState = GameState.ResultView;
            this.playerListWidth = DEFAULT_PLAYER_LIST_WIDTH;
        });
    }

    private onTimeEnd() {
        return;
    }
}
