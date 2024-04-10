import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { Subject } from 'rxjs';

describe('HeaderComponent', () => {
    interface RouterWithUrl extends Router {
        url: string;
    }
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;
    let router: RouterWithUrl;
    let routerEventsSubject: Subject<unknown>;
    beforeEach(async () => {
        routerEventsSubject = new Subject<unknown>();
        await TestBed.configureTestingModule({
            declarations: [HeaderComponent],
            providers: [
                {
                    provide: Router,
                    useClass: class {
                        navigate = jasmine.createSpy('navigate');
                        events = routerEventsSubject.asObservable();
                        url = '/home';
                    },
                },
            ],
        }).compileComponents();
        router = TestBed.inject(Router) as RouterWithUrl;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('navigateToHome should change the page by default', () => {
        component.navigateToHome();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('navigateToHome should not change the page if hasHomePathProhibited is true', () => {
        component.hasHomePathProhibited = true;
        component.navigateToHome();
        expect(router.navigate).not.toHaveBeenCalled();
    });
    it('should set hasHomePathProhibited to true when router url is /game', () => {
        (router as RouterWithUrl).url = '/game';
        routerEventsSubject.next({ url: '/game' });
        component.ngOnInit();

        expect(component.hasHomePathProhibited).toBeTrue();
    });
    it('should set hasHomePathProhibited to false when router url is not /game', () => {
        routerEventsSubject.next({ url: '/home' });
        expect(component.hasHomePathProhibited).toBeFalse();
    });
});
