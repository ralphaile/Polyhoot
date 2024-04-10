import { Injectable } from '@angular/core';
import { DEFAULT_CHAT_WIGHT, MAX_PERCENTAGE_OF_CHAT, MIN_NUM_OF_PX_OF_CHAT } from '@common/const';
import { Message } from '@common/message';
import { SocketEvents } from '@common/socketEvents';
import { BehaviorSubject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { SocketClientService } from './socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    socket: Socket;
    private messagesSource = new BehaviorSubject<Message[]>([]);
    private userNameSource = new BehaviorSubject<string>('');
    private chatWidth: number = DEFAULT_CHAT_WIGHT;

    constructor(private socketService: SocketClientService) {
        this.socketService.onConnect$.subscribe((connected) => {
            if (connected) {
                this.initializeListeners();
                this.initializeMessageListening();
            }
        });
        this.socketService.onDisconnect$.subscribe((disconnected) => {
            if (disconnected) {
                this.clearMessages();
            }
        });
    }

    get messages$() {
        return this.messagesSource.asObservable();
    }

    get userName$() {
        return this.userNameSource.asObservable();
    }

    get width() {
        return this.chatWidth;
    }
    resizeChat() {
        this.chatWidth = Math.min(Math.max(this.chatWidth, MIN_NUM_OF_PX_OF_CHAT), window.innerWidth * MAX_PERCENTAGE_OF_CHAT);
    }
    trackSliding(event: MouseEvent) {
        this.chatWidth = Math.min(Math.max(event.clientX, MIN_NUM_OF_PX_OF_CHAT), window.innerWidth * MAX_PERCENTAGE_OF_CHAT);
    }
    addMessage(message: Message) {
        const currentMessages = this.messagesSource.value;
        this.messagesSource.next([...currentMessages, message]);
    }

    sendMessage(message: string): void {
        this.socketService.send(SocketEvents.SendChatMessage, message);
    }

    clearMessages(): void {
        this.messagesSource.next([]);
    }
    async isUserMuted(): Promise<boolean> {
        return new Promise((resolve) => {
            this.socketService.send(SocketEvents.IsUserMuted, (isMuted: boolean) => {
                resolve(isMuted);
            });
        });
    }

    private setUserName(name: string) {
        this.userNameSource.next(name);
    }

    private initializeListeners() {
        this.socketService.on(SocketEvents.Username, (data: { name: string }) => this.setUserName(data.name));
        this.socketService.on(SocketEvents.UserDisconnected, (leavingPlayerName: string) => this.userLeft(leavingPlayerName));
    }
    private userLeft(username: string): void {
        const leavingMessage = {
            message: `${username} a quitté.`,
            senderName: 'System',
            time: new Date().toISOString(),
        };
        this.addMessage(leavingMessage);
    }
    private initializeMessageListening() {
        this.socketService.on(SocketEvents.NewChatMessage, (data: Message) => this.addMessage(data));
    }
}
