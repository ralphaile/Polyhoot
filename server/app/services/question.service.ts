import { MAXIMUM_CHOICES, MAXIMUM_POINTS, MINIMUM_CHOICES, MINIMUM_POINTS, MULTIPLE_OF_TEN } from '@common/const';
import { ErrorMessage } from '@common/errors';
import { Choice, Question, QuestionType } from '@common/question';
import { randomUUID } from 'crypto';
import { Collection } from 'mongodb';
import { Service } from 'typedi';
import { DB_COLLECTION_QUESTIONS } from '../../assets/database-utils';
import { DatabaseService } from './database.service';

@Service()
export class QuestionService {
    constructor(private readonly databaseService: DatabaseService) {}

    get collection(): Collection<Question> {
        return this.databaseService.database.collection(DB_COLLECTION_QUESTIONS);
    }

    async getAllQuestions(): Promise<Question[]> {
        return this.collection
            .find()
            .toArray()
            .then((questions: Question[]) => {
                return questions;
            })
            .catch(() => {
                throw new Error(ErrorMessage.DatabaseConnectionError);
            });
    }

    async addQuestion(question: Question): Promise<void> {
        await this.validateQuestion(question);
        question.id = randomUUID();
        question.lastModification = new Date().toString();
        await this.collection.insertOne(question);
    }

    async deleteQuestion(id: string): Promise<void> {
        try {
            const question: Question = await this.collection.findOneAndDelete({ id });
            if (!question) {
                throw new Error(ErrorMessage.QuestionNotFound);
            }
        } catch (error) {
            if (error.message !== 'Question not found') {
                throw new Error(ErrorMessage.DatabaseConnectionError);
            }
        }
    }

    async modifyQuestion(question: Question): Promise<void> {
        await this.validateQuestion(question);
        try {
            await this.collection.updateOne(
                { id: question.id },
                { $set: { lastModification: new Date().toString(), ...question } },
                { upsert: true },
            );
        } catch (error) {
            throw new Error(ErrorMessage.DatabaseConnectionError + ' ' + error);
        }
    }

    async findQuestion(text: string): Promise<Question> {
        if (!text || text.trim().length === 0) throw new Error(ErrorMessage.EmptyQuestionText);
        text = text.trim();
        return await this.collection.findOne({ text }).catch(() => {
            throw new Error(ErrorMessage.DatabaseConnectionError);
        });
    }

    async validateQuestion(question: Question): Promise<void> {
        const questionFound = await this.findQuestion(question.text);
        if (questionFound && questionFound.id !== question.id) {
            throw new Error(ErrorMessage.SimilarQuestionInBank);
        }

        this.validateQuestionByType(question);
    }

    async validatePlayerAnswers(questionId: string, playerChoices: boolean[]): Promise<boolean> {
        const question = await this.collection.findOne({ id: questionId });
        if (!question) throw new Error(ErrorMessage.QuestionNotFound);

        return question.choices.every((choice, index: number) => choice.isCorrect === playerChoices[index]);
    }

    async getCorrectAnswersForCurrentQuestion(questionId: string): Promise<boolean[]> {
        const question = await this.collection.findOne({ id: questionId });
        if (!question) throw new Error(ErrorMessage.QuestionNotFound);

        return question.choices.map((choice) => choice.isCorrect);
    }

    validateLongAnswerQuestion(question: Question): void {
        this.validateQuestionParameters(question);
        if (question.choices && question.choices.length !== 0) {
            throw new Error(ErrorMessage.LongAnswerWithChoices);
        }
    }

    validateMultipleChoiceQuestion(question: Question): void {
        this.validateQuestionParameters(question);
        this.validateChoices(question);
    }

    private validateQuestionParameters(question: Question): void {
        this.validateQuestionKeys(question);
        this.validateParametersValues(question);
    }

    private validateChoices(question: Question): void {
        if (question.choices.length < MINIMUM_CHOICES || question.choices.length > MAXIMUM_CHOICES) {
            throw new Error(ErrorMessage.WrongNumberOfChoices);
        }
        this.validateChoicesKeys(question.choices);
    }

