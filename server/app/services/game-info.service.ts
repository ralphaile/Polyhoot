import { TIME_OF_LONG_ANSWER_QUESTION } from '@common/const';
import { GameInfo, GameState } from '@common/game';
import { Choice, ClientQuestionInfo, Question, QuestionForResultDisplay, QuestionType } from '@common/question';
import { LoginErrorMessage, SocketEvents } from '@common/socketEvents';
import { User, UserState } from '@common/user';
import * as io from 'socket.io';
import { Service } from 'typedi';
import { GameInteractionService } from './game-interaction.service';
import { GameManagementService } from './game-management.service';
import { HistoryService } from './history.service';
// eslint-disable-next-line import/no-deprecated

@Service()
export class GameInformationService {
    private games: Map<number, GameInfo>;
    private gameInteractionService: GameInteractionService;
    private gameManagementService: GameManagementService;
    private sio: io.Server;

    constructor(sio: io.Server, historyService: HistoryService) {
        this.gameInteractionService = new GameInteractionService(this);
        this.gameManagementService = new GameManagementService(this, historyService);
        this.games = new Map<number, GameInfo>();
        this.sio = sio;
    }

    get socketServer() {
        return this.sio;
    }

    findUserBySocketId(socket: io.Socket): User {
        const game: GameInfo = this.getGameInfo(socket);
        if (!game) return null;

        if (game.organizer.id === socket.id) return game.organizer;
        return game.players.find((players) => players.id === socket.id);
    }

    getGameWithId(gameId: number): GameInfo {
        return this.games.get(gameId);
    }

    getGameInfo(socket: io.Socket): GameInfo {
        return this.getGameWithId(Number(this.getRoomId(socket)));
    }

    getPlayersName(socket: io.Socket): string[] {
        const game = this.getGameInfo(socket);
        if (!game) return [];

        const playersList: string[] = [];
        game.players.forEach((player) => {
            playersList.push(player.name);
        });

        return playersList;
    }

    isOrganizer(socket: io.Socket): boolean {
        const game: GameInfo = this.getGameInfo(socket);
        if (game) return game.organizer.id === socket.id;
        else return false;
    }

    isTester(socket: io.Socket): boolean {
        const game: GameInfo = this.getGameInfo(socket);
        if (game) return game.isTester;
        else return false;
    }

    isRandomGame(socket: io.Socket): boolean {
        const game: GameInfo = this.getGameInfo(socket);
        if (game) return game.isRandomGame;
        else return false;
    }

    getTimeForCurrentQuestion(socket: io.Socket): number {
        const game: GameInfo = this.getGameInfo(socket);
        if (game) return game.quiz.duration;
        else return null;
    }

    getRoomId(socket: io.Socket): string {
        return [...socket.rooms][1];
    }

    getCurrentQuestion(socket: io.Socket): ClientQuestionInfo {
        const game: GameInfo = this.getGameInfo(socket);
        if (!game) return null;
        if (game.gameState !== GameState.AnsweringQuestion) {
            this.gameInteractionService.initializeQuestion(game, socket);
        }
        return this.getCurrentQuestionForClient(game);
    }

    addNewPlayer(socket: io.Socket, game: GameInfo, playerName: string): void {
        const roomId = String(game.gameId);
        game.players.push(this.createPlayer(playerName, game, socket.id));
        socket.join(roomId);
        socket.emit(SocketEvents.LoginSuccessful);
        const names = game.players.map((user) => user.name);
        socket.to(roomId).emit(SocketEvents.PlayerListActualized, names);
    }

    gameIdAlreadyUsed(newId: number): boolean {
        return this.games.has(newId);
    }

    addGame(newGame: GameInfo): void {
        this.games.set(newGame.gameId, newGame);
    }

