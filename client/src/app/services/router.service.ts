import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class RouterService {
    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
    ) {}

    getRouter(): Router {
        return this.router;
    }

    getRoute(): ActivatedRoute {
        return this.route;
    }
}
