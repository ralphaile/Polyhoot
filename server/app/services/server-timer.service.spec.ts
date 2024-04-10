// Method needed to test private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SEC_TO_MS } from '@common/const';
import { GameInfo, GameState } from '@common/game';
import { QuestionType } from '@common/question';
import { SocketEvents } from '@common/socketEvents';
import { TimerMode } from '@common/timer';
import { expect } from 'chai';
import { Server } from 'http';
import * as sinon from 'sinon';
import * as io from 'socket.io';
import { TimeService } from './server-timer.service';

describe('TimeService', () => {
    let timeService: TimeService;
    let mockGame: GameInfo;
    let mockSio: io.Server;
    const server = new Server();
    let emitSpy: sinon.SinonSpy;

    beforeEach(() => {
        mockSio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        timeService = new TimeService(mockSio);
        mockGame = {} as GameInfo;
        timeService.gameInfo = mockGame;
        emitSpy = sinon.spy(mockSio, 'emit');
    });

    afterEach(() => {
        timeService['stopTimer']();
        sinon.restore();
    });

    describe('startTimer', () => {
        it('should call onTimerEnd after the specified time and send RefreshTimer', (done) => {
            const time = 1;
            const onTimerEnd = sinon.spy();
            mockGame.gameState = GameState.AnsweringQuestion;
            timeService.startTimer(time, onTimerEnd);

            expect(emitSpy.calledWith(SocketEvents.RefreshTimer));
            setTimeout(() => {
                expect(onTimerEnd.calledOnce).to.equal(true);
                done();
            }, time * SEC_TO_MS);
        });

        it('should not send RefreshTimer if the GameState is not AnsweringQuestion', () => {
            const time = 1;
            const onTimerEnd = sinon.spy();
            mockGame.gameState = GameState.QuestionFinalized;
            timeService.startTimer(time, onTimerEnd);

            expect(emitSpy.notCalled);
        });
    });

    describe('resetTimer', () => {
        it('should restart the timer with the new value', () => {
            const stopTimerSpy = sinon.spy(timeService as any, 'stopTimer');
            const setNormalTimerSpy = sinon.spy(timeService as any, 'setNormalTimer');
            const startTimerSpy = sinon.spy(timeService, 'startTimer');
            const time = 1;
            const onTimerEnd = sinon.spy();

            timeService.resetTimer(time, onTimerEnd);

            expect(stopTimerSpy.called).to.equal(true);
            expect(setNormalTimerSpy.called).to.equal(true);
            expect(startTimerSpy.calledWith(time, onTimerEnd)).to.equal(true);
        });
    });

    describe('enterPanicMode', () => {
        let stopTimerSpy: sinon.SinonSpy;
        let startTimerSpy: sinon.SinonSpy;

        beforeEach(() => {
            stopTimerSpy = sinon.spy(timeService as any, 'stopTimer');
            startTimerSpy = sinon.spy(timeService, 'startTimer');
        });
        it('should not enter PanicMode if all ready in PanicMode', () => {
            timeService['mode'] = { isInPanicMode: true } as TimerMode;

            timeService.enterPanicMode();

            expect(stopTimerSpy.notCalled);
            expect(startTimerSpy.notCalled);
        });
        it('should enter PanicMode if not all ready in PanicMode', () => {
            timeService['mode'] = { isInPanicMode: false } as TimerMode;

            timeService.enterPanicMode();

            expect(stopTimerSpy.called);
            expect(timeService['mode'].isInPanicMode).to.equal(true);
            expect(startTimerSpy.calledWith(timeService.time, timeService['onTimeEndFunction']));
        });
    });

    describe('togglePause', () => {
        it('should toggle isPause and emit ToggleTimerSpin', () => {
            timeService['mode'] = { isPaused: false } as TimerMode;

            timeService.togglePause();

            expect(timeService['mode'].isPaused).to.equal(true);
            expect(emitSpy.calledWith(SocketEvents.ToggleTimerSpin));
        });
    });

    describe('canGoInPanicMode', () => {
        it('should return false if type is LongAnswer and counter greater than 20 ', () => {
            timeService['counter'] = 30;
            expect(timeService.canGoInPanicMode(QuestionType.LongAnswer)).to.equal(false);
        });
        it('should return true if type is LongAnswer and counter smaller than 20', () => {
            timeService['counter'] = 10;
            expect(timeService.canGoInPanicMode(QuestionType.LongAnswer)).to.equal(true);
        });
        it('should return false if type is MultipleChoices and counter greater than 10', () => {
            timeService['counter'] = 20;
            expect(timeService.canGoInPanicMode(QuestionType.MultipleChoices)).to.equal(false);
        });
        it('should return true if type is MultipleChoices and counter smaller than 10', () => {
            timeService['counter'] = 5;
            expect(timeService.canGoInPanicMode(QuestionType.MultipleChoices)).to.equal(true);
        });
    });

    describe('tickDown', () => {
        it('should not tickDown if the TimerMode is Stopped', () => {
            const initialCount = 10;
            timeService['counter'] = initialCount;
            timeService['mode'] = { isPaused: true } as TimerMode;
            timeService['tickDown']();
            expect(timeService['counter']).to.equal(initialCount);
        });
        it('should tickDown and send the RefreshTimer to all users when AnsweringQuestion', () => {
            timeService['mode'] = { isPaused: false } as TimerMode;
            timeService['game'].gameState = GameState.AnsweringQuestion;
            timeService['tickDown']();
            expect(emitSpy.calledWith(SocketEvents.RefreshTimer));
        });
        it('should tickDown but not send the RefreshTimer when not AnsweringQuestion', () => {
            timeService['mode'] = { isPaused: false } as TimerMode;
            timeService['game'].gameState = GameState.QuestionFinalized;
            timeService['tickDown']();
            expect(emitSpy.notCalled);
        });
    });
});
