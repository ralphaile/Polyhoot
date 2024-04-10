import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterService } from '@app/services/router.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { UserType } from '@common/user';
import { AppMaterialModule } from '../../modules/material.module';
import { LeaveInterfaceComponent } from './leave-interface.component';

describe('LeaveInterfaceComponent', () => {
    let component: LeaveInterfaceComponent;
    let fixture: ComponentFixture<LeaveInterfaceComponent>;
    let mockSocketService: jasmine.SpyObj<SocketClientService>;
    let router: Router;
    let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

    beforeEach(async () => {
        mockSocketService = jasmine.createSpyObj('SocketClientService', ['disconnect']);
        mockSocketService.socket = jasmine.createSpyObj('Socket', [], { connected: true });

        await TestBed.configureTestingModule({
            declarations: [LeaveInterfaceComponent],
            providers: [
                { provide: SocketClientService, useValue: mockSocketService },
                { provide: RouterService, useValue: { getRouter: () => router, getRoute: () => mockActivatedRoute } },
                { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
            ],
            imports: [AppMaterialModule],
        }).compileComponents();
        router = TestBed.inject(Router);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LeaveInterfaceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should disconnect and navigate to "/create-game" if doesLeave is true and socket is connected', () => {
        component.leavePage(true);
        expect(mockSocketService.disconnect).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/create-game'], jasmine.any(Object));
    });

    it('should not disconnect if doesLeave is true and socket is not connected', () => {
        mockSocketService.socket = undefined as never;
        component.leavePage(true);
        expect(mockSocketService.disconnect).not.toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/create-game'], jasmine.any(Object));
    });

    it('should emit "isNotLeaving" event if doesLeave is false', () => {
        const emitSpy = spyOn(component.isNotLeaving, 'emit');
        component.leavePage(false);
        expect(emitSpy).toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        expect(mockSocketService.disconnect).not.toHaveBeenCalled();
    });

    it('should navigate to /home if user is a player', () => {
        component.userType = UserType.Player;
        component.leavePage(true);
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });
});
