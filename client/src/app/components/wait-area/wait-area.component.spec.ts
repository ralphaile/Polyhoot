import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { WaitAreaService } from '@app/services/wait-area-handler.service';
import { UserType } from '@common/user';
import { WaitAreaComponent } from './wait-area.component';

describe('WaitAreaComponent', () => {
    let component: WaitAreaComponent;
    let fixture: ComponentFixture<WaitAreaComponent>;
    let waitAreaService: WaitAreaService;
    class MockRouterActivatedRoute {
        navigate = jasmine.createSpy('navigate');
    }
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WaitAreaComponent],
            providers: [
                WaitAreaService,
                {
                    provide: ActivatedRoute,
                    useClass: MockRouterActivatedRoute,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitAreaComponent);
        component = fixture.componentInstance;
        waitAreaService = TestBed.inject(WaitAreaService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize page on ngOnInit', () => {
        spyOn(waitAreaService, 'initializePage');
        component.ngOnInit();
        expect(waitAreaService.initializePage).toHaveBeenCalled();
    });

    it('should connect to game', () => {
        const gameName = document.createElement('input');
        gameName.id = 'join-code';
        document.body.appendChild(gameName);
        spyOn(waitAreaService, 'connect');
        component.connect();
        expect(waitAreaService.connect).toHaveBeenCalled();
        document.body.removeChild(gameName);
    });

    it('should ban player', () => {
        spyOn(waitAreaService, 'banPlayerName');
        component.banPlayerName('testPlayer');
        expect(waitAreaService.banPlayerName).toHaveBeenCalledWith('testPlayer');
    });

    it('should get user type', () => {
        spyOn(waitAreaService, 'getUserType').and.returnValue(UserType.Organizer);
        expect(component.userType).toBe(UserType.Organizer);
    });

    it('should start game', () => {
        spyOn(waitAreaService, 'startGame');
        component.startGame();
        expect(waitAreaService.startGame).toHaveBeenCalled();
    });

    it('should toggle lock', () => {
        spyOn(waitAreaService, 'toggleLock');
        component.toggleLock();
        expect(waitAreaService.toggleLock).toHaveBeenCalled();
    });

    it('should call getReasonStartGameIsDisabled', () => {
        spyOn(waitAreaService, 'getReasonStartGameIsDisabled');
        component.getReasonStartGameIsDisabled();
        expect(waitAreaService.getReasonStartGameIsDisabled).toHaveBeenCalled();
    });
    describe('isStartGameDisable', () => {
        it('should return true when game is not isLocked ', () => {
            waitAreaService.waitAreaInfo.isLocked = false;
            expect(component.isStartGameDisable()).toBeTrue();
        });
        it('should return true when game is not isLocked ', () => {
            waitAreaService.waitAreaInfo.isLocked = true;
            waitAreaService.waitAreaInfo.playersList = ['player 1', 'player 2'];
            expect(component.isStartGameDisable()).toBeFalse();
        });
        it('should return true when game is not isLocked ', () => {
            waitAreaService.waitAreaInfo.isLocked = true;
            waitAreaService.waitAreaInfo.playersList = [];
            waitAreaService.waitAreaInfo.isRandomMode = true;
            expect(component.isStartGameDisable()).toBeFalse();
        });
    });
});
