// Need more line to make the tests
/* eslint-disable max-lines */
// Method needed to test private methods
/* eslint-disable @typescript-eslint/no-explicit-any */
// import { GameInfo } from '@common/game';
import { EvaluatedLongResponse } from '@common/longResponse';
import { Choice, Question } from '@common/question';
import { expect } from 'chai';
import { Server } from 'http';
import { describe } from 'mocha';
import * as sinon from 'sinon';
import * as io from 'socket.io';
import { GameInformationService } from './game-info.service';
import { GraphInfoService } from './graph-info.service';

describe('GraphInfoService', () => {
    let graphInfoService: GraphInfoService;
    let gameInfoServiceStub: sinon.SinonStubbedInstance<GameInformationService>;
    let mockQuestion: Question;
    const server = new Server();

    beforeEach(() => {
        gameInfoServiceStub = sinon.createStubInstance(GameInformationService);
        gameInfoServiceStub['sio'] = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        graphInfoService = new GraphInfoService(gameInfoServiceStub);

        mockQuestion = {
            choices: [
                {
                    nbOfSelection: 0,
                } as Choice,
                {
                    nbOfSelection: 0,
                } as Choice,
                {
                    nbOfSelection: 0,
                } as Choice,
            ],
        } as Question;
    });

    afterEach(() => {
        sinon.restore();
        server.close();
    });

    describe('modifyChoicesForHistogram', () => {
        let mockEvaluatedLongResponse: EvaluatedLongResponse;
        beforeEach(() => {
            mockEvaluatedLongResponse = {
                userName: 'Player Name',
            } as EvaluatedLongResponse;
        });
        it('should increase the nbOfSelection of choice 0 when multiplier is 0', () => {
            mockEvaluatedLongResponse.multiplier = 0;
            graphInfoService.modifyChoicesForHistogram(mockQuestion, mockEvaluatedLongResponse);
            expect(mockQuestion.choices[0].nbOfSelection).to.equal(1);
        });
        it('should increase the nbOfSelection of choice 1 when multiplier is 0.5', () => {
            mockEvaluatedLongResponse.multiplier = 0.5;
            graphInfoService.modifyChoicesForHistogram(mockQuestion, mockEvaluatedLongResponse);
            expect(mockQuestion.choices[1].nbOfSelection).to.equal(1);
        });
        it('should increase the nbOfSelection of choice 2 when multiplier is 1', () => {
            mockEvaluatedLongResponse.multiplier = 1;
            graphInfoService.modifyChoicesForHistogram(mockQuestion, mockEvaluatedLongResponse);
            expect(mockQuestion.choices[2].nbOfSelection).to.equal(1);
        });
    });
});
