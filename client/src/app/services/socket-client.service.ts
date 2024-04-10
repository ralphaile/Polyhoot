import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketClientService {
    socket: Socket;
    _onDisconnect = new BehaviorSubject<boolean>(false);
    _onConnect = new BehaviorSubject<boolean>(false);
    readonly onDisconnect$ = this._onDisconnect.asObservable();
    readonly onConnect$ = this._onConnect.asObservable();
    private serverUrl: string = environment.serverUrl;

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    connect() {
        this.socket = io(this.getSocketUrl(), { transports: ['websocket'], upgrade: false });
        this._onConnect.next(true);
    }

    disconnect() {
        this.socket.disconnect();
        this._onDisconnect.next(true);
    }

    on<T>(event: string, action: (data: T) => void): void {
        this.socket.on(event, action);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    send<T>(event: string, data?: T, callback?: Function): void {
        if (!this.socket) {
            return;
        }
        this.socket.emit(event, ...[data, callback].filter((x) => x));
    }

    private getSocketUrl(): string {
        return this.serverUrl.replace('/api', '');
    }
}
