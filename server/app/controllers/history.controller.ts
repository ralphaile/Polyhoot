import { HistoryService } from '@app/services/history.service';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class HistoryController {
    router: Router;
    constructor(private readonly historyService: HistoryService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/', async (req: Request, res: Response) => {
            try {
                const history = await this.historyService.getHistory();
                res.json(history);
            } catch {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });

        this.router.delete('/', async (req: Request, res: Response) => {
            try {
                await this.historyService.deleteHistory();
                res.sendStatus(StatusCodes.OK);
            } catch {
                res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
            }
        });
    }
}
