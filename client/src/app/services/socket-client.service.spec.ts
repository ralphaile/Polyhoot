import { TestBed } from '@angular/core/testing';
import { Socket } from 'socket.io-client';
import { SocketClientService } from './socket-client.service';
describe('SocketClientService', () => {
    let service: SocketClientService;
    let socketMock: Partial<Socket>;

    beforeEach(() => {
        socketMock = {
            on: jasmine.createSpy('on').and.callThrough(),
            emit: jasmine.createSpy('emit').and.callThrough(),
            disconnect: jasmine.createSpy('disconnect').and.callThrough(),
            connected: false,
        };

        TestBed.configureTestingModule({
            providers: [{ provide: Socket, useValue: socketMock }],
        });
        service = TestBed.inject(SocketClientService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should disconnect from the server', () => {
        const disconnectSocketMock: Partial<Socket> = {
            emit: jasmine.createSpy('emit'),
            disconnect: jasmine.createSpy('disconnect'),
        };
        spyOn(service, 'connect').and.callFake(() => {
            service.socket = disconnectSocketMock as Socket;
        });
        service.connect();
        service.disconnect();
        expect(disconnectSocketMock.disconnect).toHaveBeenCalled();
    });

    it('should check if socket is alive', () => {
        expect(service.isSocketAlive()).toBeFalsy();

        service.socket = socketMock as Socket;
        expect(service.isSocketAlive()).toBeFalsy();

        socketMock.connected = true;
        expect(service.isSocketAlive()).toBeTruthy();

        socketMock.connected = false;
        expect(service.isSocketAlive()).toBeFalsy();
    });

    it('should subscribe to an event', () => {
        const subscribeSocketMock: Partial<Socket> = {
            emit: jasmine.createSpy('emit'),
            on: jasmine.createSpy('on'),
        };
        spyOn(service, 'connect').and.callFake(() => {
            service.socket = subscribeSocketMock as Socket;
        });
        service.connect();
        const event = 'test';
        const action = jasmine.createSpy('action');
        service.on(event, action);
        expect(subscribeSocketMock.on).toHaveBeenCalledWith(event, action);
    });

    it('should send data to the server', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const sendSocketMock: Partial<Socket> = {
            emit: jasmine.createSpy('emit'),
        };
        spyOn(service, 'connect').and.callFake(() => {
            service.socket = sendSocketMock as Socket;
        });
        service.connect();
        const event = 'test';
        const data = { message: 'Hello' };
        service.send(event, data);
        expect(sendSocketMock.emit).toHaveBeenCalledWith(event, data);
    });

    it('should create socket connection', () => {
        expect(service.socket).not.toBeDefined();
        service.connect();
        expect(service.socket).toBeDefined();
    });

    it('should not attempt to emit if socket is not defined', () => {
        service.send('testEvent', { message: 'test' });
        expect(socketMock.emit).not.toHaveBeenCalled();
    });
});
