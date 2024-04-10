import { LoginService } from '@app/services/login.service';
import { Request, Response, Router } from 'express';
import { Service } from 'typedi';
@Service()
export class LoginController {
    router: Router;
    constructor(private readonly loginService: LoginService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.post('/', async (req: Request, res: Response) => {
            const password: string = req.body.password;
            const isAdmin: boolean = await this.loginService.authenticate(password);
            return res.json(isAdmin);
        });
    }
}
