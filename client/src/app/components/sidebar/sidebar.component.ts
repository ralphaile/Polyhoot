import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessagesReader } from '@app/interfaces/messages-reader';
import { ChatService } from '@app/services/chat.service';
import { Message } from '@common/message';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
    @ViewChild('messageDisplay') private messageDisplay: ElementRef;

    messagesReader: MessagesReader;
    private messagesSubscription: Subscription;
    private userNameSubscription: Subscription;

    constructor(private chatService: ChatService) {
        this.messagesReader = {
            newMessage: '',
            messages: [],
            userName: '',
        };
    }

    ngOnInit(): void {
        this.fetchUserName();
        this.messagesSubscription = this.chatService.messages$.subscribe((messages) => {
            this.messagesReader.messages = messages;
            setTimeout(() => this.scrollToBottom(), 0);
        });
    }

    verifyMessage(): void {
        const message = this.messagesReader.newMessage.trim();
        if (message) {
            this.sendMessage(message);
        }
    }

    ngOnDestroy(): void {
        if (this.userNameSubscription) {
            this.userNameSubscription.unsubscribe();
        }
        if (this.messagesSubscription) {
            this.messagesSubscription.unsubscribe();
        }
        this.clearLocalMessages();
    }

    private fetchUserName(): void {
        this.userNameSubscription = this.chatService.userName$.subscribe((name) => {
            this.messagesReader.userName = name;
        });
    }

    private scrollToBottom(): void {
        this.messageDisplay.nativeElement.scrollTop = this.messageDisplay.nativeElement.scrollHeight;
    }

    private clearLocalMessages(): void {
        this.messagesReader.messages = [];
    }

    private generateMessage(message: string): Message {
        const currentTime = new Date().toISOString();

        return {
            message,
            senderName: this.messagesReader.userName,
            time: currentTime,
        };
    }

    private async sendMessage(message: string): Promise<void> {
        if (!(await this.chatService.isUserMuted())) {
            const messageObject = this.generateMessage(message);

            this.messagesReader.messages.push(messageObject);
            this.chatService.sendMessage(message);
            setTimeout(() => this.scrollToBottom(), 0);
        }

        this.messagesReader.newMessage = '';
    }
}
