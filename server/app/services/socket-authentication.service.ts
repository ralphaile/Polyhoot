import { MAXIMUM_CODE_THOUSANDTH, MINIMUM_CODE_THOUSANDTH, NOT_FOUND } from '@common/const';
import { GameInfo, GameState } from '@common/game';
import { Quiz } from '@common/quiz';
import { SocketEvents } from '@common/socketEvents';
import { User, UserState } from '@common/user';
import * as io from 'socket.io';
import { Service } from 'typedi';
import { GameInformationService } from './game-info.service';
import { GameInteractionService } from './game-interaction.service';
import { TimeService } from './server-timer.service';

@Service()
export class SocketAuthenticationService {
    // private getGameInfo: (socket: io.Socket) => GameInfo;

    constructor(
        private readonly gameInfoService: GameInformationService,
        private readonly gameInteractionService: GameInteractionService,
    ) {
        // this.getGameInfo = (socket): GameInfo => {
        //     return this.gameInfoService.getGameInfo(socket);
        // };
    }

    validateCode(code: number): { isValid: boolean; isLocked: boolean } {
        const game = this.gameInfoService.getGameWithId(code);
        if (!game) return { isValid: false, isLocked: false };
        if (game.isLocked) return { isValid: false, isLocked: true };
        return { isValid: true, isLocked: false };
    }

    handleOrganizerLogin(quiz: Quiz, socket: io.Socket): void {
        const newGame = this.createGame(socket, quiz, false, false);
        const roomIdString = newGame.gameId.toString();
        socket.join(roomIdString);
        const userName = this.gameInfoService.findUserBySocketId(socket);
        socket.emit(SocketEvents.Username, { name: userName.name });
    }

    handleRandomGameLogin(quiz: Quiz, socket: io.Socket): void {
        const newGame = this.createGame(socket, quiz, false, true);
        const roomIdString = newGame.gameId.toString();
        socket.join(roomIdString);
        const userName = this.gameInfoService.findUserBySocketId(socket);
        socket.emit(SocketEvents.Username, { name: userName.name });
    }

    handleTesterLogin(quiz: Quiz, socket: io.Socket): void {
        const newGame = this.createGame(socket, quiz, true, false);
        newGame.gameState = GameState.SwitchingQuestion;
        newGame.players.push({
            id: socket.id,
            name: 'Testeur',
            points: 0,
            nbOfFirstAnswers: 0,
            hasFinalizeIsAnswers: false,
            currentChoices: Array(newGame.quiz.questions[0].choices.length).fill(false),
            state: UserState.Connected,
            isMuted: false,
        });
        socket.join(newGame.gameId.toString());
    }

    handlePlayerLogin(gameId: number, playerName: string, socket: io.Socket) {
        const game: GameInfo = this.gameInfoService.getGameWithId(gameId);
        if (this.gameInfoService.validatePlayerLogin(game, socket, playerName)) {
            this.gameInfoService.addNewPlayer(socket, game, playerName);
            socket.emit(SocketEvents.Username, { name: playerName });
        }
    }

    handleBanPlayer(banName: string, socket: io.Socket) {
        if (!this.gameInfoService.isOrganizer(socket)) return;
        const game: GameInfo = this.gameInfoService.getGameWithId(Number(this.gameInfoService.getRoomId(socket)));
        if (game.gameState !== GameState.WaitRoom) return;
        this.banPlayer(game, banName);
    }
    handleTogglePlayerChat(playerName: string, socket: io.Socket) {
        if (!this.gameInfoService.isOrganizer(socket)) return;
        const game: GameInfo = this.gameInfoService.getGameWithId(Number(this.gameInfoService.getRoomId(socket)));
        this.toggleMute(game, playerName);
    }
    handleDisconnect(socket: io.Socket) {
        const game: GameInfo = this.gameInfoService.getGameInfo(socket);
        if (!game) return;
        const roomId = game.gameId.toString();
        if (this.gameInfoService.isOrganizer(socket)) this.organizerDisconnect(socket, roomId, game);
        else this.playerDisconnect(socket, roomId, game);
    }

    private playerDisconnect(socket: io.Socket, roomId: string, game: GameInfo) {
        const leavingPlayer: User = game.players.find((user: User) => user.id === socket.id);
        socket.to(roomId).emit(SocketEvents.UserDisconnected, leavingPlayer.name);
        if (game.gameState === GameState.WaitRoom) {
            this.disconnectWhileInWaitingRoom(socket, roomId, game);
            return;
        }
        leavingPlayer.state = UserState.Disconnected;
        this.gameInfoService.socketServer
            .to(game.organizer.id)
            .emit(SocketEvents.PlayerStateChanged, { newState: leavingPlayer.state, name: leavingPlayer.name });
        if (this.gameInfoService.getNumberOfOnlinePlayers(game) === 0) this.allPlayersDisconnected(socket, game);

        this.checkAllPlayersFinalized(game, leavingPlayer);
    }

