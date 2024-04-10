import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { HistoryComponent } from '@app/components/history/history.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { HistoryPageComponent } from './history-page.component';

describe('HistoryPageComponent', () => {
    let component: HistoryPageComponent;
    let fixture: ComponentFixture<HistoryPageComponent>;
    class MockRouterActivatedRoute {
        navigate = jasmine.createSpy('navigate');
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HistoryPageComponent, HeaderComponent, HistoryComponent],
            imports: [HttpClientTestingModule, AppMaterialModule],
            providers: [
                {
                    provide: Router,
                    useClass: MockRouterActivatedRoute,
                },
                {
                    provide: ActivatedRoute,
                    useClass: MockRouterActivatedRoute,
                },
            ],
            schemas: [NO_ERRORS_SCHEMA, AppMaterialModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HistoryPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
