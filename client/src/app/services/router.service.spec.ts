import { TestBed } from '@angular/core/testing';

import { ActivatedRoute, Router } from '@angular/router';
import { RouterService } from './router.service';

class MockActivatedRoute {}

describe('RouterService', () => {
    let service: RouterService;
    let router: Router;
    let route: ActivatedRoute;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [Router, { provide: ActivatedRoute, useClass: MockActivatedRoute }, RouterService],
        }).compileComponents();

        service = TestBed.inject(RouterService);
        router = TestBed.inject(Router);
        route = TestBed.inject(ActivatedRoute);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return the router', () => {
        expect(service.getRouter()).toBe(router);
    });

    it('should return the route', () => {
        expect(service.getRoute()).toBe(route);
    });
});
