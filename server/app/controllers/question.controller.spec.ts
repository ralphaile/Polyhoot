import { Application } from '@app/app';
import { QuestionService } from '@app/services/question.service';
import { Question, QuestionType } from '@common/question';
import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';
describe('QuestionsController', () => {
    const questions: Question[] = [
        {
            type: QuestionType.MultipleChoices,
            text: 'Question Test',
            points: 20,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
            ],
        },
        {
            type: QuestionType.LongAnswer,
            text: 'Second question is this',
            points: 20,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
            ],
        },
    ];
    let questionService: SinonStubbedInstance<QuestionService>;
    let expressApp: Express.Application;

    beforeEach(async () => {
        questionService = createStubInstance(QuestionService);
        const app = Container.get(Application);
        Object.defineProperty(app['questionController'], 'questionService', { value: questionService, writable: true });
        expressApp = app.app;
    });

    it('should return all questions on valid get request to root', async () => {
        questionService.getAllQuestions.resolves(questions);
        return supertest(expressApp)
            .get('/api/questions')
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body).to.deep.equal(questions);
            });
    });

    it('should return 500 on invalid get all request to root', async () => {
        questionService.getAllQuestions.rejects(new Error('Database connection error'));
        return supertest(expressApp).get('/api/questions').expect(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return a question and 200 on valid get request to /{text}', async () => {
        questionService.findQuestion.resolves(questions[0]);
        return supertest(expressApp)
            .get('/api/questions/Question Test')
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body).to.deep.equal(questions[0]);
            });
    });

    it('should return 404 on invalid get request to /{text}', async () => {
        questionService.findQuestion.rejects(new Error('Question not found'));
        return supertest(expressApp).get('/api/questions/Question Test').expect(StatusCodes.NOT_FOUND);
    });

    it('should return 201 on valid post request to root', async () => {
        questionService.addQuestion.resolves();
        return supertest(expressApp)
            .post('/api/questions')
            .send(questions[0])
            .expect(StatusCodes.CREATED)
            .then((response) => {
                expect(response.body).to.deep.equal({});
            });
    });

    it('should return 400 on invalid post request to root', async () => {
        questionService.addQuestion.rejects(new Error('Invalid question'));
        return supertest(expressApp).post('/api/questions').send(questions[0]).expect(StatusCodes.BAD_REQUEST);
    });

    it('should return 200 on valid patch request to root', async () => {
        questionService.modifyQuestion.resolves();
        return supertest(expressApp)
            .patch('/api/questions')
            .send(questions[0])
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body).to.deep.equal({});
            });
    });

    it('should return 400 on invalid patch request to root', async () => {
        questionService.modifyQuestion.rejects(new Error('Invalid question'));
        return supertest(expressApp).patch('/api/questions').send(questions[0]).expect(StatusCodes.BAD_REQUEST);
    });

    it('should return 200 on valid delete request to /{id}', async () => {
        questionService.deleteQuestion.resolves();
        return supertest(expressApp).delete('/api/questions/1').expect(StatusCodes.OK);
    });

    it('should return 404 on invalid delete request to /{id}', async () => {
        questionService.deleteQuestion.rejects(new Error('Question not found'));
        return supertest(expressApp).delete('/api/questions/1').expect(StatusCodes.NOT_FOUND);
    });

    it('should return true and 200 on valid validate-answers request', async () => {
        questionService.validatePlayerAnswers.resolves(true);
        return supertest(expressApp)
            .post('/api/questions/validate-answers')
            .send({ questionId: '1', playerAnswers: [true, false] })
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body.isValid).to.equal(true);
            });
    });

    it('should return false and 200 on invalid validate-answers request', async () => {
        questionService.validatePlayerAnswers.resolves(false);
        return supertest(expressApp)
            .post('/api/questions/validate-answers')
            .send({ questionId: '1', playerAnswers: [false, true] })
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body.isValid).to.equal(false);
            });
    });

    it('should return 500 on server error during validate-answers request', async () => {
        questionService.validatePlayerAnswers.rejects(new Error('Server error'));
        return supertest(expressApp)
            .post('/api/questions/validate-answers')
            .send({ questionId: '1', playerAnswers: [true, false] })
            .expect(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return correct answers and 200 on valid correct-answers request', async () => {
        questionService.getCorrectAnswersForCurrentQuestion.resolves([true, false]);
        return supertest(expressApp)
            .post('/api/questions/correct-answers')
            .send({ questionId: '1' })
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body.correctAnswers).to.deep.equal([true, false]);
            });
    });

    it('should return 500 on server error during correct-answers request', async () => {
        questionService.getCorrectAnswersForCurrentQuestion.rejects(new Error('Server error'));
        return supertest(expressApp).post('/api/questions/correct-answers').send({ questionId: '1' }).expect(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should return 200 if a valid QCM question is sent to /validate', async () => {
        questionService.validateLongAnswerQuestion.returns();
        return supertest(expressApp).post('/api/questions/validate').send(questions[1]).expect(StatusCodes.OK);
    });

    it('should return 200 if a valid QRL question is sent to /validate', async () => {
        questionService.validateMultipleChoiceQuestion.returns();
        return supertest(expressApp).post('/api/questions/validate').send(questions[0]).expect(StatusCodes.OK);
    });

    it('should return 200 if a valid question is sent to /validate', async () => {
        questionService.validateMultipleChoiceQuestion.returns();
        return supertest(expressApp).post('/api/questions/validate').send(questions[0]).expect(StatusCodes.OK);
    });

    it('should return 400 if an invalid question is sent to /validate', async () => {
        questionService.validateMultipleChoiceQuestion.throws(new Error('Invalid question'));
        return await supertest(expressApp).post('/api/questions/validate').send(questions[0]).expect(StatusCodes.BAD_REQUEST, 'Invalid question');
    });

    it('should return 400 if an invalid question type is sent to /validate', async () => {
        questionService.validateMultipleChoiceQuestion.returns();
        return await supertest(expressApp)
            .post('/api/questions/validate')
            .send({ type: 'invalid', text: 'Question Test', points: 20, choices: [] })
            .expect(StatusCodes.BAD_REQUEST, "Ce type de question n'est pas supporté");
    });
});
