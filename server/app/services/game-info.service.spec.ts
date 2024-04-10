// Need more line to make the tests
/* eslint-disable max-lines */
// Method needed to test private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TIME_OF_LONG_ANSWER_QUESTION } from '@common/const';
import { GameInfo, GameState } from '@common/game';
import { Choice, ClientQuestionInfo, Question, QuestionType } from '@common/question';
import { LoginErrorMessage } from '@common/socketEvents';
import { User, UserState } from '@common/user';
import { expect } from 'chai';
import { Server } from 'http';
import { describe } from 'mocha';
import * as sinon from 'sinon';
import * as io from 'socket.io';
import { GameInformationService } from './game-info.service';
import { HistoryService } from './history.service';
import { TimeService } from './server-timer.service';

describe('GameInformationService', () => {
    let gameInformationService: GameInformationService;
    let socketMock: io.Socket;
    let roomSocketMock: io.Socket;
    let emitSpy: sinon.SinonSpy;
    let joinSpy: sinon.SinonSpy;
    let toSpy: sinon.SinonSpy;
    let mockGame: GameInfo;
    let getGameInfoStub: sinon.SinonStub;
    let startTimerStub: sinon.SinonStub;
    let mockSio: io.Server;
    let historyService: HistoryService;
    const server = new Server();

    beforeEach(() => {
        mockSio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        gameInformationService = new GameInformationService(mockSio, historyService);
        mockGame = {
            gameId: 1,
            organizer: {
                id: 'organizer1',
                name: 'Organizer',
                state: UserState.Connected,
                isMuted: false,
            },
            isTester: false,
            isRandomGame: false,
            players: [
                {
                    id: 'player1',
                    name: 'Player 1',
                    state: UserState.Connected,
                    currentChoices: [false, false, false],
                    points: 0,
                    nbOfFirstAnswers: 0,
                    hasFinalizeIsAnswers: false,
                    isFirstToAnswers: false,
                    isMuted: false,
                },
            ],
            banList: [] as string[],
            isLocked: false,
            quiz: {
                id: '123',
                title: 'title',
                description: '123',
                duration: 30,
                lastModification: new Date(),
                isVisible: true,
                questions: [],
            },
            currentQuestionIndex: 0,
            firstToAnswer: null as User,
            nbOfGoodAnswers: 0,
            nbOfFinishedPlayers: 0,
            timer: { startTimer: startTimerStub } as unknown as TimeService,
            gameState: GameState.AnsweringQuestion,
            nbOfRecentModification: 0,
        };
        // Needed to make the function do nothing
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        roomSocketMock = { id: '112', emit: () => {} } as any as io.Socket;
        socketMock = {
            id: '111',
            // Needed to make the function do nothing
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            emit: () => {},
            // Needed to make the function do nothing
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            join: () => {},
            to: () => {
                return roomSocketMock;
            },
        } as any as io.Socket;

        gameInformationService['games'].set(mockGame.gameId, mockGame);
        getGameInfoStub = sinon.stub(gameInformationService, 'getGameInfo');
        emitSpy = sinon.spy(socketMock, 'emit');
        joinSpy = sinon.spy(socketMock, 'join');
        toSpy = sinon.spy(socketMock, 'to');
    });

    afterEach(() => {
        sinon.restore();
        server.close();
    });

    describe('get socketServer', () => {
        it('should return the sio', () => {
            expect(gameInformationService.socketServer).to.equal(mockSio);
        });
    });
    describe('findUserBySocketId', () => {
        it('should return null if no game exist', () => {
            getGameInfoStub.returns(null);

            expect(gameInformationService.findUserBySocketId(socketMock)).to.equal(null);
        });
        it('should find organizer if organizer socket is passed', () => {
            getGameInfoStub.returns(mockGame);
            socketMock = { id: mockGame.organizer.id } as io.Socket;

            expect(gameInformationService.findUserBySocketId(socketMock)).to.equal(mockGame.organizer);
        });
        it('should find a player if a player socket is passed', () => {
            getGameInfoStub.returns(mockGame);
            socketMock = { id: mockGame.players[0].id } as io.Socket;

            expect(gameInformationService.findUserBySocketId(socketMock)).to.equal(mockGame.players[0]);
        });
    });
    describe('getGameWithId', () => {
        it('should return the game with the matching id', () => {
            expect(gameInformationService.getGameWithId(mockGame.gameId)).to.equal(mockGame);
        });
    });
    describe('getGameInfo', () => {
        it('should return the game witch the socket his in', () => {
            getGameInfoStub.restore();
            const getGameWithIdStub = sinon.stub(gameInformationService, 'getGameWithId').returns(mockGame);
            const getRoomIdStub = sinon.stub(gameInformationService, 'getRoomId').returns(String(mockGame.gameId));

            socketMock = { id: mockGame.players[0].id } as io.Socket;

            expect(gameInformationService.getGameInfo(socketMock)).to.equal(mockGame);

            getGameWithIdStub.restore();
            getRoomIdStub.restore();
        });
    });
    describe('getPlayersName', () => {
        it('should a empty array if there is no game found', () => {
            getGameInfoStub.returns(null);

            socketMock = { id: null } as io.Socket;

            expect(gameInformationService.getPlayersName(socketMock)).to.deep.equal([]);
        });
        it('should return the player list if the mage is found', () => {
            getGameInfoStub.returns(mockGame);

            socketMock = { id: mockGame.organizer.id } as io.Socket;

            expect(gameInformationService.getPlayersName(socketMock)).to.deep.equal(['Player 1']);
        });
    });
    describe('isOrganizer', () => {
        it('should return false if the game is not found', () => {
            getGameInfoStub.returns(null);

            socketMock = { id: null } as io.Socket;

            expect(gameInformationService.isOrganizer(socketMock)).to.equal(false);
        });
        it('should return false if a player socket is used', () => {
            getGameInfoStub.returns(mockGame);

            socketMock = { id: mockGame.players[0].id } as io.Socket;

            expect(gameInformationService.isOrganizer(socketMock)).to.equal(false);
        });

        it('should return true the socket is the organizer', () => {
            getGameInfoStub.returns(mockGame);

            socketMock = { id: mockGame.organizer.id } as io.Socket;

            expect(gameInformationService.isOrganizer(socketMock)).to.equal(true);
        });
    });

    describe('isTester', () => {
        it('should return false if the game is not found', () => {
            getGameInfoStub.returns(null);

            socketMock = { id: null } as io.Socket;

            expect(gameInformationService.isTester(socketMock)).to.equal(false);
        });
        it('should return true if the game has a tester', () => {
            mockGame.isTester = true;
            getGameInfoStub.returns(mockGame);

            socketMock = { id: mockGame.organizer.id } as io.Socket;

            expect(gameInformationService.isTester(socketMock)).to.equal(true);
        });
    });

    describe('isRandomGame', () => {
        it('should return false if the game is not found', () => {
            getGameInfoStub.returns(null);

            socketMock = { id: null } as io.Socket;

            expect(gameInformationService.isRandomGame(socketMock)).to.equal(false);
        });
        it('should return true if the game is random', () => {
            mockGame.isRandomGame = true;
            getGameInfoStub.returns(mockGame);

            socketMock = { id: mockGame.organizer.id } as io.Socket;

            expect(gameInformationService.isRandomGame(socketMock)).to.equal(true);
        });
    });

    describe('getTimeForCurrentQuestion', () => {
        it('should return null if the game is not found', () => {
            getGameInfoStub.returns(null);

            socketMock = { id: null } as io.Socket;

            expect(gameInformationService.getTimeForCurrentQuestion(socketMock)).to.equal(null);
        });
        it('should return the duration of the quiz', () => {
            getGameInfoStub.returns(mockGame);

            socketMock = { id: mockGame.organizer.id } as io.Socket;

            expect(gameInformationService.getTimeForCurrentQuestion(socketMock)).to.equal(mockGame.quiz.duration);
        });
    });
    describe('getRoomId', () => {
        it('should return the duration of the quiz', () => {
            getGameInfoStub.returns(mockGame);
            const roomsMock = new Set(['room1', String(mockGame.gameId)]);
            socketMock = { id: mockGame.organizer.id, rooms: roomsMock } as io.Socket;

            expect(gameInformationService.getRoomId(socketMock)).to.equal(String(mockGame.gameId));
        });
    });
    describe('getCurrentQuestion', () => {
        const mockClientQuestionInfo = { text: 'Mock Question', points: 10, type: 'multipleChoice', choicesText: ['Choice 1', 'Choice 2'] };
        let initializeQuestionStub: sinon.SinonStub;
        let getCurrentQuestionForClientStub: sinon.SinonStub;
        beforeEach(() => {
            initializeQuestionStub = sinon.stub((gameInformationService as any).gameInteractionService, 'initializeQuestion');
            getCurrentQuestionForClientStub = sinon
                .stub(gameInformationService as any, 'getCurrentQuestionForClient')
                .returns(mockClientQuestionInfo);
        });

        it('should return null if the game is not found', () => {
            getGameInfoStub.returns(null);

            socketMock = { id: null } as io.Socket;

            expect(gameInformationService.getCurrentQuestion(socketMock)).to.equal(null);
        });
        it('should call getCurrentQuestionForClient and initializeQuestion if gameState is SwitchingQuestion', () => {
            mockGame.gameState = GameState.SwitchingQuestion;
            getGameInfoStub.returns(mockGame);

            expect(gameInformationService.getCurrentQuestion(socketMock)).to.equal(mockClientQuestionInfo);
            expect(initializeQuestionStub.calledOnce).to.equal(true);
            expect(getCurrentQuestionForClientStub.calledOnce).to.equal(true);
        });
        it('should call getCurrentQuestionForClient and not initializeQuestion if gameState not SwitchingQuestion', () => {
            getGameInfoStub.returns(mockGame);

            expect(gameInformationService.getCurrentQuestion(socketMock)).to.equal(mockClientQuestionInfo);
            expect(initializeQuestionStub.calledOnce).to.equal(false);
            expect(getCurrentQuestionForClientStub.calledOnce).to.equal(true);
        });
    });

    describe('getDuration', () => {
        let getCurrentQuestionStub: sinon.SinonStub;
        let mockQuestion: Question;
        beforeEach(() => {
            getCurrentQuestionStub = sinon.stub(gameInformationService as any, 'getCurrentQuestionForClient');
        });
        it('should return 0 if there is no game found', () => {
            getGameInfoStub.returns(null);

            socketMock = { id: null } as io.Socket;

            expect(gameInformationService.getDuration(socketMock)).to.equal(0);
        });
        it('should return the quiz duration if the question type is MultipleChoices', () => {
            mockQuestion = { type: QuestionType.MultipleChoices } as Question;
            getCurrentQuestionStub.returns(mockQuestion);
            getGameInfoStub.returns(mockGame);

            socketMock = { id: mockGame.players[0].id } as io.Socket;

            expect(gameInformationService.getDuration(socketMock)).to.equal(mockGame.quiz.duration);
        });
        it('should return TIME_OF_LONG_ANSWER_QUESTION if the question type is LongAnswer', () => {
            mockQuestion = { type: QuestionType.LongAnswer } as Question;
            getCurrentQuestionStub.returns(mockQuestion);
            getGameInfoStub.returns(mockGame);

            socketMock = { id: mockGame.players[0].id } as io.Socket;

            expect(gameInformationService.getDuration(socketMock)).to.equal(TIME_OF_LONG_ANSWER_QUESTION);
        });
    });

    describe('getQuestionType', () => {
        let mockQuestion: Question;
        it('should return 0 MultipleChoices if the question type is MultipleChoices', () => {
            mockQuestion = { type: QuestionType.MultipleChoices } as Question;
            mockGame.quiz.questions[mockGame.currentQuestionIndex] = mockQuestion;
            expect(gameInformationService.getQuestionType(mockGame)).to.equal(QuestionType.MultipleChoices);
        });
        it('should return LongAnswer if the question type is LongAnswer', () => {
            mockQuestion = { type: QuestionType.LongAnswer } as Question;
            mockGame.quiz.questions[mockGame.currentQuestionIndex] = mockQuestion;
            expect(gameInformationService.getQuestionType(mockGame)).to.equal(QuestionType.LongAnswer);
        });
    });

    describe('getPlayerNewScore', () => {
        let mockPlayer: Omit<User, 'id'>;
        it('should return the player list but without the id', () => {
            mockPlayer = {
                name: 'Player 1',
                state: UserState.Connected,
                currentChoices: [false, false, false],
                points: 0,
                nbOfFirstAnswers: 0,
                hasFinalizeIsAnswers: false,
                isMuted: false,
                isFirstToAnswers: false,
            };

            expect(gameInformationService.getPlayerNewScore(mockGame)).to.deep.equal([mockPlayer]);
        });
    });

    describe('allPlayerHasAnswered', () => {
        it('should true when nbOfFinishedPlayers equal getNumberOfOnlinePlayers', () => {
            const numberOfFinishedPLayers = 10;
            mockGame.nbOfFinishedPlayers = numberOfFinishedPLayers;
            sinon.stub(gameInformationService, 'getNumberOfOnlinePlayers').returns(numberOfFinishedPLayers);
            expect(gameInformationService.allPlayerHasAnswered(mockGame)).to.equal(true);
        });
        it('should false when nbOfFinishedPlayers is greater that getNumberOfOnlinePlayers', () => {
            const numberOfFinishedPLayers = 10;
            mockGame.nbOfFinishedPlayers = numberOfFinishedPLayers;
            sinon.stub(gameInformationService, 'getNumberOfOnlinePlayers').returns(numberOfFinishedPLayers + 2);
            expect(gameInformationService.allPlayerHasAnswered(mockGame)).to.equal(false);
        });
    });

    describe('addNewPlayer', () => {
        const playerName = 'New player';
        const mockPlayer = {
            id: '111',
            name: playerName,
            points: 0,
            nbOfFirstAnswers: 0,
            hasFinalizeIsAnswers: false,
            isFirstToAnswers: false,
            state: UserState.Connected,
        };
        let createPlayerStub: sinon.SinonStub;
        beforeEach(() => {
            createPlayerStub = sinon.stub(gameInformationService as any, 'createPlayer').returns(mockPlayer);
        });

        it('should add a player to the list and send information to users', () => {
            gameInformationService.addNewPlayer(socketMock, mockGame, playerName);

            expect(createPlayerStub.calledWith(playerName, mockGame, socketMock.id));
            expect(joinSpy.calledWith(String(mockGame.gameId))).to.equal(true);
            expect(emitSpy.calledWith('loginSuccessful')).to.equal(true);
            expect(toSpy.calledWith(String(mockGame.gameId))).to.equal(true);
        });
    });
    describe('gameIdAlreadyUsed', () => {
        it('should return true if the game id match one of the game', () => {
            expect(gameInformationService.gameIdAlreadyUsed(mockGame.gameId)).to.equal(true);
        });
        it('should return false if the game id match one of the game', () => {
            expect(gameInformationService.gameIdAlreadyUsed(null)).to.equal(false);
        });
    });
    describe('addGame', () => {
        const newGame: GameInfo = {
            gameId: 111,
        } as GameInfo;
        it('should add the game to the games list', () => {
            gameInformationService.addGame(newGame);
            expect(gameInformationService.gameIdAlreadyUsed(newGame.gameId)).to.equal(true);
        });
    });
    describe('validatePlayerLogin', () => {
        const playerName = 'New Player';
        let isNameInGameStub: sinon.SinonStub;
        let isNameBannedStub: sinon.SinonStub;
        beforeEach(() => {
            isNameInGameStub = sinon.stub(gameInformationService as any, 'isNameInGame');
            isNameBannedStub = sinon.stub(gameInformationService as any, 'isNameBanned');
        });

        it("should emit La partie n'existe pas if the game does not exist", () => {
            expect(gameInformationService.validatePlayerLogin(null, socketMock, playerName)).to.equal(false);
            expect(emitSpy.calledWith('loginError', LoginErrorMessage.GameDoesNotExit)).to.equal(true);
        });
        it('should emit La partie est verrouillée pas if the game is locked', () => {
            mockGame.isLocked = true;
            expect(gameInformationService.validatePlayerLogin(mockGame, socketMock, playerName)).to.equal(false);
            expect(emitSpy.calledWith('loginError', LoginErrorMessage.LockedGame)).to.equal(true);
        });
        it('should emit Ce nom existe déjà dans la partie pas if the player is already in the game', () => {
            isNameInGameStub.returns(true);
            expect(gameInformationService.validatePlayerLogin(mockGame, socketMock, playerName)).to.equal(false);
            expect(emitSpy.calledWith('loginError', LoginErrorMessage.AllReadyExistingName)).to.equal(true);
            expect(isNameInGameStub.calledWith(mockGame, playerName)).to.equal(true);
        });
        it('should emit Ce nom est banni de la partie if the player name is banned', () => {
            isNameInGameStub.returns(false);
            isNameBannedStub.returns(true);
            expect(gameInformationService.validatePlayerLogin(mockGame, socketMock, playerName)).to.equal(false);
            expect(emitSpy.calledWith('loginError', LoginErrorMessage.PlayerBanned)).to.equal(true);
            expect(isNameInGameStub.calledWith(mockGame, playerName)).to.equal(true);
            expect(isNameBannedStub.calledWith(mockGame, playerName)).to.equal(true);
        });
        it('should return true if all the condition are met', () => {
            isNameInGameStub.returns(false);
            isNameBannedStub.returns(false);
            expect(gameInformationService.validatePlayerLogin(mockGame, socketMock, playerName)).to.equal(true);
            expect(isNameInGameStub.calledWith(mockGame, playerName)).to.equal(true);
            expect(isNameBannedStub.calledWith(mockGame, playerName)).to.equal(true);
        });
    });
    describe('changeSelection', () => {
        let mockQuestion: Question;
        const questionIndex = 0;
        beforeEach(() => {
            mockQuestion = {
                type: QuestionType.MultipleChoices,
                text: 'Question Text',
                points: 10,
                choices: [
                    {
                        text: 'Choice Text',
                        isCorrect: true,
                        nbOfSelection: 1,
                    },
                ],
            };
        });
        it('should change the player choice to true and increase the number of selection if is choices was not selected', () => {
            gameInformationService.changeSelection(mockGame.players[0], mockQuestion, questionIndex);
            expect(mockQuestion.choices[questionIndex].nbOfSelection).to.equal(2);
            expect(mockGame.players[0].currentChoices[questionIndex]).to.equal(true);
        });
        it('should change the player choice to false and decrease the number of selection if is choices was selected', () => {
            mockGame.players[0].currentChoices[questionIndex] = true;
            gameInformationService.changeSelection(mockGame.players[0], mockQuestion, questionIndex);
            expect(mockQuestion.choices[questionIndex].nbOfSelection).to.equal(0);
            expect(mockGame.players[0].currentChoices[questionIndex]).to.equal(false);
        });
    });
    describe('getPlayerList', () => {
        let isOrganizerStub: sinon.SinonStub;
        beforeEach(() => {
            isOrganizerStub = sinon.stub(gameInformationService as any, 'isOrganizer');
        });
        it('should return a empty array if the socket is not a organizer and not in resultView', () => {
            mockGame.gameState = GameState.AnsweringQuestion;
            getGameInfoStub.returns(mockGame);
            isOrganizerStub.returns(false);

            expect(gameInformationService.getPlayerList(socketMock)).to.deep.equal([]);
        });
        it('should return a empty array if the socket is not a organizer and not in resultView', () => {
            mockGame.gameState = GameState.ResultView;
            getGameInfoStub.returns(mockGame);
            isOrganizerStub.returns(true);

            // The function removes the id so we need to remove it to
            // eslint-disable-next-line no-unused-vars
            const { id, ...playerWithoutId } = mockGame.players[0];
            expect(gameInformationService.getPlayerList(socketMock)).to.deep.equal([playerWithoutId]);
        });
    });

    describe('removeGame', () => {
        it('should remove a game from the games list', () => {
            gameInformationService.removeGame(mockGame.gameId);
            expect(gameInformationService.gameIdAlreadyUsed(mockGame.gameId)).to.equal(false);
        });
    });
    describe('getQuestionChoices', () => {
        let sendInitialChoiceDisplayQuestionStub: sinon.SinonStub;
        let prepareFinalResultsStub: sinon.SinonStub;
        beforeEach(() => {
            sendInitialChoiceDisplayQuestionStub = sinon.stub(
                (gameInformationService as any).gameManagementService,
                'sendInitialChoiceDisplayQuestion',
            );
            prepareFinalResultsStub = sinon.stub((gameInformationService as any).gameManagementService, 'prepareFinalResults');
        });
        it('should call sendInitialChoiceDisplayQuestion if is organizer', () => {
            getGameInfoStub.returns(mockGame);
            sendInitialChoiceDisplayQuestionStub.returns([]);
            prepareFinalResultsStub.returns([]);
            socketMock = { id: mockGame.organizer.id } as io.Socket;

            expect(gameInformationService.getQuestionChoices(socketMock)).to.deep.equal([]);
            expect(sendInitialChoiceDisplayQuestionStub.calledWith(mockGame)).to.equal(true);
            expect(prepareFinalResultsStub.called).to.equal(false);
        });

        it('should call prepareFinalResultsStub if gameState is ResultView', () => {
            mockGame.gameState = GameState.ResultView;
            getGameInfoStub.returns(mockGame);
            prepareFinalResultsStub.returns([]);

            expect(gameInformationService.getQuestionChoices(socketMock)).to.deep.equal([]);
            expect(sendInitialChoiceDisplayQuestionStub.called).to.equal(false);
            expect(prepareFinalResultsStub.calledWith(mockGame)).to.equal(true);
        });

        it('should return empty array if is not organizer and the gameState is not ResultView', () => {
            mockGame.gameState = GameState.AnsweringQuestion;
            getGameInfoStub.returns(mockGame);

            expect(gameInformationService.getQuestionChoices(socketMock)).to.deep.equal([]);
            expect(sendInitialChoiceDisplayQuestionStub.called).to.equal(false);
            expect(prepareFinalResultsStub.called).to.equal(false);
        });
    });
    describe('getNumberOfOnlinePlayers', () => {
        it('should count the number of connected players', () => {
            expect(gameInformationService.getNumberOfOnlinePlayers(mockGame)).to.equal(1);
        });
        it('should not count the disconnected players', () => {
            mockGame.players[0].state = UserState.Disconnected;
            expect(gameInformationService.getNumberOfOnlinePlayers(mockGame)).to.equal(0);
        });
    });
    describe('isOrganizerButNotTester', () => {
        let isOrganizerStub: sinon.SinonStub;
        let isTesterStub: sinon.SinonStub;
        beforeEach(() => {
            isOrganizerStub = sinon.stub(gameInformationService, 'isOrganizer');
            isTesterStub = sinon.stub(gameInformationService, 'isTester');
        });
        it('should count the number of connected players', () => {
            socketMock = { id: mockGame.organizer.id } as io.Socket;
            isOrganizerStub.returns(true);
            isTesterStub.returns(false);

            expect(gameInformationService.isOrganizerButNotTester(socketMock)).to.equal(true);
        });
        it('should count the number of connected players', () => {
            mockGame.isTester = true;
            isOrganizerStub.returns(false);
            isTesterStub.returns(true);

            expect(gameInformationService.isOrganizerButNotTester(socketMock)).to.equal(false);
        });
    });
    describe('getCurrentQuestionForClient', () => {
        let mockQuestion: Question;
        let mockClientQuestionInfo: ClientQuestionInfo;
        beforeEach(() => {
            mockQuestion = {
                type: QuestionType.MultipleChoices,
                text: 'Question Text',
                points: 10,
                choices: [
                    {
                        text: 'Choice Text',
                        isCorrect: true,
                        nbOfSelection: 1,
                    },
                ],
            };
            mockClientQuestionInfo = {
                text: mockQuestion.text,
                points: mockQuestion.points,
                type: mockQuestion.type,
                choicesText: [mockQuestion.choices[0].text],
            };
        });
        it('should return a ClientQuestionInfo based on the Question', () => {
            mockGame.quiz.questions[mockGame.currentQuestionIndex] = mockQuestion;
            expect(gameInformationService['getCurrentQuestionForClient'](mockGame)).to.deep.equal(mockClientQuestionInfo);
        });
    });
    describe('isNameBanned', () => {
        const bannedName = 'Banned Name';
        it('should return true if the name is banned', () => {
            mockGame.banList.push(bannedName);
            expect(gameInformationService['isNameBanned'](mockGame, bannedName)).to.deep.equal(true);
        });
        it('should return false if the name is not banned', () => {
            expect(gameInformationService['isNameBanned'](mockGame, bannedName)).to.deep.equal(false);
        });
    });
    describe('isNameInGame', () => {
        const nameNotInGame = 'Name';
        it('should return true if a player is in the game', () => {
            expect(gameInformationService['isNameInGame'](mockGame, mockGame.players[0].name)).to.deep.equal(true);
        });
        it('should return false if a player is not in the game', () => {
            expect(gameInformationService['isNameInGame'](mockGame, nameNotInGame)).to.deep.equal(false);
        });
    });
    describe('createPlayer', () => {
        const playerName = 'Player Name';
        const playerId = '111';
        const mockPlayer = {
            id: playerId,
            name: playerName,
            points: 0,
            nbOfFirstAnswers: 0,
            hasFinalizeIsAnswers: false,
            currentChoices: [false, false, false],
            isFirstToAnswers: false,
            state: UserState.Connected,
            timeOutForRecentModification: null as NodeJS.Timeout,
            isMuted: false,
        };
        it('should create a player properly', () => {
            mockGame.quiz.questions[0] = { choices: [{} as Choice, {} as Choice, {} as Choice] } as Question;
            expect(gameInformationService['createPlayer'](playerName, mockGame, playerId)).to.deep.equal(mockPlayer);
        });
    });
});
