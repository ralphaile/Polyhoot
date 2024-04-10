import { TIME_BETWEEN_QUESTION, TIME_ON_GAME_START } from '@common/const';
import { GameInfo, GameState } from '@common/game';
import { Question, QuestionForResultDisplay, QuestionType } from '@common/question';
import { SocketEvents } from '@common/socketEvents';
import { User, UserState } from '@common/user';
import * as io from 'socket.io';
import { Service } from 'typedi';
import { GameInformationService } from './game-info.service';
import { GraphInfoService } from './graph-info.service';
import { HistoryService } from './history.service';

@Service()
export class GameManagementService {
    graphInfoService: GraphInfoService;
    constructor(
        private readonly gameInfoService: GameInformationService,
        private readonly historyService: HistoryService,
    ) {
        this.graphInfoService = new GraphInfoService(this.gameInfoService);
    }

    lockGameAccess(socket: io.Socket): boolean {
        const game: GameInfo = this.gameInfoService.getGameInfo(socket);
        game.isLocked = !game.isLocked;
        return game.isLocked;
    }

    startGame(socket: io.Socket): void {
        if (!this.gameInfoService.isOrganizer(socket) && !this.gameInfoService.isRandomGame(socket)) return;
        if (this.gameInfoService.isRandomGame(socket)) this.switchOrganizerToPlayer(socket);
        const game: GameInfo = this.gameInfoService.getGameInfo(socket);
        if (this.gameCantStart(game)) return;

        this.gameInfoService.socketServer.to(String(game.gameId)).emit(SocketEvents.MoveToGame);
        game.timer.resetTimer(TIME_ON_GAME_START, () => {
            game.gameState = GameState.SwitchingQuestion;
        });
    }

    goToNextQuestion(socket: io.Socket): void {
        const game: GameInfo = this.gameInfoService.getGameInfo(socket);
        if (this.gameInfoService.isOrganizer(socket) && game.gameState === GameState.QuestionFinalized) {
            this.startCountdownForQuestion(game);
        }
        if (this.gameInfoService.isRandomGame(socket) && game.gameState === GameState.QuestionFinalized) {
            this.startCountdownForQuestion(game);
        }
    }

    goToResult(socket: io.Socket): void {
        if (this.gameInfoService.isOrganizer(socket) || this.gameInfoService.isRandomGame(socket)) {
            this.historyService.addGameToHistory(this.gameInfoService.getGameInfo(socket));
            this.moveToResult(socket);
        }
    }

    togglePauseOfTimer(socket: io.Socket): void {
        if (!this.gameInfoService.isOrganizer(socket)) return;
        const game: GameInfo = this.gameInfoService.getGameInfo(socket);
        if (game && game.gameState === GameState.AnsweringQuestion) return game.timer.togglePause();
    }

    enterPanicMode(socket: io.Socket): void {
        if (!this.gameInfoService.isOrganizer(socket)) return;
        const game: GameInfo = this.gameInfoService.getGameInfo(socket);
        if (game.timer.canGoInPanicMode(this.gameInfoService.getCurrentQuestion(socket).type)) {
            game.timer.enterPanicMode();
            this.gameInfoService.socketServer.to(String(game.gameId)).emit(SocketEvents.EnterInPanicMode);
        }
    }

    prepareFinalResults(game: GameInfo): QuestionForResultDisplay[] {
        const finalResults: QuestionForResultDisplay[] = [];
        game.quiz.questions.forEach((question: Question) => {
            const finalQuestionResult: QuestionForResultDisplay = {
                text: question.text,
                points: question.points,
                questionType: question.type,
                bandInfo: this.graphInfoService.getMultipleChoiceGraphInfo(question.choices),
            };
            finalResults.push(finalQuestionResult);
        });
        return finalResults;
    }

    sendInitialChoiceDisplayQuestion(game: GameInfo): QuestionForResultDisplay[] {
        if (this.gameInfoService.getQuestionType(game) === QuestionType.MultipleChoices) {
            return this.getInitialMultipleChoicesDisplay(game);
        } else {
            return this.getInitialLongAnswerDisplay(game);
        }
    }

