import { TIME_FOR_RECENT_MODIFICATION } from '@common/const';
import { GameInfo, GameState } from '@common/game';
import { EvaluatedLongResponse, LongResponseAnswerInfo, LongResponseForOrganizer, PointsToTester } from '@common/longResponse';
import { Question, QuestionForResultDisplay } from '@common/question';
import { SocketEvents } from '@common/socketEvents';
import { User, UserState } from '@common/user';
import * as io from 'socket.io';
import { Service } from 'typedi';
import { GameInformationService } from './game-info.service';
import { GraphInfoService } from './graph-info.service';

@Service()
export class LongAnswerHandlerService {
    constructor(
        private readonly gameInfoService: GameInformationService,
        private readonly graphInfoService: GraphInfoService,
    ) {}

    changeLongAnswer(socket: io.Socket, newAnswer: string): void {
        if (this.gameInfoService.isOrganizerButNotTester(socket)) return;
        const game: GameInfo = this.gameInfoService.getGameInfo(socket);
        const player: User = game.players.find((user: User) => user.id === socket.id);
        if (game.gameState !== GameState.AnsweringQuestion) return;

        player.state = UserState.Answering;
        player.longResponseAnswer = newAnswer;
        this.gameInfoService.socketServer.to(game.organizer.id).emit(SocketEvents.PlayerStateChanged, { newState: player.state, name: player.name });
        this.checkForModifyRecently(player, game);
    }

    sendOrganizerRecentModifications(game: GameInfo): void {
        const currentQuestion: Question = game.quiz.questions[game.currentQuestionIndex];
        const organizerModificationInfo: QuestionForResultDisplay = {
            text: currentQuestion.text,
            points: currentQuestion.points,
            questionType: currentQuestion.type,
            bandInfo: this.graphInfoService.getInitialLongAnswerDisplay(game),
        };
        this.gameInfoService.socketServer.to(game.organizer.id).emit(SocketEvents.UpdateResults, organizerModificationInfo);
    }

    giveLongResponsePoints(socket: io.Socket, evaluatedResponses: EvaluatedLongResponse[]): void {
        const game: GameInfo = this.gameInfoService.getGameInfo(socket);
        const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
        this.graphInfoService.generateLongResponseQuestionForHistogram(currentQuestion);
        evaluatedResponses.forEach((evaluatedResponse) => {
            this.givePointsForLongAnswer(game, evaluatedResponse);
            this.graphInfoService.modifyChoicesForHistogram(currentQuestion, evaluatedResponse);
        });
        this.sendAnswersToPlayers(game, evaluatedResponses);
        this.sendAnswersToUsers(game);
    }

    endOfQuestionProcess(game: GameInfo): void {
        this.setAllPlayersTimerOff(game);
        this.gameInfoService.socketServer.emit(SocketEvents.SendLongResponse, this.prepareOrganizerLongResponse(game));
    }

    validateQuestion(game: GameInfo, player: User): void {
        if (game.isTester) {
            this.gameInfoService.socketServer.emit(SocketEvents.SendPointsToTester, this.getPointsToTester(player, game));
        }
        if (this.gameInfoService.allPlayerHasAnswered(game)) {
            this.finalizeQuestion(game);
        }
    }

    finalizeQuestion(game: GameInfo): void {
        game.timer.stopTimer();
        game.gameState = GameState.QuestionFinalized;
        this.endOfQuestionProcess(game);
    }

    private getPointsToTester(player: User, game: GameInfo): PointsToTester {
        const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
        player.points += currentQuestion.points;
        return {
            points: player.points,
            isLastQuestion: game.currentQuestionIndex === game.quiz.questions.length - 1,
        };
    }

    private prepareOrganizerLongResponse(game: GameInfo): LongResponseForOrganizer[] {
        const longResponseArray: LongResponseForOrganizer[] = [];
        game.players.forEach((player: User) => {
            if (player.state === UserState.Disconnected) return;
            const senderInfo: LongResponseForOrganizer = {
                userName: player.name,
                longResponse: player.longResponseAnswer,
            };
            longResponseArray.push(senderInfo);
        });
        return longResponseArray;
    }

    private sendAnswersToUsers(game: GameInfo): void {
        this.gameInfoService.socketServer.to(game.organizer.id).emit(SocketEvents.RefreshPlayerList, this.gameInfoService.getPlayerNewScore(game));
        if (game.currentQuestionIndex === game.quiz.questions.length - 1)
            this.gameInfoService.socketServer.to(game.organizer.id).emit(SocketEvents.ShowResultQuestionButton);
        else this.gameInfoService.socketServer.to(game.organizer.id).emit(SocketEvents.ShowNextQuestionButton);
    }

    private sendAnswersToPlayers(game: GameInfo, evaluatedResponses?: EvaluatedLongResponse[]): void {
        game.players.forEach((player: User) => {
            if (player.state === UserState.Disconnected) return;
            this.handleEvaluatedResponseToPlayers(player, evaluatedResponses);
        });
    }

    private handleEvaluatedResponseToPlayers(player: User, evaluatedResponses: EvaluatedLongResponse[]): void {
        const evaluatedResponse: EvaluatedLongResponse = evaluatedResponses.find(
            (response: EvaluatedLongResponse) => response.userName === player.name,
        );
        this.gameInfoService.socketServer
            .to(player.id)
            .emit(SocketEvents.ShowPointsForLongResponseQuestion, this.createLongResponseInfo(player, evaluatedResponse));
    }

    private createLongResponseInfo(player: User, evaluatedResponse: EvaluatedLongResponse): LongResponseAnswerInfo {
        return {
            points: player.points,
            grade: evaluatedResponse.multiplier,
        };
    }

    private givePointsForLongAnswer(game: GameInfo, evaluatedResponse: EvaluatedLongResponse): void {
        const player: User = game.players.find((user: User) => user.name === evaluatedResponse.userName);
        const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
        player.points += currentQuestion.points * evaluatedResponse.multiplier;
    }

    private checkForModifyRecently(player: User, game: GameInfo) {
        if (!player.timeOutForRecentModification) {
            game.nbOfRecentModification++;
            this.sendOrganizerRecentModifications(game);
        } else {
            clearTimeout(player.timeOutForRecentModification);
        }
        this.resetNumberOfModification(player, game);
    }

    private resetNumberOfModification(player: User, game: GameInfo) {
        player.timeOutForRecentModification = setTimeout(() => {
            game.nbOfRecentModification--;
            this.sendOrganizerRecentModifications(game);
            player.timeOutForRecentModification = null;
        }, TIME_FOR_RECENT_MODIFICATION);
    }

    private setAllPlayersTimerOff(game: GameInfo) {
        game.players.forEach((player: User) => {
            clearTimeout(player.timeOutForRecentModification);
        });
        this.sendOrganizerRecentModifications(game);
    }
}
