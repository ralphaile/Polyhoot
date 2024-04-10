import { HttpClientModule } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { QuizListComponent } from '@app/components/quiz-list/quiz-list.component';
import { AlertService } from '@app/services/alert.service';
import { AuthService } from '@app/services/auth.service';
import { HttpManager } from '@app/services/http-manager.service';
import { QuestionType } from '@common/question';
import { Quiz } from '@common/quiz';
import { of } from 'rxjs';
import { AppMaterialModule } from '../../modules/material.module';
import { ManageGamesPageComponent } from './manage-games-page.component';
import SpyObj = jasmine.SpyObj;
describe('ManageGamesPageComponent', () => {
    let component: ManageGamesPageComponent;
    let fixture: ComponentFixture<ManageGamesPageComponent>;
    let authService: AuthService;
    let router: Router;
    let alertServiceSpy: SpyObj<AlertService>;
    class MockRouterActivatedRoute {
        navigate = jasmine.createSpy('navigate');
    }
    const testQuiz: Quiz = {
        id: '1',
        title: 'General Knowledge',
        description: 'A quiz to test your general knowledge',
        duration: 30,
        lastModification: new Date(),
        questions: [
            {
                type: QuestionType.MultipleChoices,
                text: 'What is the capital of Canada?',
                points: 10,
                choices: [
                    { text: 'Toronto', isCorrect: false },
                    { text: 'Vancouver', isCorrect: false },
                    { text: 'Ottawa', isCorrect: true },
                    { text: 'Montreal', isCorrect: false },
                ],
            },
            {
                type: QuestionType.MultipleChoices,
                text: 'The sun is a star.',
                points: 10,
                choices: [
                    { text: 'True', isCorrect: true },
                    { text: 'False', isCorrect: false },
                ],
            },
        ],
        isVisible: true,
    };
    beforeEach(async () => {
        alertServiceSpy = jasmine.createSpyObj('AlertService', ['showAlert', 'getAlert']);
        alertServiceSpy.getAlert.and.returnValue(of(''));
        await TestBed.configureTestingModule({
            declarations: [ManageGamesPageComponent, HeaderComponent, QuizListComponent, HeaderComponent],
            imports: [AppMaterialModule, HttpClientModule],
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
                { provide: AlertService, useValue: alertServiceSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        router = TestBed.inject(Router);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ManageGamesPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        authService = TestBed.inject(AuthService);
    });
    it('should create the component', () => {
        expect(component).toBeTruthy();
    });
    it('should navigate to login if not logged in', () => {
        authService['isLoggedIn'] = false;
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalledTimes(2);
    });

    it('should not navigate if logged in', () => {
        authService['isLoggedIn'] = true;
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalledTimes(1);
    });
    it('should set currentQuiz and showingForm correctly when called with a quiz', () => {
        component.changeView(testQuiz);

        expect(component.currentQuiz).toBe(testQuiz);
        expect(component.isShowingForm).toBe(true);
    });

    it('should toggle showingForm when called with null', () => {
        const initialShowingFormValue = component.isShowingForm;

        component.changeView(null);

        expect(component.isShowingForm).toBe(!initialShowingFormValue);
    });
});
