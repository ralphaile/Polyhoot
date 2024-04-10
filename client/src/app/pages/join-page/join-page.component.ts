import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterService } from '@app/services/router.service';

@Component({
    selector: 'app-join-page',
    templateUrl: './join-page.component.html',
    styleUrls: ['./join-page.component.scss'],
})
export class JoinPageComponent {
    codeEntered: boolean;
    code: number;
    private router: Router;
    private route: ActivatedRoute;

    constructor(private readonly routerService: RouterService) {
        this.codeEntered = false;
        this.router = this.routerService.getRouter();
        this.route = this.routerService.getRoute();
    }

    codeSubmitted(code: number): void {
        this.codeEntered = true;
        this.code = code;
    }

    navigateToWaitingPage(): void {
        this.router.navigate(['/wait-game'], { relativeTo: this.route });
    }
}