    private checkAllPlayersFinalized(game: GameInfo, leavingPlayer: User): void {
        if (leavingPlayer.hasFinalizeIsAnswers) game.nbOfFinishedPlayers--;
        else if (this.gameInfoService.getNumberOfOnlinePlayers(game) === game.nbOfFinishedPlayers) {
            this.gameInteractionService.finalizeQuestion(game);
        }
    }

    private allPlayersDisconnected(socket: io.Socket, game: GameInfo): void {
        socket.to(game.organizer.id).emit(SocketEvents.AllPlayerDisconnected);
        const socketToDisconnect = this.gameInfoService.socketServer.sockets.sockets.get(game.organizer.id);
        if (socketToDisconnect) socketToDisconnect.disconnect();
        game.timer.stopTimer();
        this.gameInfoService.removeGame(game.gameId);
    }

    private disconnectWhileInWaitingRoom(socket: io.Socket, roomId: string, game: GameInfo): void {
        const leavingPlayer: User = this.gameInfoService.findUserBySocketId(socket);
        const playerIndex: number = game.players.findIndex((player: User) => player.id === leavingPlayer.id);
        if (playerIndex !== NOT_FOUND) game.players.splice(playerIndex, 1);

        const names = game.players.map((user) => user.name);
        socket.to(roomId).emit('playerListActualized', names);
    }

    private organizerDisconnect(socket: io.Socket, roomId: string, game: GameInfo): void {
        socket.to(roomId).emit(SocketEvents.OrganizerDisconnected);
        this.gameInfoService.socketServer.socketsLeave(String(game.gameId));
        game.timer.stopTimer();
        this.gameInfoService.removeGame(game.gameId);
    }

    private banPlayer(game: GameInfo, banName: string): void {
        game.banList.push(banName);
        const playerToRemove: User = game.players.find((player: User) => player.name === banName);
        if (playerToRemove) {
            this.gameInfoService.socketServer.to(playerToRemove.id).emit(SocketEvents.HasBeenBan);
            const socketToDisconnect = this.gameInfoService.socketServer.sockets.sockets.get(playerToRemove.id);
            if (socketToDisconnect) socketToDisconnect.disconnect();
        }
    }
    private toggleMute(game: GameInfo, playerName: string) {
        const mutedPlayer = game.players.find((player: User) => player.name === playerName);
        if (mutedPlayer) {
            mutedPlayer.isMuted = !mutedPlayer.isMuted;
            this.emitMuteEventToOrganizer(game, mutedPlayer);
            this.emitMuteEventToPlayer(mutedPlayer);
        }
    }

    private emitMuteEventToOrganizer(game: GameInfo, player: User) {
        this.gameInfoService.socketServer.to(game.organizer.id).emit(SocketEvents.PlayerChatToggled, { isMuted: player.isMuted, name: player.name });
    }

    private emitMuteEventToPlayer(player: User) {
        const event = player.isMuted ? SocketEvents.MutedByOrganizer : SocketEvents.UnmutedByOrganizer;
        this.gameInfoService.socketServer.to(player.id).emit(event);
    }

    private generateRoomId(): number {
        let newId: number;
        do {
            newId = Math.floor(Math.random() * MAXIMUM_CODE_THOUSANDTH) + MINIMUM_CODE_THOUSANDTH;
        } while (this.gameInfoService.gameIdAlreadyUsed(newId));
        return newId;
    }
    // Obligatory for random game
    // eslint-disable-next-line max-params
    private createGame(socket: io.Socket, quiz: Quiz, isTester: boolean, isRandomGame: boolean): GameInfo {
        const gameId = this.generateRoomId();

        const newGame: GameInfo = {
            isTester,
            gameId,
            organizer: {
                id: socket.id,
                name: 'Organisateur',
                state: UserState.Connected,
                isMuted: false,
            },
            isRandomGame,
            players: [],
            banList: [],
            isLocked: false,
            quiz,
            currentQuestionIndex: 0,
            firstToAnswer: null,
            nbOfGoodAnswers: 0,
            nbOfFinishedPlayers: 0,
            timer: new TimeService(this.gameInfoService.socketServer),
            gameState: isTester ? GameState.AnsweringQuestion : GameState.WaitRoom,
            nbOfRecentModification: 0,
        };
        this.gameInfoService.addGame(newGame);
        newGame.timer.gameInfo = this.gameInfoService.getGameWithId(gameId);
        return newGame;
    }
}
