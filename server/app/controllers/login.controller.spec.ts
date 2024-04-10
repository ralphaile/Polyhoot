import { Application } from '@app/app';
import { LoginService } from '@app/services/login.service';
import { StatusCodes } from 'http-status-codes';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';

describe('LoginController', () => {
    let loginService: SinonStubbedInstance<LoginService>;
    let expressApp: Express.Application;

    beforeEach(async () => {
        loginService = createStubInstance(LoginService);
        const app = Container.get(Application);
        Object.defineProperty(app['loginController'], 'loginService', { value: loginService, writable: true });
        expressApp = app.app;
    });

    it('should return true when password is correct', async () => {
        loginService.authenticate.resolves(true);

        return supertest(expressApp).post('/api/login').send({ password: 'correct' }).expect(StatusCodes.OK);
    });

    it('should return false when password is incorrect', async () => {
        loginService.authenticate.resolves(false);

        return supertest(expressApp).post('/api/login').send({ password: 'incorrect' }).expect(StatusCodes.OK);
    });
});
