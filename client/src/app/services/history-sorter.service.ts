import { Injectable } from '@angular/core';
import { GameHistory, HistorySortType } from '@common/game';

@Injectable({
    providedIn: 'root',
})
export class HistorySorterService {
    sortHistory(history: GameHistory[], isAscending: boolean, sortType: string): GameHistory[] {
        if (sortType === HistorySortType.Date) {
            return this.sortHistoryByDate(history, isAscending);
        } else {
            return this.sortHistoryByName(history, isAscending);
        }
    }

    private sortHistoryByDate(history: GameHistory[], isAscending: boolean): GameHistory[] {
        if (!isAscending) {
            return history.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        } else {
            return history.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        }
    }

    private sortHistoryByName(history: GameHistory[], isAscending: boolean): GameHistory[] {
        if (!isAscending) {
            return history.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            return history.sort((a, b) => b.name.localeCompare(a.name));
        }
    }
}
