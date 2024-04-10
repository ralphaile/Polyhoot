import { QuizService } from '@app/services/quiz.service';
import { Quiz } from '@common/quiz';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class QuizController {
    router: Router;
    constructor(private readonly quizService: QuizService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/', async (req: Request, res: Response) => {
            try {
                const quizzes: Quiz[] = await this.quizService.getAllQuizzes();
                res.json(quizzes);
            } catch (error) {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.get('/:title', async (req: Request, res: Response) => {
            try {
                const quiz: Quiz = await this.quizService.findQuiz(req.params.text);
                res.json(quiz);
            } catch (error) {
                res.sendStatus(StatusCodes.NOT_FOUND);
            }
        });

        this.router.post('/', async (req: Request, res: Response) => {
            try {
                const quiz: Quiz = req.body;
                await this.quizService.addQuiz(quiz);
                res.sendStatus(StatusCodes.CREATED);
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).send(error.message);
            }
        });

        this.router.patch('/', async (req: Request, res: Response) => {
            try {
                const quiz: Quiz = req.body;
                await this.quizService.modifyQuiz(quiz);
                res.sendStatus(StatusCodes.OK);
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).send(error.message);
            }
        });

        this.router.delete('/:id', async (req: Request, res: Response) => {
            try {
                await this.quizService.deleteQuiz(req.params.id);
                res.sendStatus(StatusCodes.OK);
            } catch (error) {
                res.sendStatus(StatusCodes.NOT_FOUND);
            }
        });
    }
}
