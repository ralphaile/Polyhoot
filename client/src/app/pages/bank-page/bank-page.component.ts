import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/services/auth.service';
import { RouterService } from '@app/services/router.service';
import { Question } from '@common/question';
@Component({
    selector: 'app-bank-page',
    templateUrl: './bank-page.component.html',
    styleUrls: ['./bank-page.component.scss'],
})
export class BankPageComponent implements OnInit {
    currentQuestion: Question | null;
    showingForm: boolean;
    private router: Router;
    private route: ActivatedRoute;

    constructor(
        private readonly authService: AuthService,
        private readonly routerService: RouterService,
    ) {
        this.currentQuestion = null;
        this.showingForm = false;
        this.router = this.routerService.getRouter();
        this.route = this.routerService.getRoute();
    }
    async changeView(question: Question | null): Promise<void> {
        this.currentQuestion = question;
        this.showingForm = !this.showingForm;
    }
    ngOnInit() {
        if (!this.authService.getIsLoggedIn()) this.router.navigate(['/login'], { relativeTo: this.route, replaceUrl: true });
    }
}
