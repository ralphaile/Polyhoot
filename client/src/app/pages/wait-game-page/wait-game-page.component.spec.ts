/* eslint-disable max-classes-per-file */
import { HttpClientModule } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { WaitAreaComponent } from '@app/components/wait-area/wait-area.component';
import { HttpManager } from '@app/services/http-manager.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { MAX_PERCENTAGE_OF_CHAT, MIN_NUM_OF_PX_OF_CHAT } from '@common/const';
import { BehaviorSubject } from 'rxjs';
import { AppMaterialModule } from '../../modules/material.module';
import { WaitGamePageComponent } from './wait-game-page.component';

describe('WaitGamePageComponent', () => {
    let component: WaitGamePageComponent;
    let fixture: ComponentFixture<WaitGamePageComponent>;
    let mockSocketService: jasmine.SpyObj<SocketClientService>;

    beforeEach(async () => {
        mockSocketService = jasmine.createSpyObj('SocketClientService', ['on', 'send']);
        const onDisconnect$ = new BehaviorSubject<boolean>(false);
        const onConnect$ = new BehaviorSubject<boolean>(false);

        Object.defineProperty(mockSocketService, 'onDisconnect$', { value: onDisconnect$.asObservable() });
        Object.defineProperty(mockSocketService, 'onConnect$', { value: onConnect$.asObservable() });

        await TestBed.configureTestingModule({
            declarations: [WaitGamePageComponent, SidebarComponent, WaitAreaComponent, HeaderComponent],
            imports: [HttpClientModule, FormsModule, AppMaterialModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useClass: class {
                        navigate = jasmine.createSpy('navigate');
                    },
                },
                HttpManager,
                { provide: SocketClientService, useValue: mockSocketService },
            ],

            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        TestBed.inject(ActivatedRoute);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
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
});
