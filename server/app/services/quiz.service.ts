import { DEFAULT_DURATION, DURATION_STEP, MAXIMUM_DURATION, MINIMUM_DURATION } from '@common/const';
import { ErrorMessage } from '@common/errors';
import { Question, QuestionType } from '@common/question';
import { Quiz } from '@common/quiz';
import { Collection } from 'mongodb';
import { Service } from 'typedi';
import { DB_COLLECTION_QUIZZES } from '../../assets/database-utils';
import { DatabaseService } from './database.service';
import { QuestionService } from './question.service';

type ValidationResult = { error: string } | true;

@Service()
export class QuizService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly questionService: QuestionService,
    ) {}

    get collection(): Collection<Quiz> {
        return this.databaseService.database.collection(DB_COLLECTION_QUIZZES);
    }

    async getAllQuizzes(): Promise<Quiz[]> {
        return this.collection
            .find()
            .toArray()
            .then((quizzes: Quiz[]) => {
                return quizzes;
            });
    }

    async addQuiz(quiz: Quiz): Promise<void> {
        await this.validateQuiz(quiz);
        quiz.id = Date.now().toString();
        quiz.lastModification = new Date();
        await this.collection.insertOne(quiz);
    }

    async deleteQuiz(id: string): Promise<void> {
        const quiz: Quiz = await this.collection.findOneAndDelete({ id });
        if (!quiz) {
            throw new Error(ErrorMessage.QuizNotFound);
        }
    }

    async modifyQuiz(quiz: Quiz): Promise<void> {
        await this.validateQuiz(quiz);
        await this.collection.replaceOne({ id: quiz.id }, quiz, { upsert: true });
    }

    async findQuiz(title: string): Promise<Quiz> {
        return await this.collection.findOne({ title }).catch(() => {
            throw new Error(ErrorMessage.DatabaseConnectionError);
        });
    }

    private async validateQuiz(quiz: Quiz): Promise<ValidationResult> {
        this.validateQuizKeys(quiz);

        if (this.isDurationValid(quiz.duration)) {
            throw new Error(ErrorMessage.InvalidQuizDuration);
        }

        if (quiz.questions.length === 0) {
            throw new Error(ErrorMessage.QuizMustHaveQuestions);
        }

        for (const [index, question] of quiz.questions.entries()) {
            this.validateQuizQuestion(question, index);
        }
        await this.validateQuizTitle(quiz);
        return true;
    }

    private validateQuizQuestion(question: Question, index: number) {
        try {
            this.validateQuestion(question);
        } catch (error) {
            throw new Error('Problème avec la question ' + (index + 1) + ': ' + error.message);
        }
    }

    private validateQuizKeys(quiz: Quiz) {
        this.validatePresenceOfKeys(quiz);
        this.validateQuizTypes(quiz);
    }

    private isDurationValid(duration: number): boolean {
        return duration < MINIMUM_DURATION || duration > MAXIMUM_DURATION || duration % DURATION_STEP !== 0;
    }

    private async validateQuizTitle(quiz: Quiz) {
        if (quiz.title === null || quiz.title.trim().length === 0) {
            throw new Error(ErrorMessage.EmptyQuizTitle);
        }
        const foundQuiz = await this.findQuiz(quiz.title.trim());
        if (foundQuiz && foundQuiz.id !== quiz.id) {
            throw new Error(ErrorMessage.SameQuizTitleExists);
        }
    }

    private validateQuestion(question: Question): void {
        if (question.type === QuestionType.MultipleChoices) {
            this.questionService.validateMultipleChoiceQuestion(question);
        } else if (question.type === QuestionType.LongAnswer) {
            this.questionService.validateLongAnswerQuestion(question);
        } else {
            throw new Error(ErrorMessage.InvalidQuestionType);
        }
    }

    private validateQuizTypes(quiz: Quiz) {
        if (typeof quiz.id !== 'string') {
            throw new Error(ErrorMessage.InvalidQuizIdType + ` ${typeof quiz.id}`);
        }

        if (typeof quiz.title !== 'string') {
            throw new Error(ErrorMessage.InvalidQuizTitleType + ` ${typeof quiz.title}`);
        }

        if (typeof quiz.description !== 'string') {
            throw new Error(ErrorMessage.InvalidQuizDescriptionType + ` ${typeof quiz.description}`);
        }

        if (typeof quiz.duration !== 'number') {
            throw new Error(ErrorMessage.InvalidQuizDurationType + ` ${typeof quiz.duration}`);
        }

        if (!Array.isArray(quiz.questions)) {
            throw new Error(ErrorMessage.InvalidQuizQuestionsType + ` ${typeof quiz.questions}`);
        }

        if (typeof quiz.isVisible !== 'boolean') {
            throw new Error(ErrorMessage.InvalidQuizVisibilityType + ` ${typeof quiz.isVisible}`);
        }
    }

    private validatePresenceOfKeys(quiz: Quiz) {
        const quizExample = this.getQuizExample();

        const quizKeys = Object.keys(quiz) as (keyof typeof quiz)[];
        const exampleKeys = Object.keys(quizExample);

        for (const key of quizKeys) {
            if (!exampleKeys.includes(key) && key !== 'id') {
                delete (quiz as unknown as Record<string, unknown>)[key];
            }
        }

        for (const key of exampleKeys) {
            if (!quizKeys.includes(key as keyof typeof quiz)) {
                throw new Error(ErrorMessage.MissingQuizAttributes + ` ${key}`);
            }
        }
    }

    private getQuizExample(): Quiz {
        return {
            title: 'JavaScript Basics',
            description: 'A quiz about the basics of JavaScript.',
            duration: DEFAULT_DURATION,
            lastModification: new Date(),
            questions: [] as Question[],
            isVisible: true,
        } as Quiz;
    }
}
