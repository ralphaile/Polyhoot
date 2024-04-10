import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { AuthService } from '@app/services/auth.service';
import { AdminPageComponent } from './admin-page.component';

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
    let authService: AuthService;
    let router: Router;
    let route: ActivatedRoute;
    class MockRouterActivatedRoute {
        navigate = jasmine.createSpy('navigate');
    }
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AdminPageComponent, HeaderComponent],
            imports: [FormsModule],
            providers: [
                HttpClient,
                HttpHandler,
                AuthService,
                {
                    provide: Router,
                    useClass: MockRouterActivatedRoute,
                },
                {
                    provide: ActivatedRoute,
                    useClass: MockRouterActivatedRoute,
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        authService = TestBed.inject(AuthService);

        router = TestBed.inject(Router);
        route = TestBed.inject(ActivatedRoute);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to login if not logged in', () => {
        authService['isLoggedIn'] = false;
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalledWith(['/login'], { relativeTo: route, replaceUrl: true });
    });

    it('should not navigate if logged in', () => {
        authService['isLoggedIn'] = true;
        component.ngOnInit();
        expect(router.navigate).not.toHaveBeenCalled();
    });
});
