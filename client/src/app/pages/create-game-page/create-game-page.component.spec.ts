// Needed for private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { HttpManager } from '@app/services/http-manager.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { QuestionType } from '@common/question';
import { Quiz } from '@common/quiz';
import { of } from 'rxjs';
import { AppMaterialModule } from '../../modules/material.module';
import { CreateGamePageComponent } from './create-game-page.component';

describe('CreateGamePageComponent', () => {
    let component: CreateGamePageComponent;
    let fixture: ComponentFixture<CreateGamePageComponent>;
    let socketServiceMock: Partial<SocketClientService>;
    let router: Router;

    beforeEach(async () => {
        socketServiceMock = {
            isSocketAlive: jasmine.createSpy('isSocketAlive').and.returnValue(false),
            connect: jasmine.createSpy('connect'),
            send: jasmine.createSpy('send'),
            disconnect: jasmine.createSpy('disconnect'),
        };

        await TestBed.configureTestingModule({
            declarations: [CreateGamePageComponent, SidebarComponent, PlayAreaComponent, HeaderComponent],
            providers: [
                {
                    provide: HttpManager,
                    useValue: {
                        fetchAllQuizzes: jasmine.createSpy().and.returnValue(
                            Promise.resolve([
                                {
                                    id: '1',
                                    title: 'Quiz 1',
                                    description: 'Description 1',
                                    duration: 30,
                                    lastModification: new Date(),
                                    questions: [],
                                    isVisible: true,
                                },
                                {
                                    id: '2',
                                    title: 'Quiz 2',
                                    description: 'Description 2',
                                    duration: 20,
                                    lastModification: new Date(),
                                    questions: [],
                                    isVisible: false,
                                },
                            ]),
                        ),
                        fetchAllMultipleQuestions: jasmine.createSpy().and.returnValue(
                            Promise.resolve([
                                {
                                    id: '1',
                                    type: QuestionType.MultipleChoices,
                                    text: 'abc',
                                    points: 10,
                                    choices: [],
                                },
                                {
                                    id: '2',
                                    type: QuestionType.MultipleChoices,
                                    text: 'abcd',
                                    points: 10,
                                    choices: [],
                                },
                                {
                                    id: '3',
                                    type: QuestionType.MultipleChoices,
                                    text: 'abcde',
                                    points: 10,
                                    choices: [],
                                },
                                {
                                    id: '4',
                                    type: QuestionType.MultipleChoices,
                                    text: 'abcdef',
                                    points: 10,
                                    choices: [],
                                },
                                {
                                    id: '5',
                                    type: QuestionType.MultipleChoices,
                                    text: 'abcdefg',
                                    points: 10,
                                    choices: [],
                                },
                                {
                                    id: '6',
                                    type: QuestionType.MultipleChoices,
                                    text: 'abcdefgh',
                                    points: 10,
                                    choices: [],
                                },
                            ]),
                        ),
                    },
                },
                {
                    provide: ActivatedRoute,
                    useClass: class {
                        paramMap = of({ get: () => 'gameId' });
                    },
                },
                { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
                { provide: SocketClientService, useValue: socketServiceMock },
            ],
            imports: [AppMaterialModule],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        router = TestBed.inject(Router);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CreateGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call loadQuizzes and loadQuestions on initialization', async () => {
        await fixture.whenStable();
        expect(TestBed.inject(HttpManager).fetchAllMultipleQuestions).toHaveBeenCalled();
        expect(TestBed.inject(HttpManager).fetchAllQuizzes).toHaveBeenCalled();
    });

    it('should initialize games and visibleGames arrays', async () => {
        await fixture.whenStable();
        expect(component.quizzes).toBeDefined();
        expect(component.visibleGames()).toEqual([
            component.randomQuiz,
            {
                id: '1',
                title: 'Quiz 1',
                description: 'Description 1',
                duration: 30,
                lastModification: jasmine.any(Date),
                questions: [],
                isVisible: true,
            },
        ]);
        expect(component.visibleGames).toBeDefined();
        expect(component.quizzes.length).toBeGreaterThan(0);
    });

    it('should initially have no selected game', () => {
        expect(component.selectedGame).toBeNull();
    });

    it('should update selectedGame when a game is clicked', async () => {
        await fixture.whenStable();
        const testGame: Quiz = {
            id: '1',
            title: 'Quiz 1',
            description: 'Description 1',
            duration: 30,
            lastModification: component.quizzes[1].lastModification,
            questions: [],
            isVisible: true,
        };
        await component.selectGame(testGame);
        expect(component.selectedGame).toEqual(testGame);
    });
    it('should not update selectedGame when a hidden game is clicked', async () => {
        await fixture.whenStable();
        const hiddenGame: Quiz = {
            id: '2',
            title: 'Quiz 2',
            description: 'Description 2',
            duration: 20,
            lastModification: component.quizzes[1].lastModification,
            questions: [],
            isVisible: false,
        };
        await component.selectGame(hiddenGame);
        expect(component.selectedGame).toBeNull();
    });

    it('should clear selectedGame if the same game is clicked twice', async () => {
        await fixture.whenStable();
        const testGame: Quiz = {
            id: '1',
            title: 'Quiz 1',
            description: 'Description 1',
            duration: 30,
            lastModification: component.quizzes[0].lastModification,
            questions: [],
            isVisible: true,
        };
        await component.selectGame(testGame);
        await component.selectGame(testGame);
        expect(component.selectedGame).toBeNull();
    });

    it('should disconnect from socket if socket is already connected', () => {
        component.socketService.socket = {} as never;
        spyOn<any>(component, 'connect').and.callThrough();
        component.navigateToGame();
        expect((component as any).connect).toHaveBeenCalledOnceWith('organizer');
        expect(socketServiceMock.disconnect).toHaveBeenCalled();
    });

    it('should connect and send organizerLogin message if socket is not alive', () => {
        (socketServiceMock.isSocketAlive as jasmine.Spy).and.returnValue(false);
        component.selectedGame = {
            id: '1',
            title: 'Quiz Test',
            isVisible: true,
        } as Quiz;
        spyOn<any>(component, 'connect').and.callThrough();
        component.navigateToGame();
        expect((component as any).connect).toHaveBeenCalledOnceWith('organizer');

        expect(socketServiceMock.connect).toHaveBeenCalled();
        expect(socketServiceMock.send).toHaveBeenCalledWith('organizerLogin', component.selectedGame);
    });

    it('should connect and send randomGameLogin message if socket is not alive and game is random', () => {
        (socketServiceMock.isSocketAlive as jasmine.Spy).and.returnValue(false);
        component.selectedGame = {
            id: '1',
            title: 'Mode aléatoire',
            isVisible: true,
        } as Quiz;
        spyOn<any>(component, 'connect').and.callThrough();
        component.navigateToGame();
        expect((component as any).connect).toHaveBeenCalledOnceWith('randomGame');

        expect(socketServiceMock.connect).toHaveBeenCalled();
        expect(socketServiceMock.send).toHaveBeenCalledWith('randomGameLogin', component.selectedGame);
    });

    it('should not connect or send message if socket is already alive', () => {
        (socketServiceMock.isSocketAlive as jasmine.Spy).and.returnValue(true);
        spyOn<any>(component, 'connect').and.callThrough();
        component.navigateToGame();
        expect((component as any).connect).toHaveBeenCalledOnceWith('organizer');

        expect(socketServiceMock.connect).not.toHaveBeenCalled();
        expect(socketServiceMock.send).not.toHaveBeenCalled();
    });

    it('should navigate to "/wait-game" when navigateToGame is called', () => {
        component.navigateToGame();
        expect(router.navigate).toHaveBeenCalledWith(['/wait-game']);
    });

    it('should call connect when navigateToTest is called', () => {
        spyOn<any>(component, 'connect').and.callThrough();
        component.navigateToTest();
        expect((component as any).connect).toHaveBeenCalledOnceWith('tester');
    });

    it('should navigate to "/game" when navigateTotest is called', () => {
        component.navigateToTest();
        expect(router.navigate).toHaveBeenCalledWith(['/game']);
    });
});
