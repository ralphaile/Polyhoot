/* eslint-disable @typescript-eslint/no-explicit-any */
// Need more line to make the tests
/* eslint-disable max-lines */
import { TIME_BETWEEN_QUESTION } from '@common/const';
import { GameInfo, GameState } from '@common/game';
import { ClientQuestionInfo, GraphInfo, QuestionForResultDisplay, QuestionType } from '@common/question';
import { SocketEvents } from '@common/socketEvents';
import { User, UserState } from '@common/user';
import { expect } from 'chai';
import { Server } from 'http';
import * as sinon from 'sinon';
import * as io from 'socket.io';
import { GameInformationService } from './game-info.service';
import { GameManagementService } from './game-management.service';
import { HistoryService } from './history.service';
import { TimeService } from './server-timer.service';
// Need to set defaultMaxListeners to not cause memory leak
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
require('events').EventEmitter.defaultMaxListeners = 25;

describe('GameManagementService', () => {
    let gameManagementService: GameManagementService;
    let gameInfoServiceStub: sinon.SinonStubbedInstance<GameInformationService>;
    let mockTimer: sinon.SinonStubbedInstance<TimeService>;
    let mockGameInfo: GameInfo;
    let mockSocket: io.Socket;
    let emitSpy: sinon.SinonSpy;
    let toSpy: sinon.SinonSpy;
    let mockHistoryService: sinon.SinonStubbedInstance<HistoryService>;
    const server = new Server();

    beforeEach(() => {
        gameInfoServiceStub = sinon.createStubInstance(GameInformationService);
        mockHistoryService = sinon.createStubInstance(HistoryService);
        gameManagementService = new GameManagementService(gameInfoServiceStub, mockHistoryService);
        mockTimer = sinon.createStubInstance(TimeService);
        mockSocket = {
            emit: () => {
                return;
            },
        } as unknown as io.Socket;
        emitSpy = sinon.spy(mockSocket, 'emit');
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
                    nbOfFirstAnswers: 1,
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
        gameInfoServiceStub.getGameInfo.returns(mockGameInfo);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should lock the game if it was unlocked', () => {
        mockGameInfo.isLocked = false;

        gameInfoServiceStub.getGameInfo.returns(mockGameInfo);

        const result = gameManagementService.lockGameAccess(mockSocket);

        expect(result).to.equal(true);
        expect(mockGameInfo.isLocked).to.equal(true);
        sinon.assert.calledWith(gameInfoServiceStub.getGameInfo, mockSocket);
    });

    it('should unlock the game if it was locked', () => {
        mockGameInfo.isLocked = true;

        gameInfoServiceStub.getGameInfo.returns(mockGameInfo);

        const result = gameManagementService.lockGameAccess(mockSocket);

        expect(result).to.equal(false);
        expect(mockGameInfo.isLocked).to.equal(false);
        sinon.assert.calledWith(gameInfoServiceStub.getGameInfo, mockSocket);
    });

    it('should change the organizer to a player', () => {
        const newGameInfo: GameInfo = { ...mockGameInfo };
        newGameInfo.players = [];
        gameInfoServiceStub.getGameInfo.returns({ ...newGameInfo, isLocked: true, players: [], gameState: GameState.WaitRoom });
        const mockUser: User = {
            id: '456',
            name: 'Organisateur',
            isMuted: false,
            state: UserState.Connected,
        };
        gameInfoServiceStub.createPlayer.returns(mockUser);
        gameManagementService['switchOrganizerToPlayer'](mockSocket);
        sinon.assert.calledOnce(gameInfoServiceStub.createPlayer);
        expect(newGameInfo.organizer.id).to.equal('');
    });

    it('should not take any action if the socket is not the organizer', () => {
        gameInfoServiceStub.isOrganizer.returns(false);
        gameManagementService.startGame(mockSocket as io.Socket);

        sinon.assert.notCalled(gameInfoServiceStub.getGameInfo);
    });

    it('should switch the organizer to a player if the game is random', () => {
        gameInfoServiceStub.isRandomGame.returns(true);
        const switchOrganizerToPlayerSpy = sinon.spy(gameManagementService as never, 'switchOrganizerToPlayer');
        gameManagementService.startGame(mockSocket as io.Socket);

        sinon.assert.calledOnce(switchOrganizerToPlayerSpy);
    });

    it('should not take any action if the game cannot start', () => {
        gameInfoServiceStub.isOrganizer.returns(true);
        gameInfoServiceStub.getGameInfo.returns({ ...mockGameInfo, isLocked: false, players: [], gameState: GameState.WaitRoom });

        gameManagementService.startGame(mockSocket);

        sinon.assert.calledOnce(gameInfoServiceStub.getGameInfo);
        expect(emitSpy.notCalled).to.equal(true);
    });

    it('should start the game if the game can start', () => {
        gameInfoServiceStub.isOrganizer.returns(true);
        gameInfoServiceStub.getGameInfo.returns({
            ...mockGameInfo,
            isLocked: true,
            gameState: GameState.WaitRoom,
            timer: mockTimer as unknown as TimeService,
            gameId: 123,
        });

        gameManagementService.startGame(mockSocket);

        sinon.assert.calledOnce(mockTimer.resetTimer);
        sinon.assert.calledOnce(toSpy);

        expect(emitSpy.calledWith('moveToGame'));
    });

    it('should start the game if the game can start in random mode', () => {
        gameInfoServiceStub.isRandomGame.returns(true);
        gameInfoServiceStub.getGameInfo.returns({
            ...mockGameInfo,
            isLocked: true,
            isRandomGame: true,
            gameState: GameState.WaitRoom,
            timer: mockTimer as unknown as TimeService,
            gameId: 123,
        });

        gameManagementService.startGame(mockSocket);

        sinon.assert.calledOnce(mockTimer.resetTimer);
        sinon.assert.calledOnce(toSpy);

        expect(emitSpy.calledWith('moveToGame'));
    });

    it('should set gameState to SwitchingQuestion when the game starts', () => {
        gameInfoServiceStub.isOrganizer.returns(true);
        sinon.stub(gameManagementService as never, 'gameCantStart').returns(false);

        mockTimer.resetTimer.callsFake((time, callback) => callback());

        gameManagementService.startGame(mockSocket);

        expect(mockGameInfo.gameState).to.equal(GameState.SwitchingQuestion);
        sinon.assert.calledWith(toSpy, String(mockGameInfo.gameId));
        expect(emitSpy.calledWith(emitSpy, 'moveToGame'));
    });

    it('does nothing if the socket is not from the organizer', () => {
        gameInfoServiceStub.isOrganizer.returns(false);
        expect(gameManagementService.togglePauseOfTimer(mockSocket));
    });

    it('should pause the timer if the user is the orginizer and gameState is AnsweringQuestion', () => {
        gameInfoServiceStub.isOrganizer.returns(true);
        mockGameInfo.gameState = GameState.AnsweringQuestion;
        gameInfoServiceStub.getGameInfo.returns(mockGameInfo);
        gameManagementService.togglePauseOfTimer(mockSocket);
        expect(mockTimer.togglePause.called).to.equal(true);
    });

    it('should not pause if the gameState is not AnsweringQuestion', () => {
        gameInfoServiceStub.isOrganizer.returns(true);
        mockGameInfo.gameState = GameState.ResultView;
        gameInfoServiceStub.getGameInfo.returns(mockGameInfo);
        expect(gameManagementService.togglePauseOfTimer(mockSocket));
    });

    it('does nothing if the socket is not from the organizer', () => {
        gameInfoServiceStub.isOrganizer.returns(false);
        gameManagementService.enterPanicMode(mockSocket);
        expect(mockTimer.canGoInPanicMode.called);
    });

    it('does nothing if the socket is not from the organizer', () => {
        gameInfoServiceStub.isOrganizer.returns(true);
        gameInfoServiceStub.getCurrentQuestion.returns({ type: QuestionType.MultipleChoices } as ClientQuestionInfo);
        mockTimer.canGoInPanicMode.returns(false);
        gameManagementService.enterPanicMode(mockSocket);
        expect(mockTimer.enterPanicMode.called);
    });

    it('does nothing if the socket is not from the organizer', () => {
        gameInfoServiceStub.isOrganizer.returns(true);
        gameInfoServiceStub.getCurrentQuestion.returns({ type: QuestionType.MultipleChoices } as ClientQuestionInfo);
        mockTimer.canGoInPanicMode.returns(true);
        gameManagementService.enterPanicMode(mockSocket);
        expect(mockTimer.enterPanicMode.called);
        expect(emitSpy.calledWith(emitSpy, SocketEvents.EnterPanicMode));
    });

    it('does nothing if the socket is not from the organizer', () => {
        gameInfoServiceStub.isOrganizer.returns(false);
        gameManagementService.goToNextQuestion(mockSocket);

        sinon.assert.notCalled(mockTimer.resetTimer);
    });

    it('does nothing if the game state is not QuestionFinalized', () => {
        gameInfoServiceStub.isOrganizer.returns(true);
        mockGameInfo.gameState = GameState.AnsweringQuestion;
        gameInfoServiceStub.getGameInfo.returns(mockGameInfo);

        gameManagementService.goToNextQuestion(mockSocket);

        sinon.assert.notCalled(mockTimer.resetTimer);
    });

    it('starts countdown when user is the organizer and game state is QuestionFinalized', async () => {
        gameInfoServiceStub.isOrganizer.returns(true);
        mockGameInfo.gameState = GameState.QuestionFinalized;
        gameInfoServiceStub.getGameInfo.returns(mockGameInfo);

        gameManagementService.goToNextQuestion(mockSocket);

        sinon.assert.calledOnce(toSpy);
    });

    it('starts countdown when game is random and game state is QuestionFinalized', async () => {
        gameInfoServiceStub.isRandomGame.returns(true);
        mockGameInfo.gameState = GameState.QuestionFinalized;
        gameInfoServiceStub.getGameInfo.returns(mockGameInfo);
        const startCountdownForQuestionSpy = sinon.spy(gameManagementService as any, 'startCountdownForQuestion');

        gameManagementService.goToNextQuestion(mockSocket);

        sinon.assert.calledOnce(startCountdownForQuestionSpy);
    });

    it('should call prepareForNextQuestion after countdown', async () => {
        mockTimer.resetTimer.callsFake((time, callback) => callback());

        const prepareForNextQuestionSpy = sinon.spy(gameManagementService as never, 'prepareForNextQuestion');

        mockGameInfo.gameId = 123;
        gameInfoServiceStub.getGameInfo.returns(mockGameInfo);

        gameManagementService['startCountdownForQuestion'](mockGameInfo);

        sinon.assert.calledOnce(prepareForNextQuestionSpy);
        sinon.assert.calledWith(prepareForNextQuestionSpy, mockGameInfo);

        sinon.assert.calledWith(toSpy, String(mockGameInfo.gameId));
        expect(emitSpy.calledWith('startCountdownForQuestion'));
    });

    it('should call moveToResult when the user is the organizer and it is time for results', () => {
        gameInfoServiceStub.isOrganizer.returns(true);
        mockGameInfo.currentQuestionIndex = mockGameInfo.quiz.questions.length - 1;

        const moveToResultSpy = sinon.spy(gameManagementService as never, 'moveToResult');

        gameManagementService.goToResult(mockSocket);

        sinon.assert.calledOnce(moveToResultSpy);
    });

    it('should not call moveToResult when the user is not the organizer', () => {
        gameInfoServiceStub.isOrganizer.returns(false);

        const moveToResultSpy = sinon.spy(gameManagementService as never, 'moveToResult');

        gameManagementService.goToResult(mockSocket);

        sinon.assert.notCalled(moveToResultSpy);
    });

    it('should correctly convert quiz questions to QuestionForResultDisplay format', () => {
        mockGameInfo.quiz.questions = [
            {
                id: 'q1',
                type: QuestionType.MultipleChoices,
                text: 'What is the capital of France?',
                points: 10,
                choices: [
                    { text: 'Paris', isCorrect: true },
                    { text: 'London', isCorrect: false },
                    { text: 'Berlin', isCorrect: false },
                ],
            },
            {
                id: 'q2',
                type: QuestionType.MultipleChoices,
                text: 'The sky is blue.',
                points: 5,
                choices: [
                    { text: 'True', isCorrect: true },
                    { text: 'False', isCorrect: false },
                ],
            },
        ];

        const results = gameManagementService.prepareFinalResults(mockGameInfo);

        expect(results).to.have.lengthOf(2);
        expect(results[0].text).to.equal('What is the capital of France?');
        expect(results[0].points).to.equal(mockGameInfo.quiz.questions[0].points);
        expect(results[0].bandInfo).to.have.lengthOf(3);
        expect(results[1].text).to.equal('The sky is blue.');
        expect(results[1].points).to.equal(mockGameInfo.quiz.questions[1].points);
        expect(results[1].bandInfo).to.have.lengthOf(2);
    });

    it('should return the initial question display for the current question index', () => {
        mockGameInfo.currentQuestionIndex = 0;
        gameInfoServiceStub.getQuestionType.returns(QuestionType.MultipleChoices);
        const getInitialMultipleChoicesDisplayStub = sinon.stub(gameManagementService as any, 'getInitialLongAnswerDisplay');

        gameManagementService.sendInitialChoiceDisplayQuestion(mockGameInfo);

        expect(getInitialMultipleChoicesDisplayStub.called);
    });

    it('should handle different current question indexes correctly', () => {
        gameInfoServiceStub.getQuestionType.returns(QuestionType.MultipleChoices);
        const getInitialMultipleChoicesDisplayStub = sinon.stub(gameManagementService as any, 'getInitialLongAnswerDisplay');

        const secondQuestion = {
            text: 'Question 2',
            type: QuestionType.MultipleChoices,
            choices: [
                { text: 'Choice 3', isCorrect: false },
                { text: 'Choice 4', isCorrect: true },
            ],
            points: 10,
        };
        mockGameInfo.quiz.questions.push(secondQuestion);
        mockGameInfo.currentQuestionIndex = 1;

        gameManagementService.sendInitialChoiceDisplayQuestion(mockGameInfo);

        expect(getInitialMultipleChoicesDisplayStub.called);
    });

    it('should call getInitialLongAnswerDisplay when question type is LongAnswer', () => {
        gameInfoServiceStub.getQuestionType.returns(QuestionType.LongAnswer);
        const getInitialLongAnswerDisplayStub = sinon.stub(gameManagementService as any, 'getInitialLongAnswerDisplay');

        gameManagementService.sendInitialChoiceDisplayQuestion(mockGameInfo);

        expect(getInitialLongAnswerDisplayStub.called);
    });

    // {
    //     text: 'Question 1',
    //     type: QuestionType.MultipleChoices,
    //     choices: [
    //         { text: 'Choice 1', isCorrect: true },
    //         { text: 'Choice 2', isCorrect: false },
    //     ],
    //     points: 5,
    // },

    it('should get the long answer display', () => {
        sinon.stub(gameManagementService.graphInfoService, 'getInitialLongAnswerDisplay').returns([]);
        const target: QuestionForResultDisplay = {
            text: 'Question 1',
            points: 5,
            questionType: QuestionType.MultipleChoices,
            bandInfo: [],
        };

        expect(gameManagementService['getInitialLongAnswerDisplay'](mockGameInfo)).to.deep.equal([target]);
    });

    it('should emit startCountdownForQuestion and reset timer for next question', () => {
        mockGameInfo.gameState = GameState.QuestionFinalized;
        gameInfoServiceStub.getGameInfo.returns(mockGameInfo);

        gameManagementService['startCountdownForQuestion'](mockGameInfo);

        sinon.assert.calledWith(toSpy, String(mockGameInfo.gameId));
        sinon.assert.calledWith(mockTimer.resetTimer, TIME_BETWEEN_QUESTION, sinon.match.func);
    });

    it('should increment currentQuestionIndex and emit loadNextQuestion if not last question', () => {
        mockGameInfo.currentQuestionIndex = 0;
        mockGameInfo.quiz.questions.push({
            text: 'Question 2',
            type: QuestionType.MultipleChoices,
            choices: [
                { text: 'Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
            ],
            points: 10,
        });

        gameManagementService['prepareForNextQuestion'](mockGameInfo);

        expect(mockGameInfo.currentQuestionIndex).to.equal(1);

        sinon.assert.calledTwice(toSpy);

        expect(emitSpy.calledWith('loadNextQuestion'));
    });

    it('should reset game question-related properties and call resetPlayersChoices', () => {
        mockGameInfo.nbOfFinishedPlayers = 5;
        mockGameInfo.nbOfGoodAnswers = 3;
        mockGameInfo.gameState = GameState.AnsweringQuestion;

        const resetPlayersChoicesSpy = sinon.spy(gameManagementService as never, 'resetPlayersChoices');

        gameManagementService['resetQuestion'](mockGameInfo);

        expect(mockGameInfo.nbOfFinishedPlayers).to.equal(0);
        expect(mockGameInfo.nbOfGoodAnswers).to.equal(0);
        expect(mockGameInfo.gameState).to.equal(GameState.SwitchingQuestion);
        sinon.assert.calledOnceWithExactly(resetPlayersChoicesSpy, mockGameInfo);
    });

    it('should reset all players choices to false', () => {
        mockGameInfo.players.push({
            id: 'player2',
            name: 'Player 2',
            state: UserState.Connected,
            currentChoices: [false, true],
            hasFinalizeIsAnswers: true,
            isFirstToAnswers: true,
            isMuted: false,
        });

        gameManagementService['resetPlayersChoices'](mockGameInfo);

        mockGameInfo.players.forEach((player) => {
            expect(player.currentChoices.every((choice) => choice === false)).to.equal(true);
            expect(player.hasFinalizeIsAnswers).to.equal(false);
            expect(player.isFirstToAnswers).to.equal(false);
        });
    });

    it('should move game to ResultView state and emit final results if on last question', () => {
        mockGameInfo.currentQuestionIndex = mockGameInfo.quiz.questions.length - 1;
        const bandInfo: GraphInfo[] = [
            { text: 'Choice 3', nbOfSelection: 0, isCorrect: false },
            { text: 'Choice 4', nbOfSelection: 0, isCorrect: true },
        ];
        const expectedFinalResults: QuestionForResultDisplay[] = [
            {
                text: 'Some Question',
                points: 5,
                questionType: QuestionType.MultipleChoices,
                bandInfo,
            },
        ];
        sinon.stub(gameManagementService, 'prepareFinalResults').returns(expectedFinalResults);

        gameManagementService['moveToResult'](mockSocket);
        expect(mockGameInfo.gameState).to.equal(GameState.ResultView);
        sinon.assert.calledWith(toSpy, String(mockGameInfo.gameId));
        expect(emitSpy.calledWith('sendToAllFinalResults', expectedFinalResults));
    });

    it('should not change game state or emit final results if not on last question', () => {
        mockGameInfo.currentQuestionIndex = mockGameInfo.quiz.questions.length - 2;

        gameManagementService['moveToResult'](mockSocket);

        expect(mockGameInfo.gameState).not.to.equal(GameState.ResultView);
        sinon.assert.notCalled(emitSpy);
    });

    it("Should return false if it's the organizer", () => {
        const result: boolean = gameManagementService.isUserMuted({ id: mockGameInfo.organizer.id } as io.Socket);
        expect(result).to.equal(false);
    });

    it('Should return value of isMuted for players', () => {
        const result: boolean = gameManagementService.isUserMuted({ id: mockGameInfo.players[0].id } as io.Socket);
        expect(result).to.deep.equal(mockGameInfo.players[0].isMuted);
    });

    it('Should emit MutedByOrganizer event if user is Muted', () => {
        mockGameInfo.players[0].isMuted = true;
        const result: boolean = gameManagementService.isUserMuted({ id: mockGameInfo.players[0].id } as io.Socket);
        expect(result).to.deep.equal(mockGameInfo.players[0].isMuted);
        expect(emitSpy.calledWith(emitSpy, 'mutedByOrganizer'));
    });
    it('should keep the userState disconnected if user left', () => {
        const player = mockGameInfo.players[0];
        player.state = UserState.Disconnected;
        gameManagementService['resetPlayerState'](mockGameInfo.players[0]);
        expect(player.state).to.equal(UserState.Disconnected);
    });
});
