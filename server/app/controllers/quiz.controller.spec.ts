import { Application } from '@app/app';
import { QuizService } from '@app/services/quiz.service';
import { QuestionType } from '@common/question';
import { Quiz } from '@common/quiz';
import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';
describe('QuizController', () => {
    const testQuiz: Quiz[] = [
        {
            id: '1',
            title: 'General Knowledge',
            description: 'A quiz to test your general knowledge',
            duration: 30,
            lastModification: new Date(),
            questions: [
                {
                    type: QuestionType.MultipleChoices,
                    text: 'What is the capital of Canada?',
                    points: 10,
                    choices: [
                        { text: 'Toronto', isCorrect: false },
                        { text: 'Vancouver', isCorrect: false },
                        { text: 'Ottawa', isCorrect: true },
                        { text: 'Montreal', isCorrect: false },
                    ],
                },
                {
                    type: QuestionType.MultipleChoices,
                    text: 'The sun is a star.',
                    points: 10,
                    choices: [
                        { text: 'True', isCorrect: true },
                        { text: 'False', isCorrect: false },
                    ],
                },
            ],
            isVisible: true,
        },
    ];
    let quizService: SinonStubbedInstance<QuizService>;
    let expressApp: Express.Application;

    beforeEach(async () => {
        quizService = createStubInstance(QuizService);
        const app = Container.get(Application);
        Object.defineProperty(app['quizController'], 'quizService', { value: quizService, writable: true });
        expressApp = app.app;
    });

    it('should return all quizzes on valid get request to root', async () => {
        quizService.getAllQuizzes.resolves(testQuiz);
        return supertest(expressApp)
            .get('/api/admin/manage-games')
            .expect(StatusCodes.OK)
            .then((response) => {
                const expectedResponse = testQuiz.map((quiz) => ({
                    ...quiz,
                    lastModification: quiz.lastModification.toISOString(),
                }));
                expect(response.body).to.deep.equal(expectedResponse);
            });
    });

    it('should return 500 on invalid get all request to root', async () => {
        quizService.getAllQuizzes.rejects(new Error('Database connection error'));
        return supertest(expressApp).get('/api/admin/manage-games').expect(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return a quiz and 200 on valid get request to /{title}', async () => {
        quizService.findQuiz.resolves(testQuiz[0]);
        return supertest(expressApp)
            .get('/api/admin/manage-games/General Knowledge')
            .expect(StatusCodes.OK)
            .then((response) => {
                const expectedResponse = testQuiz.map((quiz) => ({
                    ...quiz,
                    lastModification: quiz.lastModification.toISOString(),
                }));
                expect(response.body).to.deep.equal(expectedResponse[0]);
            });
    });

    it('should return 404 on invalid get request to /{title}', async () => {
        quizService.findQuiz.rejects(new Error('Quiz not found'));
        return supertest(expressApp).get('/api/admin/manage-games/General Knowledge').expect(StatusCodes.NOT_FOUND);
    });

    it('should return 201 on valid post request to root', async () => {
        quizService.addQuiz.resolves();
        return supertest(expressApp)
            .post('/api/admin/manage-games')
            .send(testQuiz)
            .expect(StatusCodes.CREATED)
            .then((response) => {
                expect(response.body).to.deep.equal({});
            });
    });

    it('should return 400 on invalid post request to root', async () => {
        quizService.addQuiz.rejects(new Error('Invalid quiz'));
        return supertest(expressApp).post('/api/admin/manage-games').send(testQuiz).expect(StatusCodes.BAD_REQUEST);
    });

    it('should return 200 on valid patch request to root', async () => {
        quizService.modifyQuiz.resolves();
        return supertest(expressApp)
            .patch('/api/admin/manage-games')
            .send(testQuiz)
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body).to.deep.equal({});
            });
    });

    it('should return 400 on invalid patch request to root', async () => {
        quizService.modifyQuiz.rejects(new Error('Invalid quiz'));
        return supertest(expressApp).patch('/api/admin/manage-games').send(testQuiz).expect(StatusCodes.BAD_REQUEST);
    });

    it('should return 200 on valid delete request to /{id}', async () => {
        quizService.deleteQuiz.resolves();
        return supertest(expressApp).delete('/api/admin/manage-games/1').expect(StatusCodes.OK);
    });

    it('should return 404 on invalid delete request to /{id}', async () => {
        quizService.deleteQuiz.rejects(new Error('Quiz not found'));
        return supertest(expressApp).delete('/api/admin/manage-games/1').expect(StatusCodes.NOT_FOUND);
    });
});
