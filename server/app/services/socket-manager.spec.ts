// Need more line to make the tests
/* eslint-disable max-lines */
// Method needed to test private methods
/* eslint-disable @typescript-eslint/no-explicit-any */

import { GameInfo } from '@common/game';
import { ClientQuestionInfo, QuestionForResultDisplay } from '@common/question';
import { Quiz } from '@common/quiz';
import { SocketEvents } from '@common/socketEvents';
import { User } from '@common/user';
import { Server } from 'app/server';
import { expect } from 'chai';
import { describe } from 'mocha';
import * as sinon from 'sinon';
import { Socket, io as ioClient } from 'socket.io-client';
import { Container } from 'typedi';
import { SocketManager } from './socket-manager';

const RESPONSE_DELAY = 300;

describe('socketManager', () => {
    let socketManager: SocketManager;
    let clientSocket: Socket;
    const urlString = 'http://localhost:3000';
    let disconnectStub: sinon.SinonStub;
    let serverMock: Server;

    beforeEach(async () => {
        serverMock = Container.get(Server);
        await serverMock.init();
        socketManager = serverMock['socketManager'];
        sinon.stub(console, 'log');
    });

    beforeEach(() => {
        clientSocket = ioClient(urlString);
        disconnectStub = sinon.stub(socketManager['socketAuthentication'], 'handleDisconnect');
        disconnectStub.callsFake(() => {
            return;
        });
    });

    afterEach(() => {
        clientSocket.close();
        socketManager['gameInfoService']['sio'].close();
        sinon.restore();
    });

    describe('SocketManager', () => {
        describe('handleSockets', () => {
            it('should initialize socket events', (done) => {
                socketManager.handleSockets();
                clientSocket.emit(SocketEvents.Connection);
                setTimeout(() => {
                    expect(socketManager.handleSockets);
                    done();
                }, RESPONSE_DELAY);
            });
        });
        describe('initializeGetEvent', () => {
            it('should return the game code when call on GetGameCode', (done) => {
                const gameCode = '1111';
                const getRoomIdStub = sinon.stub(socketManager['gameInfoService'], 'getRoomId');
                getRoomIdStub.returns(gameCode);
                let receivedCode: string;
                clientSocket.emit(SocketEvents.GetGameCode, (res: string) => {
                    receivedCode = res;
                });
                setTimeout(() => {
                    expect(receivedCode).to.equal(gameCode);
                    expect(getRoomIdStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should return the game title on GetGameTitle', (done) => {
                const gameTitle = 'Quiz Title';
                const mockGame = { quiz: { title: gameTitle } as Quiz } as GameInfo;
                const getGameInfoStub = sinon.stub(socketManager['gameInfoService'], 'getGameInfo');
                getGameInfoStub.returns(mockGame);
                let titleReceived: string;
                clientSocket.emit(SocketEvents.GetGameTitle, (res: string) => {
                    titleReceived = res;
                });
                setTimeout(() => {
                    expect(titleReceived).to.equal(gameTitle);
                    expect(getGameInfoStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should return the game title on GetPlayers', (done) => {
                const playerList = ['player1', 'player2', 'player3'];
                const getPlayersNameStub = sinon.stub(socketManager['gameInfoService'], 'getPlayersName');
                getPlayersNameStub.returns(playerList);
                let playerListReceived: string[];
                clientSocket.emit(SocketEvents.GetPlayers, (res: string[]) => {
                    playerListReceived = res;
                });
                setTimeout(() => {
                    expect(playerListReceived).to.deep.equal(playerList);
                    expect(getPlayersNameStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should return if the socket is a organizer on GetIsOrganizer', (done) => {
                const isOrganizerStub = sinon.stub(socketManager['gameInfoService'], 'isOrganizer');
                isOrganizerStub.returns(true);
                let respondReceived: boolean;
                clientSocket.emit(SocketEvents.GetIsOrganizer, (res: boolean) => {
                    respondReceived = res;
                });
                setTimeout(() => {
                    expect(respondReceived).to.equal(true);
                    expect(isOrganizerStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should return true if the game is a Tester on GetIsTester', (done) => {
                const isTesterStub = sinon.stub(socketManager['gameInfoService'], 'isTester');
                isTesterStub.returns(true);
                let respondReceived: boolean;
                clientSocket.emit(SocketEvents.GetIsTester, (res: boolean) => {
                    respondReceived = res;
                });
                setTimeout(() => {
                    expect(respondReceived).to.equal(true);
                    expect(isTesterStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should return true if the game is random on GetIsRandomGame', (done) => {
                const isRandomGameStub = sinon.stub(socketManager['gameInfoService'], 'isRandomGame');
                isRandomGameStub.returns(true);
                let respondReceived: boolean;
                clientSocket.emit(SocketEvents.GetIsRandomGame, (res: boolean) => {
                    respondReceived = res;
                });
                setTimeout(() => {
                    expect(respondReceived).to.equal(true);
                    expect(isRandomGameStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should return the quiz duration on GetTimeForQuestion', (done) => {
                const quizDuration = 60;
                const getTimeForCurrentQuestionStub = sinon.stub(socketManager['gameInfoService'], 'getTimeForCurrentQuestion');
                getTimeForCurrentQuestionStub.returns(quizDuration);
                let durationReceived: number;
                clientSocket.emit(SocketEvents.GetTimeForQuestion, (res: number) => {
                    durationReceived = res;
                });
                setTimeout(() => {
                    expect(durationReceived).to.equal(quizDuration);
                    expect(getTimeForCurrentQuestionStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should return the current question on GetCurrentQuestion', (done) => {
                const clientQuestionInfoMock = { text: 'Question Text' } as ClientQuestionInfo;
                const getCurrentQuestionStub = sinon.stub(socketManager['gameInfoService'], 'getCurrentQuestion');
                getCurrentQuestionStub.returns(clientQuestionInfoMock);
                let respondReceived: ClientQuestionInfo;
                clientSocket.emit(SocketEvents.GetCurrentQuestion, (res: ClientQuestionInfo) => {
                    respondReceived = res;
                });
                setTimeout(() => {
                    expect(respondReceived).to.deep.equal(clientQuestionInfoMock);
                    expect(getCurrentQuestionStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should return the player list on GetPlayerList', (done) => {
                const playerListInfoMock = [{ name: 'player 1' } as Omit<User, 'id'>];
                const getPlayerListStub = sinon.stub(socketManager['gameInfoService'], 'getPlayerList');
                getPlayerListStub.returns(playerListInfoMock);
                let respondReceived: Omit<User, 'id'>[];
                clientSocket.emit(SocketEvents.GetPlayerList, (res: Omit<User, 'id'>[]) => {
                    respondReceived = res;
                });
                setTimeout(() => {
                    expect(respondReceived).to.deep.equal(playerListInfoMock);
                    expect(getPlayerListStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should return the choices on GetQuestionChoices', (done) => {
                const questionForResultDisplayMock = [{ text: 'Question Text' } as QuestionForResultDisplay];
                const getQuestionChoicesStub = sinon.stub(socketManager['gameInfoService'], 'getQuestionChoices');
                getQuestionChoicesStub.returns(questionForResultDisplayMock);
                let respondReceived: QuestionForResultDisplay[];
                clientSocket.emit(SocketEvents.GetQuestionChoices, (res: QuestionForResultDisplay[]) => {
                    respondReceived = res;
                });
                setTimeout(() => {
                    expect(respondReceived).to.deep.equal(questionForResultDisplayMock);
                    expect(getQuestionChoicesStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
        });
        describe('initializeLoginEvent', () => {
            it('should call handleOrganizerLogin on OrganizerLogin', (done) => {
                const handleOrganizerLoginStub = sinon.stub(socketManager['socketAuthentication'], 'handleOrganizerLogin');
                clientSocket.emit(SocketEvents.OrganizerLogin);
                setTimeout(() => {
                    expect(handleOrganizerLoginStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call handleRandomGameLogin on RandomGameLogin', (done) => {
                const handleRandomGameLoginStub = sinon.stub(socketManager['socketAuthentication'], 'handleRandomGameLogin');
                clientSocket.emit(SocketEvents.RandomGameLogin);
                setTimeout(() => {
                    expect(handleRandomGameLoginStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call handleTesterLogin on TesterLogin', (done) => {
                const handleTesterLoginStub = sinon.stub(socketManager['socketAuthentication'], 'handleTesterLogin');
                clientSocket.emit(SocketEvents.TesterLogin);
                setTimeout(() => {
                    expect(handleTesterLoginStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call handlePlayerLogin on PlayerLogin', (done) => {
                const gameId = 123;
                const handlePlayerLoginStub = sinon.stub(socketManager['socketAuthentication'], 'handlePlayerLogin');
                clientSocket.emit(SocketEvents.PlayerLogin, [gameId, '123']);
                setTimeout(() => {
                    expect(handlePlayerLoginStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
        });
        describe('initializeOrganizerEvent', () => {
            it('should call handleBanPlayer on BanPlayerName', (done) => {
                const handleBanPlayerStub = sinon.stub(socketManager['socketAuthentication'], 'handleBanPlayer');
                clientSocket.emit(SocketEvents.BanPlayerName, 'ImGonnaBeBanned');
                setTimeout(() => {
                    expect(handleBanPlayerStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should locked the game on LockGameAccess', (done) => {
                const isLockedMock = true;
                const lockGameAccessStub = sinon.stub(socketManager['gameManagementService'], 'lockGameAccess');
                lockGameAccessStub.returns(isLockedMock);
                let respondReceived: boolean;
                clientSocket.emit(SocketEvents.LockGameAccess, (res: boolean) => {
                    respondReceived = res;
                });
                setTimeout(() => {
                    expect(respondReceived).to.deep.equal(isLockedMock);
                    expect(lockGameAccessStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call startGame on StartGame', (done) => {
                const startGameStub = sinon.stub(socketManager['gameManagementService'], 'startGame');
                clientSocket.emit(SocketEvents.StartGame);
                setTimeout(() => {
                    expect(startGameStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call goToResult on GoToResults', (done) => {
                const goToResultStub = sinon.stub(socketManager['gameManagementService'], 'goToResult');
                clientSocket.emit(SocketEvents.GoToResult);
                setTimeout(() => {
                    expect(goToResultStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call goToNextQuestion on GoToNextQuestion', (done) => {
                const goToNextQuestionStub = sinon.stub(socketManager['gameManagementService'], 'goToNextQuestion');
                clientSocket.emit(SocketEvents.GoToNextQuestion);
                setTimeout(() => {
                    expect(goToNextQuestionStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call handleTogglePlayerChat on ToggleChat', (done) => {
                const handleTogglePlayerChat = sinon.stub(socketManager['socketAuthentication'], 'handleTogglePlayerChat');
                clientSocket.emit(SocketEvents.ToggleChat);
                setTimeout(() => {
                    expect(handleTogglePlayerChat.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
        });
        describe('initializePlayerEvent', () => {
            it('should call validateCode on ValidateCode', (done) => {
                const gameCode = 1111;
                const validateCodeMock = { isValid: true, isLocked: true };
                const validateCodeStub = sinon.stub(socketManager['socketAuthentication'], 'validateCode');
                validateCodeStub.returns(validateCodeMock);
                let respondReceived: { isValid: boolean; isLocked: boolean };
                clientSocket.emit(SocketEvents.ValidateCode, gameCode, (res: { isValid: boolean; isLocked: boolean }) => {
                    respondReceived = res;
                });
                setTimeout(() => {
                    expect(respondReceived).to.deep.equal(validateCodeMock);
                    expect(validateCodeStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should return if the user can finalize is answer on FinalizeAnswers', (done) => {
                const canFinalizeAnswers = true;
                const canFinalizeAnswersStub = sinon.stub(socketManager['gameInteractionService'], 'canFinalizeAnswers');
                canFinalizeAnswersStub.returns(canFinalizeAnswers);
                let respondReceived: boolean;
                clientSocket.emit(SocketEvents.FinalizeAnswers, (res: boolean) => {
                    respondReceived = res;
                });
                setTimeout(() => {
                    expect(respondReceived).to.equal(canFinalizeAnswers);
                    expect(canFinalizeAnswersStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call toggleChoice on ToggleChoice', (done) => {
                const newChoices = false;
                const toggleChoiceIndex = 1;
                const toggleChoiceStub = sinon.stub(socketManager['gameInteractionService'], 'toggleChoice');
                toggleChoiceStub.returns(newChoices);
                let newToggleChoice: boolean;
                clientSocket.emit(SocketEvents.ToggleChoice, toggleChoiceIndex, (res: boolean) => {
                    newToggleChoice = res;
                });
                setTimeout(() => {
                    expect(newToggleChoice).to.equal(newChoices);
                    expect(toggleChoiceStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call changeLongAnswer on LongAnswerUpdated', (done) => {
                const newAnswer = 'New Player Answer';
                const changeLongAnswerStub = sinon.stub(socketManager['gameInteractionService'], 'changeLongAnswer');
                clientSocket.emit(SocketEvents.LongAnswerUpdated, newAnswer);
                setTimeout(() => {
                    expect(changeLongAnswerStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
        });
        describe('initializeOrganizerEvent', () => {
            it('should call handleBanPlayer on BanPlayerName', (done) => {
                const handleBanPlayerStub = sinon.stub(socketManager['socketAuthentication'], 'handleBanPlayer');
                clientSocket.emit(SocketEvents.BanPlayerName);
                setTimeout(() => {
                    expect(handleBanPlayerStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should locked the game on LockGameAccess', (done) => {
                const isLockedMock = true;
                const lockGameAccessStub = sinon.stub(socketManager['gameManagementService'], 'lockGameAccess');
                lockGameAccessStub.returns(isLockedMock);
                let respondReceived: boolean;
                clientSocket.emit(SocketEvents.LockGameAccess, (res: boolean) => {
                    respondReceived = res;
                });
                setTimeout(() => {
                    expect(respondReceived).to.deep.equal(isLockedMock);
                    expect(lockGameAccessStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call startGame on StartGame', (done) => {
                const startGameStub = sinon.stub(socketManager['gameManagementService'], 'startGame');
                clientSocket.emit(SocketEvents.StartGame);
                setTimeout(() => {
                    expect(startGameStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call goToResult on GoToResults', (done) => {
                const goToResultStub = sinon.stub(socketManager['gameManagementService'], 'goToResult');
                clientSocket.emit(SocketEvents.GoToResult);
                setTimeout(() => {
                    expect(goToResultStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call goToNextQuestion on GoToNextQuestion', (done) => {
                const goToNextQuestionStub = sinon.stub(socketManager['gameManagementService'], 'goToNextQuestion');
                clientSocket.emit(SocketEvents.GoToNextQuestion);
                setTimeout(() => {
                    expect(goToNextQuestionStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call togglePauseOfTimer on PauseTimer', (done) => {
                const togglePauseOfTimerStub = sinon.stub(socketManager['gameManagementService'], 'togglePauseOfTimer');
                clientSocket.emit(SocketEvents.PauseTimer);
                setTimeout(() => {
                    expect(togglePauseOfTimerStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call enterPanicMode on EnterPanicMode', (done) => {
                const enterPanicModeStub = sinon.stub(socketManager['gameManagementService'], 'enterPanicMode');
                clientSocket.emit(SocketEvents.EnterPanicMode);
                setTimeout(() => {
                    expect(enterPanicModeStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
        });
        describe('initializeGeneralEvent', () => {
            it('should call sendChatMessage on SendChatMessage', (done) => {
                const sendChatMessageStub = sinon.stub(socketManager['gameInteractionService'], 'sendChatMessage');
                clientSocket.emit(SocketEvents.SendChatMessage);
                setTimeout(() => {
                    expect(sendChatMessageStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call giveLongResponsePoints on EvaluationLongResponse', (done) => {
                const giveLongResponsePointsStub = sinon.stub(socketManager['gameInteractionService'], 'giveLongResponsePoints');
                clientSocket.emit(SocketEvents.EvaluationLongResponse);
                setTimeout(() => {
                    expect(giveLongResponsePointsStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
            it('should call getDurationStub on GetDuration', (done) => {
                const duration = 20;
                const getDurationStub = sinon.stub(socketManager['gameInfoService'], 'getDuration');
                getDurationStub.returns(duration);
                let durationReceived: number;
                clientSocket.emit(SocketEvents.GetDuration, (res: number) => {
                    durationReceived = res;
                });
                setTimeout(() => {
                    expect(durationReceived).to.equal(duration);
                    expect(getDurationStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });

            it('should return the value of isMuted on IsUserMuted', (done) => {
                const isUserMuted = true;
                const isUserMutedStub = sinon.stub(socketManager['gameManagementService'], 'isUserMuted');
                isUserMutedStub.returns(isUserMuted);
                let respondReceived: boolean;
                clientSocket.emit(SocketEvents.IsUserMuted, (res: boolean) => {
                    respondReceived = res;
                });
                setTimeout(() => {
                    expect(respondReceived).to.equal(isUserMuted);
                    expect(isUserMutedStub.called).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            });
        });
    });
});
