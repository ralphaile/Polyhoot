// This code comes greatly from MongoDB-Example from LOG2990 class
import { Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

const DATABASE_NAME = 'LOG2990';

export class DatabaseServiceMock {
    mongoServer: MongoMemoryServer;
    private mongoDataBase: Db;
    private client: MongoClient;

    get database(): Db {
        return this.mongoDataBase;
    }

    async start(): Promise<MongoClient | null> {
        this.mongoServer = await MongoMemoryServer.create();
        const mongoUri = this.mongoServer.getUri();
        this.client = new MongoClient(mongoUri);
        await this.client.connect();
        this.mongoDataBase = this.client.db(DATABASE_NAME);

        return this.client;
    }

    async closeConnection(): Promise<void> {
        return this.client.close();
    }
}
