import { FIRST_ANSWER_MODIFIER, TIME_FOR_FIRST_TO_ANSWER } from '@common/const';
import { GameInfo, GameState } from '@common/game';
import { AnswerPlayerInfo, Choice, Question, QuestionForResultDisplay } from '@common/question';
import { SocketEvents } from '@common/socketEvents';
import { User, UserState } from '@common/user';
import * as io from 'socket.io';
import { Service } from 'typedi';
import { GameInformationService } from './game-info.service';
import { GraphInfoService } from './graph-info.service';

@Service()
export class MultipleChoicesHandlerService {
    constructor(
        private readonly gameInfoService: GameInformationService,
        private readonly graphInfoService: GraphInfoService,
    ) {}

    toggleChoice(socket: io.Socket, index: number): boolean {
        if (this.gameInfoService.isOrganizerButNotTester(socket)) return false;
        const game: GameInfo = this.gameInfoService.getGameInfo(socket);
        const player: User = game.players.find((user: User) => user.id === socket.id);
        if (game.gameState !== GameState.AnsweringQuestion) return false;
        player.state = UserState.Answering;
        this.gameInfoService.socketServer.to(game.organizer.id).emit(SocketEvents.PlayerStateChanged, { newState: player.state, name: player.name });
        index--;
        this.updateInformationForChoiceChange(game, player, index);
        return player.currentChoices[index];
    }

    resetNumberOfSelection(currentQuestion: Question): void {
        currentQuestion.choices.forEach((choice: Choice) => {
            choice.nbOfSelection = 0;
        });
    }

    sendAnswersToUsers(game: GameInfo): void {
        this.sendAnswersToPlayers(game);
        this.gameInfoService.socketServer.to(game.organizer.id).emit(SocketEvents.RefreshPlayerList, this.gameInfoService.getPlayerNewScore(game));
        if (game.isRandomGame) this.randomGameShowNextButton(game);
        if (game.currentQuestionIndex === game.quiz.questions.length - 1)
            this.gameInfoService.socketServer.to(game.organizer.id).emit(SocketEvents.ShowResultQuestionButton);
        else this.gameInfoService.socketServer.to(game.organizer.id).emit(SocketEvents.ShowNextQuestionButton);
    }

    validateQuestion(game: GameInfo, player: User): void {
        this.validateGoodAnswer(game, player);
        this.checkIfAllPlayerAnswered(game);
    }

    finalizeQuestion(game: GameInfo): void {
        game.timer.stopTimer();
        game.gameState = GameState.QuestionFinalized;
        this.sendAnswersToUsers(game);
    }

    private randomGameShowNextButton(game: GameInfo): void {
        if (game.currentQuestionIndex === game.quiz.questions.length - 1)
            this.gameInfoService.socketServer.to(game.players[0].id).emit(SocketEvents.ShowResultQuestionButton);
        else this.gameInfoService.socketServer.to(game.players[0].id).emit(SocketEvents.ShowNextQuestionButton);
    }

    private validateGoodAnswer(game: GameInfo, player: User): void {
        if (this.hasBadAnswer(game, player)) return;
        game.nbOfGoodAnswers++;
        this.giveNormalPoints(player, game);
        this.checkForFirstToAnswer(game, player);
    }

    private hasBadAnswer(game: GameInfo, player: User): boolean {
        const currentQuestion: Question = game.quiz.questions[game.currentQuestionIndex];
        return !currentQuestion.choices.every((choice, index: number) => choice.isCorrect === player.currentChoices[index]);
    }

    private giveNormalPoints(player: User, game: GameInfo): void {
        const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
        player.points += currentQuestion.points;
    }

    private checkIfAllPlayerAnswered(game: GameInfo): void {
        if (this.gameInfoService.allPlayerHasAnswered(game)) {
            if (game.firstToAnswer !== null) this.giveBonusPoints(game.firstToAnswer, game);
            this.finalizeQuestion(game);
        }
    }

    private checkForFirstToAnswer(game: GameInfo, player: User): void {
        if (game.nbOfGoodAnswers === 1) {
            game.firstToAnswer = player;
            this.checkIfHisStillFirst(game, player);
        } else game.firstToAnswer = null;
    }

    private checkIfHisStillFirst(game: GameInfo, player: User): void {
        setTimeout(() => {
            if (game.firstToAnswer) this.giveBonusPoints(player, game);
        }, TIME_FOR_FIRST_TO_ANSWER);
    }

    private giveBonusPoints(player: User, game: GameInfo): void {
        const currentQuestion = game.quiz.questions[game.currentQuestionIndex];
        player.points += currentQuestion.points * FIRST_ANSWER_MODIFIER;
        player.nbOfFirstAnswers++;
        player.isFirstToAnswers = true;
        game.firstToAnswer = null;
    }

    private sendAnswersToPlayers(game: GameInfo): void {
        game.players.forEach((player: User) => {
            if (player.state === UserState.Disconnected) return;
            this.gameInfoService.socketServer.to(player.id).emit(SocketEvents.ShowAnswersForQuestion, this.createAnswerPlayerInfo(game, player));
        });
    }

    private createAnswerPlayerInfo(game: GameInfo, player: User): AnswerPlayerInfo {
        return {
            correctAnswers: game.quiz.questions[game.currentQuestionIndex].choices.map((choices: Choice) => choices.isCorrect),
            playerAnswers: player.currentChoices,
            points: player.points,
            isFirst: player.isFirstToAnswers,
        };
    }

    private updateInformationForChoiceChange(game: GameInfo, player: User, index: number): void {
        const currentQuestion: Question = game.quiz.questions[game.currentQuestionIndex];
        this.gameInfoService.changeSelection(player, currentQuestion, index);
        this.sendUpdatedResultToOrganizerOnChoiceChange(currentQuestion, game);
    }

    private sendUpdatedResultToOrganizerOnChoiceChange(currentQuestion: Question, game: GameInfo) {
        const organizerQuestion: QuestionForResultDisplay = {
            text: currentQuestion.text,
            points: currentQuestion.points,
            questionType: currentQuestion.type,
            bandInfo: this.graphInfoService.getMultipleChoiceGraphInfo(currentQuestion.choices),
        };
        this.gameInfoService.socketServer.to(game.organizer.id).emit(SocketEvents.UpdateResults, organizerQuestion);
    }
}
