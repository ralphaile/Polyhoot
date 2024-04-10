// Need more line to make the tests
/* eslint-disable max-lines */
// Method needed to test private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NOT_FOUND } from '@common/const';
import { GameInfo, GameState } from '@common/game';
import { QuestionType } from '@common/question';
import { Quiz } from '@common/quiz';
import { User, UserState } from '@common/user';
import { expect } from 'chai';
import { Server } from 'http';
import * as sinon from 'sinon';
import * as io from 'socket.io';
import { GameInformationService } from './game-info.service';
import { GameInteractionService } from './game-interaction.service';
import { HistoryService } from './history.service';
import { TimeService } from './server-timer.service';
import { SocketAuthenticationService } from './socket-authentication.service';

describe('SocketAuthenticationService', () => {
    let authService: SocketAuthenticationService;
    let gameInfoService: GameInformationService;
    let gameInteractionService: GameInteractionService;
    let mockSio: io.Server;
    let mockPlayer: User;
    let mockGame: GameInfo;
    let socketMock: io.Socket;
    let emitSpy: sinon.SinonSpy;
    let joinSpy: sinon.SinonSpy;
    let toSpy: sinon.SinonSpy;
    let historyService: HistoryService;
    let roomSocketMock: io.Socket;

    beforeEach(() => {
        const server = new Server();
        mockSio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        gameInfoService = new GameInformationService(mockSio, historyService);
        gameInteractionService = new GameInteractionService(gameInfoService);
        authService = new SocketAuthenticationService(gameInfoService, gameInteractionService);
        mockPlayer = {
            id: 'player1',
            name: 'Player 1',
            state: UserState.Connected,
            currentChoices: [false, false, false],
            points: 0,
            nbOfFirstAnswers: 0,
            hasFinalizeIsAnswers: false,
            isFirstToAnswers: false,
            isMuted: false,
        };
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
            players: [mockPlayer],
            banList: [] as string[],
            isLocked: false,
            quiz: {
                id: '123',
                title: 'title',
                description: '123',
                duration: 30,
                lastModification: new Date(),
                isVisible: true,
                questions: [{ type: QuestionType.MultipleChoices, text: '', points: 0, choices: [] }],
            },
            currentQuestionIndex: 0,
            firstToAnswer: null as User,
            nbOfGoodAnswers: 0,
            nbOfFinishedPlayers: 0,
            timer: new TimeService(mockSio),
            gameState: GameState.WaitRoom,
            nbOfRecentModification: 0,
        };
        // Needed to make the function do nothing
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        roomSocketMock = { id: '112', emit: () => {} } as any as io.Socket;
        socketMock = {
            id: mockPlayer.id,
            // Needed to make the function do nothing
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            emit: () => {},
            // Needed to make the function do nothing
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            join: () => {},
            to: () => {
                return roomSocketMock;
            },
            // Needed to make the function do nothing
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            disconnect: () => {},
        } as any as io.Socket;
        gameInfoService['games'].set(mockGame.gameId, mockGame);
        emitSpy = sinon.spy(socketMock, 'emit');
        joinSpy = sinon.spy(socketMock, 'join');
        toSpy = sinon.spy(socketMock, 'to');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('validateCode', () => {
        it('should return isValid true if the game is valid and not locked', () => {
            const gameInfoServiceMock = sinon.mock(gameInfoService);
            gameInfoServiceMock.expects('getGameWithId').withExactArgs(1).returns(mockGame);
            const result = authService.validateCode(1);

            expect(result.isValid).to.equal(true);
            expect(result.isLocked).to.equal(false);
            gameInfoServiceMock.verify();
        });
        it('should return isValid false and isLocked false if game does not exist', () => {
            const code = 123;
            sinon.stub(authService['gameInfoService'], 'getGameWithId').returns(undefined);

            const result = authService.validateCode(code);

            expect(result.isValid).to.equal(false);
            expect(result.isLocked).to.equal(false);
        });

        it('should return isValid false and isLocked true if game is locked', () => {
            mockGame.isLocked = true;
            sinon.stub(authService['gameInfoService'], 'getGameWithId').returns(mockGame);

            const result = authService.validateCode(mockGame.gameId);

            expect(result.isValid).to.equal(false);
            expect(result.isLocked).to.equal(true);
        });
    });

    describe('handleOrganizerLogin', () => {
        it('should create a game and emit userName event to the socket', () => {
            const createGameStub = sinon.stub(authService as any, 'createGame').returns({ gameId: 123 });
            const findUserBySocketIdStub = sinon.stub(gameInfoService, 'findUserBySocketId').returns({
                name: 'Player 1',
                id: socketMock.id,
                state: UserState.Connected,
                isMuted: false,
            });
            authService.handleOrganizerLogin(mockGame.quiz, socketMock);

            expect(createGameStub.calledOnce).to.equal(true);
            expect(joinSpy.calledOnceWithExactly('123')).to.equal(true);
            findUserBySocketIdStub.restore();
        });
    });

    describe('handleRandomGameLogin', () => {
        it('should create a game and emit userName event to the socket', () => {
            const createGameStub = sinon.stub(authService as any, 'createGame').returns({ gameId: 123 });
            const findUserBySocketIdStub = sinon.stub(gameInfoService, 'findUserBySocketId').returns({
                name: 'Player 1',
                id: socketMock.id,
                isMuted: false,
                state: UserState.Connected,
            });
            authService.handleRandomGameLogin(mockGame.quiz, socketMock);

            expect(createGameStub.calledOnce).to.equal(true);
            expect(joinSpy.calledOnceWithExactly('123')).to.equal(true);
            findUserBySocketIdStub.restore();
        });
    });

    describe('handleTesterLogin', () => {
        it('should create a game and add a tester to it', () => {
            const createGameStub = sinon.stub(authService as any, 'createGame').returns(mockGame);
            authService.handleTesterLogin(mockGame.quiz, socketMock);

            expect(createGameStub.calledOnceWithExactly(socketMock, mockGame.quiz, true, false)).to.equal(true);
            expect(joinSpy.calledOnceWithExactly('1')).to.equal(true);
        });
    });

    describe('handlePlayerLogin', () => {
        it('should add a new player if player login is valid', () => {
            const getGameWithIdStub = sinon.stub(gameInfoService, 'getGameWithId').returns(mockGame);
            const validatePlayerLoginStub = sinon.stub(gameInfoService, 'validatePlayerLogin').returns(true);
            const addNewPlayerStub = sinon.stub(gameInfoService, 'addNewPlayer');

            authService.handlePlayerLogin(1, 'Player 2', socketMock);

            expect(addNewPlayerStub.calledOnce).to.equal(true);
            expect(emitSpy.calledOnceWithExactly('userName', { name: 'Player 2' })).to.equal(true);

            getGameWithIdStub.restore();
            validatePlayerLoginStub.restore();
            addNewPlayerStub.restore();
        });

        it('should not add a new player if player login is invalid', () => {
            const getGameWithIdStub = sinon.stub(gameInfoService, 'getGameWithId').returns(mockGame);
            const validatePlayerLoginStub = sinon.stub(gameInfoService, 'validatePlayerLogin').returns(false);
            const addNewPlayerStub = sinon.stub(gameInfoService, 'addNewPlayer');

            authService.handlePlayerLogin(1, 'InvalidPlayer', socketMock);

            expect(addNewPlayerStub.called).to.equal(false);
            expect(emitSpy.called).to.equal(false);

            getGameWithIdStub.restore();
            validatePlayerLoginStub.restore();
            addNewPlayerStub.restore();
        });
    });

    describe('handleBanPlayer', () => {
        it('should ban a player if the organizer calls and the game state is waiting', () => {
            const isOrganizerStub = sinon.stub(gameInfoService, 'isOrganizer').returns(true);
            const getGameWithIdStub = sinon.stub(gameInfoService, 'getGameWithId').returns(mockGame);
            const banPlayerStub = sinon.stub(authService as any, 'banPlayer');
            const getRoomIdStub = sinon.stub(gameInfoService, 'getRoomId').returns('1');

            authService.handleBanPlayer('Player 1', socketMock);

            expect(banPlayerStub.calledOnceWithExactly(mockGame, 'Player 1')).to.equal(true);

            isOrganizerStub.restore();
            getGameWithIdStub.restore();
            banPlayerStub.restore();
            getRoomIdStub.restore();
        });

        it('should not ban a player if the organizer calls and the game state is not waiting', () => {
            const isOrganizerStub = sinon.stub(gameInfoService, 'isOrganizer').returns(true);
            const getGameWithIdStub = sinon.stub(gameInfoService, 'getGameWithId').returns({
                ...mockGame,
                gameState: GameState.AnsweringQuestion,
            });
            const banPlayerStub = sinon.stub(authService as any, 'banPlayer');
            const getRoomIdStub = sinon.stub(gameInfoService, 'getRoomId').returns('1');

            authService.handleBanPlayer('Player 1', socketMock);

            expect(banPlayerStub.called).to.equal(false);

            isOrganizerStub.restore();
            getGameWithIdStub.restore();
            banPlayerStub.restore();
            getRoomIdStub.restore();
        });

        it('should not ban a player if the caller is not the organizer', () => {
            const isOrganizerStub = sinon.stub(gameInfoService, 'isOrganizer').returns(false);
            const getGameWithIdStub = sinon.stub(gameInfoService, 'getGameWithId').returns(mockGame);
            const banPlayerStub = sinon.stub(authService as any, 'banPlayer');

            authService.handleBanPlayer('Player 1', socketMock);

            expect(banPlayerStub.called).to.equal(false);

            isOrganizerStub.restore();
            getGameWithIdStub.restore();
            banPlayerStub.restore();
        });
    });

    describe('handleDisconnect', () => {
        it('should call organizerDisconnect if the disconnected socket is the organizer', () => {
            const getGameInfoStub = sinon.stub(gameInfoService, 'getGameInfo').returns(mockGame);
            const isOrganizerStub = sinon.stub(gameInfoService, 'isOrganizer').returns(true);
            const organizerDisconnectStub = sinon.stub(authService as any, 'organizerDisconnect');

            authService.handleDisconnect(socketMock);

            expect(organizerDisconnectStub.calledOnceWithExactly(socketMock, '1', mockGame)).to.equal(true);

            getGameInfoStub.restore();
            isOrganizerStub.restore();
            organizerDisconnectStub.restore();
        });

        it('should call playerDisconnect if the disconnected socket is not the organizer', () => {
            const getGameInfoStub = sinon.stub(gameInfoService, 'getGameInfo').returns(mockGame);
            const isOrganizerStub = sinon.stub(gameInfoService, 'isOrganizer').returns(false);
            const playerDisconnectStub = sinon.stub(authService as any, 'playerDisconnect');

            authService.handleDisconnect(socketMock);

            expect(playerDisconnectStub.calledOnceWithExactly(socketMock, '1', mockGame)).to.equal(true);

            getGameInfoStub.restore();
            isOrganizerStub.restore();
            playerDisconnectStub.restore();
        });

        it('should do nothing if there is no game associated with the disconnected socket', () => {
            const getGameInfoStub = sinon.stub(gameInfoService, 'getGameInfo').returns(undefined);
            const organizerDisconnectStub = sinon.stub(authService as any, 'organizerDisconnect');
            const playerDisconnectStub = sinon.stub(authService as any, 'playerDisconnect');

            authService.handleDisconnect(socketMock);

            expect(organizerDisconnectStub.notCalled).to.equal(true);
            expect(playerDisconnectStub.notCalled).to.equal(true);

            getGameInfoStub.restore();
            organizerDisconnectStub.restore();
            playerDisconnectStub.restore();
        });
    });
    describe('playerDisconnect', () => {
        const leavingPlayer: User = {
            id: 'player1',
            name: 'Player 1',
            state: UserState.Connected,
            isMuted: false,
        };
        const game: GameInfo = {
            gameId: 1,
            organizer: {
                id: 'organizer1',
                name: 'Organizer',
                state: UserState.Connected,
                isMuted: false,
            },
            players: [leavingPlayer],
            gameState: GameState.AnsweringQuestion,
            isTester: false,
            isRandomGame: false,
            banList: [],
            isLocked: false,
            quiz: undefined,
            currentQuestionIndex: 0,
            firstToAnswer: undefined,
            nbOfGoodAnswers: 0,
            nbOfFinishedPlayers: 0,
            timer: new TimeService(mockSio),
            nbOfRecentModification: 0,
        };
        it('should disconnect player if the game state is waiting', () => {
            const disconnectWhileInWaitingRoom = sinon.stub(authService as any, 'disconnectWhileInWaitingRoom');
            authService['playerDisconnect'](socketMock, '1', mockGame);

            expect(disconnectWhileInWaitingRoom.calledOnceWithExactly(socketMock, '1', mockGame)).to.equal(true);

            disconnectWhileInWaitingRoom.restore();
        });

        it('should update player state and emit playerStateChanged event if the game state is not waiting', () => {
            const playerStateChangedEmitSpy = sinon.spy(authService['gameInfoService'].socketServer, 'to');
            const checkAllPlayersFinalizedStub = sinon.stub(authService as any, 'checkAllPlayersFinalized');
            const findStub = sinon.stub(game.players, 'find').returns(leavingPlayer);

            authService['playerDisconnect'](socketMock, '1', game);

            expect(leavingPlayer.state).to.equal(UserState.Disconnected);
            expect(playerStateChangedEmitSpy.calledOnceWithExactly('organizer1')).to.equal(true);
            expect(checkAllPlayersFinalizedStub.calledOnceWithExactly(game, leavingPlayer)).to.equal(true);

            playerStateChangedEmitSpy.restore();
            checkAllPlayersFinalizedStub.restore();
            findStub.restore();
        });

        it('should call allPlayersDisconnected if all players are disconnected', () => {
            const allPlayersDisconnectedStub = sinon.stub(authService as any, 'allPlayersDisconnected');
            const checkAllPlayersFinalizedStub = sinon.stub(authService as any, 'checkAllPlayersFinalized');
            const findStub = sinon.stub(game.players, 'find').returns(leavingPlayer);

            authService['playerDisconnect'](socketMock, '1', game);

            expect(allPlayersDisconnectedStub.calledOnceWithExactly(socketMock, game)).to.equal(true);

            allPlayersDisconnectedStub.restore();
            findStub.restore();
            checkAllPlayersFinalizedStub.restore();
        });

        it('should not call allPlayersDisconnected if not all players are disconnected', () => {
            const secondPlayer: User = {
                id: '123',
                name: 'secondPlayer',
                state: UserState.Connected,
                isMuted: false,
            };
            game.players = [leavingPlayer, secondPlayer];
            const allPlayersDisconnectedStub = sinon.stub(authService as any, 'allPlayersDisconnected');
            const checkAllPlayersFinalizedStub = sinon.stub(authService as any, 'checkAllPlayersFinalized');
            const findStub = sinon.stub(game.players, 'find').returns(leavingPlayer);

            authService['playerDisconnect'](socketMock, '1', game);

            expect(allPlayersDisconnectedStub.notCalled).to.equal(true);

            allPlayersDisconnectedStub.restore();
            findStub.restore();
            checkAllPlayersFinalizedStub.restore();
        });
    });

    describe('checkAllPlayersFinalized', () => {
        it('should decrement nbOfFinishedPlayers if leaving player has finalized answers', () => {
            mockPlayer.hasFinalizeIsAnswers = true;
            mockGame.nbOfFinishedPlayers = 1;

            authService['checkAllPlayersFinalized'](mockGame, mockPlayer);

            expect(mockGame.nbOfFinishedPlayers).to.equal(0);
        });

        it('should call gameInteractionService.finalizeQuestion if all players have finished their answers', () => {
            mockPlayer.hasFinalizeIsAnswers = false;
            mockGame.nbOfFinishedPlayers = 1;

            const getNumberOfOnlinePlayersStub = sinon.stub(authService['gameInfoService'], 'getNumberOfOnlinePlayers').returns(1);
            const finalizeQuestionStub = sinon.stub(authService['gameInteractionService'], 'finalizeQuestion');

            authService['checkAllPlayersFinalized'](mockGame, mockPlayer);

            expect(finalizeQuestionStub.calledOnceWithExactly(mockGame)).to.equal(true);

            getNumberOfOnlinePlayersStub.restore();
            finalizeQuestionStub.restore();
        });

        it('should not call gameInteractionService.finalizeQuestion if not all players have finished their answers', () => {
            const getNumberOfOnlinePlayersStub = sinon.stub(authService['gameInfoService'], 'getNumberOfOnlinePlayers').returns(2);
            const finalizeQuestionSpy = sinon.spy(authService['gameInteractionService'], 'finalizeQuestion');

            authService['checkAllPlayersFinalized'](mockGame, mockPlayer);

            expect(finalizeQuestionSpy.notCalled).to.equal(true);

            getNumberOfOnlinePlayersStub.restore();
            finalizeQuestionSpy.restore();
        });
    });

    describe('allPlayersDisconnected', () => {
        it('should emit an event to the organizer, stop the timer, and remove the game', () => {
            const playerSocketStub = sinon.stub(socketMock, 'disconnect');
            const removeGameStub = sinon.stub(authService['gameInfoService'], 'removeGame');
            const socketToDisconnectStub = sinon.stub(authService['gameInfoService'].socketServer.sockets.sockets, 'get').returns(socketMock);

            authService['allPlayersDisconnected'](socketMock, mockGame);

            expect(toSpy.calledOnce).to.equal(true);
            expect(removeGameStub.calledOnceWithExactly(mockGame.gameId)).to.equal(true);
            expect(playerSocketStub.calledOnce).to.equal(true);

            playerSocketStub.restore();
            socketToDisconnectStub.restore();
            removeGameStub.restore();
        });
    });

    describe('disconnectWhileInWaitingRoom', () => {
        it('should remove leaving player from the list and emit playerListActualized event', () => {
            const secondPlayer: User = { id: socketMock.id, name: 'Player 2', state: UserState.Connected, isMuted: false };
            mockGame.players = [mockPlayer, secondPlayer];
            const findStub = sinon.stub(authService['gameInfoService'], 'findUserBySocketId').returns(secondPlayer);

            authService['disconnectWhileInWaitingRoom'](socketMock, '1', mockGame);

            expect(mockGame.players.length).to.equal(1);
            expect(mockGame.players[0].id).to.equal('player1');
            expect(toSpy.calledWith(String(mockGame.gameId))).to.equal(true);
            findStub.restore();
        });

        it('should not remove leaving player if not found and emit playerListActualized event', () => {
            mockGame.players = [mockPlayer];
            const findStub = sinon.stub(authService['gameInfoService'], 'findUserBySocketId');
            const findIndexStub = sinon.stub(mockGame.players, 'findIndex').returns(NOT_FOUND);

            authService['disconnectWhileInWaitingRoom'](socketMock, '1', mockGame);

            expect(mockGame.players.length).to.equal(1);
            expect(mockGame.players[0].id).to.equal('player1');
            expect(toSpy.calledWith(String(mockGame.gameId))).to.equal(true);
            findStub.restore();
            findIndexStub.restore();
        });
    });

    describe('organizerDisconnect', () => {
        it('should emit organizerDisconnected event, leave sockets, stop timer, and remove the game', () => {
            const socketsLeaveStub = sinon.stub(authService['gameInfoService'].socketServer, 'socketsLeave');
            const removeGameStub = sinon.stub(authService['gameInfoService'], 'removeGame');
            const stopTimerStub = sinon.stub(mockGame.timer, 'stopTimer');

            authService['organizerDisconnect'](socketMock, '1', mockGame);

            expect(toSpy.calledWith(String(mockGame.gameId))).to.equal(true);
            expect(socketsLeaveStub.calledOnceWithExactly('1')).to.equal(true);
            expect(stopTimerStub.calledOnce).to.equal(true);
            expect(removeGameStub.calledOnceWithExactly(1)).to.equal(true);

            socketsLeaveStub.restore();
            removeGameStub.restore();
        });
    });

    describe('banPlayer', () => {
        it('should ban a player and emit hasBeenBan event if player is found and is online', () => {
            const playerToRemove: User = { id: socketMock.id, name: 'Player 1', state: UserState.Connected, isMuted: false };
            mockGame.players = [playerToRemove];

            const playerSocketStub = sinon.stub(socketMock, 'disconnect');
            const socketServerStub = sinon.stub(authService['gameInfoService'].socketServer.to(socketMock.id), 'emit').returns(true);
            const socketToDisconnectStub = sinon.stub(authService['gameInfoService'].socketServer.sockets.sockets, 'get').returns(socketMock);
            const findStub = sinon.stub(mockGame.players, 'find').returns(playerToRemove);

            authService['banPlayer'](mockGame, 'Player 1');

            expect(mockGame.banList).to.deep.equal(['Player 1']);
            expect(playerSocketStub.calledOnce).to.equal(true);

            playerSocketStub.restore();
            socketServerStub.restore();
            socketToDisconnectStub.restore();
            findStub.restore();
        });

        it('should ban a player if player is found but not online', () => {
            const playerToRemove: User = { id: socketMock.id, name: 'Player 1', state: UserState.Connected, isMuted: false };
            mockGame.players = [playerToRemove];
            const playerSocketStub = sinon.stub(socketMock, 'disconnect');
            const socketServerStub = sinon.stub(authService['gameInfoService'].socketServer.to(socketMock.id), 'emit').returns(true);
            const socketToDisconnectStub = sinon.stub(authService['gameInfoService'].socketServer.sockets.sockets, 'get');
            const findStub = sinon.stub(mockGame.players, 'find').returns(playerToRemove);

            authService['banPlayer'](mockGame, 'Player 2');

            expect(mockGame.banList).to.deep.equal(['Player 2']);
            expect(playerSocketStub.calledOnce).to.equal(false);
            playerSocketStub.restore();
            socketServerStub.restore();
            socketToDisconnectStub.restore();
            findStub.restore();
        });

        it('should not ban a player if player is not found', () => {
            const socketServerStub = sinon.stub(authService['gameInfoService'].socketServer, 'to');
            const socketToDisconnectStub = sinon.stub(authService['gameInfoService'].socketServer.sockets.sockets, 'get');

            authService['banPlayer'](mockGame, 'Player 2');

            expect(mockGame.banList).to.deep.equal(['Player 2']);
            expect(socketServerStub.called).to.equal(false);
            socketServerStub.restore();
            socketToDisconnectStub.restore();
        });
    });

    describe('generateRoomId', () => {
        it('should generate a unique room id', () => {
            const gameIdAlreadyUsedStub = sinon.stub(authService['gameInfoService'], 'gameIdAlreadyUsed');
            gameIdAlreadyUsedStub.onCall(0).returns(false);
            gameIdAlreadyUsedStub.onCall(1).returns(true).returns(false);

            const roomId1 = authService['generateRoomId']();
            const roomId2 = authService['generateRoomId']();
            const roomId3 = authService['generateRoomId']();

            expect(roomId1).to.be.a('number');
            expect(roomId2).to.be.a('number');
            expect(roomId3).to.be.a('number');
            expect(roomId1).to.not.equal(roomId2);
            expect(roomId2).to.not.equal(roomId3);

            gameIdAlreadyUsedStub.restore();
        });

        it('should generate a unique room id even if the first id generated is already used', () => {
            const gameIdAlreadyUsedStub = sinon.stub(authService['gameInfoService'], 'gameIdAlreadyUsed');
            gameIdAlreadyUsedStub.returns(true).returns(false);

            const roomId1 = authService['generateRoomId']();
            const roomId2 = authService['generateRoomId']();

            expect(roomId1).to.be.a('number');
            expect(roomId2).to.be.a('number');
            expect(roomId1).to.not.equal(roomId2);

            gameIdAlreadyUsedStub.restore();
        });
    });

    describe('createGame', () => {
        it('should create a new game with the correct properties', () => {
            const quiz: Quiz = {
                id: 'quizId',
                title: 'Quiz Title',
                description: 'Quiz Description',
                duration: 60,
                lastModification: new Date(),
                isVisible: true,
                questions: [],
            };
            const isTester = false;
            const isRandomMode = false;

            const addGameStub = sinon.stub(authService['gameInfoService'], 'addGame');

            const newGame = authService['createGame'](socketMock, quiz, isTester, isRandomMode);

            // const timerConstructorSpy = sinon.spy(TimeService.prototype, 'constructor');

            expect(newGame).to.be.an('object');
            expect(newGame.gameId).to.be.a('number');
            expect(newGame.organizer.id).to.equal(socketMock.id);
            expect(newGame.organizer.name).to.equal('Organisateur');
            expect(newGame.organizer.state).to.equal(UserState.Connected);
            expect(newGame.players).to.be.an('array').with.lengthOf(0);
            expect(newGame.banList).to.be.an('array').with.lengthOf(0);
            expect(newGame.isLocked).to.equal(false);
            expect(newGame.quiz).to.deep.equal(quiz);
            expect(newGame.currentQuestionIndex).to.equal(0);
            expect(newGame.firstToAnswer).to.equal(null);
            expect(newGame.nbOfGoodAnswers).to.equal(0);
            expect(newGame.nbOfFinishedPlayers).to.equal(0);
            expect(newGame.timer).to.be.an.instanceOf(TimeService);
            expect(newGame.gameState).to.equal(GameState.WaitRoom);

            // expect(timerConstructorSpy.((gameInfoService.socketServer, Function as any)).to.equal(true));

            expect(addGameStub.calledOnceWithExactly(newGame)).to.equal(true);

            const testerGame = authService['createGame'](socketMock, quiz, true, false);
            expect(testerGame.gameState).to.equal(GameState.AnsweringQuestion);

            const randomGame = authService['createGame'](socketMock, quiz, false, true);
            expect(randomGame.isRandomGame).to.equal(true);

            addGameStub.restore();
        });
    });
    describe('handleTogglePlayerChat', () => {
        it('should not do anything if the socket does not belong to the organizer', () => {
            sinon.stub(gameInfoService, 'isOrganizer').returns(false);
            const emitSpyToOrganizer = sinon.spy(authService as any, 'emitMuteEventToOrganizer');
            const emitSpyToPlayer = sinon.spy(authService as any, 'emitMuteEventToPlayer');

            authService.handleTogglePlayerChat('Player 1', socketMock);

            expect(emitSpyToOrganizer.called).to.equal(false);
            expect(emitSpyToPlayer.called).to.equal(false);
        });

        it('should call toggleMute if the socket belongs to the organizer', () => {
            // Arrange
            sinon.stub(gameInfoService, 'isOrganizer').returns(true);
            const toggleMuteSpy = sinon.spy(authService as any, 'toggleMute');
            const getGameWithIdStub = sinon.stub(gameInfoService, 'getGameWithId').returns(mockGame);
            const getRoomIdStub = sinon.stub(gameInfoService, 'getRoomId').returns('1');
            // Act
            authService.handleTogglePlayerChat('Player 1', socketMock);

            // Assert
            expect(toggleMuteSpy.calledWith(mockGame, 'Player 1')).to.equal(true);
            getGameWithIdStub.restore();
            getRoomIdStub.restore();
        });

        it("Toggle mute shouldn't do anything if player name doesn't exist", () => {
            // Arrange
            sinon.stub(gameInfoService, 'isOrganizer').returns(true);
            const toggleMuteSpy = sinon.spy(authService as any, 'toggleMute');
            const getGameWithIdStub = sinon.stub(gameInfoService, 'getGameWithId').returns(mockGame);
            const getRoomIdStub = sinon.stub(gameInfoService, 'getRoomId').returns('1');
            const emitSpyToOrganizer = sinon.spy(authService as any, 'emitMuteEventToOrganizer');
            const emitSpyToPlayer = sinon.spy(authService as any, 'emitMuteEventToPlayer');

            // Act
            authService.handleTogglePlayerChat('Player 2', socketMock);

            // Assert
            expect(toggleMuteSpy.calledWith(mockGame, 'Player 2')).to.equal(true);
            expect(emitSpyToOrganizer.called).to.equal(false);
            expect(emitSpyToPlayer.called).to.equal(false);
            getGameWithIdStub.restore();
            getRoomIdStub.restore();
        });
        it('should unmute if player is already muted', () => {
            // Arrange
            sinon.stub(gameInfoService, 'isOrganizer').returns(true);
            const toggleMuteSpy = sinon.spy(authService as any, 'toggleMute');
            const getGameWithIdStub = sinon.stub(gameInfoService, 'getGameWithId').returns(mockGame);
            const getRoomIdStub = sinon.stub(gameInfoService, 'getRoomId').returns('1');
            mockGame.players[0].isMuted = true;
            // Act
            authService.handleTogglePlayerChat('Player 1', socketMock);

            // Assert
            expect(toggleMuteSpy.calledWith(mockGame, 'Player 1')).to.equal(true);
            getGameWithIdStub.restore();
            getRoomIdStub.restore();
        });
    });
});