    private validateChoicesKeys(choices: Choice[]): void {
        let isOneValid = false;
        let isOneInvalid = false;

        for (const choice of choices) {
            this.validateChoiceKeys(choice);
            this.validateChoiceTypes(choice);
            this.validateChoiceText(choice);
            if (choice.isCorrect) {
                isOneValid = true;
            } else {
                isOneInvalid = true;
            }
        }
        if (!isOneValid) {
            throw new Error(ErrorMessage.NoRightChoice);
        }
        if (!isOneInvalid) {
            throw new Error(ErrorMessage.NoWrongChoice);
        }
    }

    private isTextFormat(input: string): boolean {
        // Vérifier si la chaîne ne contient pas d'image, de vidéo ou de lien hypertexte
        const regex = /^(?!.*\.(jpg|jpeg|png|gif|bmp|svg|mp4|avi|mp3|wav|ogg)|https?:\/\/)/;
        return regex.test(input);
    }

    private validateQuestionKeys(question: Question) {
        const expectedKeys: (keyof Question)[] = ['type', 'text', 'points'];
        const optionalKeys: (keyof Question)[] = ['id', 'lastModification', '_id' as keyof Question];
        this.addChoicesKey(question, expectedKeys, optionalKeys);

        const allExpectedKeys = [...expectedKeys, ...optionalKeys];
        const additionalKeys = Object.keys(question).filter((key) => !allExpectedKeys.includes(key as keyof Question));
        if (additionalKeys.length > 0) {
            throw new Error(ErrorMessage.NonValidQuestionAttributes + ` ${additionalKeys.join(', ')}`);
        }
        const missingKeys = expectedKeys.filter((key) => !(key in question));
        if (missingKeys.length > 0) {
            throw new Error(ErrorMessage.MissingQuestionAttributes + ` ${missingKeys.join(', ')}`);
        }
        if (typeof question.points !== 'number') {
            throw new Error(ErrorMessage.InvalidPointsType + ` ${typeof question.points}`);
        }
    }

    private addChoicesKey(question: Question, expectedKeys: (keyof Question)[], optionalKeys: (keyof Question)[]) {
        if (question.type === QuestionType.MultipleChoices) {
            expectedKeys.push('choices');
        } else {
            optionalKeys.push('choices');
        }
    }

    private validateQuestionByType(question: Question) {
        if (question.type === QuestionType.MultipleChoices) {
            this.validateMultipleChoiceQuestion(question);
        } else if (question.type === QuestionType.LongAnswer) {
            this.validateLongAnswerQuestion(question);
        } else {
            throw new Error(ErrorMessage.InvalidQuestionType);
        }
    }

    private validateParametersValues(question: Question) {
        if (!question.text || question.text.trim().length === 0) {
            throw new Error(ErrorMessage.EmptyQuestionText);
        }
        if (question.points < MINIMUM_POINTS || question.points > MAXIMUM_POINTS || question.points % MULTIPLE_OF_TEN !== 0) {
            throw new Error(ErrorMessage.WrongPointsValue);
        }
        if (!this.isTextFormat(question.text)) {
            throw new Error(ErrorMessage.LinkInQuestionText);
        }
    }

    private validateChoiceTypes(choice: Choice) {
        if (typeof choice.text !== 'string') {
            throw new Error(ErrorMessage.InvalidChoiceType + ` ${typeof choice.text}`);
        }

        if (typeof choice.isCorrect !== 'boolean') {
            throw new Error(ErrorMessage.InvalidIsCorrectType + ` ${typeof choice.isCorrect}`);
        }
    }

    private validateChoiceText(choice: Choice) {
        if (choice.text.trim().length === 0) {
            throw new Error(ErrorMessage.EmptyChoicesText);
        }
        if (!this.isTextFormat(choice.text)) {
            throw new Error(ErrorMessage.LinkInChoicesText);
        }
    }

    private validateChoiceKeys(choice: Choice) {
        const expectedKeys: (keyof Choice)[] = ['text', 'isCorrect'];

        const additionalKeys = Object.keys(choice).filter((key) => !expectedKeys.includes(key as keyof Choice));
        if (additionalKeys.length > 0) {
            throw new Error(ErrorMessage.NonValidChoiceAttributes + ` ${additionalKeys.join(', ')}`);
        }

        const missingKeys = expectedKeys.filter((key) => !(key in choice));
        if (missingKeys.length > 0) {
            throw new Error(ErrorMessage.MissingChoiceAttributes + ` ${missingKeys.join(', ')}`);
        }
    }
}
