import { HttpClientModule } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Timer } from '@app/classes/timer';
import { HeaderComponent } from '@app/components/header/header.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { HttpManager } from '@app/services/http-manager.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { TimeService } from '@app/services/time.service';
import { MAX_PERCENTAGE_OF_CHAT, MIN_NUM_OF_PX_OF_CHAT } from '@common/const';
import { GameState } from '@common/game';
import { UserType } from '@common/user';
import { BehaviorSubject } from 'rxjs';
import { AppMaterialModule } from '../../modules/material.module';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let socketServiceMock: jasmine.SpyObj<SocketClientService>;
    let timeServiceMock: jasmine.SpyObj<TimeService>;
    let mockTimer: jasmine.SpyObj<Timer>;
    const DEFAULT_PLAYER_LIST_WIDTH = 250;

    beforeEach(async () => {
        timeServiceMock = jasmine.createSpyObj('TimeService', ['createTimer']);
        socketServiceMock = jasmine.createSpyObj('SocketClientService', ['on', 'send']);
        mockTimer = jasmine.createSpyObj('Timer', ['startTimer', 'stopTimer', 'resetTimer']);

        const onDisconnect$ = new BehaviorSubject<boolean>(false);
        const onConnect$ = new BehaviorSubject<boolean>(false);

        Object.defineProperty(socketServiceMock, 'onDisconnect$', { value: onDisconnect$.asObservable() });
        Object.defineProperty(socketServiceMock, 'onConnect$', { value: onConnect$.asObservable() });

        await TestBed.configureTestingModule({
            declarations: [GamePageComponent, SidebarComponent, PlayAreaComponent, HeaderComponent, TimerComponent],
            imports: [HttpClientModule, FormsModule, AppMaterialModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useClass: class {
                        navigate = jasmine.createSpy('navigate');
                    },
                },
                HttpManager,
                { provide: SocketClientService, useValue: socketServiceMock },
                { provide: TimeService, useValue: timeServiceMock },
            ],

            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        mockTimer['time'] = 0;
        timeServiceMock.createTimer.and.returnValue(mockTimer);

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        TestBed.inject(ActivatedRoute);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create a timer on init', () => {
        fixture.detectChanges();
        expect(timeServiceMock.createTimer).toHaveBeenCalled();
    });

    it('should set isOrganizer and doesSeePlayerList based on getIsOrganizer response', () => {
        const isOrganizerResponse = true;
        const DEFAULT_CHAT_WIDTH = 300;
        socketServiceMock.send.and.callFake((eventName, callback) => {
            if (eventName === 'getIsOrganizer' && typeof callback === 'function') {
                callback(isOrganizerResponse);
            }
        });

        component.ngOnInit();

        expect(socketServiceMock.send).toHaveBeenCalledWith('getIsOrganizer', jasmine.any(Function));
        expect(component.playerType).toBe(UserType.Organizer);
        expect(component.playerListWidth).toBe(DEFAULT_CHAT_WIDTH);
    });

    it('should initialize socket listeners on init', () => {
        component.ngOnInit();

        expect(socketServiceMock.on.calls.count()).toBeGreaterThan(0);
        expect(socketServiceMock.on).toHaveBeenCalledWith('startCountdownForQuestion', jasmine.any(Function));
    });

    it('should properly initialize chat width on init', () => {
        spyOn(component, 'resizeChat').and.callThrough();

        component.ngOnInit();

        expect(component.resizeChat).toHaveBeenCalled();
    });

    it('should return true if user is tester', () => {
        component.playerType = UserType.Tester;
        expect(component.canSeePlayArea()).toBeTrue();
    });

    it('the trackSliding function should change the chatWidth according to min and max', () => {
        const RANDOM_CHAT_WIDTH = 200;
        const RANDOM_WINDOW_SIZE = 1920;
        window.innerWidth = RANDOM_WINDOW_SIZE;

        const mockMouseEventForNormalBehavior = new MouseEvent('mousemove', {
            clientX: RANDOM_CHAT_WIDTH,
        });

        component.isResizing = true;
        component.trackSliding(mockMouseEventForNormalBehavior);
        expect(component.chatWidth).toBe(RANDOM_CHAT_WIDTH);

        const mockMouseEventForMinBehavior = new MouseEvent('mousemove', {
            clientX: 50,
        });

        component.trackSliding(mockMouseEventForMinBehavior);

        expect(component.chatWidth).toBe(MIN_NUM_OF_PX_OF_CHAT);

        const mockMouseEventForMaxBehavior = new MouseEvent('mousemove', {
            clientX: RANDOM_WINDOW_SIZE,
        });

        component.trackSliding(mockMouseEventForMaxBehavior);

        expect(component.chatWidth).toBe(RANDOM_WINDOW_SIZE * MAX_PERCENTAGE_OF_CHAT);
    });

    describe('initializeSocket', () => {
        beforeEach(() => {
            (socketServiceMock.send as jasmine.Spy).and.callFake((event: string, callback: (res: void) => void) => {
                switch (event) {
                    case 'showAnswersForQuestion':
                        callback();
                        break;
                    case 'sendToAllFinalResults':
                        callback();
                        break;
                }
            });
        });

        it('should start a 3-second timer when "startCountdownForQuestion" event is received', () => {
            (socketServiceMock.on as jasmine.Spy).and.callFake((event: string, callback: (res: void) => void) => {
                if (event === 'startCountdownForQuestion') {
                    callback();
                }
            });

            component.ngOnInit();

            expect(timeServiceMock.createTimer).toHaveBeenCalledWith(jasmine.any(Function));

            const timerInstance = timeServiceMock.createTimer.calls.mostRecent().returnValue;
            timerInstance.startTimer(3);

            expect(timerInstance.startTimer).toHaveBeenCalledWith(3);
        });

        it('should show player list and set playerListWidth when "sendToAllFinalResults" event is received', () => {
            socketServiceMock.on.calls.allArgs().forEach((args) => {
                if (args[0] === 'sendToAllFinalResults') {
                    args[1]({});
                }
            });

            fixture.detectChanges();

            expect(component.currentGameState).toBe(GameState.ResultView);
            expect(component.playerListWidth).toBe(DEFAULT_PLAYER_LIST_WIDTH);
        });
    });

    it('should get isTester', () => {
        const isTesterResponse = true;
        socketServiceMock.send.and.callFake((eventName, callback) => {
            if (eventName === 'getIsTester' && typeof callback === 'function') {
                callback(isTesterResponse);
            }
        });

        component.ngOnInit();
        expect(component.playerType).toBe(UserType.Tester);
    });

    it('should get isRandomGame', () => {
        const isRandomGameResponse = true;
        socketServiceMock.send.and.callFake((eventName, callback) => {
            if (eventName === 'getIsRandomGame' && typeof callback === 'function') {
                callback(isRandomGameResponse);
            }
        });

        component.ngOnInit();
        expect(component.playerType).toBe(UserType.Player);
        expect(component.isRandomGame).toBe(true);
    });

    it('should call onTimeEnd', () => {
        component['onTimeEnd']();
        expect(component['onTimeEnd']).toBeTruthy();
    });
});
