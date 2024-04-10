import { EvaluatedLongResponse } from '@common/longResponse';
import { ClientQuestionInfo, QuestionForResultDisplay } from '@common/question';
import { Quiz } from '@common/quiz';
import { SocketEvents } from '@common/socketEvents';
import { User } from '@common/user';
import * as http from 'http';
import * as io from 'socket.io';
import { GameInformationService } from './game-info.service';
import { GameInteractionService } from './game-interaction.service';
import { GameManagementService } from './game-management.service';
import { HistoryService } from './history.service';
import { SocketAuthenticationService } from './socket-authentication.service';

export class SocketManager {
    private gameInfoService: GameInformationService;
    private socketAuthentication: SocketAuthenticationService;
    private gameManagementService: GameManagementService;
    private gameInteractionService: GameInteractionService;

    constructor(
        server: http.Server,
        protected readonly historyService: HistoryService,
    ) {
        this.gameInfoService = new GameInformationService(new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } }), historyService);
        this.gameManagementService = new GameManagementService(this.gameInfoService, historyService);
        this.gameInteractionService = new GameInteractionService(this.gameInfoService);
        this.socketAuthentication = new SocketAuthenticationService(this.gameInfoService, this.gameInteractionService);
    }

    handleSockets(): void {
        this.gameInfoService.socketServer.on(SocketEvents.Connection, (socket: io.Socket) => {
            this.initializeGetEvent(socket);
            this.initializeLoginEvent(socket);
            this.initializeOrganizerEvent(socket);
            this.initializePlayerEvent(socket);
            this.initializeGeneralEvent(socket);
        });
    }

    private initializeGetEvent(socket: io.Socket): void {
        socket.on(SocketEvents.GetGameCode, (callback: (arg0: string) => void) => {
            callback(this.gameInfoService.getRoomId(socket));
        });
        socket.on(SocketEvents.GetGameTitle, (callback: (arg0: string) => void) => {
            callback(this.gameInfoService.getGameInfo(socket).quiz.title);
        });
        socket.on(SocketEvents.GetPlayers, (callback: (arg0: string[]) => void) => {
            callback(this.gameInfoService.getPlayersName(socket));
        });
        socket.on(SocketEvents.GetIsOrganizer, (callback: (arg0: boolean) => void) => {
            callback(this.gameInfoService.isOrganizer(socket));
        });
        socket.on(SocketEvents.GetIsTester, (callback: (arg0: boolean) => void) => {
            callback(this.gameInfoService.isTester(socket));
        });
        socket.on(SocketEvents.GetIsRandomGame, (callback: (arg0: boolean) => void) => {
            callback(this.gameInfoService.isRandomGame(socket));
        });
        socket.on(SocketEvents.GetTimeForQuestion, (callback: (arg0: number) => void) => {
            callback(this.gameInfoService.getTimeForCurrentQuestion(socket));
        });
        socket.on(SocketEvents.GetCurrentQuestion, (callback: (arg0: ClientQuestionInfo) => void) => {
            callback(this.gameInfoService.getCurrentQuestion(socket));
        });
        socket.on(SocketEvents.GetPlayerList, (callback: (arg0: Omit<User, 'id'>[]) => void) => {
            callback(this.gameInfoService.getPlayerList(socket));
        });
        socket.on(SocketEvents.GetQuestionChoices, (callback: (arg0: QuestionForResultDisplay[]) => void) => {
            callback(this.gameInfoService.getQuestionChoices(socket));
        });
    }
    private initializeLoginEvent(socket: io.Socket): void {
        socket.on(SocketEvents.OrganizerLogin, async (quiz: Quiz) => {
            this.socketAuthentication.handleOrganizerLogin(quiz, socket);
        });
        socket.on(SocketEvents.RandomGameLogin, async (quiz: Quiz) => {
            this.socketAuthentication.handleRandomGameLogin(quiz, socket);
        });
        socket.on(SocketEvents.TesterLogin, async (quiz: Quiz) => {
            this.socketAuthentication.handleTesterLogin(quiz, socket);
        });
        socket.on(SocketEvents.PlayerLogin, ([gameId, playerName]: [number, string]) => {
            this.socketAuthentication.handlePlayerLogin(gameId, playerName, socket);
        });
    }
    private initializeOrganizerEvent(socket: io.Socket): void {
        socket.on(SocketEvents.BanPlayerName, (banName: string) => {
            this.socketAuthentication.handleBanPlayer(banName, socket);
        });
        socket.on(SocketEvents.LockGameAccess, (callback: (arg0: boolean) => void) => {
            callback(this.gameManagementService.lockGameAccess(socket));
        });
        socket.on(SocketEvents.StartGame, () => {
            this.gameManagementService.startGame(socket);
        });
        socket.on(SocketEvents.GoToResult, () => {
            this.gameManagementService.goToResult(socket);
        });
        socket.on(SocketEvents.GoToNextQuestion, () => {
            this.gameManagementService.goToNextQuestion(socket);
        });
        socket.on(SocketEvents.PauseTimer, () => {
            this.gameManagementService.togglePauseOfTimer(socket);
        });
        socket.on(SocketEvents.EnterPanicMode, () => {
            this.gameManagementService.enterPanicMode(socket);
        });
        socket.on(SocketEvents.ToggleChat, (playerName: string) => {
            this.socketAuthentication.handleTogglePlayerChat(playerName, socket);
        });
    }
    private initializePlayerEvent(socket: io.Socket): void {
        socket.on(SocketEvents.ValidateCode, (code: number, callback: (arg0: { isValid: boolean; isLocked: boolean }) => void) => {
            callback(this.socketAuthentication.validateCode(code));
        });
        socket.on(SocketEvents.FinalizeAnswers, (callback: (arg0: boolean) => void) => {
            callback(this.gameInteractionService.canFinalizeAnswers(socket));
        });
        socket.on(SocketEvents.ToggleChoice, (index: number, callback: (arg0: boolean) => void) => {
            callback(this.gameInteractionService.toggleChoice(socket, index));
        });
        socket.on(SocketEvents.LongAnswerUpdated, (newAnswer: string) => {
            this.gameInteractionService.changeLongAnswer(socket, newAnswer);
        });
    }
    private initializeGeneralEvent(socket: io.Socket): void {
        socket.on(SocketEvents.SendChatMessage, (message: string) => {
            this.gameInteractionService.sendChatMessage(socket, message);
        });
        socket.on(SocketEvents.IsUserMuted, (callback: (arg0: boolean) => void) => {
            callback(this.gameManagementService.isUserMuted(socket));
        });
        socket.on(SocketEvents.EvaluationLongResponse, (evaluatedResponses: EvaluatedLongResponse[]) => {
            this.gameInteractionService.giveLongResponsePoints(socket, evaluatedResponses);
        });
        socket.on(SocketEvents.GetDuration, (callback: (arg0: number) => void) => {
            callback(this.gameInfoService.getDuration(socket));
        });
        socket.on(SocketEvents.Disconnecting, () => {
            this.socketAuthentication.handleDisconnect(socket);
        });
    }
}
