import { Message } from '@common/message';

export interface MessagesReader {
    newMessage: string;
    messages: Message[];
    userName: string;
}
