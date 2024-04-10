import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WaitAreaInformation } from '@app/interfaces/wait-area-information';
import { GAME_SHOULD_BE_LOCKED, MOVE_TO_GAME_COUNTDOWN, NEED_ONE_PLAYER, ONE_SECOND_INTERVAL } from '@common/const';
import { ErrorMessage } from '@common/errors';
import { SocketEvents } from '@common/socketEvents';
import { UserType } from '@common/user';
import { AlertService } from './alert.service';
import { RouterService } from './router.service';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class WaitAreaService {
    private waitAreaInformation: WaitAreaInformation;
    private router: Router;
    private route: ActivatedRoute;
    constructor(
        private readonly routerService: RouterService,
        private readonly socketService: SocketClientService,
        private readonly alertService: AlertService,
    ) {
        this.router = this.routerService.getRouter();
        this.route = this.routerService.getRoute();
        this.waitAreaInformation = {
            gameCode: '',
            gameTitle: '',
            playersList: [],
            isOrganizer: false,
            isLocked: false,
            isRandomMode: false,
            countdown: 0,
            countdownInterval: 0,
        };
    }

    get waitAreaInfo(): WaitAreaInformation {
        return this.waitAreaInformation;
    }
    initializePage() {
        if (!this.socketService.socket) {
            this.router.navigate(['/home'], { relativeTo: this.route });
            return;
        }

        this.getGameCode();
        this.getGameTitle();
        this.getPlayersList();
        this.getIsOrganizer();
        this.getIsRandomGame();
        this.initializeAction();
    }
    getGameCode(): void {
        this.socketService.send(SocketEvents.GetGameCode, (code: string) => {
            this.waitAreaInformation.gameCode = code;
        });
    }
    getGameTitle(): void {
        this.socketService.send(SocketEvents.GetGameTitle, (title: string) => {
            this.waitAreaInformation.gameTitle = title;
        });
    }
    getPlayersList(): void {
        this.socketService.send(SocketEvents.GetPlayers, (players: string[]) => {
            this.waitAreaInformation.playersList = players;
        });
    }

    getIsOrganizer(): void {
        this.socketService.send(SocketEvents.GetIsOrganizer, (isOrganizer: boolean) => {
            this.waitAreaInformation.isOrganizer = isOrganizer;
        });
    }
    getIsRandomGame(): void {
        this.socketService.send(SocketEvents.GetIsRandomGame, (isRandomGame: boolean) => {
            this.waitAreaInformation.isRandomMode = isRandomGame;
        });
    }
    initializeAction(): void {
        this.socketService.socket.on(SocketEvents.PlayerListActualized, (newPlayerList: string[]) => {
            this.waitAreaInformation.playersList = newPlayerList;
        });
        this.socketService.socket.on(SocketEvents.OrganizerDisconnected, () => {
            this.router.navigate(['/home'], { relativeTo: this.route });
            this.alertService.showAlert(ErrorMessage.OrganizerLeft);
            this.socketService.disconnect();
        });
        this.socketService.socket.on(SocketEvents.MoveToGame, () => {
            this.waitAreaInformation.countdown = MOVE_TO_GAME_COUNTDOWN;
            this.startCountdown();
        });
        this.socketService.socket.on(SocketEvents.Disconnect, () => {
            this.waitAreaInformation.isLocked = false;
            this.router.navigate(['/home'], { relativeTo: this.route });
        });
        this.socketService.socket.on(SocketEvents.HasBeenBan, () => {
            this.router.navigate(['/home'], { relativeTo: this.route });
            this.alertService.showAlert(ErrorMessage.Banned);
        });
    }
    startCountdown(): void {
        this.waitAreaInformation.countdownInterval = window.setInterval(() => {
            if (this.waitAreaInformation.countdown > 1) {
                this.waitAreaInformation.countdown--;
            } else {
                clearInterval(this.waitAreaInformation.countdownInterval);
                this.waitAreaInformation.countdown--;
                this.router.navigate(['/game'], { relativeTo: this.route });
            }
        }, ONE_SECOND_INTERVAL);
    }

    connect(gameName: HTMLInputElement): void {
        try {
            const gameCode = Number(gameName.value);
            if (!this.socketService.isSocketAlive()) {
                this.socketService.connect();
                this.socketService.send(SocketEvents.PlayerLogin, gameCode);
            }
        } catch (error) {
            window.console.log(error);
        }
    }
    banPlayerName(playerName: string): void {
        this.socketService.send(SocketEvents.BanPlayerName, playerName);
    }

    startGame() {
        this.socketService.send(SocketEvents.StartGame);
    }
    toggleLock() {
        this.socketService.send(SocketEvents.LockGameAccess, (isLocked: boolean) => {
            this.waitAreaInformation.isLocked = isLocked;
        });
    }

    getUserType(): UserType {
        if (this.waitAreaInformation.isOrganizer && !this.waitAreaInformation.isRandomMode) return UserType.Organizer;
        return UserType.Player;
    }

    getReasonStartGameIsDisabled(): string {
        if (!this.waitAreaInfo.isLocked) return GAME_SHOULD_BE_LOCKED;
        return NEED_ONE_PLAYER;
    }
}
