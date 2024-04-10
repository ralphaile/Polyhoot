import { QuestionService } from '@app/services/question.service';
import { ErrorMessage } from '@common/errors';
import { Question, QuestionType } from '@common/question';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class QuestionController {
    router: Router;
    constructor(private readonly questionService: QuestionService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/', async (req: Request, res: Response) => {
            try {
                const questions: Question[] = await this.questionService.getAllQuestions();
                res.json(questions);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.get('/:text', async (req: Request, res: Response) => {
            try {
                const question: Question = await this.questionService.findQuestion(req.params.text);
                res.json(question);
            } catch (error) {
                res.sendStatus(StatusCodes.NOT_FOUND);
            }
        });

        this.router.post('/', async (req: Request, res: Response) => {
            try {
                const question: Question = req.body;
                await this.questionService.addQuestion(question);
                res.sendStatus(StatusCodes.CREATED);
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).send(error.message);
            }
        });

        this.router.post('/validate', (req: Request, res: Response) => {
            try {
                const question: Question = req.body;
                this.validateQuestion(question);
                res.sendStatus(StatusCodes.OK);
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).send(error.message);
            }
        });

        this.router.patch('/', async (req: Request, res: Response) => {
            try {
                const question: Question = req.body;
                await this.questionService.modifyQuestion(question);
                res.sendStatus(StatusCodes.OK);
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).send(error.message);
            }
        });

        this.router.delete('/:id', async (req: Request, res: Response) => {
            try {
                await this.questionService.deleteQuestion(req.params.id);
                res.sendStatus(StatusCodes.OK);
            } catch (error) {
                res.sendStatus(StatusCodes.NOT_FOUND);
            }
        });

        this.router.post('/validate-answers', async (req: Request, res: Response) => {
            try {
                const { questionId, playerAnswers } = req.body;
                const isValid = await this.questionService.validatePlayerAnswers(questionId, playerAnswers);
                res.status(StatusCodes.OK).json({ isValid });
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
            }
        });

        this.router.post('/correct-answers', async (req: Request, res: Response) => {
            try {
                const { questionId } = req.body;
                const correctAnswers = await this.questionService.getCorrectAnswersForCurrentQuestion(questionId);
                res.status(StatusCodes.OK).json({ correctAnswers });
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
            }
        });
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
}
