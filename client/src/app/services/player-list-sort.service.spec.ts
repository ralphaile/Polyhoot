// Need to test private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { SortType } from '@common/sort';
import { User, UserState } from '@common/user';
import { PlayerListSortService } from './player-list-sort.service';

describe('PlayerListSortService', () => {
    let service: PlayerListSortService;
    let playerListMock: Omit<User, 'id'>[];

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PlayerListSortService);
        playerListMock = [
            {
                name: 'Joujou',
                points: 10,
                state: UserState.Connected,
                isMuted: false,
            },
            {
                name: 'Pastroy',
                points: 15,
                state: UserState.Connected,
                isMuted: false,
            },
            {
                name: 'Zèbre',
                points: 0,
                state: UserState.Disconnected,
                isMuted: false,
            },
            {
                name: 'Ralph',
                points: 20,
                state: UserState.Connected,
                isMuted: false,
            },
        ];
    });
    it('should sort by score', () => {
        const sortedList = service.sortPlayerList(playerListMock, SortType.scoreDescending);
        expect(sortedList).toEqual([
            { name: 'Ralph', points: 20, state: UserState.Connected, isMuted: false },
            { name: 'Pastroy', points: 15, state: UserState.Connected, isMuted: false },
            { name: 'Joujou', points: 10, state: UserState.Connected, isMuted: false },
            { name: 'Zèbre', points: 0, state: UserState.Disconnected, isMuted: false },
        ]);
    });

    it('should sort by reversed score', () => {
        const sortedList = service.sortPlayerList(playerListMock, SortType.scoreAscending);
        expect(sortedList).toEqual([
            { name: 'Zèbre', points: 0, state: UserState.Disconnected, isMuted: false },
            { name: 'Joujou', points: 10, state: UserState.Connected, isMuted: false },
            { name: 'Pastroy', points: 15, state: UserState.Connected, isMuted: false },
            { name: 'Ralph', points: 20, state: UserState.Connected, isMuted: false },
        ]);
    });

    it('should sort by name', () => {
        const sortedList = service.sortPlayerList(playerListMock, SortType.nameAscending);
        expect(sortedList).toEqual([
            { name: 'Joujou', points: 10, state: UserState.Connected, isMuted: false },
            { name: 'Pastroy', points: 15, state: UserState.Connected, isMuted: false },
            { name: 'Ralph', points: 20, state: UserState.Connected, isMuted: false },
            { name: 'Zèbre', points: 0, state: UserState.Disconnected, isMuted: false },
        ]);
    });

    it('should sort by reversed name', () => {
        const sortedList = service.sortPlayerList(playerListMock, SortType.nameDescending);
        expect(sortedList).toEqual([
            { name: 'Zèbre', points: 0, state: UserState.Disconnected, isMuted: false },
            { name: 'Ralph', points: 20, state: UserState.Connected, isMuted: false },
            { name: 'Pastroy', points: 15, state: UserState.Connected, isMuted: false },
            { name: 'Joujou', points: 10, state: UserState.Connected, isMuted: false },
        ]);
    });
    it('should sort by state', () => {
        const sortedList = service.sortPlayerList(playerListMock, SortType.state);
        expect(sortedList).toEqual([
            { name: 'Joujou', points: 10, state: UserState.Connected, isMuted: false },
            { name: 'Pastroy', points: 15, state: UserState.Connected, isMuted: false },
            { name: 'Ralph', points: 20, state: UserState.Connected, isMuted: false },
            { name: 'Zèbre', points: 0, state: UserState.Disconnected, isMuted: false },
        ]);
    });

    it('should do nothing if default', () => {
        const sortedList = service.sortPlayerList(playerListMock, 'NotSortType');
        expect(sortedList).toEqual(playerListMock);
    });
    it('should sort by name if players have same score descending', () => {
        playerListMock[0].points = 15;
        const sortedList = service.sortPlayerList(playerListMock, SortType.scoreDescending);
        expect(sortedList).toEqual([
            { name: 'Ralph', points: 20, state: UserState.Connected, isMuted: false },
            { name: 'Joujou', points: 15, state: UserState.Connected, isMuted: false },
            { name: 'Pastroy', points: 15, state: UserState.Connected, isMuted: false },
            { name: 'Zèbre', points: 0, state: UserState.Disconnected, isMuted: false },
        ]);
    });
    it('should sort by name if players have same score ascending', () => {
        playerListMock[0].points = 15;
        const sortedList = service.sortPlayerList(playerListMock, SortType.scoreAscending);
        expect(sortedList).toEqual([
            { name: 'Zèbre', points: 0, state: UserState.Disconnected, isMuted: false },
            { name: 'Pastroy', points: 15, state: UserState.Connected, isMuted: false },
            { name: 'Joujou', points: 15, state: UserState.Connected, isMuted: false },
            { name: 'Ralph', points: 20, state: UserState.Connected, isMuted: false },
        ]);
    });
});
