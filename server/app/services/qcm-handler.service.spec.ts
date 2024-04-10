// Need more line to make the tests
/* eslint-disable max-lines */
// Method needed to test private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
// import { GameInfo } from '@common/game';
import { TIME_FOR_FIRST_TO_ANSWER } from '@common/const';
import { GameInfo, GameState } from '@common/game';
import { AnswerPlayerInfo, Choice, Question, QuestionType } from '@common/question';
import { Quiz } from '@common/quiz';
import { SocketEvents } from '@common/socketEvents';
import { User, UserState } from '@common/user';
import { expect } from 'chai';
import { Server } from 'http';
import { describe } from 'mocha';
import * as sinon from 'sinon';
import * as io from 'socket.io';
import { GameInformationService } from './game-info.service';
import { GraphInfoService } from './graph-info.service';
import { MultipleChoicesHandlerService } from './qcm-handler.service';
import { TimeService } from './server-timer.service';

describe('MultipleChoicesHandlerService', () => {
    let multipleChoicesHandlerService: MultipleChoicesHandlerService;
    let gameInfoServiceStub: sinon.SinonStubbedInstance<GameInformationService>;
    let graphInfoServiceStub: sinon.SinonStubbedInstance<GraphInfoService>;
    let mockSocket: io.Socket;
    let emitSpy: sinon.SinonSpy;
    let mockPlayer: User;
    let mockTimer: sinon.SinonStubbedInstance<TimeService>;
    // let joinSpy: sinon.SinonSpy;
    let toSpy: sinon.SinonSpy;
    let mockGame: GameInfo;
    // let getGameInfoStub: sinon.SinonStub;
    // let historyService: HistoryService;
    const server = new Server();

    beforeEach(() => {
        gameInfoServiceStub = sinon.createStubInstance(GameInformationService);
        gameInfoServiceStub['sio'] = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        graphInfoServiceStub = sinon.createStubInstance(GraphInfoService);
        mockTimer = sinon.createStubInstance(TimeService);
        multipleChoicesHandlerService = new MultipleChoicesHandlerService(gameInfoServiceStub, graphInfoServiceStub);
        mockGame = {
            currentQuestionIndex: 0,
            quiz: {
                questions: [
                    {
                        text: 'Question Text',
                        choices: [{ isCorrect: true, nbOfSelection: 5 } as Choice, { isCorrect: false, nbOfSelection: 4 } as Choice],
                        points: 10,
                        type: QuestionType.MultipleChoices,
                    } as Question,
                ],
            } as Quiz,
        } as GameInfo;
        mockSocket = {
            id: '111',
            emit: () => {
                return;
            },
        } as unknown as io.Socket;

        mockPlayer = { id: '111' } as User;

        emitSpy = sinon.spy(mockSocket, 'emit');

        toSpy = sinon.spy(gameInfoServiceStub['sio'], 'to');

        gameInfoServiceStub.getGameInfo.returns(mockGame);
        // emitSpy = sinon.spy(socketMock, 'emit');
        // joinSpy = sinon.spy(socketMock, 'join');
        // toSpy = sinon.spy(socketMock, 'to');
    });

    afterEach(() => {
        sinon.restore();
        server.close();
    });

    describe('toggleChoice', () => {
        beforeEach(() => {
            mockGame.players = [
                {
                    id: '111',
                    currentChoices: [false],
                    points: 15,
                } as User,
            ];
        });
        it('should return false if isOrganizerButNotTester', () => {
            gameInfoServiceStub.isOrganizerButNotTester.returns(true);
            expect(multipleChoicesHandlerService.toggleChoice(mockSocket, 1)).to.equal(false);
        });
        it('should return false when gameState is not AnsweringQuestion', () => {
            gameInfoServiceStub.isOrganizerButNotTester.returns(false);
            mockGame.gameState = GameState.SwitchingQuestion;
            expect(multipleChoicesHandlerService.toggleChoice(mockSocket, 1)).to.equal(false);
        });
        it('should return false when gameState is AnsweringQuestion', () => {
            gameInfoServiceStub.isOrganizerButNotTester.returns(false);
            mockGame.organizer = { id: '111' } as User;
            sinon.stub(multipleChoicesHandlerService as any, 'updateInformationForChoiceChange');
            mockGame.gameState = GameState.AnsweringQuestion;
            expect(multipleChoicesHandlerService.toggleChoice(mockSocket, 1)).to.equal(false);
        });
    });
    describe('resetNumberOfSelection', () => {
        it('should set the nbOfSelection to zero', () => {
            const questionMock: Question = mockGame.quiz.questions[0];
            multipleChoicesHandlerService.resetNumberOfSelection(questionMock);
            questionMock.choices.forEach((choice: Choice) => {
                expect(choice.nbOfSelection).to.equal(0);
            });
        });
    });
    describe('sendAnswersToUsers', () => {
        const playerList: Omit<User, 'id'>[] = [];
        beforeEach(() => {
            mockGame.organizer = { id: '123' } as User;
            mockGame.quiz = { questions: Array(3).fill({} as Question) } as Quiz;
            sinon.stub(multipleChoicesHandlerService as any, 'sendAnswersToPlayers');
            gameInfoServiceStub.getPlayerNewScore.returns(playerList);
        });
        it('should emit ShowNextQuestionButton when not on the last question', () => {
            mockGame.currentQuestionIndex = 1;

            multipleChoicesHandlerService.sendAnswersToUsers(mockGame);

            expect(emitSpy.calledWith(SocketEvents.RefreshPlayerList, playerList));
            expect(emitSpy.calledWith(SocketEvents.ShowNextQuestionButton, playerList));
        });
        it('should emit ShowResultQuestionButton on the last question', () => {
            mockGame.currentQuestionIndex = 2;

            multipleChoicesHandlerService.sendAnswersToUsers(mockGame);

            expect(emitSpy.calledWith(SocketEvents.RefreshPlayerList, playerList));
            expect(emitSpy.calledWith(SocketEvents.ShowResultQuestionButton, playerList));
        });
        it('should call randomGameShowNextButton when game isRandomGame is true', () => {
            mockGame.isRandomGame = true;
            const randomGameShowNextButtonStub = sinon.stub(multipleChoicesHandlerService as any, 'randomGameShowNextButton');

            multipleChoicesHandlerService.sendAnswersToUsers(mockGame);

            expect(randomGameShowNextButtonStub.called);
        });
    });
    describe('validateQuestion', () => {
        it('should call validateGoodAnswer and checkIfAllPlayerAnswered', () => {
            const validateGoodAnswerStub = sinon.stub(multipleChoicesHandlerService as any, 'validateGoodAnswer');
            const checkIfAllPlayerAnsweredStub = sinon.stub(multipleChoicesHandlerService as any, 'checkIfAllPlayerAnswered');

            multipleChoicesHandlerService.validateQuestion(mockGame, mockPlayer);

            expect(validateGoodAnswerStub.called).to.equal(true);
            expect(checkIfAllPlayerAnsweredStub.called).to.equal(true);
        });
    });

    describe('finalizeQuestion', () => {
        it('should stop the timer, switch the state to QuestionFinalized and call sendAnswersToUsers', () => {
            mockGame.timer = mockTimer as TimeService;
            const stopTimerSpy = mockGame.timer.stopTimer;
            const sendAnswersToUsersStub = sinon.stub(multipleChoicesHandlerService as any, 'sendAnswersToUsers');

            multipleChoicesHandlerService.finalizeQuestion(mockGame);

            expect(stopTimerSpy.called).to.equal(true);
            expect(mockGame.gameState).to.equal(GameState.QuestionFinalized);
            expect(sendAnswersToUsersStub.calledWith(mockGame)).to.equal(true);
        });
    });

    describe('randomGameShowNextButton', () => {
        const organizer: User = { id: '111' } as User;
        beforeEach(() => {
            mockGame.quiz.questions = [{} as Question, {} as Question];
            mockGame.players = [organizer];
        });
        it('should emit ShowResultQuestionButton when on the last question', () => {
            mockGame.currentQuestionIndex = 2;
            multipleChoicesHandlerService['randomGameShowNextButton'](mockGame);
            expect(toSpy.called).to.equal(true);
        });
        it('should emit ShowNextQuestionButton when not on the last question', () => {
            mockGame.currentQuestionIndex = 1;
            multipleChoicesHandlerService['randomGameShowNextButton'](mockGame);
            expect(toSpy.called).to.equal(true);
        });
    });

    describe('validateGoodAnswer', () => {
        const nbOfGoodAnswer = 2;
        beforeEach(() => {
            mockGame.nbOfGoodAnswers = nbOfGoodAnswer;
        });
        it('should do nothing if the player hasBadAnswer', () => {
            sinon.stub(multipleChoicesHandlerService as any, 'hasBadAnswer').returns(true);
            multipleChoicesHandlerService.validateQuestion(mockGame, mockPlayer);
            expect(mockGame.nbOfGoodAnswers).to.equal(nbOfGoodAnswer);
        });
        it('should increase nbOfGoodAnswers and call giveNormalPointsStub is the player has the good answer', () => {
            sinon.stub(multipleChoicesHandlerService as any, 'hasBadAnswer').returns(false);
            const giveNormalPointsStub = sinon.stub(multipleChoicesHandlerService as any, 'giveNormalPoints');
            const checkForFirstToAnswerStub = sinon.stub(multipleChoicesHandlerService as any, 'checkForFirstToAnswer');

            multipleChoicesHandlerService.validateQuestion(mockGame, mockPlayer);
            expect(mockGame.nbOfGoodAnswers).to.equal(nbOfGoodAnswer + 1);
            expect(giveNormalPointsStub.called).to.equal(true);
            expect(checkForFirstToAnswerStub.called).to.equal(true);
        });
    });

    describe('hasBadAnswer', () => {
        it('should return false when all answer are good', () => {
            mockPlayer.currentChoices = [true, false];
            expect(multipleChoicesHandlerService['hasBadAnswer'](mockGame, mockPlayer)).to.equal(false);
        });
        it('should return true when not all answer are good', () => {
            mockPlayer.currentChoices = [true, true];
            expect(multipleChoicesHandlerService['hasBadAnswer'](mockGame, mockPlayer)).to.equal(true);
        });
    });

    describe('giveNormalPoints', () => {
        const initialPlayerPoints = 0;
        beforeEach(() => {
            mockPlayer.points = initialPlayerPoints;
        });
        it('should give the points to the player', () => {
            multipleChoicesHandlerService['giveNormalPoints'](mockPlayer, mockGame);
            expect(mockPlayer.points).to.equal(initialPlayerPoints + mockGame.quiz.questions[0].points);
        });
    });

    describe('checkIfAllPlayerAnswered', () => {
        let finalizeQuestionStub: sinon.SinonStub;
        beforeEach(() => {
            gameInfoServiceStub.allPlayerHasAnswered.returns(true);
            finalizeQuestionStub = sinon.stub(multipleChoicesHandlerService, 'finalizeQuestion');
        });
        it('should finalizeQuestion the question if allPlayerHasAnswered', () => {
            mockGame.firstToAnswer = null;
            multipleChoicesHandlerService['checkIfAllPlayerAnswered'](mockGame);
            expect(finalizeQuestionStub.calledWith(mockGame)).to.equal(true);
        });
        it('should finalizeQuestion the question if allPlayerHasAnswered and give bonus points if there is someone who is firstToAnswer', () => {
            const giveBonusPointsStub = sinon.stub(multipleChoicesHandlerService as any, 'giveBonusPoints');
            mockGame.firstToAnswer = mockPlayer;
            multipleChoicesHandlerService['checkIfAllPlayerAnswered'](mockGame);
            expect(finalizeQuestionStub.calledWith(mockGame)).to.equal(true);
            expect(giveBonusPointsStub.calledWith(mockPlayer, mockGame)).to.equal(true);
        });
    });

    describe('checkForFirstToAnswer', () => {
        it('should set the player to firstToAnswer if the nbOfGoodAnswers is one', () => {
            mockGame.nbOfGoodAnswers = 1;
            mockGame.firstToAnswer = null;
            const checkIfHisStillFirstStub = sinon.stub(multipleChoicesHandlerService as any, 'checkIfHisStillFirst');
            multipleChoicesHandlerService['checkForFirstToAnswer'](mockGame, mockPlayer);
            expect(mockGame.firstToAnswer).to.equal(mockPlayer);
            expect(checkIfHisStillFirstStub.calledWith(mockGame, mockPlayer)).to.equal(true);
        });
        it('should set null to firstToAnswer if the nbOfGoodAnswers is not one', () => {
            mockGame.nbOfGoodAnswers = 0;
            mockGame.firstToAnswer = mockPlayer;
            multipleChoicesHandlerService['checkForFirstToAnswer'](mockGame, mockPlayer);
            expect(mockGame.firstToAnswer).to.equal(null);
        });
    });

    describe('checkIfHisStillFirst', () => {
        let giveBonusPointsStub: sinon.SinonStub;
        beforeEach(() => {
            giveBonusPointsStub = sinon.stub(multipleChoicesHandlerService as any, 'giveBonusPoints');
        });
        it('should give bonus points if the player is still the first to have answered', (done) => {
            mockGame.firstToAnswer = mockPlayer;
            multipleChoicesHandlerService['checkIfHisStillFirst'](mockGame, mockPlayer);
            setTimeout(() => {
                expect(giveBonusPointsStub.calledWith(mockPlayer, mockGame)).to.equal(true);
                done();
            }, TIME_FOR_FIRST_TO_ANSWER);
        });
        it('should not give bonus points if firstToAnswer is null', (done) => {
            mockGame.firstToAnswer = null;
            multipleChoicesHandlerService['checkIfHisStillFirst'](mockGame, mockPlayer);
            setTimeout(() => {
                expect(giveBonusPointsStub.calledWith(mockPlayer, mockGame)).to.equal(false);
                done();
            }, TIME_FOR_FIRST_TO_ANSWER);
        });
    });

    describe('giveBonusPoints', () => {
        it('should give bonus points, increase the nbOfFirstAnswers and set isFirstToAnswers to true', () => {
            mockPlayer.nbOfFirstAnswers = 0;
            mockPlayer.points = 0;
            mockGame.firstToAnswer = mockPlayer;
            multipleChoicesHandlerService['giveBonusPoints'](mockPlayer, mockGame);
            expect(mockPlayer.points).to.equal(2);
            expect(mockPlayer.nbOfFirstAnswers).to.equal(1);
            expect(mockPlayer.isFirstToAnswers).to.equal(true);
            expect(mockGame.firstToAnswer).to.equal(null);
        });
    });

    describe('sendAnswersToPlayers', () => {
        let createAnswerPlayerInfoStub: sinon.SinonStub;
        const answerPlayerInfoStub = {} as AnswerPlayerInfo;
        beforeEach(() => {
            createAnswerPlayerInfoStub = sinon.stub(multipleChoicesHandlerService as any, 'createAnswerPlayerInfo');
            createAnswerPlayerInfoStub.returns(answerPlayerInfoStub);
        });

        it('should not call the RefreshPlayerList event when the player state is Disconnected', () => {
            mockPlayer.state = UserState.Disconnected;
            mockGame.players = [mockPlayer];

            multipleChoicesHandlerService['sendAnswersToPlayers'](mockGame);

            expect(toSpy.called).to.equal(false);
        });
        it('should call the RefreshPlayerList event when the player state is Connected', () => {
            mockPlayer.state = UserState.Connected;
            mockGame.players = [mockPlayer];

            multipleChoicesHandlerService['sendAnswersToPlayers'](mockGame);

            expect(toSpy.called).to.equal(true);
        });
    });

    describe('createAnswerPlayerInfo', () => {
        const target: AnswerPlayerInfo = {
            correctAnswers: [true, false],
            playerAnswers: [true, false],
            points: 15,
            isFirst: true,
        };
        it('should format the player info correctly', () => {
            mockPlayer.currentChoices = [true, false];
            mockPlayer.isFirstToAnswers = true;
            mockPlayer.points = 15;

            expect(multipleChoicesHandlerService['createAnswerPlayerInfo'](mockGame, mockPlayer)).to.deep.equal(target);
        });
    });

    describe('updateInformationForChoiceChange', () => {
        it('should call changeSelection and sendUpdatedResultToOrganizerOnChoiceChange', () => {
            const sendUpdatedResultToOrganizerOnChoiceChangeStub = sinon.stub(
                multipleChoicesHandlerService as any,
                'sendUpdatedResultToOrganizerOnChoiceChange',
            );

            multipleChoicesHandlerService['updateInformationForChoiceChange'](mockGame, mockPlayer, 1);
            expect(gameInfoServiceStub.changeSelection.called).to.equal(true);
            expect(sendUpdatedResultToOrganizerOnChoiceChangeStub.called).to.equal(true);
        });
    });

    describe('sendUpdatedResultToOrganizerOnChoiceChange', () => {
        it('should send the result to the Organizer', () => {
            mockGame.organizer = { id: '123' } as User;
            graphInfoServiceStub.getMultipleChoiceGraphInfo.returns([]);
            multipleChoicesHandlerService['sendUpdatedResultToOrganizerOnChoiceChange'](mockGame.quiz.questions[0], mockGame);
            expect(toSpy.called).to.equal(true);
        });
    });
});
