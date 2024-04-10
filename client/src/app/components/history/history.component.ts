import { Component } from '@angular/core';
import { ConfirmationDialogService } from '@app/services/confirmation-dialog.service';
import { DatabaseService } from '@app/services/database.service';
import { HistorySorterService } from '@app/services/history-sorter.service';
import { GameHistory, HistorySortType } from '@common/game';

@Component({
    selector: 'app-history',
    templateUrl: './history.component.html',
    styleUrls: ['./history.component.scss'],
})
export class HistoryComponent {
    isAscending: boolean;
    history: GameHistory[];
    sortType: string;

    constructor(
        private readonly databaseService: DatabaseService,
        private readonly historySorterService: HistorySorterService,
        private readonly confirmationDialogService: ConfirmationDialogService,
    ) {
        this.isAscending = true;
        this.sortType = HistorySortType.Date;
        this.onSortChange();
    }

    deleteConfirmation(): void {
        this.confirmationDialogService
            .openConfirmationDialog("Voulez-vous vraiment supprimer l'historique des parties?")
            .afterClosed()
            .subscribe((result) => {
                if (result) {
                    this.deleteHistory();
                }
            });
    }

    async onSortChange(): Promise<void> {
        const databaseHistory = await this.databaseService.getHistory();
        this.history = this.historySorterService.sortHistory(databaseHistory, this.isAscending, this.sortType);
    }

    async deleteHistory(): Promise<void> {
        await this.databaseService.deleteHistory();
        this.history = [];
    }
}
