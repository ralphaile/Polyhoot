import { GameHistory, GameInfo, GameState } from '@common/game';
import { User, UserState } from '@common/user';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { describe } from 'mocha';
import { MongoClient } from 'mongodb';
import * as sinon from 'sinon';
import { DatabaseServiceMock } from './database.service.mock';
import { HistoryService } from './history.service';
import { TimeService } from './server-timer.service';

chai.use(chaiAsPromised);

describe('History service', () => {
    let historyService: HistoryService;
    let databaseService: DatabaseServiceMock;
    let client: MongoClient;
    let mockGame: GameInfo;
    let startTimerStub: sinon.SinonStub;
    let mockHistory1: GameHistory;
    let mockHistory2: GameHistory;

    beforeEach(async () => {
        databaseService = new DatabaseServiceMock();
        client = (await databaseService.start()) as MongoClient;
        // We need to cast databaseService to any here because we're passing a mock object
        // that doesn't have the same type as the expected parameter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        historyService = new HistoryService(databaseService as any);
        mockHistory1 = {
            name: 'Ancient Empires',
            startTime: new Date('2023-05-15T13:30:00'),
            players: 4,
            bestScore: 9500,
        };
        mockHistory2 = {
            name: 'Medieval Quest',
            startTime: new Date('2022-10-08T10:15:00'),
            players: 2,
            bestScore: 7800,
        };
        mockGame = {
            gameId: 1,
            organizer: {
                id: 'organizer1',
                name: 'Organizer',
                state: UserState.Connected,
                isMuted: false,
            },
            isTester: false,
            isRandomGame: false,
            players: [
                {
                    id: 'player1',
                    name: 'Player 1',
                    state: UserState.Connected,
                    currentChoices: [false, false, false],
                    points: 0,
                    nbOfFirstAnswers: 0,
                    hasFinalizeIsAnswers: false,
                    isFirstToAnswers: false,
                    isMuted: false,
                },
                {
                    id: 'player2',
                    name: 'Player 2',
                    state: UserState.Connected,
                    currentChoices: [false, false, false],
                    points: 17,
                    nbOfFirstAnswers: 0,
                    hasFinalizeIsAnswers: false,
                    isFirstToAnswers: false,
                    isMuted: false,
                },
            ],
            banList: [] as string[],
            isLocked: false,
            quiz: {
                id: '123',
                title: 'title',
                description: '123',
                duration: 30,
                lastModification: new Date(),
                isVisible: true,
                questions: [],
            },
            currentQuestionIndex: 0,
            firstToAnswer: null as User,
            nbOfGoodAnswers: 0,
            nbOfFinishedPlayers: 0,
            timer: { startTimer: startTimerStub } as unknown as TimeService,
            gameState: GameState.AnsweringQuestion,
            nbOfRecentModification: 0,
        };
        await historyService.collection.insertOne(mockHistory1);
        await historyService.collection.insertOne(mockHistory2);
    });

    afterEach(async () => {
        await databaseService.closeConnection();
        await client.close();
    });

    it('should get the history', async () => {
        const history = await historyService.getHistory();
        chai.expect(history).to.deep.equal([mockHistory1, mockHistory2]);
    });

    it('should add a history', async () => {
        await historyService.addGameToHistory(mockGame);
        const history = await historyService.getHistory();
        chai.expect(history.length).to.equal(3);
    });

    it('should delete a history', async () => {
        await historyService.deleteHistory();
        const history = await historyService.getHistory();
        chai.expect(history).to.deep.equal([]);
    });
});
