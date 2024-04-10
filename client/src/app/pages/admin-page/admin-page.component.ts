import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/services/auth.service';
import { RouterService } from '@app/services/router.service';
@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
})
export class AdminPageComponent implements OnInit {
    private router: Router;
    private route: ActivatedRoute;
    constructor(
        private readonly authService: AuthService,
        private readonly routerService: RouterService,
    ) {
        this.router = this.routerService.getRouter();
        this.route = this.routerService.getRoute();
    }
    ngOnInit() {
        if (!this.authService.getIsLoggedIn()) this.router.navigate(['/login'], { relativeTo: this.route, replaceUrl: true });
    }
}
