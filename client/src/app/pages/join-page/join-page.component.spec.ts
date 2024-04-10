import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { JoinPageComponent } from '@app/pages/join-page/join-page.component';
import { AppMaterialModule } from '../../modules/material.module';

describe('JoinPageComponent', () => {
    let component: JoinPageComponent;
    let fixture: ComponentFixture<JoinPageComponent>;
    class MockRouterActivatedRoute {
        navigate = jasmine.createSpy('navigate');
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppMaterialModule],
            declarations: [JoinPageComponent, HeaderComponent],
            providers: [
                {
                    provide: Router,
                    useClass: MockRouterActivatedRoute,
                },
                {
                    provide: ActivatedRoute,
                    useClass: MockRouterActivatedRoute,
                },
            ],
            schemas: [NO_ERRORS_SCHEMA, AppMaterialModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JoinPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should correctly change codeEntered and this.code when codeSubmitted is called', () => {
        const code = 1234;
        component.codeSubmitted(code);
        expect(component.codeEntered).toBeTrue();
        expect(component.code).toBe(code);
    });

    it('should navigate to waiting page when navigateToWaitingPage is called', () => {
        component.navigateToWaitingPage();
        expect(component['router'].navigate).toHaveBeenCalledWith(['/wait-game'], { relativeTo: component['route'] });
    });
});
