import { Application } from '@app/app';
import { HistoryService } from '@app/services/history.service';
import { StatusCodes } from 'http-status-codes';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';

describe('HistoryController', () => {
    let historyService: SinonStubbedInstance<HistoryService>;
    let expressApp: Express.Application;

    beforeEach(async () => {
        historyService = createStubInstance(HistoryService);
        const app = Container.get(Application);
        Object.defineProperty(app['historyController'], 'historyService', { value: historyService, writable: true });
        expressApp = app.app;
    });

    it('should get the history', async () => {
        historyService.getHistory.resolves([]);

        return supertest(expressApp).get('/api/admin/history').expect(StatusCodes.OK);
    });

    it('should return server error if it cant get the history', async () => {
        historyService.getHistory.rejects(new Error('Database connection error'));

        return supertest(expressApp).get('/api/admin/history').expect(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should delete the history', async () => {
        historyService.deleteHistory.resolves();

        return supertest(expressApp).delete('/api/admin/history').expect(StatusCodes.OK);
    });

    it('should return server error if it cant delete the history', async () => {
        historyService.deleteHistory.rejects(new Error('Database connection error'));

        return supertest(expressApp).delete('/api/admin/history').expect(StatusCodes.INTERNAL_SERVER_ERROR);
    });
});
