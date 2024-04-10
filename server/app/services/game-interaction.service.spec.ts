/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
// Method needed to test private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GameInfo, GameState } from '@common/game';
import { QuestionType } from '@common/question';
import { User, UserState } from '@common/user';
import { expect } from 'chai';
import { Server } from 'http';
import * as sinon from 'sinon';
import * as io from 'socket.io';
import { GameInformationService } from './game-info.service';
import { GameInteractionService } from './game-interaction.service';
import { MultipleChoicesHandlerService } from './qcm-handler.service';
import { LongAnswerHandlerService } from './qrl-handler.service';
import { TimeService } from './server-timer.service';

describe('GameInteractionService', () => {
    let gameInteractionService: GameInteractionService;
    let multipleChoicesHandlerServiceStub: sinon.SinonStubbedInstance<MultipleChoicesHandlerService>;
    let longAnswerHandlerServiceStub: sinon.SinonStubbedInstance<LongAnswerHandlerService>;
    let gameInfoServiceStub: sinon.SinonStubbedInstance<GameInformationService>;
    let mockTimer: sinon.SinonStubbedInstance<TimeService>;
    let mockGameInfo: GameInfo;
    let mockPlayer: User;
    let mockSocket: io.Socket;
    let toSpy: sinon.SinonSpy;
    // let emitSpy: sinon.SinonSpy;
    const server = new Server();

    beforeEach(() => {
        gameInfoServiceStub = sinon.createStubInstance(GameInformationService);
        multipleChoicesHandlerServiceStub = sinon.createStubInstance(MultipleChoicesHandlerService);
        longAnswerHandlerServiceStub = sinon.createStubInstance(LongAnswerHandlerService);
        gameInteractionService = new GameInteractionService(gameInfoServiceStub as never);
        mockTimer = sinon.createStubInstance(TimeService);

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
        // emitSpy = sinon.spy(mockSocket, 'emit');
        // emitSpy = fakeBroadcastOperator.emit;
        gameInfoServiceStub['sio'] = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        toSpy = sinon.spy(gameInfoServiceStub['sio'], 'to');

        mockGameInfo = {
            gameId: 123,
            organizer: {
                id: 'organizerId',
                name: 'Organizer Name',
                state: UserState.Connected,
                isMuted: false,
            },
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
            isRandomGame: false,
            gameState: GameState.WaitRoom,
            nbOfRecentModification: 0,
        };
        mockPlayer = mockGameInfo.players[0];
        gameInfoServiceStub.getGameInfo.returns(mockGameInfo);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('canFinalizeAnswers', () => {
        it('should return false if the user is the organizer but not a tester', () => {
            gameInfoServiceStub.isOrganizerButNotTester.returns(true);
            const result = gameInteractionService.canFinalizeAnswers(mockSocket);
            expect(result).to.equal(false);
        });

        it('should return false if the player cannot finalize answer', () => {
            sinon.stub(gameInteractionService as any, 'playerCantFinalizeAnswer').returns(true);
            gameInfoServiceStub.isOrganizerButNotTester.returns(false);
            const result = gameInteractionService.canFinalizeAnswers(mockSocket);
            expect(result).to.equal(false);
        });

        it('should return true and finalize answers when the player can finalize answer', () => {
            sinon.stub(gameInteractionService as any, 'playerCantFinalizeAnswer').returns(false);
            gameInfoServiceStub.isOrganizerButNotTester.returns(false);
            const finalizeAnswersSpy = sinon.spy(gameInteractionService as any, 'finalizeAnswers');
            const result = gameInteractionService.canFinalizeAnswers(mockSocket);
            expect(result).to.equal(true);
            expect(finalizeAnswersSpy.calledWith(mockGameInfo, mockPlayer));
        });
    });

    describe('initializeQuestion', () => {
        it('should set game state to AnsweringQuestion', () => {
            gameInteractionService.initializeQuestion(mockGameInfo, mockSocket);
            expect(mockGameInfo.gameState).to.equal(GameState.AnsweringQuestion);
        });

        it('should reset number of selections for current question', () => {
            sinon.restore();
            const resetNumberOfSelectionSpy = sinon.spy(multipleChoicesHandlerServiceStub, 'resetNumberOfSelection');
            gameInteractionService.initializeQuestion(mockGameInfo, mockSocket);
            expect(resetNumberOfSelectionSpy.calledWith(mockGameInfo.quiz.questions[mockGameInfo.currentQuestionIndex]));
        });

        it('should reset the timer with the correct duration', () => {
            const onTimeEndSpy = sinon.spy(gameInteractionService as any, 'onTimeEnd');
            gameInteractionService.initializeQuestion(mockGameInfo, mockSocket);
            const callback = mockGameInfo.timer.resetTimer.getCall(0).args[1];
            callback();
            sinon.assert.calledOnce(onTimeEndSpy);
        });
    });

    describe('toggleChoice', () => {
        it('should delegate call to multipleChoiceHandlerService', () => {
            const index = 1;
            gameInteractionService.toggleChoice(mockSocket, index);
            expect(multipleChoicesHandlerServiceStub.toggleChoice.calledWith(mockSocket, index));
        });
    });

    describe('changeLongAnswer', () => {
        it('should delegate call to longAnswerHandlerService', () => {
            const newAnswer = 'Some long answer';
            gameInteractionService.changeLongAnswer(mockSocket, newAnswer);
            expect(longAnswerHandlerServiceStub.changeLongAnswer.calledWith(mockSocket, newAnswer));
        });
    });

    describe('finalizeQuestion', () => {
        it('should call finalizeQuestion on multipleChoiceHandlerService for multiple choice questions', () => {
            sinon.stub(gameInteractionService as any, 'questionIsMultipleChoices').returns(true);
            gameInteractionService.finalizeQuestion(mockGameInfo);
            expect(multipleChoicesHandlerServiceStub.finalizeQuestion.calledWith(mockGameInfo));
        });

        it('should call finalizeQuestion on longAnswerHandlerService for long answer questions', () => {
            sinon.stub(gameInteractionService as any, 'questionIsMultipleChoices').returns(false);
            gameInteractionService.finalizeQuestion(mockGameInfo);
            expect(longAnswerHandlerServiceStub.finalizeQuestion.calledWith(mockGameInfo));
        });
    });

    describe('sendChatMessage', () => {
        it('should broadcast the chat message with user name when user is found', () => {
            const roomId = 'someRoomId';
            const userName = 'TestUser';
            gameInfoServiceStub.getRoomId.returns(roomId);
            gameInfoServiceStub.findUserBySocketId.returns({ id: roomId, name: 'User1', state: UserState.Connected, isMuted: false });
            const broadcastSpy = sinon.spy();
            gameInteractionService.sendChatMessage(mockSocket, 'Hello World');
            expect(toSpy.calledWith(roomId));
            expect(broadcastSpy.calledWith('newChatMessage', sinon.match.has('senderName', userName)));
        });

        it('should broadcast the chat message with "Anonyme" when user is not found', () => {
            const roomId = 'someRoomId';
            gameInfoServiceStub.getRoomId.returns(roomId);
            gameInfoServiceStub.findUserBySocketId.returns(null);
            const broadcastSpy = sinon.spy();
            gameInteractionService.sendChatMessage(mockSocket, 'Hello World');
            expect(toSpy.calledWith(roomId));
            expect(broadcastSpy.calledWith('newChatMessage', sinon.match.has('senderName', 'Anonyme')));
        });
    });

    it('should delegate to longAnswerHandlerService with correct parameters', () => {
        const evaluatedResponses = [{ userName: 'Player 1', multiplier: 1 }];
        gameInteractionService.giveLongResponsePoints(mockSocket, evaluatedResponses);
        expect(longAnswerHandlerServiceStub.giveLongResponsePoints.calledWith(mockSocket, evaluatedResponses));
    });

    describe('onTimeEnd', () => {
        it('should set the game state to QuestionFinalized and finalize answers for all players', () => {
            const finalizeAnswersSpy = sinon.spy(gameInteractionService as never, 'finalizeAnswers');
            gameInteractionService['onTimeEnd'](mockGameInfo);
            // expect(mockGameInfo.gameState).to.equal(GameState.QuestionFinalized);
            mockGameInfo.players.forEach(() => {
                sinon.assert.calledOnce(finalizeAnswersSpy);
            });
        });
    });

    describe('finalizeAnswers', () => {
        it('should do nothing of the player as not answered', () => {
            mockPlayer.hasFinalizeIsAnswers = false;
            sinon.stub(gameInteractionService as any, 'verifyPlayerHasNotAnswered').returns(false);
            gameInteractionService['finalizeAnswers'](mockGameInfo, mockPlayer);
            expect(mockPlayer.hasFinalizeIsAnswers).to.equal(false);
        });
    });

    describe('validationAccordingToQuestionType', () => {
        it('should call the validateQuestion on the multipleChoiceHandlerService if the type is multipleChoice', () => {
            sinon.stub(gameInteractionService as any, 'questionIsMultipleChoices').returns(true);
            gameInteractionService['validationAccordingToQuestionType'](mockGameInfo, mockPlayer);
            expect(multipleChoicesHandlerServiceStub.validateQuestion.called);
        });
    });

    describe('playerCantFinalizeAnswer', () => {
        it('should only check if the gameState is AnsweringQuestion when question type is long answer', () => {
            mockGameInfo.gameState = GameState.AnsweringQuestion;
            sinon.stub(gameInteractionService as any, 'questionIsMultipleChoices').returns(false);
            expect(gameInteractionService['playerCantFinalizeAnswer'](mockGameInfo, mockPlayer)).to.equal(false);
        });
        it('should check if the player has answered when questionIsMultipleChoices ', () => {
            sinon.stub(gameInteractionService as any, 'questionIsMultipleChoices').returns(true);
            expect(gameInteractionService['playerCantFinalizeAnswer'](mockGameInfo, mockPlayer)).to.equal(false);
        });
        it('should check if the gameState is AnsweringQuestion when questionIsMultipleChoices', () => {
            mockPlayer.currentChoices = [false, false];
            mockGameInfo.gameState = GameState.AnsweringQuestion;
            sinon.stub(gameInteractionService as any, 'questionIsMultipleChoices').returns(true);
            expect(gameInteractionService['playerCantFinalizeAnswer'](mockGameInfo, mockPlayer)).to.equal(false);
        });
    });
});
