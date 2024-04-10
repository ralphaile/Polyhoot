import { Component, OnInit } from '@angular/core';
import { PlayerListSortService } from '@app/services/player-list-sort.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { Medal } from '@common/medal';
import { SocketEvents } from '@common/socketEvents';
import { SortType } from '@common/sort';
import { User, UserState, userStateColor } from '@common/user';

@Component({
    selector: 'app-player-score-list',
    templateUrl: './player-score-list.component.html',
    styleUrls: ['./player-score-list.component.scss'],
})
export class PlayerScoreListComponent implements OnInit {
    playerList: Omit<User, 'id'>[];
    isOrganizer: boolean;
    sortType: string = SortType.scoreDescending;
    constructor(
        private readonly socketService: SocketClientService,
        private readonly playerListSortService: PlayerListSortService,
    ) {}

    ngOnInit() {
        this.getPlayerList();
        this.initializeSocket();
        this.getIsOrganizer();
    }

    onSortTypeChange() {
        this.playerListSortService.sortPlayerList(this.playerList, this.sortType);
    }

    isDisconnected(state: UserState): boolean {
        return state === UserState.Disconnected;
    }

    getMedal(player: Omit<User, 'id'>): string {
        const playerList = this.playerList.slice();
        const medalList = this.playerListSortService.sortPlayerList(playerList, 'scoreAscending');
        return this.getMedalValue(player, medalList);
    }

    getPlayerColor(playerState: UserState) {
        return userStateColor.get(playerState);
    }
    toggleChat(playerName: string) {
        this.socketService.send(SocketEvents.ToggleChat, playerName);
    }
    private getMedalValue(player: Omit<User, 'id'>, medalList: Omit<User, 'id'>[]): string {
        if (medalList[0].name === player.name) return Medal.Gold;
        if (medalList[1].name === player.name) return Medal.Silver;
        if (medalList[2].name === player.name) return Medal.Bronze;
        return '';
    }

    private initializeSocket() {
        this.initializeRefreshPlayerList();
        this.initializePlayerStateChanged();
        this.initializePlayerChatToggled();
    }

    private getPlayerList() {
        this.socketService.send(SocketEvents.GetPlayerList, (res: Omit<User, 'id'>[]) => {
            this.playerList = this.playerListSortService.sortPlayerList(res, SortType.scoreDescending);
        });
    }

    private initializeRefreshPlayerList() {
        this.socketService.on(SocketEvents.RefreshPlayerList, (res: Omit<User, 'id'>[]) => {
            this.playerList = this.playerListSortService.sortPlayerList(res, this.sortType);
        });
    }

    private initializePlayerStateChanged() {
        this.socketService.on(SocketEvents.PlayerStateChanged, (res: { newState: UserState; name: string }) => {
            const updatedPlayer: Omit<User, 'id'> | undefined = this.playerList.find((player: Omit<User, 'id'>) => player.name === res.name);
            if (updatedPlayer) updatedPlayer.state = res.newState;
        });
    }

    private initializePlayerChatToggled() {
        this.socketService.on(SocketEvents.PlayerChatToggled, (res: { isMuted: boolean; name: string }) => {
            const updatedPlayer: Omit<User, 'id'> | undefined = this.playerList.find((player: Omit<User, 'id'>) => player.name === res.name);
            if (updatedPlayer) updatedPlayer.isMuted = res.isMuted;
        });
    }
    private getIsOrganizer(): void {
        this.socketService.send(SocketEvents.GetIsOrganizer, (isOrganizer: boolean) => {
            this.isOrganizer = isOrganizer;
        });
    }
}
