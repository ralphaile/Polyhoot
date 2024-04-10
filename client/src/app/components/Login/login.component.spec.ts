// Needed for private functions
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from '@app/services/alert.service';
import { AuthService } from '@app/services/auth.service';
import { ErrorMessage } from '@common/errors';
import { of } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { LoginComponent } from './login.component';
import SpyObj = jasmine.SpyObj;
describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let authService: AuthService;
    let router: Router;
    let route: ActivatedRoute;
    let alertServiceSpy: SpyObj<AlertService>;

    class MockRouterActivatedRoute {
        navigate = jasmine.createSpy('navigate');
    }

    beforeEach(async () => {
        alertServiceSpy = jasmine.createSpyObj('AlertService', ['showAlert', 'getAlert']);
        alertServiceSpy.getAlert.and.returnValue(of(''));
        await TestBed.configureTestingModule({
            declarations: [LoginComponent, HeaderComponent],
            imports: [FormsModule],
            providers: [
                HttpClient,
                HttpHandler,
                AuthService,
                { provide: AlertService, useValue: alertServiceSpy },
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

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        authService = TestBed.inject(AuthService);
        router = TestBed.inject(Router);
        route = TestBed.inject(ActivatedRoute);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call correct functions when password is submitted', async () => {
        const spy = spyOn(authService, 'verifyPassword').and.returnValue(Promise.resolve());
        const spy2 = spyOn(component as any, 'verifyLogin');

        await component.onLogin();

        expect(spy).toHaveBeenCalledWith(component.password);
        expect(spy2).toHaveBeenCalled();
    });

    it('should log in when password is correct', async () => {
        component['authService']['isLoggedIn'] = true;

        await component.onLogin();

        expect(router.navigate).toHaveBeenCalledWith(['/admin'], { relativeTo: route });
    });

    it('should not log in when password is incorrect', async () => {
        component['authService']['isLoggedIn'] = false;

        await component.onLogin();

        expect(alertServiceSpy.showAlert).toHaveBeenCalledWith(ErrorMessage.BadPassword);
    });
});