    isUserMuted(socket: io.Socket): boolean {
        const game: GameInfo = this.gameInfoService.getGameInfo(socket);
        if (socket.id === game.organizer.id) return false;
        const player: User = game.players.find((user: User) => user.id === socket.id);
        if (player.isMuted) {
            this.gameInfoService.socketServer.to(player.id).emit(SocketEvents.MutedByOrganizer);
        }
        return player.isMuted;
    }

    private getInitialMultipleChoicesDisplay(game: GameInfo): QuestionForResultDisplay[] {
        const question = game.quiz.questions[game.currentQuestionIndex];
        const initialQuestion: QuestionForResultDisplay = {
            text: question.text,
            points: question.points,
            questionType: question.type,
            bandInfo: this.graphInfoService.getMultipleChoiceGraphInfo(question.choices),
        };
        return [initialQuestion];
    }

    private getInitialLongAnswerDisplay(game: GameInfo): QuestionForResultDisplay[] {
        const currentQuestion: Question = game.quiz.questions[game.currentQuestionIndex];
        return [
            {
                text: currentQuestion.text,
                points: currentQuestion.points,
                questionType: currentQuestion.type,
                bandInfo: this.graphInfoService.getInitialLongAnswerDisplay(game),
            },
        ];
    }

    private gameCantStart(game: GameInfo): boolean {
        if (game.isRandomGame) return !game.isLocked || game.players.length === 0 || game.gameState !== GameState.WaitRoom;
        else return !game.isLocked || game.players.length === 0 || game.gameState !== GameState.WaitRoom;
    }

    private switchOrganizerToPlayer(socket: io.Socket): void {
        const game: GameInfo = this.gameInfoService.getGameInfo(socket);
        const newPlayer: User = this.gameInfoService.createPlayer('Organisateur', game, socket.id);
        game.players.push(newPlayer);
        game.organizer.id = '';
    }

    private startCountdownForQuestion(game: GameInfo): void {
        this.gameInfoService.socketServer.to(String(game.gameId)).emit(SocketEvents.StartCountdownForQuestion);
        game.timer.resetTimer(TIME_BETWEEN_QUESTION, () => {
            this.prepareForNextQuestion(game);
        });
    }

    private prepareForNextQuestion(game: GameInfo): void {
        game.currentQuestionIndex++;
        if (game.currentQuestionIndex === game.quiz.questions.length) return;
        this.resetQuestion(game);
        this.gameInfoService.socketServer.to(String(game.gameId)).emit(SocketEvents.LoadNextQuestion);
    }

    private resetQuestion(game: GameInfo): void {
        this.resetPlayersChoices(game);
        game.nbOfFinishedPlayers = 0;
        game.nbOfRecentModification = 0;
        game.nbOfGoodAnswers = 0;
        game.firstToAnswer = null;
        game.gameState = GameState.SwitchingQuestion;
    }

    private resetPlayersChoices(game: GameInfo): void {
        game.players.forEach((player: User) => {
            player.currentChoices = Array(game.quiz.questions[game.currentQuestionIndex].choices.length).fill(false);
            player.hasFinalizeIsAnswers = false;
            player.isFirstToAnswers = false;
            player.timeOutForRecentModification = null;
            this.resetPlayerState(player);
            this.gameInfoService.socketServer
                .to(game.organizer.id)
                .emit(SocketEvents.PlayerStateChanged, { newState: player.state, name: player.name });
        });
    }
    private resetPlayerState(player: User) {
        if (player.state !== UserState.Disconnected) {
            player.state = UserState.Connected;
        }
    }
    private moveToResult(socket: io.Socket): void {
        const game: GameInfo = this.gameInfoService.getGameInfo(socket);
        if (game.currentQuestionIndex === game.quiz.questions.length - 1) {
            game.gameState = GameState.ResultView;
            this.gameInfoService.socketServer.to(String(game.gameId)).emit(SocketEvents.SendToAllFinalResults, this.prepareFinalResults(game));
        }
    }
}
