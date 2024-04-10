import { Service } from 'typedi';
import { DB_COLLECTION_PASSWORD } from '../../assets/database-utils';
import { DatabaseService } from './database.service';

@Service()
export class LoginService {
    constructor(private readonly databaseService: DatabaseService) {}
    get collection() {
        return this.databaseService.database.collection(DB_COLLECTION_PASSWORD);
    }

    async authenticate(password: string): Promise<boolean> {
        const result = await this.collection.findOne({ password });
        if (result) {
            return true;
        }
        return false;
    }
}
