import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { ChatService } from '@app/services/chat.service';
import { of } from 'rxjs';

describe('SidebarComponent', () => {
    let component: SidebarComponent;
    let fixture: ComponentFixture<SidebarComponent>;
    let mockChatService: jasmine.SpyObj<ChatService>;

    beforeEach(async () => {
        mockChatService = jasmine.createSpyObj('ChatService', ['sendMessage', 'getYourId', 'getUserName', 'onMessageReceived', 'isUserMuted']);

        const messagesObservable = of([]);
        const userNameObservable = of('TestUser');

        Object.defineProperty(mockChatService, 'messages$', { value: messagesObservable });
        Object.defineProperty(mockChatService, 'userName$', { value: userNameObservable });

        await TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [SidebarComponent],
            providers: [{ provide: ChatService, useValue: mockChatService }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SidebarComponent);
        component = fixture.componentInstance;
        component['messageDisplay'] = {
            nativeElement: {
                scrollTop: 0,
                scrollHeight: 1000,
            },
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call fetchUserName when ngOnInit is called', () => {
        const fetchUserNameSpy = spyOn(component as never, 'fetchUserName');
        component.ngOnInit();
        expect(fetchUserNameSpy).toHaveBeenCalled();
    });

    it('should subscribe to messages$ when ngOnInit is called', () => {
        const subscribeSpy = spyOn(component['chatService'].messages$, 'subscribe');
        component.ngOnInit();
        expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should not send a message when newMessage is empty', () => {
        component.messagesReader.newMessage = '   ';
        component.verifyMessage();

        expect(mockChatService.sendMessage).not.toHaveBeenCalled();
        expect(component.messagesReader.messages.length).toBe(0);
    });

    it('should send a message when newMessage is not empty', fakeAsync(() => {
        component.messagesReader.newMessage = 'Hello World';
        mockChatService.isUserMuted.and.returnValue(Promise.resolve(false));
        component.verifyMessage();
        tick();
        fixture.detectChanges();

        expect(mockChatService.sendMessage).toHaveBeenCalledWith('Hello World');

        expect(component.messagesReader.messages.length).toBe(1);

        const newMessage = component.messagesReader.messages[0];
        expect(newMessage.message).toEqual('Hello World');
        expect(newMessage.senderName).toEqual('TestUser');

        expect(component.messagesReader.newMessage).toBe('');
    }));

    it('should call scrollToBottom after sending a message', fakeAsync(() => {
        component.messagesReader.newMessage = 'Another message';
        mockChatService.isUserMuted.and.returnValue(Promise.resolve(false));
        const scrollToBottomSpy = spyOn(component as never, 'scrollToBottom');

        component.verifyMessage();
        tick();

        expect(scrollToBottomSpy).toHaveBeenCalled();
    }));

    it('should unsubscribe from userNameSubscription when ngOnDestroy is called', () => {
        const unsubscribeSpy = spyOn(component['userNameSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from messagesSubscription when ngOnDestroy is called', () => {
        const unsubscribeSpy = spyOn(component['messagesSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should clear local messages when ngOnDestroy is called', () => {
        component.messagesReader.messages.push({ message: 'Test message', senderName: 'John Doe', time: '2020-01-01T00:00:00.000Z' });
        component.ngOnDestroy();
        expect(component.messagesReader.messages.length).toBe(0);
    });

    it('should subscribe to userName$ when ngOnInit is called', () => {
        const subscribeSpy = spyOn(mockChatService.userName$, 'subscribe');
        component.ngOnInit();
        expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should clear all local messages when clearLocalMessages is called', () => {
        component.messagesReader.messages = [
            { message: 'Message 1', senderName: 'Alice', time: '2020-01-01T00:00:00.000Z' },
            { message: 'Message 2', senderName: 'Bob', time: '2020-01-02T00:00:00.000Z' },
        ];
        component['clearLocalMessages']();
        expect(component.messagesReader.messages.length).toBe(0);
    });
});
