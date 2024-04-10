import { Injectable } from '@angular/core';
import { SortType } from '@common/sort';
import { User } from '@common/user';

@Injectable({
    providedIn: 'root',
})
export class PlayerListSortService {
    sortPlayerList(playerList: Omit<User, 'id'>[], sortType: string): Omit<User, 'id'>[] {
        switch (sortType) {
            case SortType.nameAscending:
                playerList.sort(this.sortByName);
                break;
            case SortType.nameDescending:
                playerList.sort(this.sortByReversedName);
                break;
            case SortType.state:
                playerList.sort((a, b) => a.state - b.state);
                break;
            case SortType.scoreAscending:
                playerList.sort(this.sortByReversedScore);
                break;
            case SortType.scoreDescending:
                playerList.sort(this.sortByScore);
                break;
            default:
                break;
        }
        return playerList;
    }

    private sortByScore(a: Omit<User, 'id'>, b: Omit<User, 'id'>): number {
        // The player should have points
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const pointsComparison = b.points! - a.points!;
        if (pointsComparison === 0) {
            return a.name.localeCompare(b.name);
        }
        return pointsComparison;
    }

    private sortByReversedScore(a: Omit<User, 'id'>, b: Omit<User, 'id'>): number {
        // The player should have points
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const pointsComparison = a.points! - b.points!;
        if (pointsComparison === 0) {
            return b.name.localeCompare(a.name);
        }
        return pointsComparison;
    }

    private sortByName(a: Omit<User, 'id'>, b: Omit<User, 'id'>) {
        return a.name.localeCompare(b.name);
    }

    private sortByReversedName(a: Omit<User, 'id'>, b: Omit<User, 'id'>) {
        return b.name.localeCompare(a.name);
    }
}
