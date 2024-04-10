// Need to test private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { AlertService } from '@app/services/alert.service';
import { PlayAreaHandlerService } from '@app/services/play-area-handler.service';
import { RouterService } from '@app/services/router.service';
import { SocketClientService } from '@app/services/socket-client.service';
import { ClientQuestionInfo, QuestionForResultDisplay, QuestionType } from '@common/question';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { AppMaterialModule } from '../../modules/material.module';

describe('PlayAreaComponent', () => {
    let component: PlayAreaComponent;
    let fixture: ComponentFixture<PlayAreaComponent>;
    let socketMock: Partial<Socket>;
    let socketServiceMock: Partial<SocketClientService>;
    let alertServiceMock: jasmine.SpyObj<AlertService>;
    let routerServiceMock: jasmine.SpyObj<RouterService>;
    let routerMock: jasmine.SpyObj<Router>;
    let spySubmitProtocol: jasmine.Spy;

    beforeEach(async () => {
        socketMock = {
            on: jasmine.createSpy('on'),
            send: jasmine.createSpy('send'),
            connect: jasmine.createSpy('connect'),
        };
        socketServiceMock = {
            socket: socketMock as Socket,
            send: jasmine.createSpy('send'),
            on: jasmine.createSpy('on'),
            disconnect: jasmine.createSpy('disconnect'),
        };
        alertServiceMock = jasmine.createSpyObj('AlertService', ['showAlert', 'getAlert']);
        alertServiceMock.getAlert.and.returnValue(of(''));

        routerMock = jasmine.createSpyObj('Router', ['navigate']);
        routerServiceMock = jasmine.createSpyObj('RouterService', ['getRouter', 'getRoute']);
        routerServiceMock.getRouter.and.returnValue(routerMock);

        await TestBed.configureTestingModule({
            declarations: [PlayAreaComponent],
            imports: [AppMaterialModule],
            providers: [
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: {} },
                { provide: SocketClientService, useValue: socketServiceMock },
                { provide: RouterService, useValue: routerServiceMock },
                { provide: AlertService, useValue: alertServiceMock },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        socketServiceMock = TestBed.inject(SocketClientService);
    });

    beforeEach(() => {
        const basicQuestionInfo: ClientQuestionInfo = {
            text: 'What is the capital of Canada?',
            points: 50,
            type: QuestionType.All,
            choicesText: ['Quebec', 'Ottawa', 'Toronto'],
        };
        fixture = TestBed.createComponent(PlayAreaComponent);
        component = fixture.componentInstance;
        component.playAreaService.state.currentQuestion = basicQuestionInfo;
        fixture.detectChanges();
        spySubmitProtocol = spyOn(component as any, 'submitProtocol').and.callThrough();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call submitProtocol when Enter is pressed and conditions are met', () => {
        component.playAreaService.state.isLeaving = false;
        component.playAreaService.state.isWaiting = false;
        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        window.dispatchEvent(event);
        expect(spySubmitProtocol).toHaveBeenCalled();
    });

    it('should not call submitProtocol when Enter is pressed but component is leaving', () => {
        component.playAreaService.state.isLeaving = true;
        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        window.dispatchEvent(event);
        expect(spySubmitProtocol).not.toHaveBeenCalled();
    });

    it('should not call submitProtocol when Enter is pressed but component is waiting', () => {
        component.playAreaService.state.isWaiting = true;
        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        window.dispatchEvent(event);
        expect(spySubmitProtocol).not.toHaveBeenCalled();
    });

    it('should not call submitProtocol when a key other than Enter is pressed', () => {
        const event = new KeyboardEvent('keyup', { key: 'Space' });
        window.dispatchEvent(event);
        expect(spySubmitProtocol).not.toHaveBeenCalled();
    });

    it('should not call submitProtocol when Enter is pressed and focus is on INPUT or TEXTAREA', () => {
        component.playAreaService.state.isLeaving = false;
        component.playAreaService.state.isWaiting = false;
        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();

        const event = new KeyboardEvent('keyup', { key: 'Enter' });
        window.dispatchEvent(event);
        expect(spySubmitProtocol).not.toHaveBeenCalled();

        document.body.removeChild(input);
    });

    it('should make isLeaving to true when leaveProtocol is called', () => {
        component.leaveProtocol();
        expect(component.playAreaService.state.isLeaving).toBeTrue();
    });

    it('should make isFirst to false when closeFirstWindow is called', () => {
        component.closeFirstWindow();
        expect(component.playAreaService.state.isFirst).toBeFalse();
    });

    it('should set isWaiting and isSubmitting to false if the callback is false', () => {
        (socketServiceMock.send as jasmine.Spy).and.callFake((message: string, callback: (res: boolean) => void) => {
            callback(false);
        });
        component.submitProtocol();
        expect(component.playAreaService.state.isWaiting).toBeFalse();
        expect(component.playAreaService.state.isSubmitting).toBeFalse();
        expect(alertServiceMock.showAlert).toHaveBeenCalledWith('Vous devez choisir au moins un choix');
        expect(socketServiceMock.send).toHaveBeenCalledWith('finalizeAnswers', jasmine.any(Function));
    });

    it('should set isWaiting and isSubmitting to true if the callback is true', () => {
        (socketServiceMock.send as jasmine.Spy).and.callFake((message: string, callback: (res: boolean) => void) => {
            callback(true);
        });
        component.submitProtocol();
        expect(component.playAreaService.state.isWaiting).toBeTrue();
        expect(component.playAreaService.state.isSubmitting).toBeTrue();
        expect(socketServiceMock.send).toHaveBeenCalledWith('finalizeAnswers', jasmine.any(Function));
    });

    it('should change the question if switchQuestion is called', () => {
        const mockQuestionForResultDisplay: QuestionForResultDisplay = {
            text: 'What is the capital of France?',
            points: 100,
            questionType: QuestionType.MultipleChoices,
            bandInfo: [],
        };
        component.switchQuestion(mockQuestionForResultDisplay);
        expect(component.playAreaService.state.currentQuestion.text).toBe(mockQuestionForResultDisplay.text);
        expect(component.playAreaService.state.currentQuestion.points).toBe(mockQuestionForResultDisplay.points);
    });

    it('should call submitProtocol if onTimerEndFunction is called', () => {
        component.onTimerEndFunction();
        expect(component.submitProtocol).toHaveBeenCalled();
    });

    it('should return true if player is playing multiple choice question', () => {
        spyOn(component as any, 'doesSeeChoices').and.returnValue(true);
        component.playAreaService.state.currentQuestion.type = QuestionType.MultipleChoices;
        expect(component.isPlayingMultipleChoiceQuestion()).toBeTrue();
    });

    it('should return true if player is playing long answer question', () => {
        spyOn(component as any, 'doesSeeChoices').and.returnValue(true);
        component.playAreaService.state.currentQuestion.type = QuestionType.LongAnswer;
        expect(component.isPlayingLongAnswerQuestion()).toBeTrue();
    });

    it('should call knowIfIsOrganizer of playAreaHandlerService when calling private method knowIfIsOrganizer', async () => {
        const spy = spyOn(TestBed.inject(PlayAreaHandlerService), 'knowIfIsOrganizer').and.returnValue(Promise.resolve(true));
        await (component as any).knowIfIsOrganizer();
        expect(spy).toHaveBeenCalled();
    });

    it('should check if socket is organizer if it isnt tester and random game', async () => {
        spyOn(TestBed.inject(PlayAreaHandlerService), 'doesSocketExist').and.returnValue(true);
        spyOn(TestBed.inject(PlayAreaHandlerService), 'knowIfIsTester').and.returnValue(Promise.resolve(false));
        spyOn(TestBed.inject(PlayAreaHandlerService), 'knowIfIsRandomMode').and.returnValue(Promise.resolve(false));
        const spy = spyOn(TestBed.inject(PlayAreaHandlerService), 'knowIfIsOrganizer').and.returnValue(Promise.resolve(false));
        await component['verifySocket']();
        expect(spy).toHaveBeenCalled();
    });

    it('should navigate home if socket is not connected', async () => {
        spyOn(TestBed.inject(PlayAreaHandlerService), 'doesSocketExist').and.returnValue(false);
        await component['verifySocket']();
        expect(routerMock.navigate).toHaveBeenCalledOnceWith(['/home'], { relativeTo: routerServiceMock.getRoute() });
    });
});
