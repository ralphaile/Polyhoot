import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogRef } from '@angular/material/dialog';
import { AppMaterialModule } from '@app/modules/material.module';
import { ConfirmationDialogService } from '@app/services/confirmation-dialog.service';
import { DatabaseService } from '@app/services/database.service';
import { HistorySorterService } from '@app/services/history-sorter.service';
import { GameHistory } from '@common/game';
import { of } from 'rxjs';
import { HistoryComponent } from './history.component';

describe('HistoryComponent', () => {
    let component: HistoryComponent;
    let fixture: ComponentFixture<HistoryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HistoryComponent],
            imports: [HttpClientTestingModule, AppMaterialModule, MatButtonToggleModule],
            providers: [{ provide: MatDialogRef, useValue: {} }],
            schemas: [NO_ERRORS_SCHEMA, AppMaterialModule],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(HistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get the history and sort it', async () => {
        const spy1 = spyOn(TestBed.inject(DatabaseService), 'getHistory');
        const spy2 = spyOn(TestBed.inject(HistorySorterService), 'sortHistory');
        await component.onSortChange();
        expect(spy1).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();
    });

    it('should delete the history', async () => {
        component.history = [{} as GameHistory];
        const spy = spyOn(TestBed.inject(DatabaseService), 'deleteHistory');
        await component.deleteHistory();
        expect(spy).toHaveBeenCalled();
        expect(component.history).toEqual([]);
    });

    it('should ask for delete confirmation', () => {
        const spy = spyOn(TestBed.inject(ConfirmationDialogService), 'openConfirmationDialog').and.returnValue({
            afterClosed: () => of(true),
            // Needed to mock the return value of the observer afterClosed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        component.deleteConfirmation();
        expect(spy).toHaveBeenCalled();
    });
});
