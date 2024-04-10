/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-explicit-any */
import { TIME_FOR_RECENT_MODIFICATION } from '@common/const';
import { GameInfo, GameState } from '@common/game';
import { QuestionType } from '@common/question';
import { SocketEvents } from '@common/socketEvents';
import { User, UserState } from '@common/user';
import { expect } from 'chai';
import { Server } from 'http';
import { describe } from 'mocha';
import * as sinon from 'sinon';
import * as io from 'socket.io';
import { GameInformationService } from './game-info.service';
import { GraphInfoService } from './graph-info.service';
import { LongAnswerHandlerService } from './qrl-handler.service';
import { TimeService } from './server-timer.service';

describe('LongAnswerHandlerService', () => {
    let longAnswerHandlerService: LongAnswerHandlerService;
    let graphInfoService: sinon.SinonStubbedInstance<GraphInfoService>;
    let gameInfoServiceStub: sinon.SinonStubbedInstance<GameInformationService>;
    let emitSpy: sinon.SinonSpy;
    let mockTimer: sinon.SinonStubbedInstance<TimeService>;
    let mockSocket: io.Socket;
    let toSpy: sinon.SinonSpy;
    let mockGameInfo: GameInfo;
    let mockPlayer: User;
    const server = new Server();

    beforeEach(() => {
        const fakeBroadcastOperator = {
            emit: sinon.spy(),
        };

        mockSocket = {
            id: 'player1',
            emit: () => {
                return;
            },
            broadcast: {
                to: sinon.stub().returns(fakeBroadcastOperator),
            },
        } as unknown as io.Socket;
        emitSpy = sinon.spy(mockSocket, 'emit');
        emitSpy = fakeBroadcastOperator.emit;
        graphInfoService = sinon.createStubInstance(GraphInfoService);
        gameInfoServiceStub = sinon.createStubInstance(GameInformationService);
        longAnswerHandlerService = new LongAnswerHandlerService(gameInfoServiceStub, graphInfoService);
        gameInfoServiceStub['sio'] = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        toSpy = sinon.spy(gameInfoServiceStub['sio'], 'to');
        mockGameInfo = {
            gameId: 123,
            organizer: {
                id: 'organizerId',
                name: 'Organizer Name',
                state: UserState.Connected,
            } as User,
            players: [
                {
                    id: 'player1',
                    name: 'Player 1',
                    state: UserState.Connected,
                    points: 10,
                    nbOfFirstAnswers: 0,
                    currentChoices: [true, false],
                    hasFinalizeIsAnswers: false,
                    isFirstToAnswers: false,
                    isMuted: false,
                },
            ],
            banList: ['bannedPlayer'],
            isLocked: false,
            quiz: {
                id: 'quizId',
                title: 'Quiz Title',
                description: 'Description of Quiz',
                duration: 30,
                isVisible: true,
                lastModification: new Date(),
                questions: [
                    {
                        text: 'Question 1',
                        type: QuestionType.MultipleChoices,
                        choices: [
                            { text: 'Choice 1', isCorrect: true },
                            { text: 'Choice 2', isCorrect: false },
                        ],
                        points: 5,
                    },
                ],
            },
            currentQuestionIndex: 0,
            firstToAnswer: null,
            nbOfFinishedPlayers: 0,
            nbOfGoodAnswers: 0,
            timer: mockTimer as unknown as TimeService,
            isTester: false,
            gameState: GameState.WaitRoom,
            nbOfRecentModification: 0,
        } as GameInfo;
        mockPlayer = mockGameInfo.players[0];
        gameInfoServiceStub.getGameInfo.returns(mockGameInfo);
        mockGameInfo.timer = {
            stopTimer: sinon.stub(),
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('changeLongAnswer', () => {
        beforeEach(() => {
            mockSocket = { id: 'player1' } as io.Socket;
        });

        it('should not update long answer if user is organizer but not tester', () => {
            gameInfoServiceStub.isOrganizerButNotTester.returns(true);
            const newAnswer = 'Updated answer';
            longAnswerHandlerService.changeLongAnswer(mockSocket, newAnswer);

            sinon.assert.notCalled(gameInfoServiceStub.getGameInfo);
        });

        it('should not update long answer if game state is not AnsweringQuestion', () => {
            gameInfoServiceStub.isOrganizerButNotTester.returns(false);
            mockGameInfo.gameState = GameState.WaitRoom;
            const newAnswer = 'Updated answer';
            longAnswerHandlerService.changeLongAnswer(mockSocket, newAnswer);

            expect(mockGameInfo.players[0].longResponseAnswer).to.not.equal(newAnswer);
        });

        it('should update long answer and check for modify recently if conditions are met', () => {
            gameInfoServiceStub.isOrganizerButNotTester.returns(false);
            mockGameInfo.gameState = GameState.AnsweringQuestion;
            const newAnswer = 'Updated answer';
            const checkForModifyRecentlySpy = sinon.spy(longAnswerHandlerService as never, 'checkForModifyRecently');

            longAnswerHandlerService.changeLongAnswer(mockSocket, newAnswer);

            expect(mockGameInfo.players[0].longResponseAnswer).to.equal(newAnswer);
            sinon.assert.calledOnceWithExactly(checkForModifyRecentlySpy, mockGameInfo.players[0], mockGameInfo);
        });
    });

    it('should give points for long answers based on multiplier', () => {
        const evaluatedResponses = [{ userName: 'Player 1', multiplier: 1 }];
        longAnswerHandlerService.giveLongResponsePoints(mockSocket, evaluatedResponses);

        const player = mockGameInfo.players.find((p) => p.name === 'Player 1');
        expect(player.points).to.equal(15);
    });

    it('should send answers to all users', () => {
        const evaluatedResponses = [{ userName: 'Player 1', multiplier: 1 }];
        longAnswerHandlerService.giveLongResponsePoints(mockSocket, evaluatedResponses);

        sinon.assert.calledWith(toSpy, mockGameInfo.organizer.id);
    });

    it('should emit points to tester if game is in tester mode', () => {
        mockGameInfo.isTester = true;
        longAnswerHandlerService['validateQuestion'](mockGameInfo, mockGameInfo.players[0]);
        expect(emitSpy.calledWith(SocketEvents.SendPointsToTester, sinon.match.object));
    });

    it('should finalize the question when all players have answered', () => {
        gameInfoServiceStub.allPlayerHasAnswered.returns(true);
        const finalizeQuestionSpy = sinon.spy(longAnswerHandlerService, 'finalizeQuestion');

        longAnswerHandlerService.validateQuestion(mockGameInfo, mockPlayer);

        sinon.assert.calledOnce(finalizeQuestionSpy);
        sinon.assert.calledWith(finalizeQuestionSpy, mockGameInfo);
    });

    it('should turn off timer for all players', () => {
        const setAllPlayersTimerOffSpy = sinon.spy(longAnswerHandlerService as any, 'setAllPlayersTimerOff');
        longAnswerHandlerService.endOfQuestionProcess(mockGameInfo);
        expect(setAllPlayersTimerOffSpy.calledWith(mockGameInfo)).to.equal(true);
    });

    it('should emit SendLongResponse with the prepared organizer long response', () => {
        const preparedResponse = [{ userName: 'Player 1', longResponse: 'Answer1' }];
        sinon.stub(longAnswerHandlerService as any, 'prepareOrganizerLongResponse').returns(preparedResponse);
        emitSpy = sinon.spy(gameInfoServiceStub.socketServer, 'emit');
        longAnswerHandlerService.endOfQuestionProcess(mockGameInfo);
        sinon.assert.calledWith(emitSpy, SocketEvents.SendLongResponse, preparedResponse);
        emitSpy.restore();
    });

    describe('finalizeQuestion', () => {
        it('should stop the game timer', () => {
            longAnswerHandlerService.finalizeQuestion(mockGameInfo);
            sinon.assert.calledOnce(mockGameInfo.timer.stopTimer);
        });

        it('should set game state to QuestionFinalized', () => {
            longAnswerHandlerService.finalizeQuestion(mockGameInfo);
            expect(mockGameInfo.gameState).to.equal(GameState.QuestionFinalized);
        });

        it('should call endOfQuestionProcess with the game object', () => {
            const endOfQuestionProcessSpy = sinon.spy(longAnswerHandlerService, 'endOfQuestionProcess');
            longAnswerHandlerService.finalizeQuestion(mockGameInfo);
            sinon.assert.calledOnceWithExactly(endOfQuestionProcessSpy, mockGameInfo);
        });
    });

    it('should decrement nbOfRecentModification after TEXT_MODIFICATION delay', async () => {
        const clock = sinon.useFakeTimers();
        mockGameInfo.nbOfRecentModification = 1;
        longAnswerHandlerService['resetNumberOfModification'](mockPlayer, mockGameInfo);
        clock.tick(TIME_FOR_RECENT_MODIFICATION);
        expect(mockGameInfo.nbOfRecentModification).to.equal(0);
        expect(mockPlayer.timeOutForRecentModification).to.equal(null);
        clock.restore();
    });

    it('should emit refreshPlayerList and showNextQuestionButton when not the last question', () => {
        mockGameInfo.currentQuestionIndex = 0;
        mockGameInfo.isRandomGame = true;
        mockGameInfo.quiz.questions.push({
            text: 'Question 2',
            type: QuestionType.MultipleChoices,
            choices: [
                { text: 'Choice 3', isCorrect: false },
                { text: 'Choice 4', isCorrect: true },
            ],
            points: 5,
        });
        longAnswerHandlerService['sendAnswersToUsers'](mockGameInfo);
        sinon.assert.calledWith(toSpy, mockGameInfo.organizer.id);
        expect(emitSpy.calledWith('refreshPlayerList'));
        expect(emitSpy.calledWith('showNextQuestionButton'));
        expect(emitSpy.neverCalledWith('showResultQuestionButton'));
    });

    it('should not include disconnected players', () => {
        mockGameInfo.players = [
            { id: '1', name: 'Player 1', state: UserState.Disconnected, longResponseAnswer: 'Answer 1' } as User,
            { id: '2', name: 'Player 2', state: UserState.Connected, longResponseAnswer: 'Answer 2' } as User,
        ];

        const result = longAnswerHandlerService['prepareOrganizerLongResponse'](mockGameInfo);
        expect(result.length).to.equal(1);
        expect(result[0].userName).to.equal('Player 2');
    });

    describe('sendAnswersToPlayers', () => {
        let handleEvaluatedResponseToPlayersSpy: sinon.SinonSpy;

        beforeEach(() => {
            handleEvaluatedResponseToPlayersSpy = sinon.spy(longAnswerHandlerService as any, 'handleEvaluatedResponseToPlayers');
        });

        it('should not call handleEvaluatedResponseToPlayers for disconnected players', () => {
            const evaluatedResponses = [
                { userName: 'Player 1', multiplier: 0.5 },
                { userName: 'Player 2', multiplier: 1 },
            ];

            mockGameInfo.players = [
                { id: '1', name: 'Player 1', state: UserState.Disconnected, longResponseAnswer: 'Answer 1' } as User,
                { id: '2', name: 'Player 2', state: UserState.Connected, longResponseAnswer: 'Answer 2' } as User,
            ];

            longAnswerHandlerService['sendAnswersToPlayers'](mockGameInfo, evaluatedResponses);

            sinon.assert.calledOnce(handleEvaluatedResponseToPlayersSpy);
            sinon.assert.calledWithMatch(handleEvaluatedResponseToPlayersSpy, sinon.match.has('name', 'Player 2'));
        });

        it('should call handleEvaluatedResponseToPlayers for connected players with correct evaluatedResponses', () => {
            const evaluatedResponses = [{ userName: 'Player 2', multiplier: 1 }];

            mockGameInfo.players = [{ id: '2', name: 'Player 2', state: UserState.Connected, longResponseAnswer: 'Answer 2' } as User];

            longAnswerHandlerService['sendAnswersToPlayers'](mockGameInfo, evaluatedResponses);

            sinon.assert.calledOnce(handleEvaluatedResponseToPlayersSpy);
            sinon.assert.calledWithMatch(handleEvaluatedResponseToPlayersSpy, mockGameInfo.players[0], evaluatedResponses);
        });
    });

    describe('checkForModifyRecently', () => {
        let clearTimeoutSpy: sinon.SinonSpy;
        let resetNumberOfModificationSpy: sinon.SinonSpy;

        beforeEach(() => {
            clearTimeoutSpy = sinon.spy(global, 'clearTimeout');
            resetNumberOfModificationSpy = sinon.spy(longAnswerHandlerService as any, 'resetNumberOfModification');
        });

        it('should clear existing timeout for recent modification and call resetNumberOfModification', () => {
            const playerWithTimeout = {
                ...mockPlayer,
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                timeOutForRecentModification: setTimeout(() => {}, 1000),
            };
            expect(playerWithTimeout.timeOutForRecentModification).to.not.equal(null);
            longAnswerHandlerService['checkForModifyRecently'](playerWithTimeout, mockGameInfo);
            sinon.assert.called(clearTimeoutSpy);
            sinon.assert.calledWith(resetNumberOfModificationSpy, playerWithTimeout, mockGameInfo);
        });
    });
});
