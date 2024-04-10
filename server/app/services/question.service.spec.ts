// In order to test all of our functionalities, we are surpassing the max number of lines
/* eslint-disable max-lines */
// // This code comes greatly from MongoDB-Example from LOG2990 class
import { ErrorMessage } from '@common/errors';
import { Question, QuestionType } from '@common/question';
import * as chai from 'chai';
import { expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe } from 'mocha';
import { MongoClient } from 'mongodb';
import * as sinon from 'sinon';
import { stub } from 'sinon';
import { DatabaseServiceMock } from './database.service.mock';
import { QuestionService } from './question.service';

chai.use(chaiAsPromised);

describe('questions service', () => {
    let questionService: QuestionService;
    let databaseService: DatabaseServiceMock;
    let client: MongoClient;
    let testQuestion: Question;
    let secondQuestion: Question;
    let findOneStub: sinon.SinonStub;

    beforeEach(async () => {
        databaseService = new DatabaseServiceMock();
        client = (await databaseService.start()) as MongoClient;
        // We need to cast databaseService to any here because we're passing a mock object
        // that doesn't have the same type as the expected parameter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questionService = new QuestionService(databaseService as any);
        testQuestion = {
            type: QuestionType.MultipleChoices,
            text: 'Question Test',
            id: '0',
            points: 20,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
            ],
        };
        secondQuestion = {
            type: QuestionType.MultipleChoices,
            text: 'Second question is this',
            id: '1',
            points: 20,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
            ],
        };
        await questionService.collection.insertOne(testQuestion);
        await questionService.collection.insertOne(secondQuestion);
    });

    afterEach(async () => {
        await databaseService.closeConnection();
    });

    it('should get all questions from DB', async () => {
        const questions = await questionService.getAllQuestions();
        expect(questions.length).to.equal(2);
        expect(testQuestion).to.deep.equals(questions[0]);
        expect(secondQuestion).to.deep.equals(questions[1]);
    });

    it('should get specific question with valid text', async () => {
        const question = await questionService.findQuestion('Question Test');
        expect(question).to.deep.equals(testQuestion);
    });

    it('should get null with a text that does not exist', async () => {
        const question = await questionService.findQuestion('Not a question that exist');
        expect(question).to.deep.equals(null);
    });

    it('should insert a new question', async () => {
        const newQuestion: Question = {
            type: QuestionType.MultipleChoices,
            text: 'New question is this',
            points: 20,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
            ],
        };

        await questionService.addQuestion(newQuestion);
        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(3);
        expect(questions.find((x) => x.text === newQuestion.text)).to.deep.equals(newQuestion);
    });

    it('should not insert a new question if it has the same text as another one already in db', async () => {
        const newQuestion: Question = {
            type: QuestionType.MultipleChoices,
            text: 'Second question is this',
            points: 20,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
            ],
        };
        try {
            await questionService.addQuestion(newQuestion);
            expect.fail('Expect an error to be thrown when adding a question with the same text.');
        } catch {
            const questions = await questionService.collection.find({}).toArray();
            expect(questions.length).to.equal(2);
        }
    });

    it('should modify an existing question data if a valid question format is sent', async () => {
        const modifiedQuestion = await questionService.findQuestion('Question Test');
        modifiedQuestion.text = 'Modified Question';
        await questionService.modifyQuestion(modifiedQuestion);
        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(2);
        expect(questions.find((x) => x.text === modifiedQuestion.text).text).to.equals(modifiedQuestion.text);
        expect(questions.find((x) => x.text === modifiedQuestion.text).lastModification).to.not.equals(modifiedQuestion.lastModification);
    });

    it('should not modify an existing question data if another question has the same text has the new one', async () => {
        const modifiedQuestion = await questionService.findQuestion('Question Test');
        const oldText = modifiedQuestion.text;
        modifiedQuestion.text = 'Second question is this';
        await expect(questionService.modifyQuestion(modifiedQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.SimilarQuestionInBank);

        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(2);
        expect(questions.find((x) => x.text === oldText).text).to.equal(oldText);
    });

    it('should delete an existing question data if a valid id is sent', async () => {
        const question = await questionService.findQuestion('Question Test');
        await questionService.deleteQuestion(question.id);
        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(1);
    });

    it('should not delete a question if it has an invalid id ', async () => {
        try {
            await questionService.deleteQuestion('notAnId');
            expect.fail('Expect an error when the id to delete does not exist');
        } catch {
            const questions = await questionService.collection.find({}).toArray();
            expect(questions.length).to.equal(2);
        }
    });

    it('should not add a question with an invalid type', async () => {
        const newQuestion: Question = {
            type: QuestionType.All,
            text: 'Invalid type question',
            points: 20,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
            ],
        };

        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.InvalidQuestionType);
        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(2);
    });

    it('should not add a question with invalid point values', async () => {
        const newQuestion: Question = {
            type: QuestionType.MultipleChoices,
            text: 'Bad points',
            points: 21,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
            ],
        };
        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.WrongPointsValue);

        newQuestion.points = -1;
        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.WrongPointsValue);

        newQuestion.points = 101;
        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.WrongPointsValue);

        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(2);
    });
    it('should not add a question with choices that has too many keys', async () => {
        const newQuestion = {
            type: QuestionType.MultipleChoices,
            text: 'Invalid type question',
            points: 20,
            choices: [
                { text: 'a', isCorrect: true, test: 'should throw error' },
                { text: 'b', isCorrect: false },
            ],
        };

        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.NonValidChoiceAttributes + ' test');
        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(2);
    });
    it('should not add a question with choices that is missing keys', async () => {
        const newQuestion = {
            type: QuestionType.MultipleChoices,
            text: 'Invalid type question',
            points: 20,
            choices: [{ text: 'a' }, { text: 'b', isCorrect: false }],
        };

        await expect(questionService.addQuestion(newQuestion as Question)).to.eventually.be.rejectedWith(
            Error,
            ErrorMessage.MissingChoiceAttributes + ' isCorrect',
        );
        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(2);
    });
    it('should not add a question with choices that have text other than string', async () => {
        const newQuestion = {
            type: QuestionType.MultipleChoices,
            text: 'Invalid type question',
            points: 20,
            choices: [
                { text: 1323, isCorrect: true },
                { text: 'b', isCorrect: false },
            ],
        };

        await expect(questionService.addQuestion(newQuestion as Question)).to.eventually.be.rejectedWith(
            Error,
            ErrorMessage.InvalidChoiceType + ` ${typeof newQuestion.choices[0].text}`,
        );
        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(2);
    });
    it('should not add a question with choices that have isCorrect other than boolean', async () => {
        const newQuestion = {
            type: QuestionType.MultipleChoices,
            text: 'Invalid type question',
            points: 20,
            choices: [
                { text: 'a', isCorrect: null },
                { text: 'b', isCorrect: false },
            ],
        };

        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(
            Error,
            ErrorMessage.InvalidIsCorrectType + ` ${typeof newQuestion.choices[0].isCorrect}`,
        );
        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(2);
    });
    it('should not add a question with too many keys', async () => {
        const newQuestion = {
            type: QuestionType.MultipleChoices,
            text: 'Invalid type question',
            points: 20,
            choices: [
                { text: 'a', isCorrect: null },
                { text: 'b', isCorrect: false },
            ],
            extraKey: 'hi',
        };

        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(
            Error,
            ErrorMessage.NonValidQuestionAttributes + ' extraKey',
        );
        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(2);
    });
    it('should not add a question with missing keys', async () => {
        const newQuestion = {
            type: QuestionType.MultipleChoices,
            text: 'Invalid type question',
            choices: [
                { text: 'a', isCorrect: null },
                { text: 'b', isCorrect: false },
            ],
        };

        await expect(questionService.addQuestion(newQuestion as unknown as Question)).to.eventually.be.rejectedWith(
            Error,
            ErrorMessage.MissingQuestionAttributes + ' points',
        );
        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(2);
    });
    it("should not add a question where points isn't a number", async () => {
        const newQuestion = {
            type: QuestionType.MultipleChoices,
            text: 'Invalid type question',
            points: '20',
            choices: [
                { text: 'a', isCorrect: null },
                { text: 'b', isCorrect: false },
            ],
        };

        await expect(questionService.addQuestion(newQuestion as unknown as Question)).to.eventually.be.rejectedWith(
            Error,
            ErrorMessage.InvalidPointsType + ` ${typeof newQuestion.points}`,
        );
        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(2);
    });

    it('should not add a question with invalid choices', async () => {
        const newQuestion: Question = {
            type: QuestionType.MultipleChoices,
            text: 'Bad choices',
            points: 20,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
                { text: 'a', isCorrect: true },
            ],
        };
        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.WrongNumberOfChoices);

        newQuestion.choices = [{ text: 'a', isCorrect: true }];
        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.WrongNumberOfChoices);

        newQuestion.choices = [
            { text: 'a', isCorrect: true },
            { text: 'b', isCorrect: true },
        ];
        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.NoWrongChoice);

        newQuestion.choices = [
            { text: 'a', isCorrect: false },
            { text: 'b', isCorrect: false },
        ];
        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.NoRightChoice);

        newQuestion.choices = newQuestion.choices = [
            { text: '   ', isCorrect: true },
            { text: 'b', isCorrect: true },
        ];
        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.EmptyChoicesText);

        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(2);
    });

    it('should not add a question with invalid text format in question text', async () => {
        const newQuestion: Question = {
            type: QuestionType.MultipleChoices,
            text: 'https://www.youtube.com/',
            points: 20,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
            ],
        };
        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.LinkInQuestionText);

        newQuestion.text = ' ';
        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.EmptyQuestionText);
        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(2);
    });

    it('should not add a question with invalid text format in choices text', async () => {
        const newQuestion: Question = {
            type: QuestionType.MultipleChoices,
            text: 'Bad Choices text',
            points: 20,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'https://www.youtube.com/', isCorrect: false },
            ],
        };
        await expect(questionService.addQuestion(newQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.LinkInChoicesText);

        const questions = await questionService.collection.find({}).toArray();
        expect(questions.length).to.equal(2);
    });

    it('should throw an error if the question in validateLongAnswerQuestion as choices', () => {
        const question = {
            type: QuestionType.LongAnswer,
            text: 'Question Test',
            points: 20,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
            ],
        };
        try {
            questionService.validateLongAnswerQuestion(question);
            chai.assert.fail('Expected an error to be thrown');
        } catch (error) {
            expect(error).to.be.an.instanceOf(Error);
            expect(error.message).to.equal(ErrorMessage.LongAnswerWithChoices);
        }
    });

    it('should not throw an error if the question in validateLongAnswerQuestion does not have choices', () => {
        sinon.stub(questionService, 'validateQuestionParameters' as keyof QuestionService);
        const question = {
            type: QuestionType.LongAnswer,
            text: 'Question Test',
            points: 20,
            choices: [],
        } as Question;
        try {
            questionService.validateLongAnswerQuestion(question);
        } catch {
            chai.assert.fail('Expected no error to be thrown');
        }
    });

    it('should call validateLongAnswerQuestion if the question type is LongAnswer', async () => {
        const validateStub = sinon.stub(questionService, 'validateLongAnswerQuestion' as keyof QuestionService);
        sinon.stub(questionService, 'findQuestion');
        testQuestion.type = QuestionType.LongAnswer;
        await questionService.validateQuestion(testQuestion);
        sinon.assert.calledOnce(validateStub);
    });

    describe('Database error handling', async () => {
        it('should throw an error if we try to get all questions on a closed connection', async () => {
            await client.close();
            await expect(questionService.getAllQuestions()).to.eventually.be.rejectedWith(Error, ErrorMessage.DatabaseConnectionError);
        });

        it('should throw an error if we try to get a specific question on a closed connection', async () => {
            await client.close();
            await expect(questionService.findQuestion(testQuestion.text)).to.eventually.be.rejectedWith(Error, ErrorMessage.DatabaseConnectionError);
        });

        it('should throw an error if we try to add a question on a closed connection', async () => {
            await client.close();
            await expect(questionService.addQuestion(testQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.DatabaseConnectionError);
        });

        it('should throw an error if we try to delete a specific question on a closed connection', async () => {
            await client.close();
            await expect(questionService.deleteQuestion('id')).to.eventually.be.rejectedWith(Error, ErrorMessage.DatabaseConnectionError);
        });

        it('should throw an error if we try to modify a specific question on a closed connection', async () => {
            await client.close();
            await expect(questionService.modifyQuestion({ text: 'test' } as Question)).to.eventually.be.rejectedWith(
                Error,
                ErrorMessage.DatabaseConnectionError,
            );
        });

        it('should throw an error if we try to find a question on closed connection', async () => {
            await client.close();
            await expect(questionService.findQuestion('notAQuestion')).to.eventually.be.rejectedWith(Error, ErrorMessage.DatabaseConnectionError);
        });

        it('should throw an error if we try to validate a question on closed connection', async () => {
            await client.close();
            await expect(questionService.validateQuestion(testQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.DatabaseConnectionError);
        });

        it('should throw an error if connection closes before updating a modified question', async () => {
            await client.close();
            stub(questionService, 'validateQuestion' as keyof QuestionService).resolves(true);
            await expect(questionService.modifyQuestion(testQuestion)).to.eventually.be.rejectedWith(Error, ErrorMessage.DatabaseConnectionError);
        });
    });

    describe('validatePlayerAnswers', async () => {
        beforeEach(() => {
            const collectionStub = {
                findOne: sinon.stub(),
            };

            findOneStub = collectionStub.findOne;

            const databaseServiceStub = {
                database: { collection: sinon.stub().returns(collectionStub) },
            };

            questionService = new QuestionService(databaseServiceStub as never);
        });

        it('should validate player answers correctly', async () => {
            const questionId = 'someId';
            const playerChoices = [true, false];
            const mockQuestion = {
                id: questionId,
                choices: [{ isCorrect: true }, { isCorrect: false }],
            };

            findOneStub.withArgs({ id: questionId }).resolves(mockQuestion);

            const isValid = await questionService.validatePlayerAnswers(questionId, playerChoices);
            expect(isValid).to.equal(true);
            sinon.assert.calledOnce(findOneStub);
            sinon.assert.calledWith(findOneStub, { id: questionId });
        });

        it('should throw an error if the question is not found', async () => {
            const questionId = 'nonExistentId';
            const playerChoices = [true, false];

            findOneStub.withArgs({ id: questionId }).resolves(null);

            await expect(questionService.validatePlayerAnswers(questionId, playerChoices)).to.be.rejectedWith(Error, ErrorMessage.QuestionNotFound);
            sinon.assert.calledOnce(findOneStub);
            sinon.assert.calledWith(findOneStub, { id: questionId });
        });

        it('should return false when player answers do not match the correct answers', async () => {
            const questionId = 'someId';
            const playerChoices = [false, true];
            const mockQuestion = {
                id: questionId,
                choices: [{ isCorrect: true }, { isCorrect: false }],
            };

            findOneStub.withArgs({ id: questionId }).resolves(mockQuestion);

            const isValid = await questionService.validatePlayerAnswers(questionId, playerChoices);
            expect(isValid).to.equal(false);
            sinon.assert.calledOnce(findOneStub);
            sinon.assert.calledWith(findOneStub, { id: questionId });
        });

        it('should throw an error on unexpected database issues', async () => {
            const questionId = 'someId';
            const playerChoices = [true, false];

            findOneStub.withArgs({ id: questionId }).rejects(new Error('Unexpected database error'));

            await expect(questionService.validatePlayerAnswers(questionId, playerChoices)).to.be.rejectedWith(Error, 'Unexpected database error');
            sinon.assert.calledOnce(findOneStub);
            sinon.assert.calledWith(findOneStub, { id: questionId });
        });
    });

    describe('getCorrectAnswersForCurrentQuestion', () => {
        beforeEach(() => {
            const collectionStub = {
                findOne: sinon.stub(),
            };
            findOneStub = collectionStub.findOne;

            const databaseServiceStub = {
                database: { collection: sinon.stub().returns(collectionStub) },
            };

            questionService = new QuestionService(databaseServiceStub as never);
        });

        it('should return correct answers for a given question ID', async () => {
            const questionId = 'validQuestionId';
            const correctAnswers = [true, false, false, true];
            const mockQuestion = {
                id: questionId,
                choices: correctAnswers.map((isCorrect) => ({ isCorrect })),
            };

            findOneStub.withArgs({ id: questionId }).resolves(mockQuestion);

            const result = await questionService.getCorrectAnswersForCurrentQuestion(questionId);
            expect(result).to.deep.equal(correctAnswers);
            sinon.assert.calledOnce(findOneStub);
            sinon.assert.calledWith(findOneStub, { id: questionId });
        });

        it('should throw an error if the question is not found', async () => {
            const questionId = 'nonExistentId';
            findOneStub.withArgs({ id: questionId }).resolves(null);

            await expect(questionService.getCorrectAnswersForCurrentQuestion(questionId)).to.be.rejectedWith(Error, ErrorMessage.QuestionNotFound);
            sinon.assert.calledOnce(findOneStub);
            sinon.assert.calledWith(findOneStub, { id: questionId });
        });

        it('should throw an error on unexpected database issues', async () => {
            const questionId = 'someId';
            findOneStub.withArgs({ id: questionId }).rejects(new Error('Unexpected database error'));

            await expect(questionService.getCorrectAnswersForCurrentQuestion(questionId)).to.be.rejectedWith(Error, 'Unexpected database error');
            sinon.assert.calledOnce(findOneStub);
            sinon.assert.calledWith(findOneStub, { id: questionId });
        });
    });
});
