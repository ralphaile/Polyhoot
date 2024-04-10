import { HttpClientModule } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { QuestionListComponent } from '@app/components/question-list/question-list.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { AuthService } from '@app/services/auth.service';
import { HttpManager } from '@app/services/http-manager.service';
import { Question, QuestionType } from '@common/question';
import { BankPageComponent } from './bank-page.component';

describe('BankPageComponent', () => {
    let component: BankPageComponent;
    let fixture: ComponentFixture<BankPageComponent>;
    let authService: AuthService;
    let router: Router;
    class MockRouterActivatedRoute {
        navigate = jasmine.createSpy('navigate');
    }
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BankPageComponent, HeaderComponent, QuestionListComponent, HeaderComponent],
            imports: [HttpClientModule, MatRadioModule, FormsModule, MatTableModule, MatDialogModule],
            providers: [
                HttpManager,
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
            schemas: [NO_ERRORS_SCHEMA, AppMaterialModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BankPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        authService = TestBed.inject(AuthService);
        router = TestBed.inject(Router);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should navigate to login if not logged in', () => {
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalledTimes(2);
    });

    it('should not navigate if logged in', () => {
        spyOn(authService, 'getIsLoggedIn').and.returnValue(true);
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalledTimes(1);
    });
    it('should change view when function is called', async () => {
        const question: Question = {
            id: '0',
            type: QuestionType.MultipleChoices,
            text: 'Question Test',
            points: 20,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
            ],
        };
        component.changeView(null);
        expect(component.showingForm).toBe(true);
        expect(component.currentQuestion).toBe(null);
        component.changeView(question);
        expect(component.showingForm).toBe(false);
        expect(component.currentQuestion).toBe(question);
    });
});
