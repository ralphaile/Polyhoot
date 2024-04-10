import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { ChatService } from './chat.service';
import { SocketClientService } from './socket-client.service';

describe('ChatService', () => {
    let service: ChatService;
    let socketMock: Partial<Socket>;
    let mockSocketService: jasmine.SpyObj<SocketClientService>;
    let onDisconnectSubject: BehaviorSubject<boolean>;
    let onConnectSubject: BehaviorSubject<boolean>;

    beforeEach(() => {
        mockSocketService = jasmine.createSpyObj('SocketClientService', ['on', 'send', 'disconnect']);
        onDisconnectSubject = new BehaviorSubject<boolean>(false);
        onConnectSubject = new BehaviorSubject<boolean>(false);

        Object.defineProperty(mockSocketService, 'onDisconnect$', { get: () => onDisconnectSubject.asObservable() });
        Object.defineProperty(mockSocketService, 'onConnect$', { get: () => onConnectSubject.asObservable() });
        socketMock = {
            on: jasmine.createSpy('on').and.callThrough(),
            emit: jasmine.createSpy('emit').and.callThrough(),
            disconnect: jasmine.createSpy('disconnect').and.callThrough(),
            connected: false,
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: Socket, useValue: socketMock },
                { provide: SocketClientService, useValue: mockSocketService },
            ],
        });
        service = TestBed.inject(ChatService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should clear messages when disconnected', () => {
        service.addMessage({ message: 'Hello', senderName: 'Alice', time: '2022-01-01T00:00:00.000Z' });

        onDisconnectSubject.next(true);

        service.messages$.subscribe((messages) => {
            expect(messages.length).toBe(0);
        });
    });

    it('should initialize message listening when connected', () => {
        const initializeMessageListeningSpy = spyOn(service as never, 'initializeMessageListening').and.callThrough();

        onConnectSubject.next(true);

        expect(initializeMessageListeningSpy).toHaveBeenCalled();
    });

    it('should return the current messages as an Observable', (done) => {
        const expectedMessages = [{ message: 'Test Message', senderId: '1', senderName: 'User1', time: '2022-01-01T00:00:00.000Z' }];
        service['messagesSource'].next(expectedMessages);

        service.messages$.subscribe((messages) => {
            expect(messages).toEqual(expectedMessages);
            done();
        });
    });

    it('should return the current userName as an Observable', (done) => {
        const expectedUserName = 'TestUser';
        service['userNameSource'].next(expectedUserName);

        service.userName$.subscribe((userName) => {
            expect(userName).toEqual(expectedUserName);
            done();
        });
    });

    it('should add a single message to the messages stream', (done) => {
        const testMessage = { message: 'Hello, world!', senderId: '1', senderName: 'Alice', time: '2020-01-01T00:00:00.000Z' };

        service.addMessage(testMessage);

        service.messages$.subscribe((messages) => {
            expect(messages).toEqual([testMessage]);
            done();
        });
    });

    it('should add multiple messages to the messages stream', (done) => {
        const messagesToAdd = [
            { message: 'First message', senderId: '1', senderName: 'Alice', time: '2020-01-01T00:00:00.000Z' },
            { message: 'Second message', senderId: '2', senderName: 'Bob', time: '2020-01-02T00:00:00.000Z' },
        ];

        messagesToAdd.forEach((msg) => service.addMessage(msg));

        service.messages$.subscribe((messages) => {
            expect(messages).toEqual(messagesToAdd);
            done();
        });
    });

    it('should clear all messages when clearMessages is called', (done) => {
        const testMessage = { message: 'Hello, world!', senderId: '1', senderName: 'Alice', time: '2020-01-01T00:00:00.000Z' };
        service.addMessage(testMessage);

        service.clearMessages();

        service.messages$.subscribe((messages) => {
            expect(messages.length).toBe(0);
            done();
        });
    });

    it('should update userName when setUserName is called', (done) => {
        const newUserName = 'NewUser';
        service['setUserName'](newUserName);

        service.userName$.subscribe((userName) => {
            expect(userName).toEqual(newUserName);
            done();
        });
    });

    it('should emit "sendChatMessage" event with the correct message when sendMessage is called', () => {
        const testMessage = 'Test message';
        service.sendMessage(testMessage);
        expect(mockSocketService.send).toHaveBeenCalledWith('sendChatMessage', testMessage);
    });

    it('should update userName when "userName" event is received', (done) => {
        const newUserName = 'NewUser';
        (mockSocketService.on as jasmine.Spy).and.callFake((event: string, callback: (res: { name: string }) => void) => {
            if (event === 'userName') {
                callback({ name: newUserName });
            }
        });

        service['initializeListeners']();

        service.userName$.subscribe((userName) => {
            expect(userName).toEqual(newUserName);
            done();
        });
    });

    it('should add message when "newChatMessage" event is received', (done) => {
        const testMessage = { message: 'Test message', senderName: 'Tester', time: '2023-01-01T00:00:00.000Z' };
        (mockSocketService.on as jasmine.Spy).and.callFake(
            (event: string, callback: (res: { message: string; senderName: string; time: string }) => void) => {
                if (event === 'newChatMessage') {
                    callback(testMessage);
                }
            },
        );

        service['initializeMessageListening']();

        service.messages$.subscribe((messages) => {
            expect(messages).toContain(testMessage);
            done();
        });
    });
    it('should check if user is muted', async () => {
        const expectedIsMuted = true; // Set this to the expected result

        // Spy on the 'send' method of socketService and mock its implementation
        (mockSocketService.send as jasmine.Spy).and.callFake((eventName: string, callback: (res: boolean) => void) => {
            callback(true);
        });
        const res = await service['isUserMuted']();
        expect(res).toBe(expectedIsMuted);
    });

    it('should call userLeft when "userDisconnected" event is received', (done) => {
        const leavingPlayer = 'leaving';
        (mockSocketService.on as jasmine.Spy).and.callFake((event: string, callback: (leavingPlayerName: string) => void) => {
            if (event === 'userDisconnected') {
                callback(leavingPlayer);
            }
        });
        // userLeft is private and we need to spy on it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userLeftSpy = spyOn(service as any, 'userLeft').and.callThrough();
        const addMessageSpy = spyOn(service, 'addMessage');
        service['initializeListeners']();
        expect(userLeftSpy).toHaveBeenCalledWith(leavingPlayer);
        const expectedMessage = {
            message: `${leavingPlayer} a quitté.`,
            senderName: 'System',
            time: jasmine.any(String),
        };
        expect(addMessageSpy).toHaveBeenCalledWith(expectedMessage);
        done();
    });
});
