import { GameInfo, GameState } from '@common/game';
import { EvaluatedLongResponse } from '@common/longResponse';
import { Message } from '@common/message';
import { Question, QuestionType } from '@common/question';
import { SocketEvents } from '@common/socketEvents';
import { User, UserState } from '@common/user';
import * as io from 'socket.io';
import { Service } from 'typedi';
import { GameInformationService } from './game-info.service';
import { GraphInfoService } from './graph-info.service';
import { MultipleChoicesHandlerService } from './qcm-handler.service';
import { LongAnswerHandlerService } from './qrl-handler.service';

@Service()
export class GameInteractionService {
    graphInfoService: GraphInfoService;
    multipleChoiceHandlerService: MultipleChoicesHandlerService;
    longAnswerHandlerService: LongAnswerHandlerService;
    constructor(private readonly gameInfoService: GameInformationService) {
        this.graphInfoService = new GraphInfoService(this.gameInfoService);
        this.multipleChoiceHandlerService = new MultipleChoicesHandlerService(this.gameInfoService, this.graphInfoService);
        this.longAnswerHandlerService = new LongAnswerHandlerService(this.gameInfoService, this.graphInfoService);
    }

    canFinalizeAnswers(socket: io.Socket): boolean {
        if (this.gameInfoService.isOrganizerButNotTester(socket)) return false;
        const game: GameInfo = this.gameInfoService.getGameInfo(socket);
        const player: User = game.players.find((user: User) => user.id === socket.id);
        if (this.playerCantFinalizeAnswer(game, player)) return false;
        this.finalizeAnswers(game, player);

        player.state = UserState.FinalizedAnswer;
        this.gameInfoService.socketServer.to(game.organizer.id).emit(SocketEvents.PlayerStateChanged, { newState: player.state, name: player.name });

        return true;
    }

    initializeQuestion(game: GameInfo, socket: io.Socket): void {
        const currentQuestion: Question = game.quiz.questions[game.currentQuestionIndex];
        game.gameState = GameState.AnsweringQuestion;
        game.timer.resetTimer(this.gameInfoService.getDuration(socket), () => {
            this.onTimeEnd(game);
        });
        this.multipleChoiceHandlerService.resetNumberOfSelection(currentQuestion);
    }

    toggleChoice(socket: io.Socket, index: number): boolean {
        return this.multipleChoiceHandlerService.toggleChoice(socket, index);
    }

    changeLongAnswer(socket: io.Socket, newAnswer: string): void {
        this.longAnswerHandlerService.changeLongAnswer(socket, newAnswer);
    }

    finalizeQuestion(game: GameInfo): void {
        if (this.questionIsMultipleChoices(game)) this.multipleChoiceHandlerService.finalizeQuestion(game);
        else this.longAnswerHandlerService.finalizeQuestion(game);
    }

    sendChatMessage(socket: io.Socket, message: string): void {
        const roomId = this.gameInfoService.getRoomId(socket);
        const user = this.gameInfoService.findUserBySocketId(socket);
        if (user) socket.broadcast.to(roomId).emit(SocketEvents.NewChatMessage, this.createNewMessage(message, user));
    }

    giveLongResponsePoints(socket: io.Socket, evaluatedResponses: EvaluatedLongResponse[]): void {
        this.longAnswerHandlerService.giveLongResponsePoints(socket, evaluatedResponses);
    }

    private finalizeAnswers(game: GameInfo, player: User): void {
        if (this.verifyPlayerHasNotAnswered(player)) {
            player.hasFinalizeIsAnswers = true;
            game.nbOfFinishedPlayers++;
            this.validationAccordingToQuestionType(game, player);
        }
    }

    private validationAccordingToQuestionType(game: GameInfo, player: User): void {
        if (this.questionIsMultipleChoices(game)) this.multipleChoiceHandlerService.validateQuestion(game, player);
        else this.longAnswerHandlerService.validateQuestion(game, player);
    }

    private verifyPlayerHasNotAnswered(player: User): boolean {
        return player.state !== UserState.Disconnected && !player.hasFinalizeIsAnswers;
    }

    private questionIsMultipleChoices(game: GameInfo): boolean {
        return this.gameInfoService.getQuestionType(game) === QuestionType.MultipleChoices;
    }

    private onTimeEnd(game: GameInfo) {
        game.players.forEach((player: User) => {
            this.finalizeAnswers(game, player);
        });
    }

    private playerCantFinalizeAnswer(game: GameInfo, player: User): boolean {
        if (!this.questionIsMultipleChoices(game)) return game.gameState !== GameState.AnsweringQuestion;
        const hasNotAnswered = player.currentChoices.every((choice: boolean) => choice === false);
        return hasNotAnswered && game.gameState !== GameState.AnsweringQuestion;
    }

    private createNewMessage(message: string, user: User): Message {
        return {
            message,
            senderName: user.name,
            time: new Date().toISOString(),
        };
    }
}
