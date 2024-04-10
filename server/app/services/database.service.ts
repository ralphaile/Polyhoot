// This code is adapted from MongoDB-Example from LOG2990 class
import { ErrorMessage } from '@common/errors';
import { Db, MongoClient } from 'mongodb';
import { Service } from 'typedi';
import { DATABASE_NAME, DATABASE_URL } from '../../assets/database-utils';

@Service()
export class DatabaseService {
    private mongoDataBase: Db;
    private client: MongoClient;

    get database(): Db {
        return this.mongoDataBase;
    }

    async start(url: string = DATABASE_URL): Promise<void> {
        try {
            this.client = new MongoClient(url);
            await this.client.connect();
            this.mongoDataBase = this.client.db(DATABASE_NAME);
        } catch {
            throw new Error(ErrorMessage.DatabaseConnectionError);
        }
    }

    async closeConnection(): Promise<void> {
        return await this.client.close();
    }
}
