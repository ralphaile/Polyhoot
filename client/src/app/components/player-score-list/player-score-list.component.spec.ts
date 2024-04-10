// Needed to test private functions
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlayerListSortService } from '@app/services/player-list-sort.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { SocketEvents } from '@common/socketEvents';
import { User, UserState, userStateColor } from '@common/user';
import { AppMaterialModule } from '../../modules/material.module';
import { PlayerScoreListComponent } from './player-score-list.component';

describe('PlayerScoreListComponent', () => {
    let component: PlayerScoreListComponent;
    let fixture: ComponentFixture<PlayerScoreListComponent>;
    let mockSocketService: jasmine.SpyObj<SocketClientService>;
    let mockPlayerListSortService: jasmine.SpyObj<PlayerListSortService>;
    const players: Omit<User, 'id'>[] = [
        { name: 'Alice', points: 10, state: UserState.Connected, isMuted: false },
        { name: 'Bob', points: 15, state: UserState.Connected, isMuted: false },
        { name: 'Charlie', points: 5, state: UserState.Disconnected, isMuted: false },
        { name: 'Dave', points: 20, state: UserState.Connected, isMuted: false },
    ];

    beforeEach(async () => {
        mockSocketService = jasmine.createSpyObj('SocketClientService', ['on', 'send', 'emit']);
        mockPlayerListSortService = jasmine.createSpyObj('PlayerListSortService', ['sortPlayerList']);
        await TestBed.configureTestingModule({
            declarations: [PlayerScoreListComponent],
            providers: [
                { provide: SocketClientService, useValue: mockSocketService },
                { provide: PlayerListSortService, useValue: mockPlayerListSortService },
            ],
            imports: [AppMaterialModule, MatSelectModule, BrowserAnimationsModule, FormsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayerScoreListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.playerList = players;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch and sort player list on init', () => {
        const mockPlayerList: Omit<User, 'id'>[] = [
            { name: 'Player 2', points: 10, state: UserState.Connected, isMuted: false },
            { name: 'Player 1', points: 20, state: UserState.Connected, isMuted: false },
        ];

        (mockSocketService.send as jasmine.Spy).and.callFake((event: string, callback: (res: Omit<User, 'id'>[]) => void) => {
            if (event === 'getPlayerList') {
                callback(mockPlayerList);
            }
        });

        component.ngOnInit();

        expect(mockSocketService.send).toHaveBeenCalledWith('getPlayerList', jasmine.any(Function));
    });

    it('should update player state on "playerStateChanged" event', () => {
        const playerName = 'Player A';
        const initialState: Omit<User, 'id'> = { name: playerName, points: 20, state: UserState.Connected, isMuted: false };
        const newState = UserState.Disconnected;
        component.playerList = [initialState];

        (mockSocketService.on as jasmine.Spy).and.callFake((event: string, callback: (res: { newState: UserState; name: string }) => void) => {
            if (event === 'playerStateChanged') {
                callback({ newState, name: playerName });
            }
        });
        component.ngOnInit();
        expect(component.playerList.find((player) => player.name === playerName)?.state).toEqual(newState);
    });

    it('should toggle isReversed when calling toggleReversed2', () => {
        const sortedPlayers: Omit<User, 'id'>[] = [
            { name: 'Dave', points: 20, state: UserState.Connected, isMuted: false },
            { name: 'Bob', points: 15, state: UserState.Connected, isMuted: false },
            { name: 'Alice', points: 10, state: UserState.Connected, isMuted: false },
            { name: 'Charlie', points: 5, state: UserState.Disconnected, isMuted: false },
        ];

        (mockSocketService.on as jasmine.Spy).and.callFake((message: string, callback: (res: Omit<User, 'id'>[]) => void) => {
            callback(sortedPlayers);
        });
        mockPlayerListSortService.sortPlayerList.and.callFake(() => {
            return sortedPlayers;
        });
        component['initializeSocket']();

        expect(component.playerList).toEqual(sortedPlayers);
    });

    it('should return true if player is disconnected', () => {
        const state = UserState.Disconnected;
        expect(component.isDisconnected(state)).toBeTrue();
    });

    it('should return getMedalValue', () => {
        spyOn(component as any, 'getMedalValue').and.returnValue('gold');
        expect(component.getMedal({} as Omit<User, 'id'>)).toBe('gold');
    });

    it('should return correct medal', () => {
        const player1 = { name: '1', points: 10 } as Omit<User, 'id'>;
        const player2 = { name: '2', points: 20 } as Omit<User, 'id'>;
        const player3 = { name: '3', points: 30 } as Omit<User, 'id'>;
        const player4 = { name: '4', points: 5 } as Omit<User, 'id'>;
        const playersSortedByPoints = [player3, player2, player1, player4];
        expect((component as any).getMedalValue(player1, playersSortedByPoints)).toBe('bronze');
        expect((component as any).getMedalValue(player2, playersSortedByPoints)).toBe('silver');
        expect((component as any).getMedalValue(player3, playersSortedByPoints)).toBe('gold');
        expect((component as any).getMedalValue(player4, playersSortedByPoints)).toBe('');
    });

    it('should return correct color depending on the state', () => {
        expect(component.getPlayerColor(UserState.Connected)).toEqual(userStateColor.get(UserState.Connected));
        expect(component.getPlayerColor(UserState.Answering)).toEqual(userStateColor.get(UserState.Answering));
        expect(component.getPlayerColor(UserState.FinalizedAnswer)).toEqual(userStateColor.get(UserState.FinalizedAnswer));
        expect(component.getPlayerColor(UserState.Disconnected)).toEqual(userStateColor.get(UserState.Disconnected));
    });

    it('should fetch and sort player list on init', () => {
        const playerName = 'John Doe';

        component.toggleChat(playerName);

        expect(mockSocketService.send).toHaveBeenCalledWith(SocketEvents.ToggleChat, playerName);
    });
    it('should call sortPlayerList from playerListSortService when onSortTypeChange is called', () => {
        const sortType = 'nameAscending';

        component.sortType = sortType;
        component.onSortTypeChange();

        expect(mockPlayerListSortService.sortPlayerList).toHaveBeenCalledWith(component.playerList, sortType);
    });

    it('should set isOrganizer and doesSeePlayerList on getIsOrganizer response', () => {
        const isOrganizerResponse = true;
        mockSocketService.send.and.callFake((eventName, callback) => {
            if (eventName === 'getIsOrganizer' && typeof callback === 'function') {
                callback(isOrganizerResponse);
            }
        });

        component.ngOnInit();

        expect(mockSocketService.send).toHaveBeenCalledWith('getIsOrganizer', jasmine.any(Function));
        expect(component.isOrganizer).toBeTrue();
    });

    it('should update player isMuted on "PlayerChatToggled" event', () => {
        const playerName = 'Player A';
        const initialState: Omit<User, 'id'> = { name: playerName, points: 20, state: UserState.Connected, isMuted: false };
        const newIsMuted = true;
        component.playerList = [initialState];

        (mockSocketService.on as jasmine.Spy).and.callFake((event: string, callback: (res: { isMuted: boolean; name: string }) => void) => {
            if (event === 'playerChatToggled') {
                callback({ isMuted: newIsMuted, name: playerName });
            }
        });

        component.ngOnInit();
        expect(component.playerList.find((player) => player.name === playerName)?.isMuted).toEqual(newIsMuted);
    });
});