    validatePlayerLogin(game: GameInfo, socket: io.Socket, playerName: string): boolean {
        if (!game) {
            socket.emit(SocketEvents.LoginError, LoginErrorMessage.GameDoesNotExit);
            return false;
        }
        if (game.isLocked) {
            socket.emit(SocketEvents.LoginError, LoginErrorMessage.LockedGame);
            return false;
        }
        if (this.isNameInGame(game, playerName)) {
            socket.emit(SocketEvents.LoginError, LoginErrorMessage.AllReadyExistingName);
            return false;
        }
        if (this.isNameBanned(game, playerName)) {
            socket.emit(SocketEvents.LoginError, LoginErrorMessage.PlayerBanned);
            return false;
        }
        return true;
    }

    changeSelection(player: User, currentQuestion: Question, index: number): void {
        if (!player.currentChoices[index]) currentQuestion.choices[index].nbOfSelection++;
        else currentQuestion.choices[index].nbOfSelection--;
        player.currentChoices[index] = !player.currentChoices[index];
    }

    getPlayerList(socket: io.Socket): Omit<User, 'id'>[] {
        const game: GameInfo = this.getGameInfo(socket);
        if (this.isOrganizer(socket) || game.gameState === GameState.ResultView) {
            return game.players.map((player: User) => {
                // We need to remove the id but not the user
                // eslint-disable-next-line no-unused-vars
                const { id, ...playerWithoutId } = player;
                return playerWithoutId;
            });
        }
        return [];
    }

    removeGame(gameId: number): void {
        this.games.delete(gameId);
    }

    getQuestionChoices(socket: io.Socket): QuestionForResultDisplay[] {
        const game: GameInfo = this.getGameInfo(socket);
        if (this.isOrganizer(socket)) return this.gameManagementService.sendInitialChoiceDisplayQuestion(game);
        else if (game.gameState === GameState.ResultView) return this.gameManagementService.prepareFinalResults(game);
        else return [];
    }

    getNumberOfOnlinePlayers(game: GameInfo): number {
        let numberOfOnlinePlayer = 0;
        game.players.forEach((player: User) => {
            if (player.state !== UserState.Disconnected) numberOfOnlinePlayer++;
        });
        return numberOfOnlinePlayer;
    }

    isOrganizerButNotTester(socket: io.Socket): boolean {
        return this.isOrganizer(socket) && !this.isTester(socket);
    }

    getDuration(socket: io.Socket): number {
        const game: GameInfo = this.getGameInfo(socket);
        if (!game) return 0;

        if (this.getCurrentQuestion(socket).type === QuestionType.MultipleChoices) return game.quiz.duration;
        else return TIME_OF_LONG_ANSWER_QUESTION;
    }

    getQuestionType(game: GameInfo): QuestionType {
        return game.quiz.questions[game.currentQuestionIndex].type;
    }

    getPlayerNewScore(game: GameInfo): Omit<User, 'id'>[] {
        return game.players.map((player: User) => {
            // The id has not to be used
            // eslint-disable-next-line no-unused-vars
            const { id, timeOutForRecentModification, ...playerWithoutId } = player;
            return playerWithoutId;
        });
    }

    allPlayerHasAnswered(game: GameInfo): boolean {
        return game.nbOfFinishedPlayers >= this.getNumberOfOnlinePlayers(game);
    }

    createPlayer(name: string, game: GameInfo, id: string): User {
        return {
            id,
            name,
            points: 0,
            nbOfFirstAnswers: 0,
            hasFinalizeIsAnswers: false,
            currentChoices: Array(game.quiz.questions[0].choices.length).fill(false),
            isFirstToAnswers: false,
            isMuted: false,
            state: UserState.Connected,
            timeOutForRecentModification: null,
        };
    }

    private getCurrentQuestionForClient(game: GameInfo): ClientQuestionInfo {
        const currentQuestion: Question = game.quiz.questions[game.currentQuestionIndex];
        return {
            text: currentQuestion.text,
            points: currentQuestion.points,
            type: currentQuestion.type,
            choicesText: currentQuestion.choices.map((choice: Choice) => choice.text),
        };
    }

    private isNameBanned(game: GameInfo, name: string): boolean {
        return game.banList.some((banName) => banName.toLowerCase() === name.toLowerCase());
    }

    private isNameInGame(game: GameInfo, name: string): boolean {
        return game.players.some((player) => player.name.toLowerCase() === name.toLowerCase());
    }
}
