import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/services/auth.service';
import { RouterService } from '@app/services/router.service';
import { Quiz } from '@common/quiz';
@Component({
    selector: 'app-manage-games-page',
    templateUrl: './manage-games-page.component.html',
    styleUrls: ['./manage-games-page.component.scss'],
})
export class ManageGamesPageComponent implements OnInit {
    isShowingForm: boolean;
    currentQuiz: Quiz | null;
    private router: Router;
    private route: ActivatedRoute;

    constructor(
        private readonly authService: AuthService,
        private readonly routerService: RouterService,
    ) {
        this.isShowingForm = false;
        this.currentQuiz = null;
        this.router = this.routerService.getRouter();
        this.route = this.routerService.getRoute();
    }
    changeView(quiz: Quiz | null): void {
        this.currentQuiz = quiz;
        this.isShowingForm = !this.isShowingForm;
    }
    ngOnInit() {
        if (!this.authService.getIsLoggedIn()) this.router.navigate(['/login'], { relativeTo: this.route, replaceUrl: true });
    }
}
