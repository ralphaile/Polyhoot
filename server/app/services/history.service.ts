import { GameHistory, GameInfo } from '@common/game';
import { User } from '@common/user';
import { Collection } from 'mongodb';
import { Service } from 'typedi';
import { DB_COLLECTION_HISTORY } from '../../assets/database-utils';
import { DatabaseService } from './database.service';

@Service()
export class HistoryService {
    constructor(private readonly databaseService: DatabaseService) {}

    get collection(): Collection<GameHistory> {
        return this.databaseService.database.collection(DB_COLLECTION_HISTORY);
    }

    async getHistory(): Promise<GameHistory[]> {
        return this.collection
            .find()
            .toArray()
            .then((history: GameHistory[]) => {
                return history;
            });
    }

    async addGameToHistory(game: GameInfo): Promise<void> {
        const gameHistory = this.createGameHistory(game);
        await this.collection.insertOne(gameHistory);
    }

    async deleteHistory(): Promise<void> {
        await this.collection.deleteMany({});
    }

    private createGameHistory(game: GameInfo): GameHistory {
        return {
            name: game.quiz.title,
            startTime: new Date(),
            players: game.players.length,
            bestScore: this.getHighestScore(game.players),
        };
    }

    private getHighestScore(players: User[]) {
        return players.reduce((acc, player) => {
            return player.points > acc ? player.points : acc;
        }, 0);
    }
}
