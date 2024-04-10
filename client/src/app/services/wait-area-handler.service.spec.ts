/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line max-classes-per-file
import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { WaitAreaInformation } from '@app/interfaces/wait-area-information';
import { GAME_SHOULD_BE_LOCKED, MOVE_TO_GAME_COUNTDOWN, NEED_ONE_PLAYER, ONE_SECOND_INTERVAL } from '@common/const';
import { UserType } from '@common/user';
import { Socket } from 'socket.io-client';
import { RouterService } from './router.service';
import { SocketClientService } from './socket-client.service';
import { WaitAreaService } from './wait-area-handler.service';

describe('WaitAreaService', () => {
    let service: WaitAreaService;
    let socketServiceMock: Partial<SocketClientService>;
    let routerServiceMock: jasmine.SpyObj<RouterService>;
    let routerMock: jasmine.SpyObj<Router>;
    const tickSimulation = 1000;
    beforeEach(async () => {
        socketServiceMock = {
            socket: jasmine.createSpyObj('socket', ['on']),
            connect: jasmine.createSpy('connect'),
            send: jasmine.createSpy('send'),
            disconnect: jasmine.createSpy('disconnect'),
            isSocketAlive: jasmine.createSpy('isSocketAlive'),
        };
        routerServiceMock = jasmine.createSpyObj('RouterService', ['getRouter', 'getRoute']);
        routerMock = jasmine.createSpyObj('Router', ['navigate']);
        routerServiceMock.getRouter.and.returnValue(routerMock);
        TestBed.configureTestingModule({
            providers: [
                { provide: SocketClientService, useValue: socketServiceMock },
                { provide: RouterService, useValue: routerServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: {} },
            ],
        });
    });
    beforeEach(() => {
        service = TestBed.inject(WaitAreaService);
    });
    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should connect to socket service and send playerLogin message if game name is provided and socket is not alive', () => {
        const gameName = document.createElement('input');
        gameName.id = 'join-code';
        document.body.appendChild(gameName);
        gameName.value = '1234';
        const gameCode = 1234;

        service.connect(gameName);

        expect(socketServiceMock.isSocketAlive).toHaveBeenCalled();
        expect(socketServiceMock.connect).toHaveBeenCalled();
        expect(socketServiceMock.send).toHaveBeenCalledWith('playerLogin', gameCode);

        document.body.removeChild(gameName);
    });

    it('should not connect to socket service if socket is already alive', () => {
        const gameName = document.createElement('input');
        gameName.id = 'join-code';
        document.body.appendChild(gameName);
        gameName.value = '1234';
        (socketServiceMock.isSocketAlive as jasmine.Spy).and.returnValue(true);

        service.connect(gameName);

        expect(socketServiceMock.isSocketAlive).toHaveBeenCalled();
        expect(socketServiceMock.connect).not.toHaveBeenCalled();
        expect(socketServiceMock.send).not.toHaveBeenCalledWith('playerLogin');

        document.body.removeChild(gameName);
    });

    it('should log an error when an exception occurs', () => {
        spyOn(window, 'Number').and.throwError('Invalid input');
        const gameName = document.createElement('input');
        gameName.id = 'join-code';
        gameName.value = 'non-numeric-value';
        document.body.appendChild(gameName);

        spyOn(window.console, 'log');
        service.connect(gameName);
        expect(window.console.log).toHaveBeenCalledWith(jasmine.any(Error));

        document.body.removeChild(gameName);
    });

    it('should update playersList when playerListActualized event is triggered', () => {
        service.initializeAction();

        const playerList: string[] = ['Player 1', 'Player 2'];
        const playerListCallback = (socketServiceMock.socket?.on as jasmine.Spy).calls.argsFor(0)[1] as (newPlayerList: string[]) => void;
        playerListCallback(playerList);

        expect(service.waitAreaInfo.playersList.length).toEqual(2);
        expect(service.waitAreaInfo.playersList[0]).toEqual('Player 1');
        expect(service.waitAreaInfo.playersList[1]).toEqual('Player 2');
    });

    it('should navigate to home and show alert when organizerDisconnected event is triggered', () => {
        service.initializeAction();

        const organizerDisconnectedCallback = (socketServiceMock.socket?.on as jasmine.Spy).calls.argsFor(1)[1] as () => void;
        organizerDisconnectedCallback();
        expect(routerMock.navigate).toHaveBeenCalledWith(['/home'], { relativeTo: routerServiceMock.getRoute() });
    });

    it('should set countdown to 5 and start countdown on moveToGame event', () => {
        service.initializeAction();
        const moveToGameCallback = (socketServiceMock.socket?.on as jasmine.Spy).calls.argsFor(2)[1] as () => void;

        moveToGameCallback();

        expect(service.waitAreaInfo.countdown).toEqual(MOVE_TO_GAME_COUNTDOWN);
    });

    it('should navigate to home on disconnect event', () => {
        service.initializeAction();
        const disconnectCallback = (socketServiceMock.socket?.on as jasmine.Spy).calls.argsFor(3)[1] as () => void;

        disconnectCallback();

        expect(routerMock.navigate).toHaveBeenCalledWith(['/home'], { relativeTo: routerServiceMock.getRoute() });
    });

    it('should navigate to home and show alert on hasBeenBan event', () => {
        service.initializeAction();
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const hasBeenBanCallback = (socketServiceMock.socket?.on as jasmine.Spy).calls.argsFor(4)[1] as () => void;

        hasBeenBanCallback();

        expect(routerMock.navigate).toHaveBeenCalledWith(['/home'], { relativeTo: routerServiceMock.getRoute() });
    });

    it('should call send on SocketClientService with "getGameTitle" when getGameTitle is called', () => {
        service.getGameTitle();
        expect(socketServiceMock.send).toHaveBeenCalledWith('getGameTitle', jasmine.any(Function));
    });

    it('should set gameTitle correctly when getGameTitle is called', () => {
        const testTitle = 'Test Game Title';
        (socketServiceMock.send as jasmine.Spy).and.callFake((event, callback) => {
            if (event === 'getGameTitle') {
                callback(testTitle);
            }
        });

        service.getGameTitle();
        expect(service.waitAreaInfo.gameTitle).toEqual(testTitle);
    });

    it('should navigate to /game when countdown reaches 1', fakeAsync(() => {
        spyOn(window, 'clearInterval');

        service['waitAreaInformation'] = { countdown: 1, countdownInterval: 123 } as WaitAreaInformation;

        service.startCountdown();

        tick(ONE_SECOND_INTERVAL);

        expect(window.clearInterval).toHaveBeenCalled();
        expect(routerMock.navigate).toHaveBeenCalledWith(['/game'], {
            relativeTo: routerServiceMock.getRoute(),
        });
        discardPeriodicTasks();
    }));

    it('should initialize page if socket is connected', () => {
        socketServiceMock.socket = {} as Socket;
        spyOn(service, 'getGameCode');
        spyOn(service, 'getGameTitle');
        spyOn(service, 'getPlayersList');
        spyOn(service, 'getIsOrganizer');
        spyOn(service, 'getIsRandomGame');
        spyOn(service, 'initializeAction');

        service.initializePage();

        expect(service.getGameCode).toHaveBeenCalled();
        expect(service.getGameTitle).toHaveBeenCalled();
        expect(service.getPlayersList).toHaveBeenCalled();
        expect(service.getIsOrganizer).toHaveBeenCalled();
        expect(service.getIsRandomGame).toHaveBeenCalled();
        expect(service.initializeAction).toHaveBeenCalled();
    });

    it('should get game code properly', () => {
        service.getGameCode();
        expect(socketServiceMock.send).toHaveBeenCalledWith('getGameCode', jasmine.any(Function));

        (socketServiceMock.send as jasmine.Spy).calls.mostRecent().args[1]('ABCD1234');
        expect(service.waitAreaInfo.gameCode).toEqual('ABCD1234');
    });

    it('should get players list properly', () => {
        service.getPlayersList();
        expect(socketServiceMock.send).toHaveBeenCalledWith('getPlayers', jasmine.any(Function));

        (socketServiceMock.send as jasmine.Spy).calls.mostRecent().args[1](['Player 1', 'Player 2', 'Player 3']);
        expect(service.waitAreaInfo.playersList).toEqual(['Player 1', 'Player 2', 'Player 3']);
    });

    it('should get isOrganizer properly', () => {
        service.getIsOrganizer();
        expect(socketServiceMock.send).toHaveBeenCalledWith('getIsOrganizer', jasmine.any(Function));

        (socketServiceMock.send as jasmine.Spy).calls.mostRecent().args[1](true);
        expect(service.waitAreaInfo.isOrganizer).toEqual(true);
    });

    it('should get isRandomGame properly', () => {
        service.getIsRandomGame();
        expect(socketServiceMock.send).toHaveBeenCalledWith('getIsRandomGame', jasmine.any(Function));

        (socketServiceMock.send as jasmine.Spy).calls.mostRecent().args[1](true);
        expect(service.waitAreaInfo.isRandomMode).toEqual(true);
    });

    it('should should send banPlayerName', () => {
        const name = 'abc';
        service.banPlayerName(name);
        expect(socketServiceMock.send).toHaveBeenCalledWith('banPlayerName', 'abc');
    });

    it('should start the game when startGame is called', () => {
        service.startGame();
        expect(socketServiceMock.send).toHaveBeenCalledWith('startGame');
    });

    it('should toggle lock game access when toggleLock is called', () => {
        service.toggleLock();
        expect(socketServiceMock.send).toHaveBeenCalledWith('lockGameAccess', jasmine.any(Function));

        (socketServiceMock.send as jasmine.Spy).calls.mostRecent().args[1](true);
        expect(service.waitAreaInfo.isLocked).toEqual(true);
    });

    it('should decrease countdown every second', fakeAsync(() => {
        const countdown = 5;
        const restOfCountdown = 4;
        service.waitAreaInfo.countdown = 5;
        service.startCountdown();
        expect(service.waitAreaInfo.countdown).toEqual(countdown);
        tick(tickSimulation);
        expect(service.waitAreaInfo.countdown).toEqual(restOfCountdown);
        tick(tickSimulation);
        expect(service.waitAreaInfo.countdown).toEqual(3);
        clearInterval(service.waitAreaInfo.countdownInterval);
    }));

    it('should get user type', () => {
        service.waitAreaInfo.isOrganizer = true;
        expect(service.getUserType()).toEqual(UserType.Organizer);
        service.waitAreaInfo.isOrganizer = false;
        expect(service.getUserType()).toEqual(UserType.Player);
    });

    describe('getReasonStartGameIsDisabled', () => {
        it('should return GAME_SHOULD_BE_LOCKED if game is locked', () => {
            service.waitAreaInfo.isLocked = false;
            expect(service.getReasonStartGameIsDisabled()).toBe(GAME_SHOULD_BE_LOCKED);
        });
        it('should return NEED_ONE_PLAYER if game is not locked', () => {
            service.waitAreaInfo.isLocked = true;
            expect(service.getReasonStartGameIsDisabled()).toBe(NEED_ONE_PLAYER);
        });
    });
});
