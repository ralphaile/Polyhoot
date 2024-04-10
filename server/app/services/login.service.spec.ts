import { expect } from 'chai';
import { describe } from 'mocha';
import { DatabaseServiceMock } from './database.service.mock';
import { LoginService } from './login.service';

describe('LoginService', () => {
    let loginService: LoginService;
    let databaseService: DatabaseServiceMock;

    beforeEach(async () => {
        databaseService = new DatabaseServiceMock();
        await databaseService.start();
        loginService = new LoginService(databaseService as never);
        const password = 'log2990-306';
        await loginService.collection.insertOne({ password });
    });
    afterEach(async () => {
        await databaseService.closeConnection();
    });

    it('should authenticate with correct password', async () => {
        const isAuthenticated: boolean = await loginService.authenticate('log2990-306');
        expect(isAuthenticated).to.equal(true);
    });

    it('should not authenticate with incorrect password', async () => {
        const isAuthenticated = await loginService.authenticate('incorrectPassword');

        expect(isAuthenticated).to.equal(false);
    });
});
