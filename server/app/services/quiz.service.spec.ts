// // This code comes greatly from MongoDB-Example from LOG2990 class
import { ErrorMessage } from '@common/errors';
import { Question, QuestionType } from '@common/question';
import { Quiz } from '@common/quiz';
import * as chai from 'chai';
import { expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe } from 'mocha';
import { MongoClient } from 'mongodb';
import * as sinon from 'sinon';
import { DatabaseServiceMock } from './database.service.mock';
import { QuestionService } from './question.service';
import { QuizService } from './quiz.service';
chai.use(chaiAsPromised);

describe('Quiz service', () => {
    let questionService: QuestionService;
    let quizService: QuizService;
    let databaseService: DatabaseServiceMock;
    let client: MongoClient;
    let testQuiz: Quiz;

    beforeEach(async () => {
        databaseService = new DatabaseServiceMock();
        // We need to cast databaseService to any here because we're passing a mock object
        // that doesn't have the same type as the expected parameter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questionService = new QuestionService(databaseService as any);
        client = (await databaseService.start()) as MongoClient;
        quizService = new QuizService(databaseService as never, questionService);
        testQuiz = {
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
        };
        await quizService.collection.insertOne(testQuiz);
    });

    afterEach(async () => {
        await databaseService.closeConnection();
    });

    it('should get all quizzes from DB', async () => {
        const quizzes = await quizService.getAllQuizzes();
        expect(quizzes.length).to.equal(1);
        expect(testQuiz).to.deep.equals(quizzes[0]);
    });

    it('should get specific quiz with valid title', async () => {
        const quiz = await quizService.findQuiz('General Knowledge');
        expect(testQuiz).to.deep.equals(quiz);
    });

    it('should get null with a title that does not exist', async () => {
        const quiz = await quizService.findQuiz('Not a quiz that exists');
        expect(quiz).to.deep.equals(null);
    });

    it('should insert a new quiz', async () => {
        const newQuiz: Quiz = testQuiz;
        newQuiz.id = '2';
        newQuiz.title = 'newQuiz';
        newQuiz.questions[0].text = 'question 1';
        newQuiz.questions[1].text = 'question 2';

        await quizService.addQuiz(newQuiz);
        const quizzes = await quizService.collection.find({}).toArray();
        expect(quizzes.length).to.equal(2);
        expect(quizzes.find((x) => x.id === newQuiz.id)).to.deep.equals(newQuiz);
    });

    it('should not insert a new Quiz if it has the same title as another one already in db', async () => {
        const newQuiz: Quiz = testQuiz;
        newQuiz.id = '2';

        try {
            await quizService.addQuiz(newQuiz);
            expect.fail('Expect an error to be thrown when adding a quiz with the same title.');
        } catch {
            const quizzes = await quizService.collection.find({}).toArray();
            expect(quizzes.length).to.equal(1);
        }
    });

    it('should modify an existing quiz data if a valid quiz format is sent', async () => {
        const modifiedQuiz = await quizService.findQuiz('General Knowledge');
        modifiedQuiz.title = 'Modified quiz';
        modifiedQuiz.isVisible = !modifiedQuiz.isVisible;
        await quizService.modifyQuiz(modifiedQuiz);
        const quizzes = await quizService.collection.find({}, { projection: { _id: 0 } }).toArray();
        expect(quizzes.length).to.equal(1);
        expect(quizzes.find((x) => x.id === modifiedQuiz.id)).to.deep.equals(modifiedQuiz);
    });

    it('should not modify an existing quiz data if another quiz has the same title has the new one', async () => {
        const newQuiz: Quiz = testQuiz;
        newQuiz.id = '2';
        newQuiz.title = 'newQuiz';
        newQuiz.questions[0].text = 'question 1';
        newQuiz.questions[1].text = 'question 2';

        await quizService.addQuiz(newQuiz);
        const modifiedQuiz = await quizService.findQuiz('newQuiz');
        const oldTitle = modifiedQuiz.title;
        modifiedQuiz.title = 'General Knowledge';
        await expect(quizService.modifyQuiz(modifiedQuiz)).to.eventually.be.rejectedWith(Error);

        const quizzes = await quizService.collection.find({}).toArray();
        expect(quizzes.length).to.equal(2);
        expect(quizzes.find((x) => x.title === oldTitle).id).to.equal(modifiedQuiz.id);
    });

    it('should delete an existing quiz data if a valid id is sent', async () => {
        const quiz = await quizService.findQuiz('General Knowledge');
        await quizService.deleteQuiz(quiz.id);
        const quizzes = await quizService.collection.find({}).toArray();
        expect(quizzes.length).to.equal(0);
    });

    it('should not modify an existing quiz data if the quiz title is empty', async () => {
        const modifiedQuiz = await quizService.findQuiz('General Knowledge');
        modifiedQuiz.title = '';
        await expect(quizService.modifyQuiz(modifiedQuiz)).to.eventually.be.rejectedWith(Error);
        const quizzes = await quizService.collection.find({}).toArray();
        expect(quizzes.find((x) => x.title === '')).to.not.equal(modifiedQuiz);
    });

    it('should not modify an existing quiz data if there is no questions', async () => {
        const modifiedQuiz = await quizService.findQuiz('General Knowledge');
        modifiedQuiz.questions = [];
        await expect(quizService.modifyQuiz(modifiedQuiz)).to.eventually.be.rejectedWith(Error);
        const quizzes = await quizService.collection.find({}).toArray();
        expect(quizzes.find((x) => x.title === 'General Knowledge').questions).to.not.equal([]);
    });

    it('should not modify an existing quiz data if the duration is invalid', async () => {
        const modifiedQuiz = await quizService.findQuiz('General Knowledge');
        modifiedQuiz.duration = -1;
        await expect(quizService.modifyQuiz(modifiedQuiz)).to.eventually.be.rejectedWith(Error);
        const quizzes = await quizService.collection.find({}).toArray();
        expect(quizzes.find((x) => x.title === 'General Knowledge').duration).to.not.equal(0);
    });

    it('should not modify an existing quiz data if one question is invalid', async () => {
        const modifiedQuiz = await quizService.findQuiz('General Knowledge');
        modifiedQuiz.questions[0].text = '';
        await expect(quizService.modifyQuiz(modifiedQuiz)).to.eventually.be.rejectedWith(Error);
        const quizzes = await quizService.collection.find({}).toArray();
        expect(quizzes.find((x) => x.title === 'General Knowledge').questions[0].text).to.not.equal('');
    });

    it('should call questionService.validateLongAnswerQuestion if question type is LongAnswer', async () => {
        const validateStub = sinon.stub(questionService, 'validateLongAnswerQuestion');
        const quiz = testQuiz;
        quiz.questions[0].type = QuestionType.LongAnswer;
        quizService['validateQuestion'](quiz.questions[0]);
        sinon.assert.calledOnce(validateStub);
    });

    it('should throw an error if question type does not exist', () => {
        const quiz = testQuiz;
        quiz.questions[0].type = 'notAQuestionType' as QuestionType;
        try {
            quizService['validateQuestion'](quiz.questions[0]);
            expect.fail('Expect an error to be thrown when question type does not exist.');
        } catch (error) {
            expect(error.message).to.equal(ErrorMessage.InvalidQuestionType);
        }
    });

    describe('Error handling', async () => {
        it('should throw an error if we try to get all quizzes on a closed connection', async () => {
            await client.close();
            await expect(quizService.getAllQuizzes()).to.eventually.be.rejectedWith(Error);
        });

        it('should throw an error if we try to get a specific quiz on a closed connection', async () => {
            await client.close();
            await expect(quizService.findQuiz(testQuiz.title)).to.eventually.be.rejectedWith(Error);
        });

        it('should throw an error if we try to add a quiz on a closed connection', async () => {
            await client.close();
            await expect(quizService.addQuiz(testQuiz)).to.eventually.be.rejectedWith(Error);
        });

        it('should throw an error if we try to delete a specific quiz on a closed connection', async () => {
            await client.close();
            await expect(quizService.deleteQuiz('id')).to.eventually.be.rejectedWith(Error);
        });
        it("should throw an error if we try to delete a quiz that doesn't exist", async () => {
            await expect(quizService.deleteQuiz('id')).to.eventually.be.rejectedWith(Error);
        });
        it('should throw an error if we try to add a quiz that with an empty title', async () => {
            const newQuiz = testQuiz;
            newQuiz.title = '';
            await expect(quizService.addQuiz(newQuiz)).to.eventually.be.rejectedWith(Error);
        });
        it("should throw an error if we try to add a quiz with an id that isn't a string", async () => {
            const quiz = {
                id: 123,
                title: 'Title',
                description: 'Description',
                duration: 30,
                lastModification: new Date(),
                questions: [] as Question[],
                isVisible: true,
            };
            await expect(quizService.addQuiz(quiz as unknown as Quiz)).to.eventually.be.rejectedWith(
                Error,
                `L'ID du quiz doit être une chaîne de caractères, reçu ${typeof quiz.id}`,
            );
        });
        it("should throw an error if we try to add a quiz with a title that isn't a string", async () => {
            const quiz = {
                id: '123',
                title: 123,
                description: 'Description',
                duration: 30,
                lastModification: new Date(),
                questions: [] as Question[],
                isVisible: true,
            };
            await expect(quizService.addQuiz(quiz as unknown as Quiz)).to.eventually.be.rejectedWith(
                Error,
                `Le titre du quiz doit être une chaîne de caractères, reçu ${typeof quiz.title}`,
            );
        });
        it("should throw an error if we try to add a quiz with a description that isn't a string", async () => {
            const quiz = {
                id: '123',
                title: 'title',
                description: 123,
                duration: 30,
                lastModification: new Date(),
                questions: [] as Question[],
                isVisible: true,
            };
            await expect(quizService.addQuiz(quiz as unknown as Quiz)).to.eventually.be.rejectedWith(
                Error,
                `La description du quiz doit être une chaîne de caractères, reçu ${typeof quiz.description}`,
            );
        });

        it("should throw an error if we try to add a quiz with questions that isn't an array of question", async () => {
            const quiz = {
                id: '123',
                title: 'title',
                description: '123',
                duration: 30,
                lastModification: new Date(),
                questions: 'test',
                isVisible: true,
            };
            await expect(quizService.addQuiz(quiz as unknown as Quiz)).to.eventually.be.rejectedWith(
                Error,
                `Les questions du quiz doivent être un tableau, reçu ${typeof quiz.questions}`,
            );
        });
        it("should throw an error if we try to add a quiz with isVisible that isn't a boolean", async () => {
            const quiz = {
                id: '123',
                title: 'title',
                description: '123',
                duration: 30,
                lastModification: new Date(),
                questions: [] as Question[],
                isVisible: 'true',
            };
            await expect(quizService.addQuiz(quiz as unknown as Quiz)).to.eventually.be.rejectedWith(
                Error,
                `isVisible du quiz doit être un booléen, reçu ${typeof quiz.isVisible}`,
            );
        });
        it("should throw an error if we try to add a quiz with a duration that isn't a number", async () => {
            const quiz = {
                id: '123',
                title: 'title',
                description: '123',
                duration: '30',
                lastModification: new Date(),
                questions: [] as Question[],
                isVisible: 'true',
            };
            await expect(quizService.addQuiz(quiz as unknown as Quiz)).to.eventually.be.rejectedWith(
                Error,
                `La durée du quiz doit être un nombre, reçu ${typeof quiz.duration}`,
            );
        });

        it('should throw an error if we try to add a quiz with faulty questions', async () => {
            const oldQuiz = testQuiz;
            oldQuiz.title = 'newTitle';
            oldQuiz.questions[0].points = 5;
            await expect(quizService.addQuiz(oldQuiz)).to.eventually.be.rejectedWith(Error);
        });

        it('should throw an error if we try to modify a specific quiz on a closed connection', async () => {
            await client.close();
            await expect(quizService.modifyQuiz({} as Quiz)).to.eventually.be.rejectedWith(Error);
        });

        it("should throw an error if we try to modify a quiz that doesn't exist", async () => {
            await expect(quizService.modifyQuiz({} as Quiz)).to.eventually.be.rejectedWith(Error);
        });

        it('should throw an error if we try to find a quiz on closed connection', async () => {
            await client.close();
            await expect(quizService.findQuiz('notAQUiz')).to.eventually.be.rejectedWith(Error);
        });
    });
});
