// We are checking if the database is undefined so we're not using those expressions
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */

// This code comes greatly from MongomongoDataBase-Example from LOG2990 class
import { fail } from 'assert';
import * as chai from 'chai';
import { expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe } from 'mocha';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as sinon from 'sinon';
import { DatabaseService } from './database.service';
chai.use(chaiAsPromised);

describe('Database service', () => {
    let databaseService: DatabaseService;
    let mongoServer: MongoMemoryServer;

    beforeEach(async () => {
        databaseService = new DatabaseService();
        mongoServer = await MongoMemoryServer.create();
    });

    afterEach(async () => {
        if (databaseService['client']) {
            await databaseService['client'].close();
        }
    });

    it('should get the database', () => {
        const mongoDataBase = databaseService.database;
        expect(mongoDataBase).to.be.equal(databaseService['mongoDataBase']);
    });

    it('should connect to the database when start is called', async () => {
        const mongoUri = mongoServer.getUri();
        await databaseService.start(mongoUri);
        expect(databaseService['client']).to.not.be.undefined;
        expect(databaseService['mongoDataBase'].databaseName).to.equal('LOG2990');
    });

    it('should connect to the database when start is called with no URL', async () => {
        await databaseService.start();
        expect(databaseService['client']).to.not.be.undefined;
        expect(databaseService['mongoDataBase'].databaseName).to.equal('LOG2990');
    });

    it('should not connect to the database when start is called with wrong URL', async () => {
        try {
            await databaseService.start('WRONG URL');
            fail();
        } catch {
            expect(databaseService['client']).to.be.undefined;
        }
    });

    it('should close the connection to the database when closeConnection is called', async () => {
        await databaseService.start();
        expect(databaseService['client']).to.not.be.undefined;
        const spy = sinon.spy(databaseService['client'], 'close');
        await databaseService.closeConnection();
        expect(spy.calledOnce).to.be.true;
    });
});
