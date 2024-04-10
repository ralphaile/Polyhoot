import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from '@app/services/alert.service';
import { AuthService } from '@app/services/auth.service';
import { RouterService } from '@app/services/router.service';
import { ErrorMessage } from '@common/errors';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
    password: string;
    private router: Router;
    private route: ActivatedRoute;

    constructor(
        private readonly authService: AuthService,
        private readonly routerService: RouterService,
        private readonly alertService: AlertService,
    ) {
        this.router = this.routerService.getRouter();
        this.route = this.routerService.getRoute();
        this.password = '';
    }

    async onLogin() {
        await this.authService.verifyPassword(this.password);
        this.verifyLogin();
    }

    private verifyLogin() {
        if (this.authService.getIsLoggedIn()) {
            this.router.navigate(['/admin'], { relativeTo: this.route });
        } else {
            this.alertService.showAlert(ErrorMessage.BadPassword);
            this.password = '';
        }
    }
}
